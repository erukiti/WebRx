///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/DomManager.ts" />
/// <reference path="../Core/Module.ts" />
/// <reference path="../Bindings/Module.ts" />

module wx {
    "use strict";

    export interface IComponentBindingOptions {
        name: string;
        params?: Object;
    }

    class ComponentBinding implements IBindingHandler {
        constructor(domManager: IDomManager) {
            this.domManager = domManager;
        } 

        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void {
            if (node.nodeType !== 1)
                internal.throwError("component-binding only operates on elements!");

            if (options == null)
                internal.throwError("invalid binding-options!");

            var el = <HTMLElement> node;
            var compiled = this.domManager.compileBindingOptions(options, module);
            var opt = <IComponentBindingOptions> compiled;
            var exp: ICompiledExpression;
            var componentObservable: Rx.Observable<string>;
            var componentParams = {};
            var cleanup: Rx.CompositeDisposable;

            function doCleanup() {
                if (cleanup) {
                    cleanup.dispose();
                    cleanup = null;
                }
            }

            if (typeof compiled === "function") {
                exp = <ICompiledExpression> compiled;

                componentObservable = <any> this.domManager.expressionToObservable(exp, ctx);
            } else {
                // collect component-name observable
                componentObservable = <any> this.domManager.expressionToObservable(<ICompiledExpression> <any> opt.name, ctx);

                // collect params observables
                if (opt.params) {
                    if (isFunction(opt.params)) {
                        // opt params is object passed by value (probably $componentParams from view-binding)
                        componentParams = this.domManager.evaluateExpression(<ICompiledExpression> opt.params, ctx);
                    } else if (typeof opt.params === "object") {
                        Object.keys(opt.params).forEach(x => {
                            componentParams[x] = this.domManager.evaluateExpression(opt.params[x], ctx);
                        });
                    } else {
                        internal.throwError("invalid component-params");
                    }
                }
            }

            // clear children
            var oldContents = new Array<Node>();
            while (el.firstChild) { oldContents.push(el.removeChild(el.firstChild)); }

            // subscribe to any input changes
            state.cleanup.add(componentObservable.subscribe(componentName => {
                try {
                    doCleanup();
                    cleanup = new Rx.CompositeDisposable();

                    // lookup component
                    var component: IComponent = undefined;

                    if (module)
                        component = module.component(componentName);

                    // fallback to "app" module if not registered with
                    if (!component)
                        component = app.component(componentName);

                    if (component == null)
                        internal.throwError("component '{0}' is not registered.", componentName);

                    // resolve template & view-model
                    if (component.viewModel) {
                        state.cleanup.add(Rx.Observable.combineLatest(
                            this.loadTemplate(component.template, componentParams),
                            this.loadViewModel(component.viewModel, componentParams),
                            (t, vm) => {
                                return { template: t, viewModel: vm }
                            }).subscribe(x => {
                            if (isDisposable(x.viewModel)) {
                                cleanup.add(x.viewModel);
                            }

                            this.applyTemplate(component, el, ctx, state, x.template, x.viewModel);
                        },(err) => app.defaultExceptionHandler.onNext(err)));
                    } else {
                        state.cleanup.add(this.loadTemplate(component.template, componentParams).subscribe((t) => {
                            this.applyTemplate(component, el, ctx, state, t);
                        },(err) => app.defaultExceptionHandler.onNext(err)));
                    }
                } catch (e) {
                    wx.app.defaultExceptionHandler.onNext(e);
                } 
            }));

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

                doCleanup();
            }));
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 30;
        public controlsDescendants = true;

        ////////////////////
        // Implementation

        protected domManager: IDomManager;

        protected loadTemplate(template: any, params: Object): Rx.Observable<Node[]> {
            var syncResult: Node[];
            var el: Element;

            if (isFunction(template)) {
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
                    syncResult = injector.get<Node[]>(options.resolve);
                    return Rx.Observable.return(syncResult);
                } else if (options.promise) {
                    var promise = <Rx.IPromise<Node[]>> <any> options.promise;
                    return Rx.Observable.fromPromise(promise);
                } else if (options.require) {
                    return observableRequire(options.require).select(x=> app.templateEngine.parse(x));
                } else if (options.element) {
                    if (typeof options.element === "string") {
                        // try both getElementById & querySelector
                        el = document.getElementById(<string> options.element) ||
                            document.querySelector(<string> options.element);

                        if (el != null) {
                            // only the nodes inside the specified element will be cloned for use as the component’s template
                            syncResult = app.templateEngine.parse((<HTMLElement> el).innerHTML);
                        } else {
                            syncResult = [];
                        }

                        return Rx.Observable.return(syncResult);
                    } else {
                        el = <Element> <any> options.element;

                        // unwrap text/html script nodes
                        if (el != null) {
                            // only the nodes inside the specified element will be cloned for use as the component’s template
                            syncResult = app.templateEngine.parse((<HTMLElement> el).innerHTML);
                        } else {
                            syncResult = [];
                        }

                        return Rx.Observable.return(syncResult);
                    }
                }
            }

            internal.throwError("invalid template descriptor");
        }

        protected loadViewModel(vm: any, componentParams: Object): Rx.Observable<any> {
            var syncResult: any;

            if (isFunction(vm)) {
                syncResult = new vm(componentParams);
                return Rx.Observable.return(syncResult);
            } else if (Array.isArray(vm)) {
                // assumed to be inline-annotated-array
                syncResult = injector.resolve<any>(vm, componentParams);
                return Rx.Observable.return(syncResult);
            } else if (typeof vm === "object") {
                var options = <IComponentViewModelDescriptor> vm;

                if (options.resolve) {
                    syncResult = injector.get<any>(options.resolve, componentParams);
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
                this.domManager.cleanNode(el.firstChild);
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
                ctx = this.domManager.getDataContext(el);
            }

            // invoke preBindingInit 
            if (vm && component.preBindingInit && vm.hasOwnProperty(component.preBindingInit)) {
                vm[component.preBindingInit].call(vm, el);
            }

            // done
            this.domManager.applyBindingsToDescendants(ctx, el);

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