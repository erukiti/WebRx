///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Interfaces.ts" />
/// <reference path="../Core/Resources.ts" />

module wx {
    class WithBinding implements IBindingHandler {
        constructor(domService: IDomService) {
            this.domService = domService;
        } 
 
        ////////////////////
        // IBinding

        public apply(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("with-binding only operates on elements!");

            if (utils.isNull(options))
                internal.throwError("invalid binding-options!");

            var el = <HTMLElement> node;
            var self = this;
            var exp = this.domService.compileBindingOptions(options);
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
            this.domService.applyBindingsToDescendants(ctx, el);
        }
    }

    export module internal {
        export var withBindingConstructor = <any> WithBinding;
    }
}