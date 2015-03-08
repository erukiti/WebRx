///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Core/Environment.ts" />

module wx {
    class CheckedDirective implements IDirective {
        constructor(domService: IDomService) {
            this.domService = domService;
        } 

        ////////////////////
        // IDirective

        public apply(node: Node, options: any, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("Checked directive only operates on elements!");
            
            if (utils.isNull(options))
                internal.throwError("invalid options for directive!");

            var el = <HTMLInputElement> node;
            var tag = el.tagName.toLowerCase();
            var isRadioButton = el.type === 'radio';

            if (tag !== 'input' || el.type !== 'checkbox')
                internal.throwError("Checked directive only operates on checkboxes and radio-buttons");

            var prop: IObservableProperty<any>;
            var propertySubscription: Rx.Disposable;
            var eventSubscription: Rx.Disposable;

            function updateElement(value: any) {
                el.checked = value;
            }

            function cleanup() {
                if (propertySubscription) {
                    propertySubscription.dispose();
                    propertySubscription = null;
                }

                if (eventSubscription) {
                    eventSubscription.dispose();
                    eventSubscription = null;
                }
            }

            // options is supposed to be a field-access path
            state.cleanup.add(this.domService.fieldAccessToObservable(options, ctx, true).subscribe(model => {
                if (!utils.isProperty(model)) {
                    // initial and final update
                    updateElement(model);
                } else {
                    cleanup();

                    // update on property change
                    prop = model;

                    propertySubscription = prop.changed.subscribe(x => {
                        updateElement(x);
                    });

                    // initial update
                    updateElement(prop());

                    // don't attempt to updated computed properties
                    if (!prop.source) {
                        // wire change-events depending on browser and version
                        var events = this.getCheckedEventObservables(el);
                        eventSubscription = Rx.Observable.merge(events).subscribe(e => {
                            if (isRadioButton) {
                                prop(el.value);
                            } else {
                                prop(el.checked);
                            }
                        });
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
        export var checkedDirectiveConstructor = <any> CheckedDirective;
    }
}