///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Interfaces.ts" />

module wx {
    export interface ICommandDirectiveOptions {
        command: ICommand<any>;
        parameter?: any;
    }

    class CommandDirective implements IDirective {
        constructor(domService: IDomService) {
            this.domService = domService;
        } 

        ////////////////////
        // IDirective

        public apply(node: Node, options: any, ctx: IDataContext, state: INodeState): boolean {
            if (node.nodeType !== 1)
                internal.throwError("command directive only operates on elements!");

            if (utils.isNull(options))
                internal.throwError("invalid options for directive!");

            var el = <HTMLElement> node;
            var cmd: ICommand<any>;
            var parameter: any;
            var exp: ICompiledExpression;

            if (typeof options === "function") {
                exp = <ICompiledExpression> options;

                using(this.domService.expressionToObservable(exp, ctx).toProperty(),(prop) => {
                    cmd = prop();
                    parameter = null;
                });
            } else {
                var opt = <ICommandDirectiveOptions> options;

                exp = <ICompiledExpression> <any> opt.command;
                using(this.domService.expressionToObservable(exp, ctx).toProperty(),(prop) => {
                    cmd = prop();
                });

                exp = <ICompiledExpression> <any> opt.parameter;
                using(this.domService.expressionToObservable(exp, ctx).toProperty(),(prop) => {
                    parameter = prop();
                });
            }

            if (!utils.isCommand(cmd)) {
                // value is not a ICommand
                internal.throwError("Command-Directive only works when bound to a Reactive Command!");
            } else {
                // initial update
                el.disabled = !cmd.canExecute(parameter);

                // listen to changes
                state.disposables.add(cmd.canExecuteObservable.subscribe(canExecute => {
                    el.disabled = !canExecute;
                }));

                // handle click event
                state.disposables.add(Rx.Observable.fromEvent(el, "click").subscribe(e => {
                    cmd.execute(parameter);
                }));
            }

            // release closure references to GC 
            state.disposables.add(Rx.Disposable.create(() => {
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

            return false;
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 0;

        protected domService: IDomService;
    }

    export module internal {
        export var commandDirectiveConstructor = <any> CommandDirective;
    }
}