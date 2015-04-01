///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../Core/DomManager.ts" />
/// <reference path="../Interfaces.ts" />
/// <reference path="../Core/Resources.ts" />

module wx {
    class WithBinding implements IBindingHandler {
        constructor(domManager: IDomManager) {
            this.domManager = domManager;
        } 
 
        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void {
            if (node.nodeType !== 1)
                internal.throwError("with-binding only operates on elements!");

            if (options == null)
                internal.throwError("invalid binding-options!");

            var el = <HTMLElement> node;
            var self = this;
            var exp = this.domManager.compileBindingOptions(options, module);
            var obs = this.domManager.expressionToObservable(exp, ctx);

            // subscribe
            state.cleanup.add(obs.subscribe(x => {
                self.applyValue(el, unwrapProperty(x), state);
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

        protected domManager: IDomManager;

        protected applyValue(el: HTMLElement, value: any, state: INodeState): void {
            state.model = value;
            var ctx = this.domManager.getDataContext(el);

            this.domManager.cleanDescendants(el);
            this.domManager.applyBindingsToDescendants(ctx, el);
        }
    }

    export module internal {
        export var withBindingConstructor = <any> WithBinding;
    }
}