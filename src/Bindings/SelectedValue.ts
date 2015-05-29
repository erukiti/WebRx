/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Interfaces.ts" />

import IID from "../IID"
import { extend, isInUnitTest, args2Array, isFunction, throwError, using, formatString, unwrapProperty, isProperty } from "../Core/Utils"
import { applyBindings, cleanNode } from "../Core/DomManager"
import { getNodeValue, setNodeValue } from "./Value"
import { isList } from "../Collections/List"

"use strict";

interface ISelectedValueBindingImpl {
    supports(el: HTMLElement, model: any): boolean;
    observeElement(el: HTMLElement): Rx.Observable<any>;
    observeModel(model: any): Rx.Observable<any>;
    updateElement(el: HTMLElement, model: any);
    updateModel(el: HTMLElement, model: wx.IObservableProperty<any>, e: any);
}

let impls = new Array<ISelectedValueBindingImpl>();

class RadioSingleSelectionImpl implements ISelectedValueBindingImpl {
    constructor(domManager: wx.IDomManager) {
        this.domManager = domManager;
    }

    protected domManager: wx.IDomManager;

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
            let prop = <wx.IObservableProperty<any>> model;
            return prop.changed;
        }

        return Rx.Observable.never<any>();
    }

    public updateElement(el: HTMLElement, model: any) {
        let input = <HTMLInputElement> el;

        input.checked = getNodeValue(input, this.domManager) == unwrapProperty(model);
    }

    public updateModel(el: HTMLElement, model: wx.IObservableProperty<any>, e: any) {
        let input = <HTMLInputElement> el;

        if (input.checked) {
            model(getNodeValue(input, this.domManager));
        }
    }
}

class OptionSingleSelectionImpl implements ISelectedValueBindingImpl {
    constructor(domManager: wx.IDomManager) {
        this.domManager = domManager;
    }

    protected domManager: wx.IDomManager;

    public supports(el: HTMLElement, model: any): boolean {
        return el.tagName.toLowerCase() === 'select' &&
            !isList(model);
    }

    public observeElement(el: HTMLElement): Rx.Observable<any> {
        return <Rx.Observable<any>> <any> Rx.Observable.fromEvent(el, 'change');
    }

    public observeModel(model: any): Rx.Observable<any> {
        if (isProperty(model)) {
            let prop = <wx.IObservableProperty<any>> model;
            return prop.changed;
        }

        return Rx.Observable.never<any>();
    }

    public updateElement(el: HTMLElement, model: any) {
        let select = <HTMLSelectElement> el;
        let value = unwrapProperty(model);
        let length = select.options.length;

        if (value == null) {
            select.selectedIndex = -1;
        } else {
            for(let i = 0; i < length; i++) {
                let option = select.options[i];
                if (getNodeValue(option, this.domManager) == value) {
                    select.selectedIndex = i;
                    break;
                }
            }
        }
    }

    public updateModel(el: HTMLElement, model: wx.IObservableProperty<any>, e: any) {
        let select = <HTMLSelectElement> el;

        // selected-value comes from the option at selectedIndex
        let value = select.selectedIndex !== -1 ?
            getNodeValue(select.options[select.selectedIndex], this.domManager) :
            undefined;

        model(value);
    }
}

export default class SelectedValueBinding implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        this.domManager = domManager;
        this.app = app;

        impls.push(new RadioSingleSelectionImpl(domManager));
        impls.push(new OptionSingleSelectionImpl(domManager));
    } 

    ////////////////////
    // wx.IBinding

    public applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void {
        if (node.nodeType !== 1)
            throwError("selectedValue-binding only operates on elements!");
        
        if (options == null)
            throwError("invalid binding-options!");

        let el = <HTMLInputElement> node;
        let impl: ISelectedValueBindingImpl;
        let implCleanup: Rx.CompositeDisposable;
        let exp = this.domManager.compileBindingOptions(options, module);
        
        function cleanupImpl() {
            if (implCleanup) {
                implCleanup.dispose();
                implCleanup = null;
            }
        }

        // options is supposed to be a field-access path
        state.cleanup.add(this.domManager.expressionToObservable(exp, ctx).subscribe(model => {
            try {
                cleanupImpl();

                // lookup implementation
                impl = undefined;
                for(let i = 0; i < impls.length; i++) {
                    if (impls[i].supports(el, model)) {
                        impl = impls[i];
                        break;
                    }
                }

                if (!impl)
                    throwError("selectedValue-binding does not support this combination of bound element and model!");

                implCleanup = new Rx.CompositeDisposable();

                // initial update
                impl.updateElement(el, model);

                // update on model change
                implCleanup.add(impl.observeModel(model).subscribe(x => {
                    try {
                        impl.updateElement(el, model);
                    } catch (e) {
                        this.app.defaultExceptionHandler.onNext(e);
                    } 
                }));

                // wire change-events
                if (isProperty(model)) {
                    implCleanup.add(impl.observeElement(el).subscribe(e => {
                        try {
                            impl.updateModel(el, model, e);
                        } catch (e) {
                            this.app.defaultExceptionHandler.onNext(e);
                        } 
                    }));
                }
            } catch (e) {
                this.app.defaultExceptionHandler.onNext(e);
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
    // wx.Implementation

    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;
}
