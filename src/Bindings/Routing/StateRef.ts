///<reference path="../../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../Services/DomService.ts" />
/// <reference path="../../Interfaces.ts" />

module wx {
    export interface IStateRefBindingOptions {
        name: string;
        params?: Object;
    }

    class StateRefBinding implements IBindingHandler {
        constructor(domService: IDomService, router: IRouter) {
            this.domService = domService;
            this.router = router;
        } 

        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1 || (<HTMLElement> node).tagName.toLowerCase() !== 'a')
                internal.throwError("stateRef-binding only operates on anchor-elements!");

            if (options == null)
                internal.throwError("invalid binding-ptions!");

            var el = <HTMLAnchorElement> node;
            var compiled = this.domService.compileBindingOptions(options);
            var exp: ICompiledExpression;
            var observables: Array<Rx.Observable<any>> = [];
            var opt = <IStateRefBindingOptions> compiled;
            var paramsKeys: Array<string> = [];
            var stateName;
            var stateParams: Object;

            if (typeof compiled === "function") {
                exp = <ICompiledExpression> compiled;

                observables.push(this.domService.expressionToObservable(exp, ctx));
            } else {
                // collect state-name observable
                observables.push(this.domService.expressionToObservable(<ICompiledExpression> <any> opt.name, ctx));

                // collect params observables
                if (opt.params) {
                    Object.keys(opt.params).forEach(x => {
                        paramsKeys.push(x);

                        observables.push(this.domService.expressionToObservable(opt.params[x], ctx));
                    });
                }
            }

            // subscribe to any input changes
            state.cleanup.add(Rx.Observable.combineLatest(observables, (_) => args2Array(arguments)).subscribe(latest => {
                // first element is always the state-name
                stateName = unwrapProperty(latest.shift());

                // subsequent entries are latest param values
                stateParams = {};

                for (var i = 0; i < paramsKeys.length; i++) {
                    stateParams[paramsKeys[i]] = unwrapProperty(latest[i]);
                }

                // construct uri and assign
                var uri = this.router.uri(stateName, stateParams);
                el.href = uri;
            }));

            // subscribe to anchor's click event
            state.cleanup.add(Rx.Observable.fromEvent(el, "click").subscribe((e: Event) => {
                // initiate state change using latest name and params
                this.router.go(stateName, stateParams, { location: true });

                e.preventDefault();
            }));

            // release closure references to GC 
            state.cleanup.add(Rx.Disposable.create(() => {
                // nullify args
                node = null;
                options = null;
                ctx = null;
                state = null;

                // nullify locals
                observables = null;
                compiled = null;
                stateName = null;
                stateParams = null;
                opt = null;
                paramsKeys = null;
            }));
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 5;

        ////////////////////
        // Implementation

        protected domService: IDomService;
        protected router: IRouter;
    }

    export module internal {
        export var stateRefBindingConstructor = <any> StateRefBinding;
    }
}