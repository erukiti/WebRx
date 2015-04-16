///<reference path="../../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../Core/DomManager.ts" />
/// <reference path="../../Interfaces.ts" />
/// <reference path="../../Core/Log.ts" />

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

                    if (newState.views != null) {
                        var component = newState.views[viewName];

                        if (component != null) {
                            if (typeof component === "object") {
                                componentName = component.component;
                                componentParams = component.params || {};
                                componentAnimations = component.animations;
                            } else {
                                componentName = <string> component;
                                componentParams = {};
                                componentAnimations = undefined;
                            }

                            // merge state params into component params
                            if (newState.params != null)
                                componentParams = extend(newState.params, extend(componentParams, {}));

                            // only update if changed
                            if (componentName !== currentComponentName ||
                                !isEqual(componentParams, currentComponentParams) ||
                                !isEqual(componentAnimations, currentComponentAnimations)) {

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
            var oldTemplateInstance = nodeChildrenToArray<Node>(el);

            // get animation objects
            var hide: IAnimation;
            var show: IAnimation;

            if (animations) {
                if (animations.leave && oldTemplateInstance.length) {
                    if (typeof animations.leave === "string") {
                        hide = module.animation(<string> animations.leave);
                    } else {
                        hide = <IAnimation> animations.leave;
                    }
                }

                if (animations.enter) {
                    if (typeof animations.enter === "string") {
                        show = module.animation(<string> animations.enter);
                    } else {
                        show = <IAnimation> animations.enter;
                    }
                }
            }

            // Animated Hide of old template instance
            var hideAnimation: Rx.Observable<any>;

            if (hide) {
                hide.prepare(oldTemplateInstance);
                hideAnimation = hide.run(oldTemplateInstance);
            } else {
                hideAnimation = Rx.Observable.return<any>(undefined);
            }

            // Remove old template instance from dom
            function removeOldTemplate() {
                if (hide)
                    hide.complete(oldTemplateInstance);

                // remove old content
                oldTemplateInstance.forEach(x => {
                    self.domManager.cleanNode(x);
                    el.removeChild(x);
                });
            }

            // Instantiate new template instance and bind it
            function dataBind() {
                if (componentName == null)
                    return;

                // extend the data-context
                (<IViewDataContext> ctx).$componentParams = componentParams;

                // create component container
                var container = <HTMLElement> document.createElement("div");
                var binding = formatString("component: { name: '{0}', params: $componentParams }", componentName);
                container.setAttribute("data-bind", binding);

                // prepare for animation
                if (show != null && container.nodeType === 1)
                    show.prepare(container);

                el.appendChild(container);

                // done
                self.domManager.applyBindingsToDescendants(ctx, el);
            }

            // Animated show of new template instance
            var showAnimation = show != null && componentName != null ?
                show.run(el.childNodes) :
                Rx.Observable.return<any>(undefined);

            return Rx.Observable.combineLatest(
                // hide current and remove
                hideAnimation
                    .selectMany(_=> Rx.Observable.startSync<any>(removeOldTemplate)),
                // insert new and show
                Rx.Observable.startSync<any>(dataBind)
                    .selectMany(_=> showAnimation),
                <any> noop)
                .take(1);
        }
    }

    export module internal {
        export var viewBindingConstructor = <any> ViewBinding;
    }
}