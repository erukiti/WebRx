///<reference path="../../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../Core/DomService.ts" />
/// <reference path="../../Interfaces.ts" />
/// <reference path="../../Core/Log.ts" />

module wx {
    // Binding contributions to data-context
    interface IViewDataContext extends IDataContext {
        $componentParams?: Object;
    }

    class ViewBinding implements IBindingHandler {
        constructor(domService: IDomService, router: IRouter) {
            this.domService = domService;
            this.router = router;
        } 

        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("view-binding only operates on elements!");

            if (options == null)
                internal.throwError("invalid binding-options!");

            var el = <HTMLElement> node;
            var compiled = this.domService.compileBindingOptions(options);
            var viewName = this.domService.evaluateExpression(compiled, ctx);
            var componentName: string = null;
            var componentParams: any;
            var currentComponentName: string = null;
            var currentComponentParams: any;

            if (!viewName)
                internal.throwError("views needs to have a name!");

            // subscribe to router-state changes
            state.cleanup.add(this.router.current.changed.startWith(this.router.current()).subscribe(newState => {
                if (newState.views != null) {
                    var component = newState.views[viewName];

                    if (component != null) {
                        if (typeof component === "object") {
                            componentName = component.component;
                            componentParams = component.params;
                        } else {
                            componentName = <string> component;
                            componentParams = {};
                        }

                        // merge state params into component params
                        if (newState.params != null)
                            componentParams = extend(newState.params, extend(componentParams, {}));

                        // only update if changed
                        if (componentName !== currentComponentName ||
                            !isEqual(componentParams, currentComponentParams)) {

                            log.info("component for view '{0}' is now '{1}', params: {2}", viewName, componentName,
                                (componentParams != null ? JSON.stringify(componentParams) : ""));

                            this.applyTemplate(componentName, componentParams, el, ctx);

                            currentComponentName = componentName;
                            currentComponentParams = componentParams;
                        }
                    }
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
                self = null;
            }));
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 1000;
        public controlsDescendants = true;

        ////////////////////
        // Implementation

        protected domService: IDomService;
        protected router: IRouter;

        protected applyTemplate(componentName: string, componentParams: Object, el: HTMLElement, ctx: IDataContext) {
            // clear
            while (el.firstChild) {
                this.domService.cleanNode(el.firstChild);
                el.removeChild(el.firstChild);
            }

            // to avoid stringifying componentParams we inject them into the data-context
            (<IViewDataContext> ctx).$componentParams = componentParams;

            // create component container
            var container = <HTMLElement> document.createElement("div");
            var binding = formatString("component: { name: '{0}', params: $componentParams }", componentName);
            container.setAttribute("data-bind", binding);
            el.appendChild(container);

            // done
            this.domService.applyBindingsToDescendants(ctx, el);
        }
    }

    export module internal {
        export var viewBindingConstructor = <any> ViewBinding;
    }
}