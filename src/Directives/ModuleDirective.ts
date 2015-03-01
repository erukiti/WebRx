///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Interfaces.ts" />

module wx {
    class ModuleDirective implements IDirective {
        constructor(domService: IDomService) {
            this.domService = domService;
        } 

        ////////////////////
        // IDirective

        public apply(node: Node, options: any, ctx: IDataContext, state: INodeState): boolean {
            if (node.nodeType !== 1)
                internal.throwError("module directive only operates on elements!");

            if (utils.isNull(options))
                internal.throwError("invalid options for directive!");

            var exp = <ICompiledExpression> options;
            var obs = this.domService.expressionToObservable(exp, ctx);

            // subscribe
            state.cleanup.add(obs.subscribe(x => {
                if (typeof x === "string")
                    x = module(x);

                state.properties.module = x;
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

            return false;
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 100;

        protected domService: IDomService;
    }

    export module internal {
        export var moduleDirectiveConstructor = <any> ModuleDirective;
    }
}