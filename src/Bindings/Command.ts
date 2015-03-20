///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/DomManager.ts" />
/// <reference path="../Interfaces.ts" />

module wx {
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

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("command-binding only operates on elements!");

            if (options == null)
                internal.throwError("invalid binding-options!");

            var compiled = this.domManager.compileBindingOptions(options);

            var el = <HTMLElement> node;
            var exp: ICompiledExpression;
            var cmdObservable: Rx.Observable<ICommand<any>>;
            var paramObservable: Rx.Observable<any>;
            var cleanup: Rx.CompositeDisposable;

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
                var opt = <ICommandBindingOptions> compiled;

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
                    doCleanup();
                    cleanup = new Rx.CompositeDisposable();

                    if (x.cmd != null) {
                        if (!isCommand(x.cmd)) {
                            // value is not a ICommand
                            internal.throwError("Command-Binding only supports binding to a command!");
                        } else {
                            // initial update
                            el.disabled = !x.cmd.canExecute(x.param);

                            // listen to changes
                            cleanup.add(x.cmd.canExecuteObservable.subscribe(canExecute => {
                                el.disabled = !canExecute;
                            }));

                            // handle click event
                            cleanup.add(Rx.Observable.fromEvent(el, "click").subscribe(e => {
                                x.cmd.execute(x.param);
                            }));
                        }
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