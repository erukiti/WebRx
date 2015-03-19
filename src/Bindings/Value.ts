///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/DomManager.ts" />

module wx {
    class ValueBinding implements IBindingHandler {
        constructor(domManager: IDomManager) {
            this.domManager = domManager;
        } 

        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("value-binding only operates on elements!");
            
            if (options == null)
                internal.throwError("invalid binding-options!");

            var el = <HTMLInputElement> node;
            var tag = el.tagName.toLowerCase();

            if (tag !== 'input' && tag !== 'option' && tag !== 'select' && tag !== 'textarea')
                internal.throwError("value-binding only operates on checkboxes and radio-buttons");

            var prop: IObservableProperty<any>;
            var locals: Rx.CompositeDisposable;
            var exp = this.domManager.compileBindingOptions(options);

            function cleanup() {
                if (locals) {
                    locals.dispose();
                    locals = null;
                }
            }

            // options is supposed to be a field-access path
            state.cleanup.add(this.domManager.expressionToObservable(exp, ctx).subscribe(model => {
                if (!isProperty(model)) {
                    // initial and final update
                    this.domManager.setNodeValue(el, model);
                } else {
                    cleanup();
                    locals = new Rx.CompositeDisposable();

                    // update on property change
                    prop = model;

                    locals.add(prop.changed.subscribe(x => {
                        this.domManager.setNodeValue(el, x);
                    }));

                    // initial update
                    this.domManager.setNodeValue(el, prop());

                    // don't attempt to updated computed properties
                    if (!prop.source) {
                        locals.add(Rx.Observable.fromEvent(el, 'change').subscribe(e => {
                            prop(el.value);
                        }));
                    }
                }
            }));

            // release subscriptions and handlers
            state.cleanup.add(Rx.Disposable.create(() => {
                cleanup();
            }));

            // release closure references to GC 
            state.cleanup.add(Rx.Disposable.create(() => {
                // nullify args
                node = null;
                options = null;
                ctx = null;
                state = null;

                // nullify common locals
                el = null;

                // nullify locals
            }));
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 5;

        ////////////////////
        // Implementation

        protected domManager: IDomManager;
    }

    export module internal {
        export var valueBindingConstructor = <any> ValueBinding;
    }
}