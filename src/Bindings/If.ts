/// <reference path="../Interfaces.ts" />

import IID from "../IID"
import { extend, isInUnitTest, args2Array, isFunction, throwError, using, formatString, nodeChildrenToArray, unwrapProperty } from "../Core/Utils"

"use strict";

export class IfBinding implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        this.domManager = domManager;
        this.app = app;
    } 

    ////////////////////
    // wx.IBinding

    public applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void {
        if (node.nodeType !== 1)
            throwError("if-binding only operates on elements!");

        if (options == null)
            throwError("invalid binding-options!");

        let compiled = this.domManager.compileBindingOptions(options, module);
        let el = <HTMLElement> node;
        let self = this;
        let initialApply = true;
        let exp: wx.ICompiledExpression;
        let animations: wx.IIfAnimationDescriptor = <wx.IIfAnimationDescriptor> {};
        let cleanup: Rx.CompositeDisposable;

        function doCleanup() {
            if (cleanup) {
                cleanup.dispose();
                cleanup = null;
            }
        }

        if (typeof compiled === "object") {
            let opt = <wx.IIfBindingOptions> compiled;
            exp = <wx.ICompiledExpression> <any> opt.condition;

            // extract animations
            if (opt.enter) {
                animations.enter = this.domManager.evaluateExpression(<wx.ICompiledExpression> <any> opt.enter, ctx);

                if (typeof animations.enter === "string") {
                    animations.enter = module.animation(<string> animations.enter);
                }
            }

            if (opt.leave) {
                animations.leave = this.domManager.evaluateExpression(<wx.ICompiledExpression> <any> opt.leave, ctx);

                if (typeof animations.leave === "string") {
                    animations.leave = module.animation(<string> animations.leave);
                }
            }
        } else {
            exp = compiled;
        }

        let obs = this.domManager.expressionToObservable(exp, ctx);

        // backup inner HTML
        let template = new Array<Node>();

        // subscribe
        state.cleanup.add(obs.subscribe(x => {
            try {
                doCleanup();
                cleanup = new Rx.CompositeDisposable();

                cleanup.add(self.applyValue(el, unwrapProperty(x), template, ctx, animations, initialApply));

                initialApply = false;
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
            obs = null;
            el = null;
            self = null;

            // nullify locals
            template = null;
        }));
    }

    public configure(options): void {
        // intentionally left blank
    }

    public priority = 50;
    public controlsDescendants = true;

    ////////////////////
    // wx.Implementation

    protected inverse: boolean = false;
    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;

    protected applyValue(el: HTMLElement, value: any, template: Array<Node>, ctx: wx.IDataContext,
        animations: wx.IIfAnimationDescriptor, initialApply: boolean): Rx.IDisposable {
        let leaveAnimation: wx.IAnimation = <wx.IAnimation> animations.leave;
        let enterAnimation: wx.IAnimation = <wx.IAnimation> animations.enter;
        let self = this;
        let obs: Rx.Observable<any> = undefined;

        if (initialApply) {
            // clone to template
            for(let i= 0; i < el.childNodes.length; i++) {
                template.push(el.childNodes[i].cloneNode(true));
            }

            // clear
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }
        }

        let oldElements = nodeChildrenToArray<Node>(el);
        value = this.inverse ? !value : value;

        function removeOldElements() {
            oldElements.forEach(x => {
                self.domManager.cleanNode(x);
                el.removeChild(x);
            });
        }

        if (oldElements.length > 0) {
            if (leaveAnimation) {
                leaveAnimation.prepare(oldElements);

                obs = leaveAnimation.run(oldElements)
                    .continueWith(() => leaveAnimation.complete(oldElements))
                    .continueWith(removeOldElements);
            } else {
                removeOldElements();
            }
        }
        
        if(value) {
            let nodes = template.map(x => x.cloneNode(true));

            if(obs) {
                obs = obs.continueWith(()=> {                    
                    if (enterAnimation)
                        enterAnimation.prepare(nodes);
        
                    for(let i= 0; i < template.length; i++) {
                        el.appendChild(nodes[i]);
                    }
        
                    this.domManager.applyBindingsToDescendants(ctx, el);
                });

                if (enterAnimation) {
                    obs = enterAnimation.run(nodes)
                        .continueWith(() => enterAnimation.complete(nodes));
                }
            }

            else {            
                if (enterAnimation)
                    enterAnimation.prepare(nodes);
    
                for(let i= 0; i < template.length; i++) {
                    el.appendChild(nodes[i]);
                }
    
                this.domManager.applyBindingsToDescendants(ctx, el);
    
                if (enterAnimation) {
                    obs = enterAnimation.run(nodes)
                        .continueWith(() => enterAnimation.complete(nodes));
                }
            }
        }

        return obs ? (obs.subscribe() || Rx.Disposable.empty) : Rx.Disposable.empty;
    }
}

export class NotIfBinding extends IfBinding {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        super(domManager, app);

        this.inverse = true;
    } 
}
