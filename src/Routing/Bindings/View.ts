///<reference path="../../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../Core/DomManager.ts" />
/// <reference path="../../Interfaces.ts" />
/// <reference path="../../Core/Log.ts" />
/// <reference path="../../Core/Animation.ts" />

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
            var componentName: string = null;
            var componentParams: any;
            var componentAnimations: IViewAnimationDescriptor;
            var currentComponentName: string = null;
            var currentComponentParams: any;
            var currentComponentAnimations: IViewAnimationDescriptor;
            var cleanup: Rx.CompositeDisposable;

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

                    if (config.component != null) {
                        componentName = config.component;
                        componentParams = config.params || {};
                        componentAnimations = config.animations;

                        // only update if changed
                        if (componentName !== currentComponentName || !isEqual(componentParams, currentComponentParams)) {
                            cleanup.add(this.applyTemplate(componentName, componentParams, componentAnimations, el, ctx, module || app).subscribe());

                            currentComponentName = componentName;
                            currentComponentParams = componentParams;
                            currentComponentAnimations = componentAnimations;
                        }
                    } else {
                        cleanup.add(this.applyTemplate(null, null, currentComponentAnimations, el, ctx, module || app).subscribe());

                        currentComponentName = null;
                        currentComponentParams = {};
                        currentComponentAnimations = undefined;
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

        protected applyTemplate(componentName: string, componentParams: Object,
            animations: IViewAnimationDescriptor, el: HTMLElement, ctx: IDataContext, module: IModule): Rx.Observable<any> {
            var self = this;
            var currentComponentElements = nodeChildrenToArray<Node>(el);
            var combined: Array<Rx.Observable<any>> = [];
            var obs: Rx.Observable<any>;

            function removeCurrentComponentElements() {
                currentComponentElements.forEach(x => {
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
            if (currentComponentElements.length > 0) {
                var leaveAnimation: IAnimation;

                if (animations && animations.leave) {
                    if (typeof animations.leave === "string") {
                        leaveAnimation = module.animation(<string> animations.leave);
                    } else {
                        leaveAnimation = <IAnimation> animations.leave;
                    }
                }

                if (leaveAnimation) {
                    leaveAnimation.prepare(currentComponentElements);

                    obs = leaveAnimation.run(currentComponentElements)
                        .continueWith(() => leaveAnimation.complete(currentComponentElements))
                        .continueWith(removeCurrentComponentElements);
                } else {
                    obs = Rx.Observable.startDeferred<any>(removeCurrentComponentElements);
                }

                combined.push(obs);
            }

            // construct enter-observable
            if (componentName != null) {
                var enterAnimation: IAnimation;

                if (animations && animations.enter) {
                    if (typeof animations.enter === "string") {
                        enterAnimation = module.animation(<string> animations.enter);
                    } else {
                        enterAnimation = <IAnimation> animations.enter;
                    }
                }

                obs = Rx.Observable.startDeferred<any>(() => instantiateComponent(enterAnimation));

                if (enterAnimation) {
                    obs = obs
                        .continueWith(enterAnimation.run(el.childNodes))
                        .continueWith(() => enterAnimation.complete(el.childNodes));
                }

                combined.push(obs);
            }

            // optimize return
            if (combined.length > 1)
                return Rx.Observable.combineLatest(combined, <any> noop).take(1);
            else if (combined.length === 1)
                return combined[0].take(1);

            // no-op return
            return Rx.Observable.return<any>(true);
        }
    }

    export module internal {
        export var viewBindingConstructor = <any> ViewBinding;
    }
}