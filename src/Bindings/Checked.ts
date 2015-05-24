/// <reference path="../Core/DomManager.ts" />

module wx {
    "use strict";

    class CheckedBinding implements IBindingHandler {
        constructor(domManager: IDomManager) {
            this.domManager = domManager;
        } 

        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void {
            if (node.nodeType !== 1)
                internal.throwError("checked-binding only operates on elements!");
            
            if (options == null)
                internal.throwError("invalid binding-options!");

            var el = <HTMLInputElement> node;
            var tag = el.tagName.toLowerCase();
            var isCheckBox = el.type === 'checkbox';
            var isRadioButton = el.type === 'radio';

            if (tag !== 'input' || (!isCheckBox && !isRadioButton))
                internal.throwError("checked-binding only operates on checkboxes and radio-buttons");

            var exp = this.domManager.compileBindingOptions(options, module);
            var prop: IObservableProperty<any>;
            var cleanup: Rx.CompositeDisposable;

            function doCleanup() {
                if (cleanup) {
                    cleanup.dispose();
                    cleanup = null;
                }
            }

            function updateElement(value: any) {
                el.checked = value;
            }

            state.cleanup.add(this.domManager.expressionToObservable(exp, ctx).subscribe(model => {
                try {
                    if (!isProperty(model)) {
                        // initial and final update
                        updateElement(model);
                    } else {
                        doCleanup();
                        cleanup = new Rx.CompositeDisposable();

                        // update on property change
                        prop = model;

                        cleanup.add(prop.changed.subscribe(x => {
                            updateElement(x);
                        }));

                        // initial update
                        updateElement(prop());

                        // don't attempt to updated computed properties
                        if (!prop.source) {
                            // wire change-events depending on browser and version
                            var events = this.getCheckedEventObservables(el);
                            cleanup.add(Rx.Observable.merge(events).subscribe(e => {
                                try {
                                    prop(el.checked);
                                } catch(e) {
                                    app.defaultExceptionHandler.onNext(e);
                                }
                            }));
                        }
                    }
                } catch (e) {
                    wx.app.defaultExceptionHandler.onNext(e);
                } 
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
                doCleanup();
            }));
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 0;

        ////////////////////
        // Implementation

        protected domManager: IDomManager;

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