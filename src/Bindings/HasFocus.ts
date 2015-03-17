///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/DomManager.ts" />

module wx {
    class HasFocusBinding implements IBindingHandler {
        constructor(domManager: IDomManager) {
            this.domManager = domManager;
        } 

        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("hasFocus-binding only operates on elements!");
            
            if (options == null)
                internal.throwError("invalid binding-options!");

            var el = <HTMLInputElement> node;
            var prop: IObservableProperty<any>;
            var locals: Rx.CompositeDisposable;
            var exp = this.domManager.compileBindingOptions(options);

            function cleanup() {
                if (locals) {
                    locals.dispose();
                    locals = null;
                }
            }

            function handleElementFocusChange(isFocused: boolean) {
                // If possible, ignore which event was raised and determine focus state using activeElement,
                // as this avoids phantom focus/blur events raised when changing tabs in modern browsers.
                var ownerDoc = el.ownerDocument;

                if ("activeElement" in ownerDoc) {
                    var active;
                    try {
                        active = ownerDoc.activeElement;
                    } catch (e) {
                        // IE9 throws if you access activeElement during page load (see issue #703)
                        active = ownerDoc.body;
                    }
                    isFocused = (active === el);
                }

                prop(isFocused);
            }

            function updateElement(value: any) {
                if (value) {
                    el.focus();
                } else {
                    el.blur();
                }
            }

            // options is supposed to be a field-access path
            state.cleanup.add(this.domManager.expressionToObservable(exp, ctx).subscribe(model => {
                if (!isProperty(model)) {
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
                        locals.add(Rx.Observable.merge(this.getFocusEventObservables(el)).subscribe(hasFocus => {
                            handleElementFocusChange(hasFocus);
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

        protected domManager: IDomManager;

        protected getFocusEventObservables(el: HTMLInputElement): Array<Rx.Observable<boolean>> {
            var result: Array<Rx.Observable<boolean>> = [];

            result.push(Rx.Observable.fromEvent(el, 'focus').select(x=> true));
            result.push(Rx.Observable.fromEvent(el, 'focusin').select(x=> true));
            result.push(Rx.Observable.fromEvent(el, 'blur').select(x=> false));
            result.push(Rx.Observable.fromEvent(el, 'focusout').select(x=> false));

            return result;
        }
    }

    export module internal {
        export var hasFocusBindingConstructor = <any> HasFocusBinding;
    }
}