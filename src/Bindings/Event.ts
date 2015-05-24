/// <reference path="../Core/DomManager.ts" />
/// <reference path="../Interfaces.ts" />

module wx {
    "use strict";

    export interface IEventBindingOptions {
        [eventName: string]: (ctx: IDataContext, event: Event) => any|Rx.Observer<Event>|{ command: ICommand<any>; parameter: any };
    }

    class EventBinding implements IBindingHandler {
        constructor(domManager: IDomManager) {
            this.domManager = domManager;
        } 

        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void {
            if (node.nodeType !== 1)
                internal.throwError("event-binding only operates on elements!");

            if (options == null)
                internal.throwError("invalid binding-options!");

            var el = <HTMLElement> node;

            // create an observable for each event handler value
            var tokens = this.domManager.getObjectLiteralTokens(options);

            tokens.forEach(token => {
                this.wireEvent(el, token.value, token.key, ctx, state, module);
            });

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
            }));
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 0;

        ////////////////////
        // Implementation

        protected domManager: IDomManager;

        private wireEvent(el: HTMLElement, value: any, eventName: string, ctx: IDataContext, state: INodeState, module: IModule) {
            var exp = this.domManager.compileBindingOptions(value, module);
            var command: ICommand<any>;
            var commandParameter = undefined;
            var obs = Rx.Observable.fromEvent<Event>(el, eventName);

            if (typeof exp === "function") {
                var handler = this.domManager.evaluateExpression(exp, ctx);
                handler = unwrapProperty(handler);

                if (isFunction(handler)) {
                    state.cleanup.add(obs.subscribe(e => {
                        handler.apply(ctx.$data, [ctx, e]);
                    }));
                } else {
                    if (isCommand(handler)) {
                        command = <ICommand<any>> <any> handler;

                        state.cleanup.add(obs.subscribe(_ => {
                            command.execute(undefined);
                        }));
                    } else {
                        // assumed to be an Rx.Observer
                        var observer = <Rx.Observer<Event>> handler;

                        // subscribe event directly to observer
                        state.cleanup.add(obs.subscribe(observer));
                    }
                }
            } else if (typeof exp === "object") {
                var opt = <{ command: ICommand<any>; parameter: any }> exp;

                command = <ICommand<any>> <any> this.domManager.evaluateExpression(<any> opt.command, ctx);
                command = unwrapProperty(command);

                if (exp.hasOwnProperty("parameter"))
                    commandParameter = this.domManager.evaluateExpression(opt.parameter, ctx);

                state.cleanup.add(obs.subscribe(_ => {
                    try {
                        command.execute(commandParameter);
                    } catch(e) {
                        app.defaultExceptionHandler.onNext(e);
                    }
                }));
            } else {
                internal.throwError("invalid binding options");
            }
        }
    }

    export module internal {
        export var eventBindingConstructor = <any> EventBinding;
    }
}