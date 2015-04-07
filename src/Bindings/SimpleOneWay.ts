///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../Core/DomManager.ts" />
/// <reference path="../Interfaces.ts" />

module wx {
    class SingleOneWayChangeBindingBase implements IBindingHandler {
        constructor(domManager: IDomManager) {
            this.domManager = domManager;
        } 
 
      ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void {
            if (node.nodeType !== 1)
                internal.throwError("binding only operates on elements!");

            if (options == null)
                internal.throwError("invalid binding-options!");

            var el = <HTMLElement> node;
            var self = this;
            var exp = this.domManager.compileBindingOptions(options, module);
            var obs = this.domManager.expressionToObservable(exp, ctx);

            // subscribe
            state.cleanup.add(obs.subscribe(x => {
                try {
                    self.applyValue(el, unwrapProperty(x));
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

        protected domManager: IDomManager;

        protected applyValue(el: HTMLElement, value: any): void {
            internal.throwError("you need to override this method!");
        }
    }

    ////////////////////
    // Bindings

    class TextBinding extends SingleOneWayChangeBindingBase {
        constructor(domManager: IDomManager) {
            super(domManager);
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
        constructor(domManager: IDomManager) {
            super(domManager);

            this.inverse = false;
            this.priority = 10;
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
        constructor(domManager: IDomManager) {
            super(domManager);

            this.inverse = true;
        } 
    }

    class HtmlBinding extends SingleOneWayChangeBindingBase {
        constructor(domManager: IDomManager) {
            super(domManager);
        } 

        protected applyValue(el: HTMLElement, value: any): void {
            if ((value === null) || (value === undefined))
                value = "";

            el.innerHTML = value;
        }
    }

    class DisableBinding extends SingleOneWayChangeBindingBase {
        constructor(domManager: IDomManager) {
            super(domManager);

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
        constructor(domManager: IDomManager) {
            super(domManager);

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
