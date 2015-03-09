///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Collections/WeakMap.ts" />
/// <reference path="../Core/Resources.ts" />
/// <reference path="../Core/Injector.ts" />
/// <reference path="../Core/Globals.ts" />
/// <reference path="../Collections/Set.ts" />

module wx {
    class DomService implements IDomService {
        constructor(compiler: IExpressionCompiler) {
            this.elementState = createWeakMap<Node, INodeState>();
            this.compiler = compiler;
        }

        public applyDirectives(model: any, rootNode: Node): void {
            if (rootNode === undefined || rootNode.nodeType !== 1)  // && (node.nodeType !== 8))
                internal.throwError("first parameter should be your model, second parameter should be a DOM node!");

            if (this.isNodeBound(rootNode))
                internal.throwError("an element must not be bound multiple times!");

            // create node state for root node
            var state: INodeState = this.getNodeState(rootNode) || this.createNodeState(model);
            this.setNodeState(rootNode, state);

            // calculate resulting data-context and apply directives
            var ctx = this.getDataContext(rootNode);
            this.applyDirectivesRecursive(ctx, <HTMLElement> rootNode);
        }

        public applyDirectivesToDescendants(ctx: IDataContext, node: Node): void {
            if (node.hasChildNodes()) {
                for (var i = 0; i < node.childNodes.length; i++) {
                    var child = node.childNodes[i];

                    // only elements
                    if (child.nodeType !== 1)
                        continue;

                    this.applyDirectivesRecursive(ctx, <HTMLElement> child);
                }
            }
        }

        public cleanNode(rootNode: Node): void {
            if (rootNode.nodeType !== 1)  // && (node.nodeType !== 8))
                internal.throwError("first parameter should be a DOM node!");

            this.cleanNodeRecursive(rootNode);
        }

        public cleanDescendants(node: Node): void {
            if (node.hasChildNodes()) {
                for (var i = 0; i < node.childNodes.length; i++) {
                    var child = node.childNodes[i];

                    // only elements
                    if (node.nodeType !== 1)
                        continue;

                    this.clearElementState(child);
                }
            }
        }

        public getObjectLiteralTokens(value: string): Array<IObjectLiteralToken> {
            value = utils.trimString(value);

            if (value !== '' && this.isObjectLiteralString(value)) {
                return this.compiler.parseObjectLiteral(value);
            } 

            return [];
        }

        public compileDirectiveOptions(value: string): any {
            value = utils.trimString(value);
            if (value === '') {
                return null;
            }

            if (this.isObjectLiteralString(value)) {
                var result = {};
                var tokens = this.compiler.parseObjectLiteral(value);
                var token: IObjectLiteralToken;

                for (var i = 0; i < tokens.length; i++) {
                    token = tokens[i];
                    result[token.key] = this.compileDirectiveOptions(token.value);
                }

                return result;
            } else {
                return this.compiler.compileExpression(value, this.parserOptions, this.expressionCache);
            }
        }

        public getModuleContext(node: Node): IModule {
            var state: INodeState;

            // collect model hierarchy
            while (node) {
                state = this.getNodeState(node);

                if (utils.isNotNull(state)) {
                    if (utils.isNotNull(state.properties.module)) {
                        return state.properties.module;
                    }
                }

                node = node.parentNode;
            }

            // default to app
            return app;
        }

        public getDataContext(node: Node): IDataContext {
            var models = [];
            var state: INodeState = this.getNodeState(node);

            // remember index present
            var index = state ? state.properties.index : undefined;

            // collect model hierarchy
            while (node) {
                state = state || this.getNodeState(node);

                if (utils.isNotNull(state)) {
                    if (utils.isNotNull(state.properties.model)) {
                        models.push(state.properties.model);
                    }
                }

                state = undefined;
                node = node.parentNode;
            }

            var ctx: IDataContext;

            if (models.length > 0) {
                ctx = {
                    $data: models[0],
                    $root: models[models.length - 1],
                    $parent: models.length > 1 ? models[1] : null,
                    $parents: models.slice(1),
                    $index: index
                };
            } else {
                ctx = {
                    $data: null,
                    $root: null,
                    $parent: null,
                    $parents: [],
                    $index: null
                };
            }

            return ctx;
        }

