/// <reference path="./Interfaces.ts" />

import { injector } from "./Core/Injector"
import { isInUnitTest } from "./Core/Utils"
import * as res from "./Core/Resources"
import * as log from "./Core/Log"
import { property } from "./Core/Property"
import { Module, modules } from "./Core/Module"
import * as ExpressionCompiler from "./Core/ExpressionCompiler"
import {DomManager } from "./Core/DomManager"
import HtmlTemplateEngine from "./Core/HtmlTemplateEngine"
import CommandBinding from "./Bindings/Command"
import ModuleBinding from "./Bindings/Module"
import { IfBinding, NotIfBinding } from "./Bindings/If"
import { AttrBinding, CssBinding, StyleBinding } from "./Bindings/MultiOneWay"
import { DisableBinding, EnableBinding, HiddenBinding, VisibleBinding, HtmlBinding, TextBinding, } from "./Bindings/SimpleOneWay"
import ForEachBinding from "./Bindings/ForEach"
import EventBinding from "./Bindings/Event"
import ValueBinding from "./Bindings/Value"
import HasFocusBinding from "./Bindings/HasFocus"
import WithBinding from "./Bindings/With"
import CheckedBinding from "./Bindings/Checked"
import KeyPressBinding from "./Bindings/KeyPress"
import TextInputBinding from "./Bindings/TextInput"
import SelectedValueBinding from "./Bindings/SelectedValue"
import ComponentBinding from "./Bindings/Component"
import StateActiveBinding from "./Routing/Bindings/StateActive"
import ViewBinding from "./Routing/Bindings/View"
import StateRefBinding from "./Routing/Bindings/StateRef"
import SelectComponent from "./Components/Select"
import RadioGroupComponent from "./Components/RadioGroup"
import { Router } from "./Routing/Router"
import MessageBus from "./Core/MessageBus"
import { version } from "./Version"

// make sure RxExtensions get installed
import { install } from "./RxExtensions" 
install();    

declare var createMockHistory: () => wx.IHistory;

"use strict";

class App extends Module implements wx.IWebRxApp {
    constructor() {
        super("app");

        if (!isInUnitTest()) {
            this.history = this.createHistory();
        } else {
            this.history = createMockHistory();
        }
    }

    /// <summary>
    /// This Observer is signalled whenever an object that has a
    /// ThrownExceptions property doesn't Subscribe to that Observable. Use
    /// Observer.Create to set up what will happen - the default is to crash
    /// the application with an error message.
    /// </summary>
    public defaultExceptionHandler: Rx.Observer<Error> = Rx.Observer.create<Error>(ex => {
        if (!isInUnitTest()) {
            log.error("An onError occurred on an object (usually a computedProperty) that would break a binding or command. To prevent this, subscribe to the thrownExceptions property of your objects: {0}", ex);
        }
    });

    /// <summary>
    /// MainThreadScheduler is the scheduler used to schedule work items that
    /// should be run "on the UI thread". In normal mode, this will be
    /// DispatcherScheduler, and in Unit Test mode this will be Immediate,
    /// to simplify writing common unit tests.
    /// </summary>
    public get mainThreadScheduler(): Rx.IScheduler {
        return this._unitTestMainThreadScheduler || this._mainThreadScheduler
            || Rx.Scheduler.currentThread; // OW: return a default if schedulers haven't been setup by in
    }

    public set mainThreadScheduler(value: Rx.IScheduler) {
        if (isInUnitTest()) {
            this._unitTestMainThreadScheduler = value;
            this._mainThreadScheduler = this._mainThreadScheduler || value;
        } else {
            this._mainThreadScheduler = value;
        }
    }

    public get templateEngine(): wx.ITemplateEngine {
        if (!this._templateEngine) {
            this._templateEngine = injector.get<wx.ITemplateEngine>(res.templateEngine);
        }

        return this._templateEngine;
    }

    public set templateEngine(newVal: wx.ITemplateEngine) {
        this._templateEngine = newVal;
    }

    public get router(): wx.IRouter {
        if (!this._router) {
            this._router = injector.get<wx.IRouter>(res.router);
        }

        return this._router;
    }

    public history: wx.IHistory;
    public title: wx.IObservableProperty<string> = property<string>(document.title);
    public version = version;

    ///////////////////////
    // Implementation

    private _router: wx.IRouter;
    private _templateEngine: wx.ITemplateEngine;
    private _mainThreadScheduler: Rx.IScheduler;
    private _unitTestMainThreadScheduler: Rx.IScheduler;

