///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Core/Module.ts" />

module wx {
    export interface IComponentDirectiveOptions {
        name: string;
        params?: Object;
    }

    class ComponentDirective implements IDirective {
        constructor(domService: IDomService) {
            this.domService = domService;
        } 

        ////////////////////
        // IDirective

        public apply(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            debugger;
            if (node.nodeType !== 1)
                internal.throwError("component directive only operates on elements!");

            if (utils.isNull(options))
                internal.throwError("invalid options for directive!");

            var el = <HTMLElement> node;
            var compiled = this.domService.compileDirectiveOptions(options);
            var exp: ICompiledExpression;
            var componentName: string;
            var componentParams: Object;

            if (typeof compiled === "function") {
                exp = <ICompiledExpression> compiled;

                using(this.domService.expressionToObservable(exp, ctx).toProperty(),(prop) => {
                    componentName = prop();
                });
            } else {
                var opt = <IComponentDirectiveOptions> compiled;

                exp = <ICompiledExpression> <any> opt.name;
                using(this.domService.expressionToObservable(exp, ctx).toProperty(),(prop) => {
                    componentName = prop();
                });

                if (opt.params) {
                    exp = <ICompiledExpression> <any> opt.params;
                    using(this.domService.expressionToObservable(exp, ctx).toProperty(),(prop) => {
                        componentParams = prop();
                    });
                }
            }

            // clear children
            var oldContents = new Array<Node>();
            while (el.firstChild) { oldContents.push(el.removeChild(el.firstChild)); }

            // lookup component
            var component: IComponent = undefined;
            if (state.properties.module)
                component = state.properties.module.getComponent(componentName);
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
                             return { template: t, viewModel: vm }
                        }).subscribe(x => {
                            this.applyTemplate(el, ctx, state, x.template, x.viewModel);
                        }, (err) => app.defaultExceptionHandler.onNext(err)));
            } else {
                state.cleanup.add(this.loadTemplate(component.template).subscribe((t) => {
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
            } else if (Array.isArray(template)) {
                syncResult = <Node[]> template;
            } else if(typeof template === "object") {
                var options = <IComponentTemplateDescriptor> template;

                if (options.resolve) {
                    syncResult = injector.resolve<Node[]>(options.resolve);
                } else if (options.require) {
                    return observableRequire(options.require).select(x=> app.templateEngine.parse(x));
                } else if (options.element) {
                    if (typeof options.element === "string") {
                        syncResult = [document.querySelector(<string> options.element)];
                    } else {
                        syncResult = [<Node> <any> options.element];
                    }
                }
            }

            if (syncResult) {
                return Rx.Observable.return(syncResult);
            }

            return Rx.Observable.throwError<Node[]>(new Error("invalid template descriptor"));
        }

        protected loadViewModel(vm: any, componentParams: Object): Rx.Observable<any> {
            var syncResult: any;

            if (typeof vm === "function") {
                syncResult = vm(componentParams);
            } else if (typeof vm === "object") {
                var options = <IComponentViewModelDescriptor> vm;

                if (options.resolve) {
                    syncResult = injector.resolve<any>(options.resolve, componentParams);
                } else if (options.require) {
                    return observableRequire(options.require);
                } else if (options.instance) {
                    syncResult = options.instance;
                }
            }

            if (syncResult) {
                return Rx.Observable.return(syncResult);
            }

            return Rx.Observable.throwError<any>(new Error("invalid view-model descriptor"));
        }

        protected applyTemplate(el: HTMLElement, ctx: IDataContext, state: INodeState, template: Node[], vm?: any) {
            // clear
            while (el.firstChild) {
                this.domService.cleanNode(el.firstChild);
                el.removeChild(el.firstChild);
            }

            // clone nodes and inject
            for (var i = 0; i < template.length; i++) {
                var node = template[i].cloneNode(true);
                el.appendChild(node);
            }

            if (vm) {
                state.properties.model = vm;
                this.domService.setNodeState(el, state);
                ctx = this.domService.getDataContext(el);
            }

            // done
            this.domService.applyDirectivesToDescendants(ctx, el);
        }
    }

    export module internal {
        export var componentDirectiveConstructor = <any> ComponentDirective;
    }
}