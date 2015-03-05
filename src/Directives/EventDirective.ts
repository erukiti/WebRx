///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Interfaces.ts" />

module wx {
    export interface IEventDirectiveOptions {
        [eventName: string]: (ctx: IDataContext, event: Event) => any;
    }

    class EventDirective implements IDirective {
        constructor(domService: IDomService) {
            this.domService = domService;
        } 

        ////////////////////
        // IDirective

        public apply(node: Node, options: any, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("event directive only operates on elements!");

            if (utils.isNull(options))
                internal.throwError("invalid options for directive!");

            var el = <HTMLElement> node;
            debugger;

            // create an observable for each event handler value
            var tokens = this.domService.getObjectLiteralTokens(options);
            var eventDisposables: { [eventName: string]: Rx.Disposable } = {};
            var eventHandlers = tokens.map(token =>
                <Rx.Observable<(ctx: IDataContext, event: Event) => any>> <any> this.domService.fieldAccessToObservable(token.value, ctx, false));

            // subscribe to all events
            for (var i = 0; i < tokens.length; i++) {
                ((_i => {
                    state.cleanup.add(eventHandlers[_i].subscribe(handlerFunc => {
                        // unwire previous event subscription
                        if (eventDisposables[tokens[_i].key]) {
                            eventDisposables[tokens[_i].key].dispose();
                        }

                        // wire up event observable
                        eventDisposables[tokens[_i].key] = Rx.Observable.fromEvent<Event>(el, tokens[_i].key).subscribe(e => {
                            // call handler
                            handlerFunc(ctx, e);
                        });
                    }));
                })(i));
            }

            // release event handlers
            state.cleanup.add(Rx.Disposable.create(() => {
                Object.keys(eventDisposables).forEach(x => eventDisposables[x].dispose());
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

        protected domService: IDomService;
    }

    export module internal {
        export var eventDirectiveConstructor = <any> EventDirective;
    }
}