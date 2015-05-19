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
                            function(_) { return <IModule[]> args2Array(arguments) }).subscribe(modules => {
                            // create intermediate module
                            let moduleName = (module || wx.app).name + "+" + moduleNames.join("+");
                            let merged: IModule = new internal.moduleConstructor(moduleName);

                            // merge modules into intermediate
                            merged.merge(module || wx.app);
                            modules.forEach(x => merged.merge(x));

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
        public controlsDescendants = true;

        ////////////////////
        // Implementation

        protected domManager: IDomManager;

        protected applyValue(el: HTMLElement, module: IModule, template: Array<Node>, ctx: IDataContext, state: INodeState, initialApply: boolean): void {
            if (initialApply) {
                // clone to template
                for(let i= 0; i < el.childNodes.length; i++) {
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
            for(let i= 0; i < template.length; i++) {
                let node = template[i].cloneNode(true);
                el.appendChild(node);
            }

            this.domManager.applyBindingsToDescendants(ctx, el);
        }
    }

    export module internal {
        export var moduleBindingConstructor = <any> ModuleBinding;
    }
}