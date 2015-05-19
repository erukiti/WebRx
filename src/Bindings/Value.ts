/// <reference path="../Core/DomManager.ts" />

module wx {
    "use strict";

    class ValueBinding implements IBindingHandler {
        constructor(domManager: IDomManager) {
            this.domManager = domManager;
        } 

        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void {
            if (node.nodeType !== 1)
                internal.throwError("value-binding only operates on elements!");
            
            if (options == null)
                internal.throwError("invalid binding-options!");

            var el = <HTMLInputElement> node;
            var tag = el.tagName.toLowerCase();

            if (tag !== 'input' && tag !== 'option' && tag !== 'select' && tag !== 'textarea')
                internal.throwError("value-binding only operates on checkboxes and radio-buttons");

            var useDomManagerForValueUpdates = (tag === 'input' && el.type === 'radio') || tag === 'option';
            var prop: IObservableProperty<any>;
            var cleanup: Rx.CompositeDisposable;
            var exp = this.domManager.compileBindingOptions(options, module);

            function doCleanup() {
                if (cleanup) {
                    cleanup.dispose();
                    cleanup = null;
                }
            }

            function updateElement(domManager: IDomManager, value: any) {
                if (useDomManagerForValueUpdates)
                    internal.setNodeValue(el, value, domManager);
                else {
                    if ((value === null) || (value === undefined))
                        value = "";

                    el.value = value;
                }
            }

            // options is supposed to be a field-access path
            state.cleanup.add(this.domManager.expressionToObservable(exp, ctx).subscribe(model => {
                try {
                    if (!isProperty(model)) {
                        // initial and final update
                        updateElement(this.domManager, model);
                    } else {
                        doCleanup();
                        cleanup = new Rx.CompositeDisposable();

                        // update on property change
                        prop = model;

                        cleanup.add(prop.changed.subscribe(x => {
                            updateElement(this.domManager, x);
                        }));

                        // initial update
                        updateElement(this.domManager, prop());

                        // don't attempt to updated computed properties
                        if (!prop.source) {
                            cleanup.add(Rx.Observable.fromEvent(el, 'change').subscribe(e => {
                                if (useDomManagerForValueUpdates)
                                    prop(internal.getNodeValue(el, this.domManager));
                                else
                                    prop(el.value);
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

        public priority = 5;

        ////////////////////
        // Implementation

        protected domManager: IDomManager;
    }

    export module internal {
        /**
         * For certain elements such as select and input type=radio we store
         * the real element value in NodeState if it is anything other than a
         * string. This method returns that value.
         * @param {Node} node
         * @param {IDomManager} domManager
         */
        export function getNodeValue(node: Node, domManager: IDomManager): any {
            var state = <any> domManager.getNodeState(node);
            if (state != null && state[res.hasValueBindingValue]) {
                return state[res.valueBindingValue];
            }

            return (<any> node).value;
        }

        /**
         * Associate a value with an element. Either by using its value-attribute
         * or storing it in NodeState
         * @param {Node} node
         * @param {any} value
         * @param {IDomManager} domManager
         */
        export function setNodeValue(node: Node, value: any, domManager: IDomManager): void {
            if ((value === null) || (value === undefined))
                value = "";

            var state = <any> domManager.getNodeState(node);

            if (typeof value === "string") {
                // Update the element only if the element and model are different. On some browsers, updating the value
                // will move the cursor to the end of the input, which would be bad while the user is typing.
                if ((<any> node).value !== value) {
                    (<any> node).value = value;

                    // clear state since value is stored in attribute
                    if (state != null && state[res.hasValueBindingValue]) {
                        state[res.hasValueBindingValue] = false;
                        state[res.valueBindingValue] = undefined;
                    }
                }
            } else {
                // get or create state
                if (state == null) {
                    state = this.createNodeState();
                    this.setNodeState(node, state);
                }

                // store value
                state[res.valueBindingValue] = value;
                state[res.hasValueBindingValue] = true;
            }
        }
    }

    export module internal {
        export var valueBindingConstructor = <any> ValueBinding;
    }
}