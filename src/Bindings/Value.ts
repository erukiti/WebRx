/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
///<reference path="../Interfaces.ts" />

import IID from "../IID"
import { extend, isInUnitTest, args2Array, isFunction, isCommand, isRxObservable, isDisposable, 
    throwError, using, getOid, formatString, unwrapProperty, isProperty } from "../Core/Utils"
import * as res from "../Core/Resources"

"use strict";

export default class ValueBinding implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        this.domManager = domManager;
        this.app = app;
    } 

    ////////////////////
    // wx.IBinding

    public applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void {
        if (node.nodeType !== 1)
            throwError("value-binding only operates on elements!");
        
        if (options == null)
            throwError("invalid binding-options!");

        let el = <HTMLInputElement> node;
        let tag = el.tagName.toLowerCase();

        if (tag !== 'input' && tag !== 'option' && tag !== 'select' && tag !== 'textarea')
            throwError("value-binding only operates on checkboxes and radio-buttons");

        let useDomManagerForValueUpdates = (tag === 'input' && el.type === 'radio') || tag === 'option';
        let prop: wx.IObservableProperty<any>;
        let cleanup: Rx.CompositeDisposable;
        let exp = this.domManager.compileBindingOptions(options, module);

        function doCleanup() {
            if (cleanup) {
                cleanup.dispose();
                cleanup = null;
            }
        }

        function updateElement(domManager: wx.IDomManager, value: any) {
            if (useDomManagerForValueUpdates)
                setNodeValue(el, value, domManager);
            else {
                if ((value === null) || (value === undefined))
                    value = "";

                el.value = value;
            }
        }

        // options is supposed to be a field-access path
        state.cleanup.add(this.domManager.expressionToObservable(exp, ctx).subscribe(model => {
            try {
                if (!isProperty(model)) {
                    // initial and final update
                    updateElement(this.domManager, model);
                } else {
                    doCleanup();
                    cleanup = new Rx.CompositeDisposable();

                    // update on property change
                    prop = model;

                    cleanup.add(prop.changed.subscribe(x => {
                        updateElement(this.domManager, x);
                    }));

                    // initial update
                    updateElement(this.domManager, prop());

                    // don't attempt to updated computed properties
                    if (!prop.source) {
                        cleanup.add(Rx.Observable.fromEvent(el, 'change').subscribe(e => {
                            try {
                                if (useDomManagerForValueUpdates)
                                    prop(getNodeValue(el, this.domManager));
                                else
                                    prop(el.value);
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

    public priority = 5;

    ////////////////////
    // wx.Implementation

    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;
}

/**
 * For certain elements such as select and input type=radio we store
 * the real element value in NodeState if it is anything other than a
 * string. This method returns that value.
 * @param {Node} node
 * @param {IDomManager} domManager
 */
export function getNodeValue(node: Node, domManager: wx.IDomManager): any {
    let state = <any> domManager.getNodeState(node);
    if (state != null && state[res.hasValueBindingValue]) {
        return state[res.valueBindingValue];
    }

    return (<any> node).value;
}

/**
 * Associate a value with an element. Either by using its value-attribute
 * or storing it in NodeState
 * @param {Node} node
 * @param {any} value
 * @param {IDomManager} domManager
 */
export function setNodeValue(node: Node, value: any, domManager: wx.IDomManager): void {
    if ((value === null) || (value === undefined))
        value = "";

    let state = <any> domManager.getNodeState(node);

    if (typeof value === "string") {
        // Update the element only if the element and model are different. On some browsers, updating the value
        // will move the cursor to the end of the input, which would be bad while the user is typing.
        if ((<any> node).value !== value) {
            (<any> node).value = value;

            // clear state since value is stored in attribute
            if (state != null && state[res.hasValueBindingValue]) {
                state[res.hasValueBindingValue] = false;
                state[res.valueBindingValue] = undefined;
            }
        }
    } else {
        // get or create state
        if (state == null) {
            state = this.createNodeState();
            this.setNodeState(node, state);
        }

        // store value
        state[res.valueBindingValue] = value;
        state[res.hasValueBindingValue] = true;
    }
}
