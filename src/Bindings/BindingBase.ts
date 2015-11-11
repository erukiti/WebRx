/// <reference path="../Interfaces.ts" />

import IID from "../IID"
import { extend, isInUnitTest, args2Array, isFunction, throwError, using, formatString, elementCanBeDisabled, toggleCssClass, unwrapProperty } from "../Core/Utils"

"use strict";

/**
* Base class for one-way bindings that take a single expression and apply the result to one or more target elements
* @class
*/
export class SingleOneWayBindingBase implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        this.domManager = domManager;
        this.app = app;
    }

  ////////////////////
    // wx.IBinding

    public applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void {
        if (node.nodeType !== 1)
            throwError("binding only operates on elements!");

        if (options == null)
            throwError("invalid binding-options!");

        let el = <HTMLElement> node;
        let self = this;
        let exp = this.domManager.compileBindingOptions(options, module);
        let obs = this.domManager.expressionToObservable(exp, ctx);

        // subscribe
        state.cleanup.add(obs.subscribe(x => {
            try {
                self.applyValue(el, unwrapProperty(x));
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
            obs = null;
            self = null;
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

    protected applyValue(el: HTMLElement, value: any): void {
        throwError("you need to override this method!");
    }
}

/**
* Base class for one-way bindings that take multiple expressions defined as object literal and apply the result to one or more target elements
* @class
*/
export class MultiOneWayBindingBase implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp, supportsDynamicValues: boolean = false) {
        this.domManager = domManager;
        this.app = app;
        this.supportsDynamicValues = supportsDynamicValues;
    }

   ////////////////////
    // wx.IBinding

    public applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void {
        if (node.nodeType !== 1)
            throwError("binding only operates on elements!");

        let compiled = this.domManager.compileBindingOptions(options, module);

        if (compiled == null || (typeof compiled !== "object" && !this.supportsDynamicValues))
            throwError("invalid binding-options!");

        let el = <HTMLElement> node;
        let observables = new Array<[string, Rx.Observable<any>]>();
        let obs: Rx.Observable<any>;
        let exp: wx.ICompiledExpression;
        let keys = Object.keys(compiled);
        let key;

        if (typeof compiled === "function") {
            exp = <wx.ICompiledExpression> compiled;

            obs = this.domManager.expressionToObservable(exp, ctx);
            observables.push(["", obs]);
        } else {
            for(let i= 0; i < keys.length; i++) {
                key = keys[i];
                let value = compiled[key];

                exp = <wx.ICompiledExpression> value;
                obs = this.domManager.expressionToObservable(exp, ctx);

                observables.push([key, obs]);
            }
        }

        // subscribe
        for(let i= 0; i < observables.length; i++) {
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

    public configure(options): void {
        // intentionally left blank
    }

    public priority = 0;
    protected supportsDynamicValues = false;

    ////////////////////
    // wx.Implementation

    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;

    private subscribe(el: HTMLElement, obs: Rx.Observable<any>, key: string, state: wx.INodeState) {
        state.cleanup.add(obs.subscribe(x => {
            try {
                this.applyValue(el, unwrapProperty(x), key);
            } catch (e) {
                this.app.defaultExceptionHandler.onNext(e);
            }
        }));
    }

    protected applyValue(el: HTMLElement, key: string, value: any): void {
        throwError("you need to override this method!");
    }
}
