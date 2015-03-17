///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/DomManager.ts" />
/// <reference path="../Interfaces.ts" />

module wx {
    // Binding contributions to node-state
    export interface INodeState {
        module?: IModule;
    }

    class ModuleBinding implements IBindingHandler {
        constructor(domManager: IDomManager) {
            this.domManager = domManager;
        } 

        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("module-binding only operates on elements!");

            if (options == null)
                internal.throwError("invalid binding-options!");

            var exp = this.domManager.compileBindingOptions(options);
            var obs = this.domManager.expressionToObservable(exp, ctx);

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

        protected domManager: IDomManager;
    }

    export module internal {
        export var moduleBindingConstructor = <any> ModuleBinding;
    }
}