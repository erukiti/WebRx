///<reference path="../../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../Services/DomService.ts" />
/// <reference path="../../Interfaces.ts" />

module wx {
    class StateRefBinding implements IBindingHandler {
        constructor(domService: IDomService, router: IRouter) {
            this.domService = domService;
            this.router = router;
        } 

        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("stateRef-binding only operates on elements!");

            if (options == null)
                internal.throwError("invalid binding-ptions!");

            var exp = this.domService.compileBindingOptions(options);
            var obs = this.domService.expressionToObservable(exp, ctx);

            // subscribe
            state.cleanup.add(obs.subscribe(x => {
                if (typeof x === "string")
                    x = module(x);

                state.module = x;
            }));

            // release closure references to GC 
            state.cleanup.add(Rx.Disposable.create(() => {
                // nullify args
                node = null;
                options = null;
                ctx = null;
                state = null;

                // nullify common locals
                obs = null;
                self = null;
            }));
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 100;

        ////////////////////
        // Implementation

        protected domService: IDomService;
        protected  router: IRouter;
    }

    export module internal {
        export var stateRefBindingConstructor = <any> StateRefBinding;
    }
}