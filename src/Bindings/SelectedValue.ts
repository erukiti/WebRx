///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/DomManager.ts" />

module wx {
    interface ISelectedValueBindingImpl {
        supports(el: HTMLElement, model: any): boolean;
        observeElement(el: HTMLElement): Rx.Observable<any>;
        observeModel(model: any): Rx.Observable<any>;
        updateElement(el: HTMLElement, model: any);
        updateModel(el: HTMLElement, model: IObservableProperty<any>, e: any);
    }

    var impls = new Array<ISelectedValueBindingImpl>();

    class RadioSingleSelectionImpl implements ISelectedValueBindingImpl {
        constructor(domManager: IDomManager) {
            this.domManager = domManager;
        }

        protected domManager: IDomManager;

        public supports(el: HTMLElement, model: any): boolean {
            return (el.tagName.toLowerCase() === 'input' &&
                el.getAttribute("type") === 'radio') &&
                !isList(model);
        }

        public observeElement(el: HTMLElement): Rx.Observable<any> {
            return <Rx.Observable<any>> <any> Rx.Observable.merge(
                Rx.Observable.fromEvent(el, 'click'),
                Rx.Observable.fromEvent(el, 'change'));
        }

        public observeModel(model: any): Rx.Observable<any> {
            if (isProperty(model)) {
                var prop = <IObservableProperty<any>> model;
                return prop.changed;
            }

            return Rx.Observable.never<any>();
        }

        public updateElement(el: HTMLElement, model: any) {
            var input = <HTMLInputElement> el;

            input.checked = internal.getNodeValue(input, this.domManager) == unwrapProperty(model);
        }

        public updateModel(el: HTMLElement, model: IObservableProperty<any>, e: any) {
            var input = <HTMLInputElement> el;

            if (input.checked) {
                model(internal.getNodeValue(input, this.domManager));
            }
        }
    }

    class OptionSingleSelectionImpl implements ISelectedValueBindingImpl {
        constructor(domManager: IDomManager) {
            this.domManager = domManager;
        }

        protected domManager: IDomManager;

        public supports(el: HTMLElement, model: any): boolean {
            return el.tagName.toLowerCase() === 'select' &&
                !isList(model);
        }

        public observeElement(el: HTMLElement): Rx.Observable<any> {
            return <Rx.Observable<any>> <any> Rx.Observable.fromEvent(el, 'change');
        }

        public observeModel(model: any): Rx.Observable<any> {
            if (isProperty(model)) {
                var prop = <IObservableProperty<any>> model;
                return prop.changed;
            }

            return Rx.Observable.never<any>();
        }

        public updateElement(el: HTMLElement, model: any) {
            var select = <HTMLSelectElement> el;
            var value = unwrapProperty(model);
            var length = select.options.length;

            if (value == null) {
                select.selectedIndex = -1;
            } else {
                for (var i = 0; i < length; i++) {
                    var option = select.options[i];
                    if (internal.getNodeValue(option, this.domManager) == value) {
                        select.selectedIndex = i;
                        break;
                    }
                }
            }
        }

        public updateModel(el: HTMLElement, model: IObservableProperty<any>, e: any) {
            var select = <HTMLSelectElement> el;

            // selected-value comes from the option at selectedIndex
            var value = select.selectedIndex !== -1 ?
                internal.getNodeValue(select.options[select.selectedIndex], this.domManager) :
                undefined;

            model(value);
        }
    }

    class SelectedValueBinding implements IBindingHandler {
        constructor(domManager: IDomManager) {
            this.domManager = domManager;

            impls.push(new RadioSingleSelectionImpl(domManager));
            impls.push(new OptionSingleSelectionImpl(domManager));
        } 

        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void {
            if (node.nodeType !== 1)
                internal.throwError("selectedValue-binding only operates on elements!");
            
            if (options == null)
                internal.throwError("invalid binding-options!");

            var el = <HTMLInputElement> node;
            var impl: ISelectedValueBindingImpl;
            var implCleanup: Rx.CompositeDisposable;
            var exp = this.domManager.compileBindingOptions(options, module);
            
            function cleanupImpl() {
                if (implCleanup) {
                    implCleanup.dispose();
                    implCleanup = null;
                }
            }

            // options is supposed to be a field-access path
            state.cleanup.add(this.domManager.expressionToObservable(exp, ctx).subscribe(model => {
                cleanupImpl();

                // lookup implementation
                impl = undefined;
                for (var i = 0; i < impls.length; i++) {
                    if (impls[i].supports(el, model)) {
                        impl = impls[i];
                        break;
                    }
                }

                if (!impl)
                    internal.throwError("selectedValue-binding does not support this combination of bound element and model!");

                implCleanup = new Rx.CompositeDisposable();

                // initial update
                impl.updateElement(el, model);

                // update on model change
                implCleanup.add(impl.observeModel(model).subscribe(x => {
                    impl.updateElement(el, model);
                }));

                // wire change-events
                if (isProperty(model)) {
                    implCleanup.add(impl.observeElement(el).subscribe(e => {
                        impl.updateModel(el, model, e);
                    }));
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
                cleanupImpl();
            }));
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 0;

        ////////////////////
        // Implementation

        protected domManager: IDomManager;
    }

    export module internal {
        export var selectedValueBindingConstructor = <any> SelectedValueBinding;
    }
}