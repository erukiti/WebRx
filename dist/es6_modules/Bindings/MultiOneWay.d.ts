/// <reference path="../../../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Interfaces.d.ts" />
export declare class MultiOneWayChangeBindingBase implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp, supportsDynamicValues?: boolean);
    applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void;
    configure(options: any): void;
    priority: number;
    protected supportsDynamicValues: boolean;
    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;
    private subscribe(el, obs, key, state);
    protected applyValue(el: HTMLElement, key: string, value: any): void;
}
export declare class CssBinding extends MultiOneWayChangeBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    protected applyValue(el: HTMLElement, value: any, key: string): void;
}
export declare class AttrBinding extends MultiOneWayChangeBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    protected applyValue(el: HTMLElement, value: any, key: string): void;
}
export declare class StyleBinding extends MultiOneWayChangeBindingBase {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp);
    protected applyValue(el: HTMLElement, value: any, key: string): void;
}
