///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../Core/DomService.ts" />
/// <reference path="../Interfaces.ts" />

module wx {
    class MultiOneWayChangeBindingBase implements IBindingHandler {
        constructor(domService: IDomService) {
            this.domService = domService;
        } 
 
       ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("binding only operates on elements!");

            var compiled = this.domService.compileBindingOptions(options);

            if (compiled == null || typeof compiled !== "object")
                internal.throwError("invalid binding-options!");

            var el = <HTMLElement> node;
            var observables = new Array<[string, Rx.Observable<any>]>();
            var obs: Rx.Observable<any>;
            var exp: ICompiledExpression;
            var keys = Object.keys(compiled);
            var i;

            for (i = 0; i < keys.length; i++) {
                var key = keys[i];
                var value = compiled[key];

                exp = <ICompiledExpression> value;
                obs = this.domService.expressionToObservable(exp, ctx);

                observables.push([key, obs]);
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

        ////////////////////
        // Implementation

        protected domService: IDomService;

        private subscribe(el: HTMLElement, obs: Rx.Observable<any>, key: string, state: INodeState) {
            state.cleanup.add(obs.subscribe(x => {
                this.applyValue(el, x, key);
            }));
        }

        protected applyValue(el: HTMLElement, key: string, value: any): void {
            internal.throwError("you need to override this method!");
        }
    }

    class CssBinding extends MultiOneWayChangeBindingBase {
        constructor(domService: IDomService) {
            super(domService);
        }

        protected applyValue(el: HTMLElement, value: any, key: string): void {
            toggleCssClass(el, !!value, key);
        }
    }

    class AttrBinding extends MultiOneWayChangeBindingBase {
        constructor(domService: IDomService) {
            super(domService);

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
        constructor(domService: IDomService) {
            super(domService);
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
