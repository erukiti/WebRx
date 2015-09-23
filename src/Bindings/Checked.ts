/// <reference path="../Interfaces.ts" />

import IID from "../IID"
import { extend, isInUnitTest, args2Array, isFunction, throwError, formatString, cloneNodeArray, elementCanBeDisabled, isProperty } from "../Core/Utils"

"use strict";

export default class CheckedBinding implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        this.domManager = domManager;
        this.app = app;
    } 

    ////////////////////
    // wx.IBinding

    public applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void {
        if (node.nodeType !== 1)
            throwError("checked-binding only operates on elements!");
        
        if (options == null)
            throwError("invalid binding-options!");

        let el = <HTMLInputElement> node;
        let tag = el.tagName.toLowerCase();
        let isCheckBox = el.type === 'checkbox';
        let isRadioButton = el.type === 'radio';

        if (tag !== 'input' || (!isCheckBox && !isRadioButton))
            throwError("checked-binding only operates on checkboxes and radio-buttons");

        let exp = this.domManager.compileBindingOptions(options, module);
        let prop: wx.IObservableProperty<any>;
        let cleanup: Rx.CompositeDisposable;

        function doCleanup() {
            if (cleanup) {
                cleanup.dispose();
                cleanup = null;
            }
        }

        function updateElement(value: any) {
            el.checked = value;
        }

        state.cleanup.add(this.domManager.expressionToObservable(exp, ctx).subscribe(model => {
            try {
                if (!isProperty(model)) {
                    // initial and final update
                    updateElement(model);
                } else {
                    doCleanup();
                    cleanup = new Rx.CompositeDisposable();

                    // update on property change
                    prop = model;

                    cleanup.add(prop.changed.subscribe(x => {
                        updateElement(x);
                    }));

                    // initial update
                    updateElement(prop());

                    // don't attempt to updated computed properties
                    if (!prop.source) {
                        // wire change-events depending on browser and version
                        let events = this.getCheckedEventObservables(el);
                        cleanup.add(Rx.Observable.merge(events).subscribe(e => {
                            try {
                                prop(el.checked);
                            } catch(e) {
                                this.app.defaultExceptionHandler.onNext(e);
                            }
                        }));
                    }
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
            doCleanup();
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

    protected getCheckedEventObservables(el: HTMLInputElement): Array<Rx.Observable<Object>> {
        let result: Array<Rx.Observable<Object>> = [];

        result.push(Rx.Observable.fromEvent(el, 'click'));
        result.push(Rx.Observable.fromEvent(el, 'change'));

        return result;
    }
}
