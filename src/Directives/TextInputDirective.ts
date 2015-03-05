///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Interfaces.ts" />

module wx {
    class TextInputDirective implements IDirective {
        constructor(domService: IDomService) {
            this.domService = domService;
        } 

        ////////////////////
        // IDirective

        public apply(node: Node, options: any, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("textInput directive only operates on elements!");

            if (utils.isNull(options))
                internal.throwError("invalid options for directive!");

            var el = <HTMLInputElement> node;
            var tag = el.tagName.toLowerCase();

            if ((tag !== 'input' || el.getAttribute("type") !== 'text') && tag !== 'textarea')
                internal.throwError("textInput directive can only be applied to input[type='text'] or textarea elements");

            var prop: IObservableProperty<any>;
            var propertySubscription: Rx.Disposable;

            // options is supposed to be a field-access path
            state.cleanup.add(this.domService.fieldAccessToObservable(options, ctx, true).subscribe(src => {
                if (!utils.isProperty(src)) {
                    el.value = src;
                } else {
                    if (propertySubscription) {
                        propertySubscription.dispose();
                    }

                    prop = src;
                    el.value = prop();
                }
            }));

            // release subscriptions and handlers
            state.cleanup.add(Rx.Disposable.create(() => {
                if (propertySubscription) {
                    propertySubscription.dispose();
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
            }));
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 0;

        protected domService: IDomService;
    }

    export module internal {
        export var textInputDirectiveConstructor = <any> TextInputDirective;
    }
}