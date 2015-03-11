///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Interfaces.ts" />

module wx {
    export interface IEventBindingOptions {
        [eventName: string]: (ctx: IDataContext, event: Event) => any|Rx.Observer<Event>;
    }

    class EventBinding implements IBindingHandler {
        constructor(domService: IDomService) {
            this.domService = domService;
        } 

        ////////////////////
        // IBinding

        public apply(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("event-binding only operates on elements!");

            if (utils.isNull(options))
                internal.throwError("invalid binding-ptions!");

            var el = <HTMLElement> node;

            // create an observable for each event handler value
            var tokens = this.domService.getObjectLiteralTokens(options);
            var eventDisposables: { [eventName: string]: Rx.Disposable } = {};
            var eventHandlers = tokens.map(token => {
                var exp = this.domService.compileBindingOptions(token.value);
                return this.domService.expressionToObservable(exp, ctx);
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
                                handler(ctx, e);
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

        protected domService: IDomService;
    }

    export module internal {
        export var eventBindingConstructor = <any> EventBinding;
    }
}