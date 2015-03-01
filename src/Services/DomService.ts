///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/WeakMap.ts" />
/// <reference path="../Core/Resources.ts" />
/// <reference path="../Core/Injector.ts" />
/// <reference path="../Core/Resources.ts" />

module wx {
    class DomService implements IDomService {
        constructor(compiler: IExpressionCompiler) {
            this.elementState = weakmap<Node, IDomElementState>();
            this.compiler = compiler;
        }

        public applyDirectives(model: any, rootNode: Node): void {
            rootNode = rootNode || window.document.body;
            
            if (rootNode.nodeType !== 1 || !model)  // && (node.nodeType !== 8))
                internal.throwError("first parameter should be your model; second parameter should be a DOM node!");

            if (this.isNodeBound(rootNode))
                internal.throwError("an element must not be bound multiple times!");

            // create element state for root node
            var state: IDomElementState = this.createNewElementState(model);
            this.setElementState(rootNode, state);

            // calculate resulting model-context and bind
            var ctx = this.getModelContext(rootNode);
            this.applyDirectivesRecursive(ctx, rootNode);
        }

        public applyDirectivesToDescendants(ctx: IModelContext, node: Node): void {
            if (node.hasChildNodes()) {
                for (var i = 0; i < node.childNodes.length; i++) {
                    var child = node.childNodes[i];

                    // only elements
                    if (child.nodeType !== 1)
                        continue;

                    this.applyDirectivesRecursive(ctx, child);
                }
            }
        }

        public cleanNode(rootNode: Node): void {
            rootNode = rootNode || window.document.body;

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

        public getDirectives(node: Node): Array<{key: string; value: string }> {
            return this.extractDirectivesFromDataAttribute(node);
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

        public getModelContext(node: Node): IModelContext {
            var models = [];
            var state: IDomElementState;

            // collect model hierarchy
            while (node) {
                state = this.getElementState(node);

                if (utils.isNotNull(state)) {
                    if (utils.isNotNull(state.model)) {
                        models.push(state.model);
                    }
                }

                node = node.parentNode;
            }

            if (models.length === 0)
                return null;

            // create context
            var ctx: IModelContext = {
                $data: models[0],
                $root: models[models.length - 1],
                $parent: models.length > 1 ? models[1] : null,
                $parents: models.slice(1),
                $index: undefined
            };

            return ctx;
        }

        public isNodeBound(node: Node): boolean {
            var state = this.elementState.get(node);
            return state && state.isBound;
        }

        public setElementState(node: Node, state: IDomElementState): void {
            this.elementState.set(node, state);
        }

        public getElementState(node: Node): IDomElementState {
            return this.elementState.get(node);
        }

        public clearElementState(node: Node) {
            var state = this.elementState.get(node);

            if (state) {
                if (state.disposables) {
                    state.disposables.dispose();
                }

                if (state.model) {
                    state.model = null;
                }
            }

            this.elementState.delete(node);
        }

        public expressionToObservable(exp: ICompiledExpression, ctx: IModelContext, evalObs?: Rx.Observer<any>): Rx.Observable<any> {
            var captured = new HashSet<Rx.Observable<any>>();
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
                App.defaultExceptionHandler.onNext(e);

                return Rx.Observable.return(undefined);
            } 

            // Optimization: If we didn't capture any observables during 
            // initial evaluation, it is treated as a constant expression
            if (captured.length === 0) {
                if (utils.isRxObservable(result))
                    return result;

                // wrap it
                return Rx.Observable.return(result);
            }

            var obs = Rx.Observable.create<Rx.Observable<any>>(observer => {
                var innerDisp = Rx.Observable.defer(() => {
                    // construct observable that represents the first change of any of the expression's dependencies
                    return Rx.Observable.merge(captured.values).take(1);
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
                        App.defaultExceptionHandler.onNext(e);
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

        public registerDirective(name: string, handler: IDirective): void;
        public registerDirective(name: string, handler: string): void;

        public registerDirective(): void {
            var args = utils.args2Array(arguments);
            var name = args.shift();
            var handler = args.shift();

            if (typeof handler === "string")
                handler = injector.resolve<IDirective>(handler);

            this.directives[name] = handler;
        }

        public unregisterDirective(name: string): void {
            delete this.directives[name];
        }

        public getDirective(name: string): IDirective {
            return this.directives[name];
        }

        //////////////////////////////////
        // Implementation

        private static directiveAttributeName = "data-bind";
        private elementState: IWeakMap<Node, IDomElementState>;
        private expressionCache: { [exp: string]: (scope: any, locals: any) => any } = {};
        private directives: { [name: string]: IDirective } = {};
        private compiler: IExpressionCompiler;

        private parserOptions: IExpressionCompilerOptions = {
            disallowFunctionCalls: true
        };

        private createNewElementState(model?: any): IDomElementState {
            return {
                isBound: false,
                model: model || null,
                disposables: new Rx.CompositeDisposable()
            };
        }

        private applyDirectivesInternal(ctx: IModelContext, node: Node): boolean {
            var result = false;

            // get or create elment-state
            var state = this.getElementState(node);

            // create and set if necessary
            if (state === undefined) {
                state = this.createNewElementState();
                this.setElementState(node, state);
            } else if (state.isBound) {
                internal.throwError("an element must not be bound multiple times!");
            }

            // get definitions from attribute
            var directives = this.getDirectives(node);

            if (utils.isNotNull(directives) && directives.length > 0) {
                var directiveName;

                for (var i = 0; i < directives.length; i++) {
                    var directive = directives[i];
                    directiveName = directive.key;

                    // lookup handler
                    var handler = this.directives[directiveName];
                    if (handler === undefined)
                        internal.throwError("directive '{0}' has not been registered.", directiveName);

                    var options = this.compileDirectiveOptions(directive.value);

                    if (handler.apply(node, options, ctx, state) === true) {
                        result = true;
                    }
                }
            }

            // mark bound
            state.isBound = true;

            return result;
        }

        private isObjectLiteralString(str: string): boolean {
            return str[0] === "{" && str[str.length - 1] === "}";
        }

        private extractDirectivesFromDataAttribute(node: Node): Array<{ key: string; value: string }> {
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

        private applyDirectivesRecursive(ctx: IModelContext, node: Node): void {
            if (!this.applyDirectivesInternal(ctx, node) && node.hasChildNodes()) {
                for (var i = 0; i < node.childNodes.length; i++) {
                    var child = node.childNodes[i];

                    // only elements
                    if (child.nodeType !== 1)
                        continue;

                    this.applyDirectivesRecursive(ctx, child);
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

        private createLocals(captured: HashSet<Rx.Observable<any>>, ctx: IModelContext) {
            var locals = {};
            var list: IObservableList<any>;
            var prop: IObservableProperty<any>;
            var result, target;

            var hooks: ICompiledExpressionRuntimeHooks = {
                readFieldHook: (o: any, field: any): any => {
                    result = o[field];
                    
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

                writeFieldHook: (o: any, field: any, newValue: any): any => {
                    target = o[field];

                    // intercept access to observable properties
                    if (utils.queryInterface(target, IID.IObservableProperty)) {
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
                        captured.add(list.collectionChanged);
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
                        captured.add(list.collectionChanged);

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
    * Applies directives to the specified node and all of its children using the specified model context.
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
