/// <reference path="../Interfaces.ts" />

import IID from "../IID"
import { extend, isInUnitTest, args2Array, isFunction, throwError, using, formatString, elementCanBeDisabled, toggleCssClass, unwrapProperty } from "../Core/Utils"
import { Module, loadModule } from "../Core/Module"

"use strict";

export default class ModuleBinding implements wx.IBindingHandler {
    constructor(domManager: wx.IDomManager, app: wx.IWebRxApp) {
        this.domManager = domManager;
        this.app = app;
    }

    ////////////////////
    // wx.IBinding

    public applyBinding(node: Node, options: string, ctx: wx.IDataContext, state: wx.INodeState, module: wx.IModule): void {
        if (node.nodeType !== 1)
            throwError("module-binding only operates on elements!");

        if (options == null)
            throwError("invalid binding-options!");

        let el = <HTMLElement> node;
        let self = this;
        let exp = this.domManager.compileBindingOptions(options, module);
        let obs = this.domManager.expressionToObservable(exp, ctx);
        let initialApply = true;
        let cleanup: Rx.CompositeDisposable;

        function doCleanup() {
            if (cleanup) {
                cleanup.dispose();
                cleanup = null;
            }
        }

        // backup inner HTML
        let template = new Array<Node>();

        // subscribe
        state.cleanup.add(obs.subscribe(x => {
            try {
                doCleanup();
                cleanup = new Rx.CompositeDisposable();

                let value = unwrapProperty(x);
                let moduleNames: Array<string>;
                let disp: Rx.IDisposable = undefined;

                // split names
                if (value) {
                    value = value.trim();
                    moduleNames = value.split(" ").filter(x => x);
                }

                if (moduleNames.length > 0) {
                    let observables = moduleNames.map(x => loadModule(x));

                    disp = Rx.Observable.combineLatest(observables,
                        function(_) { return <wx.IModule[]> args2Array(arguments) }).subscribe(modules => {
                        try {
                            // create intermediate module
                            let moduleName = (module || this.app).name + "+" + moduleNames.join("+");
                            let merged: wx.IModule = new Module(moduleName);

                            // merge modules into intermediate
                            merged.merge(module || this.app);
                            modules.forEach(x => merged.merge(x));

                            // done
                            self.applyValue(el, merged, template, ctx, state, initialApply);
                            initialApply = false;
                        } catch(e) {
                            this.app.defaultExceptionHandler.onNext(e);
                        }
                    });

                    if (disp != null)
                        cleanup.add(disp);
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
            obs = null;
            self = null;
        }));
    }

    public configure(options): void {
        // intentionally left blank
    }

    public priority = 100;
    public controlsDescendants = true;

    ////////////////////
    // Implementation

    protected domManager: wx.IDomManager;
    protected app: wx.IWebRxApp;

    protected applyValue(el: HTMLElement, module: wx.IModule, template: Array<Node>, ctx: wx.IDataContext, state: wx.INodeState, initialApply: boolean): void {
        if (initialApply) {
            // clone to template
            for(let i= 0; i < el.childNodes.length; i++) {
                template.push(el.childNodes[i].cloneNode(true));
            }
        }

        (<any> state).module = module;

        // clean first
        this.domManager.cleanDescendants(el);

        // clear
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }

        // clone nodes and inject
        for(let i= 0; i < template.length; i++) {
            let node = template[i].cloneNode(true);
            el.appendChild(node);
        }

        this.domManager.applyBindingsToDescendants(ctx, el);
    }
}
