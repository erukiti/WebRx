/// <reference path="../../Core/DomManager.ts" />
/// <reference path="../../Interfaces.ts" />
/// <reference path="../../Core/Log.ts" />
/// <reference path="../../Core/Animation.ts" />
/// <reference path="../Router.ts" />

module wx {
    "use strict";

    // Binding contributions to data-context
    interface IViewDataContext extends IDataContext {
        $componentParams?: Object;
    }

    class ViewBinding implements IBindingHandler {
        constructor(domManager: IDomManager, router: IRouter) {
            this.domManager = domManager;
            this.router = router;
        } 

        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void {
            if (node.nodeType !== 1)
                internal.throwError("view-binding only operates on elements!");

            if (options == null)
                internal.throwError("invalid binding-options!");

            var el = <HTMLElement> node;
            var compiled = this.domManager.compileBindingOptions(options, module);
            var viewName = this.domManager.evaluateExpression(compiled, ctx);
            var currentConfig: IViewConfig;
            var cleanup: Rx.CompositeDisposable;
            var enterAnimation: any = undefined;
            var leaveAnimation: any = undefined;

            function doCleanup() {
                if (cleanup) {
                    cleanup.dispose();
                    cleanup = null;
                }
            }

            if (viewName == null || typeof viewName !== "string")
                internal.throwError("views must be named!");

            // subscribe to router-state changes
            state.cleanup.add(this.router.current.changed.startWith(this.router.current()).subscribe(newState => {
                try {
                    doCleanup();
                    cleanup = new Rx.CompositeDisposable();

                    var config = this.router.getViewComponent(viewName);

                    if (config != null) {
                        if (!isEqual(currentConfig, config)) {
                            if(config.animations != null) {
                                // setup enter animation setup
                                enterAnimation = config.animations.enter;
                                
                                if (typeof enterAnimation === "string") {
                                    enterAnimation = module.animation(enterAnimation);
                                }

                                // setup leave animation
                                leaveAnimation = config.animations.leave;
                                
                                if (typeof leaveAnimation === "string") {
                                    leaveAnimation = module.animation(leaveAnimation);
                                }
                            }
                            
                            cleanup.add(this.applyTemplate(viewName, config.component, currentConfig ? currentConfig.component : undefined, 
                                config.params, enterAnimation, leaveAnimation, el, ctx, module));

                            currentConfig = config;
                        }
                    } else {
                        cleanup.add(this.applyTemplate(viewName, null, currentConfig ? currentConfig.component : undefined, 
                            null, enterAnimation, leaveAnimation, el, ctx, module));

                        enterAnimation = undefined;
                        leaveAnimation = undefined;

                        currentConfig = <any> {};
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
            }));
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 1000;
        public controlsDescendants = true;

        ////////////////////
        // Implementation

        protected domManager: IDomManager;
        protected router: IRouter;

        protected applyTemplate(viewName: string, componentName: string, previousComponentName: string, componentParams: Object, 
            enterAnimation: IAnimation, leaveAnimation: IAnimation, el: HTMLElement, ctx: IDataContext, module: IModule): Rx.IDisposable {
            var self = this;
            var oldElements = nodeChildrenToArray<Node>(el);
            var combined: Array<Rx.Observable<any>> = [];
            var obs: Rx.Observable<any>;

            function removeOldElements() {
                oldElements.forEach(x => {
                    self.domManager.cleanNode(x);
                    el.removeChild(x);
                });
            }

            function instantiateComponent(animation: IAnimation) {
                // extend the data-context
                (<IViewDataContext> ctx).$componentParams = componentParams;

                // create component container element
                var container = <HTMLElement> document.createElement("div");
                var binding = formatString("component: { name: '{0}', params: $componentParams }", componentName);
                container.setAttribute("data-bind", binding);

                // prepare container for animation
                if (animation != null)
                    animation.prepare(container);

                // now insert it
                el.appendChild(container);

                // and apply bindings
                self.domManager.applyBindings(ctx, container);
            }

            // construct leave-observable
            if (oldElements.length > 0) {
                if (leaveAnimation) {
                    leaveAnimation.prepare(oldElements);

                    obs = leaveAnimation.run(oldElements)
                        .continueWith(() => leaveAnimation.complete(oldElements))
                        .continueWith(removeOldElements);
                } else {
                    obs = Rx.Observable.startDeferred<any>(removeOldElements);
                }

                combined.push(obs);
            }

            // construct enter-observable
            if (componentName != null) {
                obs = Rx.Observable.startDeferred<any>(() => instantiateComponent(enterAnimation));

                if (enterAnimation) {
                    obs = obs.continueWith(enterAnimation.run(el.childNodes))
                        .continueWith(() => enterAnimation.complete(el.childNodes));
                }
                
                // notify world
                obs = obs.continueWith(() => {
                    var routerInternal = <internal.IRouterInternals> <any> this.router;

                    var transition: IViewTransition = {
                        view: viewName,
                        fromComponent: previousComponentName,
                        toComponent: componentName 
                    }
                    routerInternal.viewTransitionsSubject.onNext(transition);
                });

                combined.push(obs);
            }

            // optimize return
            if (combined.length > 1)
                obs = Rx.Observable.combineLatest(combined, <any> noop).take(1);
            else if (combined.length === 1)
                obs = combined[0].take(1);
            else
                obs = null;

            // no-op return
            return obs ? (obs.subscribe() || Rx.Disposable.empty) : Rx.Disposable.empty;
        }
    }

    export module internal {
        export var viewBindingConstructor = <any> ViewBinding;
    }
}