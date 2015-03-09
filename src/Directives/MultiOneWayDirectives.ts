///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Interfaces.ts" />

module wx {
    class MultiOneWayChangeDirectiveBase implements IDirective {
        constructor(domService: IDomService) {
            this.domService = domService;
        } 
 
       ////////////////////
        // IDirective

        public apply(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("directive only operates on elements!");

            var compiled = this.domService.compileDirectiveOptions(options);

            if (utils.isNull(compiled) || typeof compiled !== "object")
                internal.throwError("invalid options for directive!");

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

    class CssDirective extends MultiOneWayChangeDirectiveBase {
        constructor(domService: IDomService) {
            super(domService);
        }

        protected applyValue(el: HTMLElement, value: any, key: string): void {
            utils.toggleCssClass(el, !!value, key);
        }
    }

    class AttrDirective extends MultiOneWayChangeDirectiveBase {
        constructor(domService: IDomService) {
            super(domService);
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

    class StyleDirective extends MultiOneWayChangeDirectiveBase {
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
        export var cssDirectiveConstructor = <any> CssDirective;
        export var attrDirectiveConstructor = <any> AttrDirective;
        export var styleDirectiveConstructor = <any> StyleDirective;
    }
}
