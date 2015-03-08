///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Core/Environment.ts" />

module wx {
    interface ISelectionDirectiveImpl {
        supports(el: HTMLElement, model: any): boolean;
        observeElement(el: HTMLElement): Rx.Observable<any>;
        observeModel(model: any): Rx.Observable<any>;
        updateElement(el: HTMLElement, model: any);
        updateModel(el: HTMLElement, model: any, e: any);
    }

    var impls = new Array<ISelectionDirectiveImpl>();

    class RadioSingleSelectionImpl implements ISelectionDirectiveImpl {
        public supports(el: HTMLElement, model: any): boolean {
            return (el.tagName.toLowerCase() === 'input' &&
                el.getAttribute("type") === 'radio') &&
                !utils.isList(model);
        }

        public observeElement(el: HTMLElement): Rx.Observable<any> {
            return <Rx.Observable<any>> <any> Rx.Observable.merge(
                Rx.Observable.fromEvent(el, 'click'),
                Rx.Observable.fromEvent(el, 'change'));
        }

        public observeModel(model: any): Rx.Observable<any> {
            if (utils.isProperty(model)) {
                var prop = <IObservableProperty<any>> model;
                return prop.changed;
            }

            return Rx.Observable.never<any>();
        }

        public updateElement(el: HTMLElement, model: any) {
            var input = <HTMLInputElement> el;

            if (utils.isProperty(model)) {
                var prop = <IObservableProperty<any>> model;
                input.checked = input.value == prop();
            } else {
                input.checked = input.value == model;
            }
        }

        public updateModel(el: HTMLElement, model: any, e: any) {
            var input = <HTMLInputElement> el;

            if (utils.isProperty(model)) {
                if (input.checked) {
                    var prop = <IObservableProperty<any>> model;
                    prop(input.value);
                }
            }
        }
    }

    impls.push(new RadioSingleSelectionImpl());

    class SelectionDirective implements IDirective {
        constructor(domService: IDomService) {
            this.domService = domService;
        } 

        ////////////////////
        // IDirective

        public apply(node: Node, options: any, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("Selection directive only operates on elements!");
            
            if (utils.isNull(options))
                internal.throwError("invalid options for directive!");

            var el = <HTMLInputElement> node;

            var impl: ISelectionDirectiveImpl;
            var implCleanup: Rx.CompositeDisposable;
            
            function cleanupImpl() {
                if (implCleanup) {
                    implCleanup.dispose();
                    implCleanup = null;
                }
            }

            // options is supposed to be a field-access path
            state.cleanup.add(this.domService.fieldAccessToObservable(options, ctx, true).subscribe(model => {
                cleanupImpl();

                // lookup implementation
                impl = undefined;
                for (var i = 0; i < impls.length; i++) {
                    if (impls[i].supports(el, model)) {
                        impl = impls[i];
                        break;
                    }
                }

                if (!impls)
                    internal.throwError("Selection directive does not support this combination of bound element and model!");

                implCleanup = new Rx.CompositeDisposable();

                // initial update
                impl.updateElement(el, model);

                // update on model change
                implCleanup.add(impl.observeModel(model).subscribe(x => {
                    impl.updateElement(el, model);
                }));

                // wire change-events
                implCleanup.add(impl.observeElement(el).subscribe(e => {
                    impl.updateModel(el, model, e);
                }));
            }));

            // release subscriptions and handlers
            state.cleanup.add(Rx.Disposable.create(() => {
                cleanupImpl();
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

        protected domService: IDomService
    }

    export module internal {
        export var selectionDirectiveConstructor = <any> SelectionDirective;
    }
}