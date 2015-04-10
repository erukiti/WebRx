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
            var componentNameObservable: Rx.Observable<string>;
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

                componentNameObservable = <any> this.domManager.expressionToObservable(exp, ctx);
            } else {
                // collect component-name observable
                componentNameObservable = <any> this.domManager.expressionToObservable(<ICompiledExpression> <any> opt.name, ctx);

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
            while (el.firstChild) {
                 oldContents.push(el.removeChild(el.firstChild));
            }

            // subscribe to any input changes
            state.cleanup.add(componentNameObservable.subscribe(componentName => {
                try {
                    doCleanup();
                    cleanup = new Rx.CompositeDisposable();

                    // lookup component
                    var obs: Rx.Observable<IComponentInstance> = undefined;
                    var disp: Rx.IDisposable = undefined;

                    if (module && module.hasComponent(componentName))
                        obs = module.loadComponent(componentName, componentParams);

                    // fallback to "app" module if not registered with
                    if (obs == null && app.hasComponent(componentName))
                        obs = app.loadComponent(componentName, componentParams);

                    if (obs == null)
                        internal.throwError("component '{0}' is not registered with current module-context", componentName);

                    disp = obs.subscribe(component => {
                        // loader cleanup
                        if (disp != null) {
                            disp.dispose();
                            disp = undefined;
                        }

                        // auto-dispose view-model
                        if (component.viewModel) {
                            if (isDisposable(component.viewModel)) {
                                cleanup.add(component.viewModel);
                            }
                        }

                        // done
                        this.applyTemplate(component, el, ctx, state, component.template, component.viewModel);
                    });

                    if (disp != null)
                        cleanup.add(disp);
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