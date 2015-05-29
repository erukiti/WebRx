/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Interfaces.ts" />

import IID from "../IID"
import { extend, isInUnitTest, args2Array, isFunction, isRxObservable, isDisposable, 
    throwError, formatString, unwrapProperty, isProperty, cloneNodeArray, noop } from "../Core/Utils"

"use strict";

export default class ComponentBinding implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        this.domManager = domManager;
        this.app = app;
    } 

    ////////////////////
    // wx.IBinding

    public applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void {
        if (node.nodeType !== 1)
            throwError("component-binding only operates on elements!");

        if (options == null)
            throwError("invalid binding-options!");

        let el = <HTMLElement> node;
        let compiled = this.domManager.compileBindingOptions(options, module);
        let opt = <wx.IComponentBindingOptions> compiled;
        let exp: wx.ICompiledExpression;
        let componentNameObservable: Rx.Observable<string>;
        let componentParams = {};
        let cleanup: Rx.CompositeDisposable;

        function doCleanup() {
            if (cleanup) {
                cleanup.dispose();
                cleanup = null;
            }
        }

        if (typeof compiled === "function") {
            exp = <wx.ICompiledExpression> compiled;

            componentNameObservable = <any> this.domManager.expressionToObservable(exp, ctx);
        } else {
            // collect component-name observable
            componentNameObservable = <any> this.domManager.expressionToObservable(<wx.ICompiledExpression> <any> opt.name, ctx);

            // collect params observables
            if (opt.params) {
                if (isFunction(opt.params)) {
                    // opt params is object passed by value (probably $componentParams from view-binding)
                    componentParams = this.domManager.evaluateExpression(<wx.ICompiledExpression> opt.params, ctx);
                } else if (typeof opt.params === "object") {
                    Object.keys(opt.params).forEach(x => {
                        componentParams[x] = this.domManager.evaluateExpression(opt.params[x], ctx);
                    });
                } else {
                    throwError("invalid component-params");
                }
            }
        }

        // clear children
        let oldContents = new Array<Node>();
        while (el.firstChild) {
             oldContents.push(el.removeChild(el.firstChild));
        }

        // subscribe to any input changes
        state.cleanup.add(componentNameObservable.subscribe(componentName => {
            try {
                doCleanup();
                cleanup = new Rx.CompositeDisposable();

                // lookup component
                let obs: Rx.Observable<wx.IComponent> = module.loadComponent(componentName, componentParams);
                let disp: Rx.IDisposable = undefined;

                if (obs == null)
                    throwError("component '{0}' is not registered with current module-context", componentName);

                disp = obs.subscribe(component => {
                    // loader cleanup
                    if (disp != null) {
                        disp.dispose();
                        disp = undefined;
                    }

                    // auto-dispose view-model
                    if (component.viewModel) {
                        if (isDisposable(component.viewModel)) {
                            cleanup.add(component.viewModel);
                        }
                    }

                    // done
                    this.applyTemplate(component, el, ctx, state, component.template, component.viewModel);
                });

                if (disp != null)
                    cleanup.add(disp);
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
            oldContents = null;
            compiled = null;

            doCleanup();
        }));
    }

    public configure(options): void {
        // intentionally left blank
    }

    public priority = 30;
    public controlsDescendants = true;

    ////////////////////
    // wx.Implementation

    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;

    protected applyTemplate(component: wx.IComponentDescriptor, el: HTMLElement, ctx: wx.IDataContext, state: wx.INodeState, template: Node[], vm?: any) {
        // clear
        while (el.firstChild) {
            this.domManager.cleanNode(el.firstChild);
            el.removeChild(el.firstChild);
        }

        // clone template and inject
        for(let i = 0; i < template.length; i++) {
            let node = template[i].cloneNode(true);
            el.appendChild(node);
        }

        if (vm) {
            state.model = vm;

            // refresh context
            ctx = this.domManager.getDataContext(el);
        }

        // invoke preBindingInit 
        if (vm && component.preBindingInit && vm.hasOwnProperty(component.preBindingInit)) {
            vm[component.preBindingInit].call(vm, el);
        }

        // done
        this.domManager.applyBindingsToDescendants(ctx, el);

        // invoke postBindingInit 
        if (vm && component.postBindingInit && vm.hasOwnProperty(component.postBindingInit)) {
            vm[component.postBindingInit].call(vm, el);
        }
    }
}
