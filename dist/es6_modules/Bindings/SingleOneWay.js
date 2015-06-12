/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Interfaces.ts" />
import { throwError, unwrapProperty, toggleCssClass, elementCanBeDisabled } from "../Core/Utils";
"use strict";
/**
* Base class for one-way bindings that take a single expression and apply the result to one or more target elements
* @class
*/
export class SingleOneWayBindingBase {
    constructor(domManager, app) {
        this.priority = 0;
        this.domManager = domManager;
        this.app = app;
    }
    ////////////////////
    // wx.IBinding
    applyBinding(node, options, ctx, state, module) {
        if (node.nodeType !== 1)
            throwError("binding only operates on elements!");
        if (options == null)
            throwError("invalid binding-options!");
        let el = node;
        let self = this;
        let exp = this.domManager.compileBindingOptions(options, module);
        let obs = this.domManager.expressionToObservable(exp, ctx);
        // subscribe
        state.cleanup.add(obs.subscribe(x => {
            try {
                self.applyValue(el, unwrapProperty(x));
            }
            catch (e) {
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
    configure(options) {
        // intentionally left blank
    }
    applyValue(el, value) {
        throwError("you need to override this method!");
    }
}
////////////////////
// Bindings
export class TextBinding extends SingleOneWayBindingBase {
    constructor(domManager, app) {
        super(domManager, app);
    }
    applyValue(el, value) {
        if ((value === null) || (value === undefined))
            value = "";
        el.textContent = value;
    }
}
export class VisibleBinding extends SingleOneWayBindingBase {
    constructor(domManager, app) {
        super(domManager, app);
        this.inverse = false;
        this.inverse = false;
        this.priority = 10;
    }
    configure(_options) {
        let options = _options;
        VisibleBinding.useCssClass = options.useCssClass;
        VisibleBinding.hiddenClass = options.hiddenClass;
    }
    ////////////////////
    // implementation
    applyValue(el, value) {
        value = this.inverse ? !value : value;
        if (!VisibleBinding.useCssClass) {
            if (!value) {
                el.style.display = "none";
            }
            else {
                el.style.display = "";
            }
        }
        else {
            toggleCssClass(el, !value, VisibleBinding.hiddenClass);
        }
    }
}
export class HiddenBinding extends VisibleBinding {
    constructor(domManager, app) {
        super(domManager, app);
        this.inverse = true;
    }
}
export class HtmlBinding extends SingleOneWayBindingBase {
    constructor(domManager, app) {
        super(domManager, app);
    }
    applyValue(el, value) {
        if ((value === null) || (value === undefined))
            value = "";
        el.innerHTML = value;
    }
}
export class DisableBinding extends SingleOneWayBindingBase {
    constructor(domManager, app) {
        super(domManager, app);
        this.inverse = false;
        this.inverse = false;
    }
    ////////////////////
    // implementation
    applyValue(el, value) {
        value = this.inverse ? !value : value;
        if (elementCanBeDisabled(el)) {
            el.disabled = value;
        }
    }
}
export class EnableBinding extends DisableBinding {
    constructor(domManager, app) {
        super(domManager, app);
        this.inverse = true;
    }
}
//# sourceMappingURL=SingleOneWay.js.map