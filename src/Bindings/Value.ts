///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Services/DomService.ts" />

module wx {
    class ValueBinding implements IBindingHandler {
        constructor(domService: IDomService) {
            this.domService = domService;
        } 

        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("value-binding only operates on elements!");
            
            if (options == null)
                internal.throwError("invalid binding-ptions!");

            var el = <HTMLInputElement> node;
            var tag = el.tagName.toLowerCase();

            if (tag !== 'input' && tag !== 'option')
                internal.throwError("value-binding only operates on checkboxes and radio-buttons");

            var prop: IObservableProperty<any>;
            var locals: Rx.CompositeDisposable;
            var exp = this.domService.compileBindingOptions(options);

            function cleanup() {
                if (locals) {
                    locals.dispose();
                    locals = null;
                }
            }

            function updateElement(value: any) {
                if (value === null || value === undefined) {
                    value = "";
                }

                // Update the element only if the element and model are different. On some browsers, updating the value
                // will move the cursor to the end of the input, which would be bad while the user is typing.
                if (el.value !== value) {
                    el.value = value;
                }
            }

            // options is supposed to be a field-access path
            state.cleanup.add(this.domService.expressionToObservable(exp, ctx).subscribe(model => {
                if (!utils.isProperty(model)) {
                    // initial and final update
                    updateElement(model);
                } else {
                    cleanup();
                    locals = new Rx.CompositeDisposable();

                    // update on property change
                    prop = model;

                    locals.add(prop.changed.subscribe(x => {
                        updateElement(x);
                    }));

                    // initial update
                    updateElement(prop());

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

        protected domService: IDomService;
    }

    export module internal {
        export var valueBindingConstructor = <any> ValueBinding;
    }
}