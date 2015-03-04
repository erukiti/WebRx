///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Interfaces.ts" />
/// <reference path="../Core/Resources.ts" />

module wx {
    class IfDirective implements IDirective {
        constructor(domService: IDomService) {
            this.domService = domService;
        } 
 
        ////////////////////
        // IDirective

        public apply(node: Node, options: any, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("if directive only operates on elements!");

            if (utils.isNull(options))
                internal.throwError("** invalid directive options!");

            var el = <HTMLElement> node;
            var self = this;
            var initialApply = true;
            var exp = <ICompiledExpression> options;
            var obs = this.domService.expressionToObservable(exp, ctx);

            // backup inner HTML
            var template = new Array<Node>();

            // subscribe
            state.cleanup.add(obs.subscribe(x => {
                self.applyValue(el, x, template, ctx, initialApply);

                initialApply = false;
            }));

            // release closure references to GC 
            state.cleanup.add(Rx.Disposable.create(() => {
                // nullify args
                node = null;
                options = null;
                ctx = null;
                state = null;

                // nullify common locals
                obs = null;
                el = null;
                self = null;

                // nullify locals
                template = null;
            }));
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 50;
        public descendants = true;

        ////////////////////
        // implementation

        protected inverse: boolean = false;
        protected domService: IDomService;

        protected applyValue(el: HTMLElement, value: any, template: Array<Node>, ctx: IDataContext, initialApply: boolean): void {
            var i;

            if (initialApply) {
                // clone to template
                for (i = 0; i < el.childNodes.length; i++) {
                    template.push(el.childNodes[i].cloneNode(true));
                }

                // clear
                while (el.firstChild) {
                    el.removeChild(el.firstChild);
                }
            }

            value = this.inverse ? !value : value;

            if (!value) {
                // clean first
                this.domService.cleanDescendants(el);

                // clear
                while (el.firstChild) {
                    el.removeChild(el.firstChild);
                }
            } else {
                // clone nodes and inject
                for (i = 0; i < template.length; i++) {
                    var node = template[i].cloneNode(true);
                    el.appendChild(node);
                }

                this.domService.applyDirectivesToDescendants(ctx, el);
            }
        }
    }

    class NotIfDirective extends IfDirective {
        constructor(domService: IDomService) {
            super(domService);

            this.inverse = true;
        } 
    }

    export module internal {
        export var ifDirectiveConstructor = <any> IfDirective;
        export var notifDirectiveConstructor = <any> NotIfDirective;
    }
}