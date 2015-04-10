///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/DomManager.ts" />
/// <reference path="../Interfaces.ts" />

module wx {
    "use strict";

    // Binding contributions to node-state
    export interface INodeState {
        module?: IModule;
    }

    class ModuleBinding implements IBindingHandler {
        constructor(domManager: IDomManager) {
            this.domManager = domManager;
        } 

        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void {
            if (node.nodeType !== 1)
                internal.throwError("module-binding only operates on elements!");

            if (options == null)
                internal.throwError("invalid binding-options!");

            var el = <HTMLElement> node;
            var self = this;
            var exp = this.domManager.compileBindingOptions(options, module);
            var obs = this.domManager.expressionToObservable(exp, ctx);
            var initialApply = true;
            var cleanup: Rx.CompositeDisposable;

            function doCleanup() {
                if (cleanup) {
                    cleanup.dispose();
                    cleanup = null;
                }
            }

            // backup inner HTML
            var template = new Array<Node>();

            // subscribe
            state.cleanup.add(obs.subscribe(x => {
                try {
                    doCleanup();
                    cleanup = new Rx.CompositeDisposable();

                    var value = unwrapProperty(x);
                    var moduleNames: Array<string>;
                    var disp: Rx.IDisposable = undefined;

                    // split names
                    if (value)
                        moduleNames = value.split(" ").filter(x=> x);

                    if (moduleNames.length > 0) {
                        var observables = moduleNames.map(x => loadModule(x));

                        disp = Rx.Observable.combineLatest(observables, (_) => <IModule[]> args2Array(arguments)).subscribe(modules => {
                            // loader cleanup
                            if (disp != null) {
                                disp.dispose();
                                disp = undefined;
                            }
                            
                            // merge modules
                            var merged: IModule = <any> {};
                            extend(module || wx.app, merged);
                            modules.forEach(x => extend(x, merged));

                            // done
                            self.applyValue(el, merged, template, ctx, state, initialApply);
                            initialApply = false;
                        });

                        if (disp != null)
                            cleanup.add(disp);
                    }
                } catch (e) {
                    wx.app.defaultExceptionHandler.onNext(e);
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
        public name = "module";
        public controlsDescendants = true;

        ////////////////////
        // Implementation

        protected domManager: IDomManager;

        protected applyValue(el: HTMLElement, module: IModule, template: Array<Node>, ctx: IDataContext, state: INodeState, initialApply: boolean): void {
            var i;

            if (initialApply) {
                // clone to template
                for (i = 0; i < el.childNodes.length; i++) {
                    template.push(el.childNodes[i].cloneNode(true));
                }
            }

            state.module = module;

            // clean first
            this.domManager.cleanDescendants(el);

            // clear
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }

            // clone nodes and inject
            for (i = 0; i < template.length; i++) {
                var node = template[i].cloneNode(true);
                el.appendChild(node);
            }

            this.domManager.applyBindingsToDescendants(ctx, el);
        }
    }

    export module internal {
        export var moduleBindingConstructor = <any> ModuleBinding;
    }
}