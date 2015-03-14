///<reference path="../../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../Services/DomService.ts" />
/// <reference path="../../Interfaces.ts" />
/// <reference path="../../Core/Log.ts" />

module wx {
    // Binding contributions to data-context
    interface IViewDataContext extends IDataContext {
        $componentParams?: Object;
    }

    class ViewBinding implements IBindingHandler {
        constructor(domService: IDomService, router: IRouter, htmlTemplateEngine: ITemplateEngine) {
            this.domService = domService;
            this.router = router;
            this.htmlTemplateEngine = htmlTemplateEngine;
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

            if (!viewName)
                internal.throwError("views needs to have a name!");

            // subscribe to router-state changes
            state.cleanup.add(this.router.currentState.subscribe(newState => {
                if (newState.views != null) {
                    var viewState = newState.views[viewName];

                    if (viewState != null) {
                        if (typeof viewState === "object") {
                            componentName = viewState.component;
                            componentParams = viewState.params;
                        } else {
                            componentName = <string> viewState;
                            componentParams = {};
                        }

                        log.info("component for view {0} is now {1}, params: {2}", viewName, componentName,
                            (componentParams != null ? JSON.stringify(componentParams) : ""));

                        this.applyTemplate(componentName, componentParams, el, ctx);
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
        protected htmlTemplateEngine: ITemplateEngine;

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
            var binding = utils.formatString("component: { name: '{0}', params: $componentParams }", componentName);
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