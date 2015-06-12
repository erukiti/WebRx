/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Interfaces.ts" />
import { throwError, toggleCssClass, unwrapProperty } from "../Core/Utils";
"use strict";
/**
* Base class for one-way bindings that take multiple expressions defined as object literal and apply the result to one or more target elements
* @class
*/
export class MultiOneWayBindingBase {
    constructor(domManager, app, supportsDynamicValues = false) {
        this.priority = 0;
        this.supportsDynamicValues = false;
        this.domManager = domManager;
        this.app = app;
        this.supportsDynamicValues = supportsDynamicValues;
    }
    ////////////////////
    // wx.IBinding
    applyBinding(node, options, ctx, state, module) {
        if (node.nodeType !== 1)
            throwError("binding only operates on elements!");
        let compiled = this.domManager.compileBindingOptions(options, module);
        if (compiled == null || (typeof compiled !== "object" && !this.supportsDynamicValues))
            throwError("invalid binding-options!");
        let el = node;
        let observables = new Array();
        let obs;
        let exp;
        let keys = Object.keys(compiled);
        let key;
        if (typeof compiled === "function") {
            exp = compiled;
            obs = this.domManager.expressionToObservable(exp, ctx);
            observables.push(["", obs]);
        }
        else {
            for (let i = 0; i < keys.length; i++) {
                key = keys[i];
                let value = compiled[key];
                exp = value;
                obs = this.domManager.expressionToObservable(exp, ctx);
                observables.push([key, obs]);
            }
        }
        // subscribe
        for (let i = 0; i < observables.length; i++) {
            key = observables[i][0];
            obs = observables[i][1];
            this.subscribe(el, obs, key, state);
        }
        // release closure references to GC 
        state.cleanup.add(Rx.Disposable.create(() => {
            // nullify args
            node = null;
            options = null;
            ctx = null;
            state = null;
            // nullify common locals
            el = null;
            keys = null;
            // nullify locals
            observables = null;
        }));
    }
    configure(options) {
        // intentionally left blank
    }
    subscribe(el, obs, key, state) {
        state.cleanup.add(obs.subscribe(x => {
            try {
                this.applyValue(el, unwrapProperty(x), key);
            }
            catch (e) {
                this.app.defaultExceptionHandler.onNext(e);
            }
        }));
    }
    applyValue(el, key, value) {
        throwError("you need to override this method!");
    }
}
export class CssBinding extends MultiOneWayBindingBase {
    constructor(domManager, app) {
        super(domManager, app, true);
    }
    applyValue(el, value, key) {
        let classes;
        if (key !== "") {
            classes = key.split(/\s+/).map(x => x.trim()).filter(x => x);
            if (classes.length) {
                toggleCssClass.apply(null, [el, !!value].concat(classes));
            }
        }
        else {
            let state = this.domManager.getNodeState(el);
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
    constructor(domManager, app) {
        super(domManager, app);
        this.priority = 5;
    }
    applyValue(el, value, key) {
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
    constructor(domManager, app) {
        super(domManager, app);
    }
    applyValue(el, value, key) {
        if (value === null || value === undefined || value === false) {
            // Empty string removes the value, whereas null/undefined have no effect
            value = "";
        }
        el.style[key] = value;
    }
}
//# sourceMappingURL=MultiOneWay.js.map