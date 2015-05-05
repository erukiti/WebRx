///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/DomManager.ts" />
/// <reference path="../Interfaces.ts" />

module wx {
    "use strict";

    export interface ICommandBindingOptions {
        command: ICommand<any>;
        parameter?: any;
    }

    class CommandBinding implements IBindingHandler {
        constructor(domManager: IDomManager) {
            this.domManager = domManager;
        } 

        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void {
            if (node.nodeType !== 1)
                internal.throwError("command-binding only operates on elements!");

            if (options == null)
                internal.throwError("invalid binding-options!");

            let compiled = this.domManager.compileBindingOptions(options, module);

            let el = <HTMLElement> node;
            let exp: ICompiledExpression;
            let cmdObservable: Rx.Observable<ICommand<any>>;
            let paramObservable: Rx.Observable<any>;
            let cleanup: Rx.CompositeDisposable;
            let isAnchor = el.tagName.toLowerCase() === "a";
            let event: any = "click";

            function doCleanup() {
                if (cleanup) {
                    cleanup.dispose();
                    cleanup = null;
                }
            }

            if (typeof compiled === "function") {
                exp = <ICompiledExpression> compiled;

                cmdObservable = <any> this.domManager.expressionToObservable(exp, ctx);
            } else {
                let opt = <ICommandBindingOptions> compiled;

                exp = <ICompiledExpression> <any> opt.command;
                cmdObservable = <any> this.domManager.expressionToObservable(exp, ctx);

                if (opt.parameter) {
                    exp = <ICompiledExpression> <any> opt.parameter;
                    paramObservable = this.domManager.expressionToObservable(exp, ctx);
                }
            }

            if (paramObservable == null) {
                paramObservable = Rx.Observable.return<any>(undefined); 
            }

            state.cleanup.add(Rx.Observable
                .combineLatest(cmdObservable, paramObservable, (cmd, param) => ({ cmd: cmd, param: param }))
                .subscribe(x => {
                    try {
                        doCleanup();
                        cleanup = new Rx.CompositeDisposable();

                        if (x.cmd != null) {
                            if (!isCommand(x.cmd))
                                internal.throwError("Command-Binding only supports binding to a command!");

                            // disabled handling if supported by element
                            if(el.hasOwnProperty("disabled")) {
                                // initial update
                                el["disabled"] = !x.cmd.canExecute(x.param);
    
                                // listen to changes
                                cleanup.add(x.cmd.canExecuteObservable.subscribe(canExecute => {
                                    el["disabled"] = !canExecute;
                                }));
                            }

                            // handle input events
                            cleanup.add(Rx.Observable.fromEvent(el, "click").subscribe((e: Event) => {
                                // verify that the command can actually execute since we cannot disable 
                                // all elements - only form elements such as buttons 
                                if(x.cmd.canExecute(x.param)) {
                                    x.cmd.execute(x.param);
                                }                                

                                // prevent default for anchors
                                if (isAnchor) {
                                    e.preventDefault();
                                }
                            }));
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
                el = null;

                // nullify locals
                doCleanup();
            }));
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 0;

        ////////////////////
        // Implementation

        protected domManager: IDomManager;
    }

    export module internal {
        export var commandBindingConstructor = <any> CommandBinding;
    }
}