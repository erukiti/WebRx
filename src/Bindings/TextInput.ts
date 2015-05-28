/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
///<reference path="../Interfaces.ts" />

import IID from "../IID"
import { extend, isInUnitTest, args2Array, isFunction, isCommand, isRxObservable, isDisposable, 
    isRxScheduler, throwError, using, getOid, formatString, unwrapProperty, isProperty } from "../Core/Utils"
import * as env from "../Core/Environment"

"use strict";

export default class TextInputBinding implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        this.domManager = domManager;
        this.app = app;
    } 

    ////////////////////
    // wx.IBinding

    public applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void {
         if (node.nodeType !== 1)
             throwError("textInput-binding only operates on elements!");
        
         if (options == null)
            throwError("invalid binding-options!");

        let el = <HTMLInputElement> node;
        let tag = el.tagName.toLowerCase();
        let isTextArea = tag === "textarea";

        if (tag !== 'input' && tag !== 'textarea')
            throwError("textInput-binding can only be applied to input or textarea elements");

        let exp = this.domManager.compileBindingOptions(options, module);
        let prop: wx.IObservableProperty<any>;
        let propertySubscription: Rx.Disposable;
        let eventSubscription: Rx.Disposable;
        let previousElementValue;

        function updateElement(value: any) {
            if (value === null || value === undefined) {
                value = "";
            }

            // Update the element only if the element and model are different. On some browsers, updating the value
            // will move the cursor to the end of the input, which would be bad while the user is typing.
            if (el.value !== value) {
                previousElementValue = value; // Make sure we ignore events (propertychange) that result from updating the value
                el.value = value;
            }
        }

        function doCleanup() {
            if (propertySubscription) {
                propertySubscription.dispose();
                propertySubscription = null;
            }

            if (eventSubscription) {
                eventSubscription.dispose();
                eventSubscription = null;
            }
        }

        state.cleanup.add(this.domManager.expressionToObservable(exp, ctx).subscribe(src => {
            try {
                if (!isProperty(src)) {
                    // initial and final update
                    updateElement(src);
                } else {
                    doCleanup();

                    // update on property change
                    prop = src;

                    propertySubscription = prop.changed.subscribe(x => {
                        updateElement(x);
                    });

                    // initial update
                    updateElement(prop());

                    // don't attempt to updated computed properties
                    if (!prop.source) {
                        // wire change-events depending on browser and version
                        let events = this.getTextInputEventObservables(el, isTextArea);
                        eventSubscription = Rx.Observable.merge(events).subscribe(e => {
                            try {
                                prop(el.value);
                            } catch(e) {
                                this.app.defaultExceptionHandler.onNext(e);
                            }                                    
                        });
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

    protected getTextInputEventObservables(el: HTMLInputElement, isTextArea: boolean): Array<Rx.Observable<Object>> {
        let result: Array<Rx.Observable<Object>> = [];

        if (env.ie && env.ie.version < 10) {
            if (env.ie.version <= 9) {
                // wx.Internet Explorer 9 doesn't fire the 'input' event when deleting text, including using
                // the backspace, delete, or ctrl-x keys, clicking the 'x' to clear the input, dragging text
                // out of the field, and cutting or deleting text using the context menu. 'selectionchange'
                // can detect all of those except dragging text out of the field, for which we use 'dragend'.
                result.push(<Rx.Observable<Object>> <any>
                    env.ie.getSelectionChangeObservable(el).where(doc=> doc.activeElement === el)); 

                result.push(Rx.Observable.fromEvent(el, 'dragend'));

                // wx.IE 9 does support 'input', but since it doesn't fire it when
                // using autocomplete, we'll use 'propertychange' for it also.
                result.push(Rx.Observable.fromEvent(el, 'input'));
                result.push(Rx.Observable.fromEvent(el, 'propertychange').where(e=> (<any> e).propertyName === 'value'));
            }
        } else {
            // All other supported browsers support the 'input' event, which fires whenever the content of the element is changed
            // through the user interface.
            result.push(Rx.Observable.fromEvent(el, 'input'));

            if (env.safari && env.safari.version < 5 && isTextArea) {
                // Safari <5 doesn't fire the 'input' event for <textarea> elements (it does fire 'textInput'
                // but only when typing). So we'll just catch as much as we can with keydown, cut, and paste.
                result.push(Rx.Observable.fromEvent(el, 'keydown'));
                result.push(Rx.Observable.fromEvent(el, 'paste'));
                result.push(Rx.Observable.fromEvent(el, 'cut'));
            } else if (env.opera && env.opera.version < 11) {
                // Opera 10 doesn't always fire the 'input' event for cut, paste, undo & drop operations.
                // We can try to catch some of those using 'keydown'.
                result.push(Rx.Observable.fromEvent(el, 'keydown'));
            } else if (env.firefox && env.firefox.version < 4.0) {
                // Firefox <= 3.6 doesn't fire the 'input' event when text is filled in through autocomplete
                result.push(Rx.Observable.fromEvent(el, 'DOMAutoComplete'));

                // Firefox <=3.5 doesn't fire the 'input' event when text is dropped into the input.
                result.push(Rx.Observable.fromEvent(el, 'dragdrop'));      // <3.5
                result.push(Rx.Observable.fromEvent(el, 'drop'));           // 3.5
            }
        }

        // Bind to the change event so that we can catch programmatic updates of the value that fire this event.
        result.push(Rx.Observable.fromEvent(el, 'change'));

        return result;
    }
}
