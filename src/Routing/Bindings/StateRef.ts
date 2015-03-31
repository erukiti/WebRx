///<reference path="../../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../Core/DomManager.ts" />
/// <reference path="../../Interfaces.ts" />

module wx {
    export interface IStateRefBindingOptions {
        name: string;
        params?: Object;
    }

    class StateRefBinding implements IBindingHandler {
        constructor(domManager: IDomManager, router: IRouter) {
            this.domManager = domManager;
            this.router = router;
        } 

        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void {
            if (node.nodeType !== 1 || (<HTMLElement> node).tagName.toLowerCase() !== 'a')
                internal.throwError("stateRef-binding only operates on anchor-elements!");

            if (options == null)
                internal.throwError("invalid binding-options!");

            var el = <HTMLAnchorElement> node;
            var compiled = this.domManager.compileBindingOptions(options, module);
            var exp: ICompiledExpression;
            var observables: Array<Rx.Observable<any>> = [];
            var opt = <IStateRefBindingOptions> compiled;
            var paramsKeys: Array<string> = [];
            var stateName;
            var stateParams: Object;

            if (typeof compiled === "function") {
                exp = <ICompiledExpression> compiled;

                observables.push(this.domManager.expressionToObservable(exp, ctx));
            } else {
                // collect state-name observable
                observables.push(this.domManager.expressionToObservable(<ICompiledExpression> <any> opt.name, ctx));

                // collect params observables
                if (opt.params) {
                    Object.keys(opt.params).forEach(x => {
                        paramsKeys.push(x);

                        observables.push(this.domManager.expressionToObservable(opt.params[x], ctx));
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

                el.href = this.router.uri(stateName, stateParams);
            }));

            // subscribe to anchor's click event
            state.cleanup.add(Rx.Observable.fromEvent(el, "click").subscribe((e: Event) => {
                e.preventDefault();

                // initiate state change using latest name and params
                this.router.go(stateName, stateParams, { location: true });
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

        protected domManager: IDomManager;
        protected router: IRouter;
    }

    export module internal {
        export var stateRefBindingConstructor = <any> StateRefBinding;
    }
}