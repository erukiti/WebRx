///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../Core/DomManager.ts" />
/// <reference path="../Interfaces.ts" />
/// <reference path="../Core/Resources.ts" />

module wx {
    export interface IIfBindingOptions {
        condition: string;
    }

    class IfBinding implements IBindingHandler {
        constructor(domManager: IDomManager) {
            this.domManager = domManager;
        } 
 
        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void {
            if (node.nodeType !== 1)
                internal.throwError("if-binding only operates on elements!");

            if (options == null)
                internal.throwError("invalid binding-options!");

            var el = <HTMLElement> node;
            var self = this;
            var initialApply = true;
            var exp = this.domManager.compileBindingOptions(options);
            var obs = this.domManager.expressionToObservable(exp, ctx);

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
        public controlsDescendants = true;

        ////////////////////
        // Implementation

        protected inverse: boolean = false;
        protected domManager: IDomManager;

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
                this.domManager.cleanDescendants(el);

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

                this.domManager.applyBindingsToDescendants(ctx, el);
            }
        }
    }

    class NotIfBinding extends IfBinding {
        constructor(domManager: IDomManager) {
            super(domManager);

            this.inverse = true;
        } 
    }

    export module internal {
        export var ifBindingConstructor = <any> IfBinding;
        export var notifBindingConstructor = <any> NotIfBinding;
    }
}