    private createHistory(): wx.IHistory {
        // inherit default implementation
        let result = <wx.IHistory> {
            back: window.history.back.bind(window.history),
            forward: window.history.forward.bind(window.history),
            //go: window.history.go,
            pushState: window.history.pushState.bind(window.history),
            replaceState: window.history.replaceState.bind(window.history),
            
            getSearchParameters: (query?:string)=> {
                query = query || result.location.search.substr(1);
                
                if(query) {
                    let result = {};
                    let params = query.split("&");
                    for ( var i = 0; i < params.length; i++) {
                        var tmp = params[i].split("=");
                        result[tmp[0]] = decodeURIComponent(tmp[1]);
                    }
            
                    return result;
                } 
                
                return {};
            }
        };

        Object.defineProperty(result, "length", {
            get() {
                return window.history.length;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(result, "state", {
            get() {
                return window.history.state;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(result, "location", {
            get() {
                return window.location;
            },
            enumerable: true,
            configurable: true
        });

        // enrich with observable
        result.onPopState = Rx.Observable.fromEventPattern<PopStateEvent>(
            (h) => window.addEventListener("popstate", <EventListener> h),
            (h) => window.removeEventListener("popstate", <EventListener> h))
            .publish()
            .refCount();

        return result;
    }
    
    public register() {
        injector.register(res.app, this)    // register with injector
            .register(res.expressionCompiler, ExpressionCompiler)
            .register(res.templateEngine, [HtmlTemplateEngine], true)
            .register(res.domManager, [res.expressionCompiler, res.app, DomManager], true)
            .register(res.router, [res.domManager, res.app, Router], true)
            .register(res.messageBus, [MessageBus], true);

        injector.register("bindings.module", [res.domManager, ModuleBinding], true)
            .register("bindings.command", [res.domManager, CommandBinding], true)
            .register("bindings.if", [res.domManager, IfBinding], true)
            .register("bindings.with", [res.domManager, WithBinding], true)
            .register("bindings.notif", [res.domManager, NotIfBinding], true)
            .register("bindings.css", [res.domManager, CssBinding], true)
            .register("bindings.attr", [res.domManager, AttrBinding], true)
            .register("bindings.style", [res.domManager, StyleBinding], true)
            .register("bindings.text", [res.domManager, TextBinding], true)
            .register("bindings.html", [res.domManager, HtmlBinding], true)
            .register("bindings.visible", [res.domManager, VisibleBinding], true)
            .register("bindings.hidden", [res.domManager, HiddenBinding], true)
            .register("bindings.enabled", [res.domManager, EnableBinding], true)
            .register("bindings.disabled", [res.domManager, DisableBinding], true)
            .register("bindings.foreach", [res.domManager, ForEachBinding], true)
            .register("bindings.event", [res.domManager, EventBinding], true)
            .register("bindings.keyPress", [res.domManager, KeyPressBinding], true)
            .register("bindings.textInput", [res.domManager, TextInputBinding], true)
            .register("bindings.checked", [res.domManager, CheckedBinding], true)
            .register("bindings.selectedValue", [res.domManager, SelectedValueBinding], true)
            .register("bindings.component", [res.domManager, ComponentBinding], true)
            .register("bindings.value", [res.domManager, ValueBinding], true)
            .register("bindings.hasFocus", [res.domManager, HasFocusBinding], true)
            .register("bindings.view", [res.domManager, res.router, ViewBinding], true)
            .register("bindings.sref", [res.domManager, res.router, StateRefBinding], true)
            .register("bindings.sactive", [res.domManager, res.router, StateActiveBinding], true);
        
        injector.register("components.radiogroup", [res.templateEngine, RadioGroupComponent])
            .register("components.select", [res.templateEngine, SelectComponent]);

        // initialize module
        this.binding("module", "bindings.module")
            .binding("css", "bindings.css")
            .binding("attr", "bindings.attr")
            .binding("style", "bindings.style")
            .binding("command", "bindings.command")
            .binding("if", "bindings.if")
            .binding("with", "bindings.with")
            .binding("ifnot", "bindings.notif")
            .binding("text", "bindings.text")
            .binding("html", "bindings.html")
            .binding("visible", "bindings.visible")
            .binding("hidden", "bindings.hidden")
            .binding("disabled", "bindings.disabled")
            .binding("enabled", "bindings.enabled")
            .binding("foreach", "bindings.foreach")
            .binding("event", "bindings.event")
            .binding(["keyPress", "keypress"], "bindings.keyPress")
            .binding(["textInput", "textinput"], "bindings.textInput")
            .binding("checked", "bindings.checked")
            .binding("selectedValue", "bindings.selectedValue")
            .binding("component", "bindings.component")
            .binding("value", "bindings.value")
            .binding(["hasFocus", "hasfocus"], "bindings.hasFocus")
            .binding("view", "bindings.view")
            .binding(["sref", "stateRef", "stateref"], "bindings.sref")
            .binding(["sactive", "stateActive", "stateactive"], "bindings.sactive");
        
        this.component("wx-radiogroup", { resolve: "components.radiogroup" })
            .component("wx-select", { resolve: "components.select" });
            
        // register with module-registry
        modules["app"] = <wx.IModuleDescriptor> <any> { instance: this };
    }
}

let _app = new App();
export var app: wx.IWebRxApp = _app;
_app.register();

export var router = injector.get<wx.IRouter>(res.router);
export var messageBus = injector.get<wx.IMessageBus>(res.messageBus);