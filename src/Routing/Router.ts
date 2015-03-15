///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Collections/WeakMap.ts" />
/// <reference path="../Core/Resources.ts" />
/// <reference path="../Core/Injector.ts" />
/// <reference path="../Collections/Set.ts" />
/// <reference path="../Core/Environment.ts" />
/// <reference path="../Core/Module.ts" />
/// <reference path="../Core/Property.ts" />
/// <reference path="RouteMatcher.ts" />

module wx {
    class Router implements IRouter {
        constructor(domService: IDomService) {
            this.domService = domService;

            this.resetStates();

            // hook into navigation events
            window.onpopstate = (e) => {
                // construct relative url from location
                //var url = document.location.pathname + document.location.search;
            
                // navigate
                //this.navigate(url, false, e.state);
            };
        }

        public registerState(config: IRouterStateConfig): IRouter {
            this.registerStateInternal(config);
            return this;
        }

        public go(to: string, params?: {}, options?: IStateOptions): Rx.Observable<any> {
            if (this.states[to] == null)
                internal.throwError("state '{0}' is not registered", to);

            this.activateState(to, params, options);

            // TODO: transitions
            return Rx.Observable.return<any>(false);
        }

        public getState(state: string): IRouterStateConfig {
            return this.states[state];
        }

        public resetStates(): void {
            this.states = {};

            // Implicit root state that is always active
            this.root = this.registerStateInternal({
                name: this.rootStateName,
                url: route("/")
            });

            //this.root.navigable = null;
            this.go(this.rootStateName);
        }

        public currentState = wx.property<IRouterState>();

        //////////////////////////////////
        // Implementation

        private states: { [name: string]: IRouterStateConfig } = {};
        private root: IRouterStateConfig;
        private domService: IDomService;
        private rootStateName = "$";

        private registerStateInternal(state: IRouterStateConfig) {
            // wrap and store
            state = <IRouterStateConfig> extend(state, {});
            this.states[state.name] = state;

            if (state.url != null) {
                // create route from string
                if (typeof state.url === "string") {
                    state.url = route(state.url);
                }
            } else {
                // derive relative url from name
                var parts = state.name.split(".");
                state.url = route(parts[parts.length - 1]);
            }

            // detect root-state override
            if (state.name === this.rootStateName)
                this.root = state;

            return state;
        }

        private getStateHierarchy(name: string): IRouterStateConfig[] {
            var parts = name.split(".");
            var stateName: string = "";
            var result = [];

            if (name !== this.rootStateName)
                result.push(this.root);

            for (var i = 0; i < parts.length; i++) {
                if (i > 0)
                    stateName += "." + parts[i];
                else
                    stateName = parts[i];

                // is registered?
                var state = this.states[stateName];
                if (state != null) {
                    result.push(state);
                }
            }

            return result;
        }

        private activateState(to: string, params?: {}, options?: IStateOptions): void {
            var states = this.getStateHierarchy(to);
            var stateViews: { [view: string]: string|{ component: string; params?: any } } = {};
            var stateParams = {};
            var absoluteRoute: IRoute = null;

            states.forEach(state => {
                // merge views
                if (state.views != null) {
                    extend(state.views, stateViews);
                }

                // merge params
                if (state.params != null) {
                    extend(state.params, stateParams);
                }

                // concat urls
                if (absoluteRoute != null) {
                    var route = <IRoute> state.url;

                    // individual states may use absolute urls as well
                    if (!route.isAbsolute)
                        absoluteRoute = absoluteRoute.concat(<IRoute> state.url);
                    else
                        absoluteRoute = route;
                } else {
                    absoluteRoute = <IRoute> state.url;
                }
            });

            // finally merge params argument if present
            if (params) {
                extend(params, stateParams);
            }

            // construct resulting state
            var state = <IRouterState> extend(this.states[to], {});
            state.views = stateViews;
            state.params = stateParams;
            state.url = absoluteRoute.stringify(state.params);

            // perform deep equal against current state
            if (this.currentState() == null ||
                this.currentState().name !== to ||
                !isEqual(this.currentState().params, state.params)) {

                // update history
                window.history.pushState(state.name, "", state.url);

                // activate
                this.currentState(state);
            }
        }
    }

    export module internal {
        export var routerConstructor = <any> Router;
    }
}
