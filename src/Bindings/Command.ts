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
            var cmd: ICommand<any>;
            var parameter: any;
            var exp: ICompiledExpression;

            if (typeof compiled === "function") {
                exp = <ICompiledExpression> compiled;

                using(this.domManager.expressionToObservable(exp, ctx).toProperty(),(prop) => {
                    cmd = prop();
                    parameter = null;
                });
            } else {
                var opt = <ICommandBindingOptions> compiled;

                exp = <ICompiledExpression> <any> opt.command;
                using(this.domManager.expressionToObservable(exp, ctx).toProperty(),(prop) => {
                    cmd = prop();
                });

                if (opt.parameter) {
                    exp = <ICompiledExpression> <any> opt.parameter;
                    using(this.domManager.expressionToObservable(exp, ctx).toProperty(), (prop) => {
                        parameter = prop();
                    });
                }
            }

            if (!isCommand(cmd)) {
                // value is not a ICommand
                internal.throwError("Command-Binding only works when bound to a Reactive Command!");
            } else {
                // initial update
                el.disabled = !cmd.canExecute(parameter);

                // listen to changes
                state.cleanup.add(cmd.canExecuteObservable.subscribe(canExecute => {
                    el.disabled = !canExecute;
                }));

                // handle click event
                state.cleanup.add(Rx.Observable.fromEvent(el, "click").subscribe(e => {
                    cmd.execute(parameter);
                }));
            }

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
                cmd = null;
                parameter = null;
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