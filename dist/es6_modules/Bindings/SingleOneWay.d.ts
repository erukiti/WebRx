/// <reference path="../../../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Interfaces.d.ts" />
/**
* Base class for one-way bindings that take a single expression and apply the result to one or more target elements
* @class
*/
export declare class SingleOneWayBindingBase implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void;
    configure(options: any): void;
    priority: number;
    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;
    protected applyValue(el: HTMLElement, value: any): void;
}
export declare class TextBinding extends SingleOneWayBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    protected applyValue(el: HTMLElement, value: any): void;
}
export declare class VisibleBinding extends SingleOneWayBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    configure(_options: any): void;
    protected applyValue(el: HTMLElement, value: any): void;
    protected inverse: boolean;
    private static useCssClass;
    private static hiddenClass;
}
export declare class HiddenBinding extends VisibleBinding {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
}
export declare class HtmlBinding extends SingleOneWayBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    protected applyValue(el: HTMLElement, value: any): void;
}
export declare class DisableBinding extends SingleOneWayBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    protected applyValue(el: HTMLElement, value: any): void;
    protected inverse: boolean;
}
export declare class EnableBinding extends DisableBinding {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
}
