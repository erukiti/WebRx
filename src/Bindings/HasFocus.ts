/// <reference path="../Interfaces.ts" />

import IID from "../IID"
import { extend, isInUnitTest, args2Array, isFunction, throwError, using, formatString, isProperty } from "../Core/Utils"
import { emitPropRefHint } from "./BindingSupport"

"use strict";

export default class HasFocusBinding implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        this.domManager = domManager;
        this.app = app;
    }

    ////////////////////
    // wx.IBinding

    public applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void {
        if (node.nodeType !== 1)
            throwError("hasFocus-binding only operates on elements!");

        if (options == null)
            throwError("invalid binding-options!");

        let el = <HTMLInputElement> node;
        let prop: wx.IObservableProperty<any>;
        let cleanup: Rx.CompositeDisposable;
        let compiled = this.domManager.compileBindingOptions(options, module);
        let exp: wx.ICompiledExpression;
        let delay = 0;

        if (typeof compiled === "object" && compiled.hasOwnProperty("property")) {
            let opt = <wx.IHasFocusBindingOptions> compiled;
            exp = opt.property;

            delay = this.domManager.evaluateExpression(<wx.ICompiledExpression> <any> opt.delay, ctx);

            // convert boolean to number
            if (typeof delay === "boolean")
                delay = delay ? 1 : 0;

        } else {
            exp = compiled;
        }

        function doCleanup() {
            if (cleanup) {
                cleanup.dispose();
                cleanup = null;
            }
        }

        function handleElementFocusChange(isFocused: boolean) {
            // If possible, ignore which event was raised and determine focus state using activeElement,
            // as this avoids phantom focus/blur events raised when changing tabs in modern browsers.
            let ownerDoc = el.ownerDocument;

            if ("activeElement" in ownerDoc) {
                let active;
                try {
                    active = ownerDoc.activeElement;
                } catch (e) {
                    // IE9 throws if you access activeElement during page load (see issue #703)
                    active = ownerDoc.body;
                }
                isFocused = (active === el);
            }

            prop(isFocused);
        }

        function updateElement(value: any) {
            if (value) {
                // Note: If the element is currently hidden, we schedule the focus change
                // to occur "soonish". Technically this is a hack because it hides the fact
                // that we make tricky assumption about the presence of a "visible" binding
                // on the same element who's subscribe handler runs after us

                if (delay === 0 && el.style.display !== 'none') {
                    el.focus();
                } else {
                    Rx.Observable.timer(delay).subscribe(() => {
                        el.focus();
                    });
                }
            } else {
                el.blur();
            }
        }

        // options is supposed to be a @propref
        state.cleanup.add(this.domManager.expressionToObservable(exp, ctx).subscribe(model => {
            try {
                if (!isProperty(model)) {
                    emitPropRefHint("HasFocus", options);

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
                        cleanup.add(Rx.Observable.merge(this.getFocusEventObservables(el)).subscribe(hasFocus => {
                            handleElementFocusChange(hasFocus);
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

    public priority = -1;

    ////////////////////
    // Implementation

    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;

    protected getFocusEventObservables(el: HTMLInputElement): Array<Rx.Observable<boolean>> {
        let result: Array<Rx.Observable<boolean>> = [];

        result.push(Rx.Observable.fromEvent(el, 'focus').select(x=> true));
        result.push(Rx.Observable.fromEvent(el, 'focusin').select(x=> true));
        result.push(Rx.Observable.fromEvent(el, 'blur').select(x=> false));
        result.push(Rx.Observable.fromEvent(el, 'focusout').select(x=> false));

        return result;
    }
}
