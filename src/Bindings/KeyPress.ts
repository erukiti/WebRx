/// <reference path="../Interfaces.ts" />

import IID from "../IID"
import { extend, isInUnitTest, args2Array, isFunction, throwError, using, formatString, unwrapProperty } from "../Core/Utils"
import { isCommand } from "../Core/Command"

"use strict";

const keysByCode = {
    8: 'backspace',
    9: 'tab',
    13: 'enter',
    27: 'esc',
    32: 'space',
    33: 'pageup',
    34: 'pagedown',
    35: 'end',
    36: 'home',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    45: 'insert',
    46: 'delete'
};

export default class KeyPressBinding implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        this.domManager = domManager;
        this.app = app;
    }

    ////////////////////
    // wx.IBinding

    public applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void {
        if (node.nodeType !== 1)
            throwError("keyPress-binding only operates on elements!");

        if (options == null)
            throwError("invalid binding-options!");

        let el = <HTMLElement> node;

        // create an observable for key combination
        let tokens = this.domManager.getObjectLiteralTokens(options);
        let obs = Rx.Observable.fromEvent<KeyboardEvent>(el, "keydown")
            .where(x=> !x.repeat)
            .publish()
            .refCount();

        tokens.forEach(token => {
            let keyDesc = token.key;
            let combination, combinations = [];

            // parse key combinations
            keyDesc.split(' ').forEach(variation => {
                combination = {
                    expression: keyDesc,
                    keys: {}
                };

                variation.split('-').forEach(value => {
                    combination.keys[value.trim()] = true;
                });

                combinations.push(combination);
            });

            this.wireKey(token.value, obs, combinations, ctx, state, module);
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

    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;

    private testCombination(combination, event: KeyboardEvent): boolean {
        let metaPressed = !!(event.metaKey && !event.ctrlKey);
        let altPressed = !!event.altKey;
        let ctrlPressed = !!event.ctrlKey;
        let shiftPressed = !!event.shiftKey;
        let keyCode = event.keyCode;

        let metaRequired = !!combination.keys.meta;
        let altRequired = !!combination.keys.alt;
        let ctrlRequired = !!combination.keys.ctrl;
        let shiftRequired = !!combination.keys.shift;

        // normalize keycodes
        if ((!shiftPressed || shiftRequired) && keyCode >= 65 && keyCode <= 90)
            keyCode = keyCode + 32;

        let mainKeyPressed = combination.keys[keysByCode[keyCode]] || combination.keys[keyCode.toString()] || combination.keys[String.fromCharCode(keyCode)];

        return (
            mainKeyPressed &&
            (metaRequired === metaPressed) &&
            (altRequired === altPressed) &&
            (ctrlRequired === ctrlPressed) &&
            (shiftRequired === shiftPressed)
        );
    }

    private testCombinations(combinations, event: KeyboardEvent): boolean {
        for(let i = 0; i < combinations.length; i++) {
            if (this.testCombination(combinations[i], event))
                return true;
        }

        return false;
    }

    private wireKey(value: any, obs: Rx.Observable<KeyboardEvent>, combinations, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule) {
        let exp = this.domManager.compileBindingOptions(value, module);
        let command: wx.ICommand<any>;
        let commandParameter = undefined;

        if (typeof exp === "function") {
            let handler = this.domManager.evaluateExpression(exp, ctx);
            handler = unwrapProperty(handler);

            if (!isCommand(handler)) {
                state.cleanup.add(obs.where(e => this.testCombinations(combinations, e)).subscribe(e => {
                    try {
                        handler.apply(ctx.$data, [ctx]);

                        e.preventDefault();
                    } catch(e) {
                        this.app.defaultExceptionHandler.onNext(e);
                    }
                }));
            } else {
                command = <wx.ICommand<any>> <any> handler;

                state.cleanup.add(obs.where(e => this.testCombinations(combinations, e)).subscribe(e => {
                    try {
                        command.execute(undefined);

                        e.preventDefault();
                    } catch(e) {
                        this.app.defaultExceptionHandler.onNext(e);
                    }
                }));
            }
        } else if (typeof exp === "object") {
            command = <wx.ICommand<any>> <any> this.domManager.evaluateExpression(exp.command, ctx);
            command = unwrapProperty(command);

            if (exp.hasOwnProperty("parameter"))
                commandParameter = this.domManager.evaluateExpression(exp.parameter, ctx);

            state.cleanup.add(obs.where(e => this.testCombinations(combinations, e)).subscribe(e => {
                try {
                    command.execute(commandParameter);

                    e.preventDefault();
                } catch(e) {
                    this.app.defaultExceptionHandler.onNext(e);
                }
            }));
        } else {
            throwError("invalid binding options");
        }
    }
}
