///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Core/Module.ts" />
/// <reference path="../Bindings/Module.ts" />

module wx {
    export interface IComponentBindingOptions {
        name: string;
        params?: Object;
    }

    class ComponentBinding implements IBindingHandler {
        constructor(domService: IDomService) {
            this.domService = domService;
        } 

        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("component-binding only operates on elements!");

            if (options == null)
                internal.throwError("invalid binding-ptions!");

            var el = <HTMLElement> node;
            var compiled = this.domService.compileBindingOptions(options);
            var exp: ICompiledExpression;
            var componentName: string;
            var componentParams: Object = undefined;

            if (typeof compiled === "function") {
                exp = <ICompiledExpression> compiled;

                componentName = this.domService.evaluateExpression(exp, ctx);
            } else {
                var opt = <IComponentBindingOptions> compiled;

                // get name
                componentName = this.domService.evaluateExpression(<ICompiledExpression> <any> opt.name, ctx);

                // build params
                if (opt.params) {
                    componentParams = {};
                    
                    // opt params may have been an object passed by value (probably $componentParams from view-binding)
                    if (typeof opt.params === "function") {
                        componentParams = this.domService.evaluateExpression(<ICompiledExpression> opt.params, ctx);
                    } else if (typeof opt.params === "object") {
                        Object.keys(opt.params).forEach(x => {
                            componentParams[x] = this.domService.evaluateExpression(opt.params[x], ctx);
                        });
                    } else {
                        internal.throwError("invalid component-params");
                    }
                }
            }

            // clear children
            var oldContents = new Array<Node>();
            while (el.firstChild) { oldContents.push(el.removeChild(el.firstChild)); }

            // lookup component
            var component: IComponent = undefined;
            if (state.module)
                component = state.module.getComponent(componentName);

            // fallback to "app" module if not registered with
            if (!component)
                component = app.getComponent(componentName);

            if (component == null)
                internal.throwError("component '{0}' has not been registered.", componentName);

            // resolve template & view-model
            if (component.viewModel) {
                state.cleanup.add(Rx.Observable.combineLatest(
                    this.loadTemplate(component.template, componentParams),
                    this.loadViewModel(component.viewModel, componentParams),
                        (t, vm) => {
                            // if loadViewModel yields a function, we interpret that as a factory
                            if (typeof vm === "function") {
                                vm = vm(componentParams);
                            }

                            return { template: t, viewModel: vm }
                        }).subscribe(x => {
                            // done
                            this.applyTemplate(component, el, ctx, state, x.template, x.viewModel);
                        }, (err) => app.defaultExceptionHandler.onNext(err)));
            } else {
                state.cleanup.add(this.loadTemplate(component.template, componentParams).subscribe((t) => {
                    // done
                    this.applyTemplate(component, el, ctx, state, t);
                },(err) => app.defaultExceptionHandler.onNext(err)));
            }

            // release closure references to GC 
            state.cleanup.add(Rx.Disposable.create(() => {
                // nullify args
                node = null;
                options = null;
                ctx = null;
                state = null;

                // nullify common locals
                oldContents = null;
                compiled = null;
            }));
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 30;
        public controlsDescendants = true;

        ////////////////////
        // Implementation

        protected domService: IDomService;

        protected loadTemplate(template: any, params: Object): Rx.Observable<Node[]> {
            var syncResult: Node[];

            if (typeof template === "function") {
                syncResult = template(params);

                if (typeof syncResult === "string") {
                    syncResult = app.templateEngine.parse(<string> template(params));
                }

                return Rx.Observable.return(syncResult);
            } else if (typeof template === "string") {
                syncResult = app.templateEngine.parse(<string> template);
                return Rx.Observable.return(syncResult);
            } else if (Array.isArray(template)) {
                return Rx.Observable.return(<Node[]> template);
            } else if(typeof template === "object") {
                var options = <IComponentTemplateDescriptor> template;

                if (options.resolve) {
                    syncResult = injector.resolve<Node[]>(options.resolve);
                    return Rx.Observable.return(syncResult);
                } else if (options.promise) {
                    var promise = <Rx.IPromise<Node[]>> <any> options.promise;
                    return Rx.Observable.fromPromise(promise);
                } else if (options.require) {
                    return observableRequire(options.require).select(x=> app.templateEngine.parse(x));
                } else if (options.element) {
                    if (typeof options.element === "string") {
                        syncResult = [document.querySelector(<string> options.element)];
                        return Rx.Observable.return(syncResult);
                    } else {
                        syncResult = [<Node> <any> options.element];
                        return Rx.Observable.return(syncResult);
                    }
                }
            }

            internal.throwError("invalid template descriptor");
        }

        protected loadViewModel(vm: any, componentParams: Object): Rx.Observable<any> {
            var syncResult: any;

            if (typeof vm === "function") {
                return Rx.Observable.return(vm);
            } else if (typeof vm === "object") {
                var options = <IComponentViewModelDescriptor> vm;

                if (options.resolve) {
                    syncResult = injector.resolve<any>(options.resolve, componentParams);
                    return Rx.Observable.return(syncResult);
                } else if (options.promise) {
                    var promise = <Rx.IPromise<any>> <any> options.promise;
                    return Rx.Observable.fromPromise(promise);
                } else if (options.require) {
                    return observableRequire(options.require);
                } else if (options.instance) {
                    return Rx.Observable.return(options.instance);
                }
            }

            internal.throwError("invalid view-model descriptor");
        }

        protected applyTemplate(component: IComponent, el: HTMLElement, ctx: IDataContext, state: INodeState, template: Node[], vm?: any) {
            // clear
            while (el.firstChild) {
                this.domService.cleanNode(el.firstChild);
                el.removeChild(el.firstChild);
            }

            // clone template and inject
            for (var i = 0; i < template.length; i++) {
                var node = template[i].cloneNode(true);
                el.appendChild(node);
            }

            if (vm) {
                state.model = vm;

                // refresh context
                ctx = this.domService.getDataContext(el);
            }

            // invoke preBindingInit 
            if (vm && component.preBindingInit && vm.hasOwnProperty(component.preBindingInit)) {
                vm[component.preBindingInit].call(vm, el);
            }

            // done
            this.domService.applyBindingsToDescendants(ctx, el);

            // invoke postBindingInit 
            if (vm && component.postBindingInit && vm.hasOwnProperty(component.postBindingInit)) {
                vm[component.postBindingInit].call(vm, el);
            }
        }
    }

    export module internal {
        export var componentBindingConstructor = <any> ComponentBinding;
    }
}