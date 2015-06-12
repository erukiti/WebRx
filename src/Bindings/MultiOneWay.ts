/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Interfaces.ts" />

import IID from "../IID"
import { extend, isInUnitTest, args2Array, isFunction, throwError, using, formatString, elementCanBeDisabled, toggleCssClass, unwrapProperty } from "../Core/Utils"
import { MultiOneWayBindingBase } from "./BindingBase"

"use strict";

// Binding contributions to node-state
interface ICssNodeState extends wx.INodeState {
    cssBindingPreviousDynamicClasses: any;
}

export class CssBinding extends MultiOneWayBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        super(domManager, app, true);
    }

    protected applyValue(el: HTMLElement, value: any, key: string): void {
        let classes: Array<any>;

        if (key !== "") {
            classes = key.split(/\s+/).map(x => x.trim()).filter(x => <any> x);

            if (classes.length) {
                toggleCssClass.apply(null, [el, !!value].concat(classes));
            }
        } else {
            let state = <ICssNodeState> this.domManager.getNodeState(el);

            // if we have previously added classes, remove them
            if (state.cssBindingPreviousDynamicClasses != null) {
                toggleCssClass.apply(null, [el, false].concat(state.cssBindingPreviousDynamicClasses));

                state.cssBindingPreviousDynamicClasses = null;
            }

            if (value) {
                classes = value.split(/\s+/).map(x => x.trim()).filter(x => x);

                if (classes.length) {
                    toggleCssClass.apply(null, [el, true].concat(classes));

                    state.cssBindingPreviousDynamicClasses = classes;
                }
            }
        }
    }
}

export class AttrBinding extends MultiOneWayBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        super(domManager, app);

        this.priority = 5;
    }

    protected applyValue(el: HTMLElement, value: any, key: string): void {
        // To cover cases like "attr: { checked:someProp }", we want to remove the attribute entirely
        // when someProp is a "no value"-like value (strictly null, false, or undefined)
        // (because the absence of the "checked" attr is how to mark an element as not checked, etc.)
        let toRemove = (value === false) || (value === null) || (value === undefined);
        if (toRemove)
            el.removeAttribute(key);
        else {
            el.setAttribute(key, value.toString());
        }
    }
}

export class StyleBinding extends MultiOneWayBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        super(domManager, app);
    }

    protected applyValue(el: HTMLElement, value: any, key: string): void {
        if (value === null || value === undefined || value === false) {
            // Empty string removes the value, whereas null/undefined have no effect
            value = "";
        }

        el.style[key] = value;
    }
}
