///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Interfaces.ts" />
/// <reference path="../Core/Resources.ts" />

module wx {
    class WithDirective implements IDirective {
        constructor(domService: IDomService) {
            this.domService = domService;
        } 
 
        ////////////////////
        // IDirective

        public apply(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("with directive only operates on elements!");

            if (utils.isNull(options))
                internal.throwError("** invalid directive options!");

            var el = <HTMLElement> node;
            var self = this;
            var exp = this.domService.compileDirectiveOptions(options);
            var obs = this.domService.expressionToObservable(exp, ctx);

            // subscribe
            state.cleanup.add(obs.subscribe(x => {
                self.applyValue(el, x, state);
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
                el = null;
                self = null;

                // nullify locals
            }));
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 50;
        public controlsDescendants = true;

        ////////////////////
        // implementation

        protected domService: IDomService;

        protected applyValue(el: HTMLElement, value: any, state: INodeState): void {
            state.properties.model = value;
            var ctx = this.domService.getDataContext(el);

            this.domService.cleanDescendants(el);
            this.domService.applyDirectivesToDescendants(ctx, el);
        }
    }

    export module internal {
        export var withDirectiveConstructor = <any> WithDirective;
    }
}