        public createNodeState(model?: any, module?: any): INodeState {
            return {
                isBound: false,
                cleanup: new Rx.CompositeDisposable(),
                properties: { model: model, module: module }
            };
        }

        public isNodeBound(node: Node): boolean {
            var state = this.elementState.get(node);
            return state && state.isBound;
        }

        public setNodeState(node: Node, state: INodeState): void {
            this.elementState.set(node, state);
        }

        public getNodeState(node: Node): INodeState {
            return this.elementState.get(node);
        }

        public clearElementState(node: Node) {
            var state = this.elementState.get(node);

            if (state) {
                if (state.cleanup) {
                    state.cleanup.dispose();
                }

                if (state.properties.model) {
                    state.properties.model = null;
                }

                if (state.properties.module) {
                    state.properties.module = null;
                }
            }

            this.elementState.delete(node);

            env.cleanExternalData(node);
        }

        public expressionToObservable(exp: ICompiledExpression, ctx: IDataContext, evalObs?: Rx.Observer<any>): Rx.Observable<any> {
            var captured = createSet<Rx.Observable<any>>();
            var locals;
            var result: any;

            // initial evaluation
            try {
                locals = this.createLocals(captured, ctx);
                result = exp(ctx.$data, locals);

                // diagnostics
                if (evalObs)
                    evalObs.onNext(true);
            } catch (e) {
                app.defaultExceptionHandler.onNext(e);

                return Rx.Observable.return(undefined);
            } 

            // Optimization: If we didn't capture any observables during 
            // initial evaluation, it is treated as a constant expression
            if (captured.size === 0) {
                if (utils.isRxObservable(result))
                    return result;

                // wrap it
                return Rx.Observable.return(result);
            }

            var obs = Rx.Observable.create<Rx.Observable<any>>(observer => {
                var innerDisp = Rx.Observable.defer(() => {
                    // construct observable that represents the first change of any of the expression's dependencies
                    return Rx.Observable.merge(utils.getSetValues(captured)).take(1);
                })
                .repeat()
                .subscribe(trigger => {
                    try {
                        // reset execution state before evaluation
                        captured.clear();
                        locals = this.createLocals(captured, ctx);

                        // evaluate and produce next value
                        result = exp(ctx.$data, locals);

                        if (!utils.isRxObservable(result)) {
                            // wrap non-observable
                            observer.onNext(Rx.Observable.return(result));
                        } else {
                            observer.onNext(result);
                        }

                        // diagnostics
                        if (evalObs)
                            evalObs.onNext(true);
                    } catch (e) {
                        app.defaultExceptionHandler.onNext(e);
                    }
                });

                return innerDisp;
            });

            // prefix with initial result
            var startValue = utils.isRxObservable(result) ?
                result :
                Rx.Observable.return(result);

            return obs.startWith(startValue)
                .concatAll()
                .publish()
                .refCount();
        }

        public fieldAccessToObservable(path: string, ctx: IDataContext,
            preserveFinalObservableProperty: boolean, evalObs?: Rx.Observer<any>): Rx.Observable<any> {
            var captured = createSet<any>();
            var result: any;

            // initial evaluation
            try {
                result = this.compiler.evaluateFieldAccess(path, ctx, captured, preserveFinalObservableProperty);

                // diagnostics
                if (evalObs)
                    evalObs.onNext(true);
            } catch (e) {
                app.defaultExceptionHandler.onNext(e);

                return Rx.Observable.return(undefined);
            } 

            // Optimization: If we didn't capture any observables during 
            // initial evaluation, it is treated as a constant expression
            if (captured.size === 0) {
                return Rx.Observable.return(result);
            }

            var obs = Rx.Observable.create<any>(observer => {
                var innerDisp = Rx.Observable.defer(() => {
                        // construct observable that represents the first change of any of the expression's dependencies
                        return Rx.Observable.merge(utils.getSetValues(captured)).take(1);
                    })
                    .repeat()
                    .subscribe(trigger => {
                        try {
                            // reset execution state before evaluation
                            captured.clear();

                            // evaluate and produce next value
                            result = this.compiler.evaluateFieldAccess(path, ctx, captured, preserveFinalObservableProperty);
                            observer.onNext(result);

                            // diagnostics
                            if (evalObs)
                                evalObs.onNext(true);
                        } catch (e) {
                            app.defaultExceptionHandler.onNext(e);
                        }
                    });

                return innerDisp;
            });

            return obs.startWith(result)
                .publish()
                .refCount();
        }

