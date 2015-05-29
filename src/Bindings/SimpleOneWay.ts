/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Interfaces.ts" />

import IID from "../IID"
import { extend, isInUnitTest, args2Array, isFunction, isRxObservable, isDisposable, 
    isRxScheduler, throwError, using, getOid, formatString, unwrapProperty, isProperty, elementCanBeDisabled, toggleCssClass } from "../Core/Utils"

"use strict";

export class SingleOneWayChangeBindingBase implements wx.IBindingHandler {
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

////////////////////
// Bindings

export class TextBinding extends SingleOneWayChangeBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        super(domManager, app);
    } 

    protected applyValue(el: HTMLElement, value: any): void {
        if ((value === null) || (value === undefined))
            value = "";

        el.textContent = value;
    }
}

export class VisibleBinding extends SingleOneWayChangeBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        super(domManager, app);

        this.inverse = false;
        this.priority = 10;
    }

    public configure(_options): void {
        let options = <wx.IVisibleBindingOptions> _options;

        VisibleBinding.useCssClass = options.useCssClass;
        VisibleBinding.hiddenClass = options.hiddenClass;
    }

    ////////////////////
    // implementation

    protected applyValue(el: HTMLElement, value: any): void {
        value = this.inverse ? !value : value;

        if (!VisibleBinding.useCssClass) {
            if (!value) {
                el.style.display = "none";
            } else {
                el.style.display = "";
            }
        } else {
            toggleCssClass(el, !value, VisibleBinding.hiddenClass);
        }
    }

    protected inverse: boolean = false;
    private static useCssClass: boolean;   // instruct the handler to hide/show elements using the supplied css classes rather than modifying the elements style property
    private static hiddenClass: string;    // the css class to apply when the object is hidden
}

export class HiddenBinding extends VisibleBinding {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        super(domManager, app);

        this.inverse = true;
    } 
}

export class HtmlBinding extends SingleOneWayChangeBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        super(domManager, app);
    } 

    protected applyValue(el: HTMLElement, value: any): void {
        if ((value === null) || (value === undefined))
            value = "";

        el.innerHTML = value;
    }
}

export class DisableBinding extends SingleOneWayChangeBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        super(domManager, app);

        this.inverse = false;
    }

    ////////////////////
    // implementation

    protected applyValue(el: HTMLElement, value: any): void {
        value = this.inverse ? !value : value;

        if(elementCanBeDisabled(el)) {
            (<any> el).disabled = value;
        }
    }

    protected inverse: boolean = false;
}

export class EnableBinding extends DisableBinding {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        super(domManager, app);

        this.inverse = true;
    }
}
