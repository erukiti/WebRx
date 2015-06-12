/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Interfaces.ts" />

import IID from "../IID"
import { extend, isInUnitTest, args2Array, throwError, unwrapProperty, toggleCssClass, elementCanBeDisabled } from "../Core/Utils"
import { SingleOneWayBindingBase } from "./BindingBase"

"use strict";

////////////////////
// Bindings

export class TextBinding extends SingleOneWayBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        super(domManager, app);
    } 

    protected applyValue(el: HTMLElement, value: any): void {
        if ((value === null) || (value === undefined))
            value = "";

        el.textContent = value;
    }
}

export class VisibleBinding extends SingleOneWayBindingBase {
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

export class HtmlBinding extends SingleOneWayBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        super(domManager, app);
    } 

    protected applyValue(el: HTMLElement, value: any): void {
        if ((value === null) || (value === undefined))
            value = "";

        el.innerHTML = value;
    }
}

export class DisableBinding extends SingleOneWayBindingBase {
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