        //////////////////////////////////
        // Implementation

        private static directiveAttributeName = "data-bind";
        private static paramsAttributename = "params";
        private elementState: IWeakMap<Node, INodeState>;
        private expressionCache: { [exp: string]: (scope: any, locals: any) => any } = {};
        private compiler: IExpressionCompiler;

        private parserOptions: IExpressionCompilerOptions = {
            disallowFunctionCalls: true
        };

        private applyDirectivesInternal(ctx: IDataContext, el: HTMLElement, module: IModule): boolean {
            var result = false;

            // get or create elment-state
            var state = this.getNodeState(el);

            // create and set if necessary
            if (!state) {
                state = this.createNodeState();
                this.setNodeState(el, state);
            } else if (state.isBound) {
                internal.throwError("an element must not be bound multiple times!");
            }

            var _directives: Array<{ key: string; value: string; fromTag?: boolean }>;
            var tagName = el.tagName.toLowerCase();
            var i;

            debugger;

            // check if tag represents a component
            if (module.isComponentRegistered(tagName) || app.isComponentRegistered(tagName)) {
                // when a component is referenced by element, we just apply a virtual 'component' directive
                var value: any = { name: tagName, params: el.getAttribute(DomService.paramsAttributename) };

                // convert to string, strip curly braces and trim
                value = utils.trimString(JSON.stringify(value).substring(1, value.length - 1));

                _directives = [{ key: 'component', value: value }];
            } else {
                // get definitions from attribute
                _directives = this.extractDirectivesFromDataAttribute(el);
            }

            if (utils.isNotNull(_directives) && _directives.length > 0) {
                // lookup handlers
                var directives = _directives.map(x=> {
                    // if handler is not registered with current module, fall-back to 'app' module 
                    var handler = module.getDirective(x.key) || app.getDirective(x.key);
                    
                    if (!handler)
                        internal.throwError("directive '{0}' has not been registered.", x.key);

                    return { handler: handler, value: x.value };
                });

                // sort by priority
                directives.sort((a, b) => (b.handler.priority || 0) - (a.handler.priority || 0));

                // check if there's directive-handler competition for descendants (which is illegal)
                var hd = directives.filter(x => x.handler.controlsDescendants).map(x => "'" + x.value + "'");
                if (hd.length > 1) {
                    internal.throwError("directives {0} are competing for descendants of target element!", hd.join(", "));
                } 

                result = hd.length > 0;

                // apply all directives
                for (i = 0; i < directives.length; i++) {
                    var directive = directives[i];
                    var handler = directive.handler;

                    handler.apply(el, directive.value, ctx, state);
                }
            }

            // mark bound
            state.isBound = true;

            return result;
        }

        private isObjectLiteralString(str: string): boolean {
            return str[0] === "{" && str[str.length - 1] === "}";
        }

        public extractDirectivesFromDataAttribute(node: Node): Array<{ key: string; value: string }> {
            var directiveText = null;

            if (node.nodeType === 1) {  // element
                // attempt to get definition from attribute
                var attr = (<Element> node).getAttribute(DomService.directiveAttributeName);
                if (attr) {
                    directiveText = attr;
                }
            } 

            // transform textual directive-definition into a key-value store where 
            // the key is the directive name and the value is its options
            if (directiveText) {
                directiveText = utils.trimString(directiveText);
            }

            if (directiveText)
                return <any> this.compiler.parseObjectLiteral(directiveText);

            return null;
        }

        private applyDirectivesRecursive(ctx: IDataContext, el: HTMLElement, module?: IModule): void {
            module = module || this.getModuleContext(el);

            if (!this.applyDirectivesInternal(ctx, el, module) && el.hasChildNodes()) {
                // module directive might have updated state.module
                var state = this.getNodeState(el);
                if (state && state.properties && state.properties.module)
                    module = state.properties.module;

                // iterate over descendants
                for (var i = 0; i < el.childNodes.length; i++) {
                    var child = el.childNodes[i];

                    // only elements
                    if (child.nodeType !== 1)
                        continue;

                    this.applyDirectivesRecursive(ctx, <HTMLElement> child, module);
                }
            }
        }

