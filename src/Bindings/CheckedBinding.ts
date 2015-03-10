///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Core/Environment.ts" />

module wx {
    class CheckedBinding implements IBindingHandler {
        constructor(domService: IDomService) {
            this.domService = domService;
        } 

        ////////////////////
        // IBinding

        public apply(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("checked-binding only operates on elements!");
            
            if (utils.isNull(options))
                internal.throwError("invalid binding-ptions!");

            var el = <HTMLInputElement> node;
            var tag = el.tagName.toLowerCase();
            var isCheckBox = el.type === 'checkbox';
            var isRadioButton = el.type === 'radio';

            if (tag !== 'input' || (!isCheckBox && !isRadioButton))
                internal.throwError("checked-binding only operates on checkboxes and radio-buttons");

            var prop: IObservableProperty<any>;
            var locals: Rx.CompositeDisposable;

            function cleanup() {
                if (locals) {
                    locals.dispose();
                    locals = null;
                }
            }

            function updateElement(value: any) {
                el.checked = value;
            }

            // options is supposed to be a field-access path
            state.cleanup.add(this.domService.fieldAccessToObservable(options, ctx, true).subscribe(model => {
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
                        // wire change-events depending on browser and version
                        var events = this.getCheckedEventObservables(el);
                        locals.add(Rx.Observable.merge(events).subscribe(e => {
                            prop(el.checked);
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

        public priority = 0;

        ////////////////////
        // Implementation

        protected domService: IDomService;

        protected getCheckedEventObservables(el: HTMLInputElement): Array<Rx.Observable<Object>> {
            var result: Array<Rx.Observable<Object>> = [];

            result.push(Rx.Observable.fromEvent(el, 'click'));
            result.push(Rx.Observable.fromEvent(el, 'change'));

            return result;
        }
    }

    export module internal {
        export var checkedBindingConstructor = <any> CheckedBinding;
    }
}