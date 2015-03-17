///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../Core/DomService.ts" />
/// <reference path="../Interfaces.ts" />

module wx {
    class SingleOneWayChangeBindingBase implements IBindingHandler {
        constructor(domService: IDomService) {
            this.domService = domService;
        } 
 
      ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("binding only operates on elements!");

            if (options == null)
                internal.throwError("invalid binding-options!");

            var el = <HTMLElement> node;
            var self = this;
            var exp = this.domService.compileBindingOptions(options);
            var obs = this.domService.expressionToObservable(exp, ctx);

            // subscribe
            state.cleanup.add(obs.subscribe(x => {
                self.applyValue(el, x);
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
                obs = null;
                self = null;
            }));
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 0;

        ////////////////////
        // Implementation

        protected domService: IDomService;

        protected applyValue(el: HTMLElement, value: any): void {
            internal.throwError("you need to override this method!");
        }
    }

    ////////////////////
    // Bindings

    class TextBinding extends SingleOneWayChangeBindingBase {
        constructor(domService: IDomService) {
            super(domService);
        } 

        protected applyValue(el: HTMLElement, value: any): void {
            if ((value === null) || (value === undefined))
                value = "";

            el.textContent = value;
        }
    }

    export interface IVisibleBindingOptions {
        useCssClass: boolean;   // instruct the handler to hide/show elements using the supplied css class rather than modifying the elements style property
        hiddenClass: string;    // the css class to apply when the object is hidden
    }

    class VisibleBinding extends SingleOneWayChangeBindingBase {
        constructor(domService: IDomService) {
            super(domService);

            this.inverse = false;
        }

        public configure(_options): void {
            var options = <IVisibleBindingOptions> _options;

            VisibleBinding.useCssClass = options.useCssClass;
            VisibleBinding.hiddenClass = options.hiddenClass;
        }

        ////////////////////
        // implementation

        protected applyValue(el: HTMLElement, value: any): void {
            value = this.inverse ? !value : value;

            if (!VisibleBinding.useCssClass) {
                if (!value) {
                    el.style.display = "none";
                } else {
                    el.style.display = "";
                }
            } else {
                toggleCssClass(el, !value, VisibleBinding.hiddenClass);
            }
        }

        protected inverse: boolean = false;
        private static useCssClass: boolean;   // instruct the handler to hide/show elements using the supplied css classes rather than modifying the elements style property
        private static hiddenClass: string;    // the css class to apply when the object is hidden
    }

    class HiddenBinding extends VisibleBinding {
        constructor(domService: IDomService) {
            super(domService);

            this.inverse = true;
        } 
    }

    class HtmlBinding extends SingleOneWayChangeBindingBase {
        constructor(domService: IDomService) {
            super(domService);
        } 

        protected applyValue(el: HTMLElement, value: any): void {
            if ((value === null) || (value === undefined))
                value = "";

            el.innerHTML = value;
        }
    }

    class DisableBinding extends SingleOneWayChangeBindingBase {
        constructor(domService: IDomService) {
            super(domService);

            this.inverse = false;
        }

        ////////////////////
        // implementation

        protected applyValue(el: HTMLElement, value: any): void {
            value = this.inverse ? !value : value;

            el.disabled = value;
        }

        protected inverse: boolean = false;
    }

    class EnableBinding extends DisableBinding {
        constructor(domService: IDomService) {
            super(domService);

            this.inverse = true;
        }
    }

    export module internal {
        export var textBindingConstructor = <any> TextBinding;
        export var htmlBindingConstructor = <any> HtmlBinding;
        export var visibleBindingConstructor = <any> VisibleBinding;
        export var hiddenBindingConstructor = <any> HiddenBinding;
        export var disableBindingConstructor = <any> DisableBinding;
        export var enableBindingConstructor = <any> EnableBinding;
    }
}
