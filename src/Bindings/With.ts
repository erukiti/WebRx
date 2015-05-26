/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import { IObservableProperty, IBindingHandler, IDataContext, INodeState, IModule  } from "../Interfaces"
import { IDomManager  } from "../Core/DomManager"
import IID from "../IID"
import { extend, isInUnitTest, args2Array, isFunction, isCommand, isRxObservable, isDisposable, 
    isRxScheduler, throwError, using, getOid, formatString, unwrapProperty } from "../Core/Utils"
import * as log from "../Core/Log"
import { property } from "../Core/Property"
import { applyBindings, cleanNode } from "../Core/DomManager"

"use strict";

export default class WithBinding implements IBindingHandler {
    constructor(domManager: IDomManager) {
        this.domManager = domManager;
    } 

    ////////////////////
    // IBinding

    public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void {
        if (node.nodeType !== 1)
            throwError("with-binding only operates on elements!");

        if (options == null)
            throwError("invalid binding-options!");

        let el = <HTMLElement> node;
        let self = this;
        let exp = this.domManager.compileBindingOptions(options, module);
        let obs = this.domManager.expressionToObservable(exp, ctx);

        // subscribe
        state.cleanup.add(obs.subscribe(x => {
            try {
                self.applyValue(el, unwrapProperty(x), state);
            } catch (e) {
                app.defaultExceptionHandler.onNext(e);
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
            obs = null;
            el = null;
            self = null;

            // nullify locals
        }));
    }

    public configure(options): void {
        // intentionally left blank
    }

    public priority = 50;
    public controlsDescendants = true;

    ////////////////////
    // implementation

    protected domManager: IDomManager;

    protected applyValue(el: HTMLElement, value: any, state: INodeState): void {
        state.model = value;
        let ctx = this.domManager.getDataContext(el);

        this.domManager.cleanDescendants(el);
        this.domManager.applyBindingsToDescendants(ctx, el);
    }
}