        private cleanNodeRecursive(node: Node): void {
            if (node.hasChildNodes()) {
                for (var i = 0; i < node.childNodes.length; i++) {
                    var child = node.childNodes[i];

                    // only elements
                    if (node.nodeType !== 1)
                        continue;

                    this.clearElementState(child);
                }
            }

            // clear parent after childs
            this.clearElementState(node);
        }

        private createLocals(captured: ISet<Rx.Observable<any>>, ctx: IDataContext) {
            var locals = {};
            var list: IObservableList<any>;
            var prop: IObservableProperty<any>;
            var result, target;

            var hooks: ICompiledExpressionRuntimeHooks = {
                readFieldHook: (o: any, field: any): any => {
                    result = o[field];
                    
                    // intercept access to observable properties
                    if (utils.isProperty(result)) {
                        var prop = <IObservableProperty<any>> result;

                        // register observable
                        captured.add(prop.changed);

                        // get the property's real value
                        result = prop();
                    }

                    return result;
                },

                writeFieldHook: (o: any, field: any, newValue: any): any => {
                    target = o[field];

                    // intercept access to observable properties
                    if (utils.isProperty(target)) {
                        var prop = <IObservableProperty<any>> target;

                        // register observable
                        captured.add(prop.changed);

                        // replace field assignment with property invocation
                        prop(newValue);
                    } else {
                        o[field] = newValue;
                    }

                    return newValue;
                },

                readIndexHook: (o: any, index: any): any => {
                    // recognize observable lists
                    if (utils.queryInterface(o, IID.IObservableList)) {
                        // translate indexer to list.get()
                        list = <IObservableList<any>> o;
                        result = list.get(index);

                        // add collectionChanged to monitored observables
                        captured.add(list.listChanged);
                    } else {
                        result = o[index];
                    }
                    
                    // intercept access to observable properties
                    if (utils.queryInterface(result, IID.IObservableProperty)) {
                        var prop = <IObservableProperty<any>> result;

                        // register observable
                        captured.add(prop.changed);

                        // get the property's real value
                        result = prop();
                    }

                    return result;
                },

                writeIndexHook: (o: any, index: any, newValue: any): any => {
                    // recognize observable lists
                    if (utils.queryInterface(o, IID.IObservableList)) {
                        // translate indexer to list.get()
                        list = <IObservableList<any>> o;
                        target = list.get(index);

                        // add collectionChanged to monitored observables
                        captured.add(list.listChanged);

                        // intercept access to observable properties
                        if (utils.queryInterface(target, IID.IObservableProperty)) {
                            prop = <IObservableProperty<any>> target;

                            // register observable
                            captured.add(prop.changed);

                            // replace field assignment with property invocation
                            prop(newValue);
                        } else {
                            list.set(index, newValue);
                        }

                    } else {
                        // intercept access to observable properties
                        if (utils.queryInterface(o[index], IID.IObservableProperty)) {
                            prop = <IObservableProperty<any>> target[index];

                            // register observable
                            captured.add(prop.changed);

                            // replace field assignment with property invocation
                            prop(newValue);
                        } else {
                            o[index] = newValue;
                        }
                    }

                    return newValue;
                }
            };

            // install property interceptor hooks
            this.compiler.setRuntimeHooks(locals, hooks);

            // injected context members into lcoals
            locals["$data"] = ctx.$data;
            locals["$root"] = ctx.$root;
            locals["$parent"] = ctx.$parent;
            locals["$parents"] = ctx.$parents;
            locals["$index"] = ctx.$index;

            return locals;
        }
    }

    export module internal {
        export var domServiceConstructor = <any> DomService;
    }

    /**
    * Applies directives to the specified node and all of its children using the specified data context.
    * @param {any} model The model to bind to
    * @param {Node} rootNode The node to be bound
    */
    export function applyDirectives(model: any, node: Node) {
        injector.resolve<IDomService>(res.domService).applyDirectives(model, node);
    }
    /**
    * Removes and cleans up any directive-related state from the specified node and its descendants.
    * @param {Node} rootNode The node to be cleaned
    */
    export function cleanNode(node: Node) {
        injector.resolve<IDomService>(res.domService).cleanNode(node);
    }
}
