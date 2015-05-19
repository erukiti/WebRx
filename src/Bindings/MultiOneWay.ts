/// <reference path="../Core/Utils.ts" />
/// <reference path="../Core/DomManager.ts" />
/// <reference path="../Interfaces.ts" />

module wx {
    "use strict";

    class MultiOneWayChangeBindingBase implements IBindingHandler {
        constructor(domManager: IDomManager, supportsDynamicValues: boolean = false) {
            this.domManager = domManager;
            this.supportsDynamicValues = supportsDynamicValues;
        } 
 
       ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void {
            if (node.nodeType !== 1)
                internal.throwError("binding only operates on elements!");

            var compiled = this.domManager.compileBindingOptions(options, module);

            if (compiled == null || (typeof compiled !== "object" && !this.supportsDynamicValues))
                internal.throwError("invalid binding-options!");

            var el = <HTMLElement> node;
            var observables = new Array<[string, Rx.Observable<any>]>();
            var obs: Rx.Observable<any>;
            var exp: ICompiledExpression;
            var keys = Object.keys(compiled);
            var i;
            var key;

            if (typeof compiled === "function") {
                exp = <ICompiledExpression> compiled;

                obs = this.domManager.expressionToObservable(exp, ctx);
                observables.push(["", obs]);
            } else {
                for (i = 0; i < keys.length; i++) {
                    key = keys[i];
                    var value = compiled[key];

                    exp = <ICompiledExpression> value;
                    obs = this.domManager.expressionToObservable(exp, ctx);

                    observables.push([key, obs]);
                }
            }

            // subscribe
            for (i = 0; i < observables.length; i++) {
                key = observables[i][0];
                obs = observables[i][1];

                this.subscribe(el, obs, key, state);
            }

            // release closure references to GC 
            state.cleanup.add(Rx.Disposable.create(() => {
                // nullify args
                node = null;
                options = null;
                ctx = null;
                state = null;

                // nullify common locals
                el = null;
                keys = null;

                // nullify locals
                observables = null;
            }));
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 0;
        protected supportsDynamicValues = false;

        ////////////////////
        // Implementation

        protected domManager: IDomManager;

        private subscribe(el: HTMLElement, obs: Rx.Observable<any>, key: string, state: INodeState) {
            state.cleanup.add(obs.subscribe(x => {
                try {
                    this.applyValue(el, unwrapProperty(x), key);
                } catch (e) {
                    wx.app.defaultExceptionHandler.onNext(e);
                } 
            }));
        }

        protected applyValue(el: HTMLElement, key: string, value: any): void {
            internal.throwError("you need to override this method!");
        }
    }

    // Binding contributions to node-state
    interface ICssNodeState extends INodeState {
        cssBindingPreviousDynamicClasses: any;
    }

    class CssBinding extends MultiOneWayChangeBindingBase {
        constructor(domManager: IDomManager) {
            super(domManager, true);
        }

        protected applyValue(el: HTMLElement, value: any, key: string): void {
            var classes: Array<any>;

            if (key !== "") {
                classes = key.split(/\s+/).map(x => x.trim()).filter(x => <any> x);

                if (classes.length) {
                    toggleCssClass.apply(null, [el, !!value].concat(classes));
                }
            } else {
                var state = <ICssNodeState> this.domManager.getNodeState(el);

                // if we have previously added classes, remove them
                if (state.cssBindingPreviousDynamicClasses != null) {
                    toggleCssClass.apply(null, [el, false].concat(state.cssBindingPreviousDynamicClasses));

                    state.cssBindingPreviousDynamicClasses = null;
                }

                if (value) {
                    classes = value.split(/\s+/).map(x => x.trim()).filter(x => x);

                    if (classes.length) {
                        toggleCssClass.apply(null, [el, true].concat(classes));

                        state.cssBindingPreviousDynamicClasses = classes;
                    }
                }
            }
        }
    }

    class AttrBinding extends MultiOneWayChangeBindingBase {
        constructor(domManager: IDomManager) {
            super(domManager);

            this.priority = 5;
        }

        protected applyValue(el: HTMLElement, value: any, key: string): void {
            // To cover cases like "attr: { checked:someProp }", we want to remove the attribute entirely
            // when someProp is a "no value"-like value (strictly null, false, or undefined)
            // (because the absence of the "checked" attr is how to mark an element as not checked, etc.)
            var toRemove = (value === false) || (value === null) || (value === undefined);
            if (toRemove)
                el.removeAttribute(key);
            else {
                el.setAttribute(key, value.toString());
            }
        }
    }

    class StyleBinding extends MultiOneWayChangeBindingBase {
        constructor(domManager: IDomManager) {
            super(domManager);
        }

        protected applyValue(el: HTMLElement, value: any, key: string): void {
            if (value === null || value === undefined || value === false) {
                // Empty string removes the value, whereas null/undefined have no effect
                value = "";
            }

            el.style[key] = value;
        }
    }

    export module internal {
        export var cssBindingConstructor = <any> CssBinding;
        export var attrBindingConstructor = <any> AttrBinding;
        export var styleBindingConstructor = <any> StyleBinding;
    }
}
