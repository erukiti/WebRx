///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Core/Module.ts" />

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

        public apply(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            debugger;
            if (node.nodeType !== 1)
                internal.throwError("component-binding only operates on elements!");

            if (utils.isNull(options))
                internal.throwError("invalid binding-ptions!");

            var el = <HTMLElement> node;
            var compiled = this.domService.compileBindingOptions(options);
            var exp: ICompiledExpression;
            var componentName: string;
            var componentParams: Object = undefined;

            if (typeof compiled === "function") {
                exp = <ICompiledExpression> compiled;

                using(this.domService.expressionToObservable(exp, ctx).toProperty(),(prop) => {
                    componentName = prop();
                });
            } else {
                var opt = <IComponentBindingOptions> compiled;

                exp = <ICompiledExpression> <any> opt.name;
                using(this.domService.expressionToObservable(exp, ctx).toProperty(),(prop) => {
                    componentName = prop();
                });

                if (opt.params) {
                    componentParams = {};

                    Object.keys(opt.params).forEach(x => {
                        using(this.domService.expressionToObservable(opt.params[x], ctx).toProperty(),(prop) => {
                            componentParams[x] = prop();
                        });
                    });
                }
            }

            // clear children
            var oldContents = new Array<Node>();
            while (el.firstChild) { oldContents.push(el.removeChild(el.firstChild)); }

            // lookup component
            var component: IComponent = undefined;
            if (state.module)
                component = state.module.getComponent(componentName);

            // fallback to "app" module if unknown to module
            if (!component)
                component = app.getComponent(componentName);

            if (!component)
                internal.throwError("component '{0}' has not been registered.", componentName);

            // resolve template & view-model
            if (component.viewModel) {
                state.cleanup.add(Rx.Observable.combineLatest(
                    this.loadTemplate(component.template),
                    this.loadViewModel(component.viewModel, componentParams),
                        (t, vm) => {
                            // if loadViewModel yields a function, we interpret that as a factory
                            if (typeof vm === "function") {
                                vm = vm(componentParams);
                            }

                             return { template: t, viewModel: vm }
                        }).subscribe(x => {
                            // done
                            this.applyTemplate(el, ctx, state, x.template, x.viewModel);
                        }, (err) => app.defaultExceptionHandler.onNext(err)));
            } else {
                state.cleanup.add(this.loadTemplate(component.template).subscribe((t) => {
                    // done
                    this.applyTemplate(el, ctx, state, t);
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

        protected loadTemplate(template: any): Rx.Observable<Node[]> {
            var syncResult: Node[];

            if (typeof template === "string") {
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

        protected applyTemplate(el: HTMLElement, ctx: IDataContext, state: INodeState, template: Node[], vm?: any) {
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
                this.domService.setNodeState(el, state);

                // refresh context
                ctx = this.domService.getDataContext(el);
            }

            // done
            this.domService.applyBindingsToDescendants(ctx, el);
        }
    }

    export module internal {
        export var componentBindingConstructor = <any> ComponentBinding;
    }
}