/// <reference path="../../Interfaces.ts" />

import { extend, isInUnitTest, args2Array, isFunction, throwError, using, formatString, unwrapProperty, toggleCssClass } from "../../Core/Utils"

"use strict";

export default class StateRefBinding implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, router: wx.IRouter, app: wx.IWebRxApp) {
        this.domManager = domManager;
        this.router = router;
        this.app = app;
    }

    ////////////////////
    // wx.IBinding

    public applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void {
        if (node.nodeType !== 1)
            throwError("stateRef-binding only operates on elements!");

        if (options == null)
            throwError("invalid binding-options!");

        let el = <HTMLElement> node;
        let isAnchor = el.tagName.toLowerCase() === "a";
        let anchor = isAnchor ? <HTMLAnchorElement> el : undefined;
        let compiled = this.domManager.compileBindingOptions(options, module);
        let exp: wx.ICompiledExpression;
        let observables: Array<Rx.Observable<any>> = [];
        let opt = <wx.IStateRefBindingOptions> compiled;
        let paramsKeys: Array<string> = [];
        let stateName;
        let stateParams: Object;

        if (typeof compiled === "function") {
            exp = <wx.ICompiledExpression> compiled;

            observables.push(this.domManager.expressionToObservable(exp, ctx));
        } else {
            // collect state-name observable
            observables.push(this.domManager.expressionToObservable(<wx.ICompiledExpression> <any> opt.name, ctx));

            // collect params observables
            if (opt.params) {
                Object.keys(opt.params).forEach(x => {
                    paramsKeys.push(x);

                    observables.push(this.domManager.expressionToObservable(opt.params[x], ctx));
                });
            }
        }

        // subscribe to any input changes
        state.cleanup.add(Rx.Observable.combineLatest(observables, function(_) { return args2Array(arguments) }).subscribe(latest => {
            try {
                // first element is always the state-name
                stateName = unwrapProperty(latest.shift());

                // subsequent entries are latest param values
                stateParams = {};

                for(let i = 0; i < paramsKeys.length; i++) {
                    stateParams[paramsKeys[i]] = unwrapProperty(latest[i]);
                }

                if(anchor != null) {
                    anchor.href = this.router.url(stateName, stateParams);
                }
            } catch (e) {
                this.app.defaultExceptionHandler.onNext(e);
            }
        }));

        // subscribe to anchor's click event
        state.cleanup.add(Rx.Observable.fromEvent(el, "click").subscribe((e: Event) => {
            e.preventDefault();

            // initiate state change using latest name and params
            this.router.go(stateName, stateParams, { location: true });
        }));

        // release closure references to GC
        state.cleanup.add(Rx.Disposable.create(() => {
            // nullify args
            node = null;
            options = null;
            ctx = null;
            state = null;

            // nullify locals
            observables = null;
            compiled = null;
            stateName = null;
            stateParams = null;
            opt = null;
            paramsKeys = null;
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
    protected router: wx.IRouter;
}
