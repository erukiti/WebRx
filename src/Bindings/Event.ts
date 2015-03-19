///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/DomManager.ts" />
/// <reference path="../Interfaces.ts" />

module wx {
    export interface IEventBindingOptions {
        [eventName: string]: (ctx: IDataContext, event: Event) => any|Rx.Observer<Event>;
    }

    class EventBinding implements IBindingHandler {
        constructor(domManager: IDomManager) {
            this.domManager = domManager;
        } 

        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("event-binding only operates on elements!");

            if (options == null)
                internal.throwError("invalid binding-options!");

            var el = <HTMLElement> node;

            // create an observable for each event handler value
            var tokens = this.domManager.getObjectLiteralTokens(options);
            var eventDisposables: { [eventName: string]: Rx.Disposable } = {};
            var eventHandlers = tokens.map(token => {
                var exp = this.domManager.compileBindingOptions(token.value);
                return this.domManager.expressionToObservable(exp, ctx);
            });

            // subscribe to all events
            for (var i = 0; i < tokens.length; i++) {
                ((_i => {
                    state.cleanup.add(eventHandlers[_i].subscribe(handler => {
                        var eventName = tokens[_i].key;

                        // unwire previous event subscription
                        if (eventDisposables[eventName]) {
                            eventDisposables[eventName].dispose();
                        }

                        // wire up event observable
                        if (typeof handler === "function") {
                            eventDisposables[eventName] = Rx.Observable.fromEvent<Event>(el, eventName).subscribe(e => {
                                handler.apply(ctx.$data, [ctx, e]);
                            });
                        } else {
                            // assumed to be an Rx.Observer
                            var observer = <Rx.Observer<Event>> handler;

                            // subscribe event directly to observer
                            eventDisposables[eventName] = Rx.Observable.fromEvent<Event>(el, eventName).subscribe(observer);
                        }
                    }));
                })(i));
            }

            // release event handlers
            state.cleanup.add(Rx.Disposable.create(() => {
                Object.keys(eventDisposables).forEach(x => {
                    if (eventDisposables[x])
                        eventDisposables[x].dispose();
                });
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
                eventDisposables = null;
                eventHandlers = null;
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
        export var eventBindingConstructor = <any> EventBinding;
    }
}