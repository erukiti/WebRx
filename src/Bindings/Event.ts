/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import { IObservableProperty, IBindingHandler, IDataContext, INodeState, IModule, IAnimation  } from "../Interfaces"
import { app  } from "../Core/Module"
import { IDomManager  } from "../Core/DomManager"
import { ICompiledExpression  } from "../Core/ExpressionCompiler"
import { ICommand  } from "../Core/Command"
import IID from "../IID"
import { extend, isInUnitTest, args2Array, isFunction, isCommand, isRxObservable, isDisposable, 
    throwError, formatString, unwrapProperty, isProperty, cloneNodeArray, isList, noop } from "../Core/Utils"

"use strict";

export interface IEventBindingOptions {
    [eventName: string]: (ctx: IDataContext, event: Event) => any|Rx.Observer<Event>|{ command: ICommand<any>; parameter: any };
}

export default class EventBinding implements IBindingHandler {
    constructor(domManager: IDomManager) {
        this.domManager = domManager;
    } 

    ////////////////////
    // IBinding

    public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void {
        if (node.nodeType !== 1)
            throwError("event-binding only operates on elements!");

        if (options == null)
            throwError("invalid binding-options!");

        let el = <HTMLElement> node;

        // create an observable for each event handler value
        let tokens = this.domManager.getObjectLiteralTokens(options);

        tokens.forEach(token => {
            this.wireEvent(el, token.value, token.key, ctx, state, module);
        });

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
        }));
    }

    public configure(options): void {
        // intentionally left blank
    }

    public priority = 0;

    ////////////////////
    // Implementation

    protected domManager: IDomManager;

    private wireEvent(el: HTMLElement, value: any, eventName: string, ctx: IDataContext, state: INodeState, module: IModule) {
        let exp = this.domManager.compileBindingOptions(value, module);
        let command: ICommand<any>;
        let commandParameter = undefined;
        let obs = Rx.Observable.fromEvent<Event>(el, eventName);

        if (typeof exp === "function") {
            let handler = this.domManager.evaluateExpression(exp, ctx);
            handler = unwrapProperty(handler);

            if (isFunction(handler)) {
                state.cleanup.add(obs.subscribe(e => {
                    handler.apply(ctx.$data, [ctx, e]);
                }));
            } else {
                if (isCommand(handler)) {
                    command = <ICommand<any>> <any> handler;

                    state.cleanup.add(obs.subscribe(_ => {
                        command.execute(undefined);
                    }));
                } else {
                    // assumed to be an Rx.Observer
                    let observer = <Rx.Observer<Event>> handler;

                    // subscribe event directly to observer
                    state.cleanup.add(obs.subscribe(observer));
                }
            }
        } else if (typeof exp === "object") {
            let opt = <{ command: ICommand<any>; parameter: any }> exp;

            command = <ICommand<any>> <any> this.domManager.evaluateExpression(<any> opt.command, ctx);
            command = unwrapProperty(command);

            if (exp.hasOwnProperty("parameter"))
                commandParameter = this.domManager.evaluateExpression(opt.parameter, ctx);

            state.cleanup.add(obs.subscribe(_ => {
                try {
                    command.execute(commandParameter);
                } catch(e) {
                    app.defaultExceptionHandler.onNext(e);
                }
            }));
        } else {
            throwError("invalid binding options");
        }
    }
}
