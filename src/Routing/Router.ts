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
    "use strict";

    interface IHistoryState {
        stateName: string;
        params: Object;
        title?: string;
    }

    class Router implements IRouter {
        constructor(domManager: IDomManager) {
            this.domManager = domManager;

            this.reset();

            // monitor navigation history
            app.history.onPopState.subscribe((e) => {
                var state = <IHistoryState> e.state;
                var stateName = state.stateName;

                if (stateName != null) {
                    // enter state using extracted params
                    this.go(stateName, state.params, { location: false });

                    // update title
                    app.title(state.title);
                }
            });

            // monitor title changes
            app.title.changed.subscribe(x => {
                document.title = x;

                this.replaceHistoryState(this.current(), x);
            });
        }

        //////////////////////////////////
        // IRouter

        public state(config: IRouterStateConfig): IRouter {
            this.registerStateInternal(config);
            return this;
        }

        public updateCurrentStateParams(withParamsAction: (params: any) => void): void {
            var _current = this.current();
            withParamsAction(_current.params);
            this.replaceHistoryState(_current, app.title());
        }

        public go(to: string, params?: {}, options?: IStateChangeOptions): void {
            to = this.mapPath(to);

            if (this.states[to] == null)
                internal.throwError("state '{0}' is not registered", to);

            this.activateState(to, params, options);
        }

        public get(state: string): IRouterStateConfig {
            return this.states[state];
        }

        public is(state: string, params?: any, options?: any) {
            var _current = this.current();
            var isActive = _current.name === state;

            if (isActive && params != null) {
                var currentParamsKeys = Object.keys(_current.params);
                var paramsKeys = Object.keys(params);

                if (currentParamsKeys.length === paramsKeys.length) {
                    for (var i = 0; i < paramsKeys.length; i++) {
                        if (_current.params[paramsKeys[i]] != params[paramsKeys[i]]) {
                            isActive = false;
                            break;
                        }
                    }
                }
            }

            return isActive;
        }

        public includes(state: string, params?: any, options?: any) {
            var _current = this.current();
            var isActive = _current.name.indexOf(state) === 0;

            if (isActive && params != null) {
                var currentParamsKeys = Object.keys(_current.params);
                var paramsKeys = Object.keys(params);

                paramsKeys = paramsKeys.length <= currentParamsKeys.length ?
                    paramsKeys : currentParamsKeys;

                for (var i = 0; i < paramsKeys.length; i++) {
                    if (_current.params[paramsKeys[i]] != params[paramsKeys[i]]) {
                        isActive = false;
                        break;
                    }
                }
            }

            return isActive;
        }

        public uri(state: string, params?: {}): string {
            state = this.mapPath(state);

            var route = this.getAbsoluteRouteForState(state);
            if (route != null)
                return route.stringify(params);

            return null;
        }

        public reset(): void {
            this.states = {};

            // Implicit root state that is always active
            this.root = this.registerStateInternal({
                name: this.rootStateName,
                route: route("/")
            });

            this.go(this.rootStateName);
        }

        public reload(): void {
            this.go(this.current().name, this.current().params, { force: true, location: false });
        }

        public getConfiguredParameterNamesForView(view: string, component: string): Array<string> {
            var hierarchy = this.getStateHierarchy(this.current().name);
            var stateParams = {};
            var result = [];
            var config: IRouterStateConfig;
            var index = -1;

            // walk the hierarchy backward to figure out when the component was introduced at the specified view-slot
            for (var i = hierarchy.length; i--; i >= 0) {
                config = hierarchy[i];

                if (config.views && config.views[view]) {
                    var other = config.views[view];
                    if (typeof other === "object") {
                        other = (<any> other).component;
                    }

                    if (other === component) {
                        index = i; // found but keep looking
                    }
                }
            }

            if (index !== -1) {
                config = hierarchy[index];

                // truncate hierarchy and merge params
                hierarchy = hierarchy.slice(0, index + 1);

                hierarchy.forEach(state => {
                    // merge params
                    if (state.params != null) {
                        extend(state.params, stateParams);
                    }
                });

                // extract resulting property names
                result = Object.keys(stateParams);

                // append any route-params
                result = result.concat((<IRoute> config.route).params);
            }

            return result;
        }

        public current = property<IRouterState>();

        //////////////////////////////////
        // Implementation

        private states: { [name: string]: IRouterStateConfig } = {};
        private root: IRouterStateConfig;
        private domManager: IDomManager;

        private pathSeparator = ".";
        private parentPathDirective = "^";
        private rootStateName = "$";
        private validPathRegExp = /^[a-zA-Z]([\w-_]*$)/;
        private titlePropertyName = "__wx_app_title";

        private registerStateInternal(state: IRouterStateConfig) {
            var parts = state.name.split(this.pathSeparator);

            if (state.name !== this.rootStateName) {
                // validate name
                if (parts.forEach(path => {
                    if (!this.validPathRegExp.test(path)) {
                        internal.throwError("invalid state-path '{0}' (a state-path must start with a character, optionally followed by one or more alphanumeric characters, dashes or underscores)");
                    }
                }));
            }

            // wrap and store
            state = <IRouterStateConfig> extend(state, {});
            this.states[state.name] = state;

            if (state.route != null) {
                // create route from string
                if (typeof state.route === "string") {
                    state.route = route(state.route);
                }
            } else {
                // derive relative route from name
                state.route = route(parts[parts.length - 1]);
            }

            // detect root-state override
            if (state.name === this.rootStateName)
                this.root = state;

            return state;
        }

        private pushHistoryState(state: IRouterState, title?: string): void {
            var hs = <IHistoryState> {
                stateName: state.name,
                params: state.params,
                title: title != null ? title : document.title
            };

            app.history.pushState(hs, "", state.uri);
        }

        private replaceHistoryState(state: IRouterState, title?: string): void {
            var hs = <IHistoryState> {
                stateName: state.name,
                params: state.params,
                title: title != null ? title : document.title
            };

            app.history.replaceState(hs, "", state.uri);
        }

        private mapPath(path: string) {
            // child-relative
            if (path.indexOf(this.pathSeparator) === 0) {
                return this.current().name + path;
            } else if (path.indexOf(this.parentPathDirective) === 0) {
                // parent-relative                
                var parent = this.current().name;

                // can't go further up than root
                if (parent === this.rootStateName)
                    return parent;

                // test parents and siblings until one is found that is registered
                var parts = parent.split(this.pathSeparator);

                for (var i = parts.length - 1; i > 0; i--) {
                    var tmp = parts.slice(0, i).join(this.pathSeparator);

                    // check if parent or sibling relative to current parent exists 
                    if (this.get(tmp) || this.get(tmp + path.substr(1))) {
                        path = tmp + path.substr(1);
                        return path;
                    }
                }

                // make it root relative
                path = this.rootStateName + path.substr(1);
                return path;
            } 

            return path;
        }

        private getStateHierarchy(name: string): IRouterStateConfig[] {
            var parts = name.split(this.pathSeparator);
            var stateName: string = "";
            var result = [];
            var state: IRouterStateConfig;

            if (name !== this.rootStateName)
                result.push(this.root);

            for (var i = 0; i < parts.length; i++) {
                if (i > 0)
                    stateName += this.pathSeparator + parts[i];
                else
                    stateName = parts[i];

                state = this.states[stateName];

                // if not registered, introduce fake state to keep hierarchy intact
                if (state == null) {
                    state = {
                        name: stateName,
                        route: route(stateName)
                    };
                }

                result.push(state);
            }

            return result;
        }

        private getAbsoluteRouteForState(name: string, hierarchy?: IRouterStateConfig[]): IRoute {
            hierarchy = hierarchy != null ? hierarchy : this.getStateHierarchy(name);
            var result: IRoute = null;

            hierarchy.forEach(state => {
                // concat urls
                if (result != null) {
                    var route = <IRoute> state.route;

                    // individual states may use absolute urls as well
                    if (!route.isAbsolute)
                        result = result.concat(<IRoute> state.route);
                    else
                        result = route;
                } else {
                    result = <IRoute> state.route;
                }
            });

            return result;
        }

        private activateState(to: string, params?: Object, options?: IStateChangeOptions): void {
            var hierarchy = this.getStateHierarchy(to);
            var stateViews: { [view: string]: string|{ component: string; params?: any } } = {};
            var stateParams = {};

            hierarchy.forEach(state => {
                // merge views
                if (state.views != null) {
                    extend(state.views, stateViews);
                }

                // merge params
                if (state.params != null) {
                    extend(state.params, stateParams);
                }
            });

            // merge param overrides
            if (params) {
                extend(params, stateParams);
            }

            // construct resulting state
            var route = this.getAbsoluteRouteForState(to, hierarchy);
            var state = <IRouterState> extend(this.states[to], {});
            state.uri = route.stringify(params);
            state.views = stateViews;
            state.params = stateParams;

            // perform deep equal against current state
            var _current = this.current();

            if ((options && options.force) || _current == null ||
                _current.name !== to ||
                !isEqual(_current.params, state.params)) {

                // reset views used by previous state that are unused by new state
                if (_current != null && _current.views != null && state.views != null) {
                    Object.keys(_current.views).forEach(x => {
                        if (!state.views.hasOwnProperty(x)) {
                            state.views[x] = null;
                        }
                    });
                }

                // update history
                if (options && options.location) {
                    if(options.location === RouterLocationChangeMode.replace)
                        this.replaceHistoryState(state, app.title());
                    else
                        this.pushHistoryState(state, app.title());
                }

                if (_current != null) {
                    if (_current.onLeave)
                        _current.onLeave(this.get(_current.name), _current.params);
                }

                // activate
                this.current(state);

                if (state.onEnter)
                    state.onEnter(this.get(state.name), params);
            }
        }
    }

    export var router: IRouter;
    Object.defineProperty(wx, "router", {
        get() { return injector.get<IRouter>(res.router); }
    });

    export module internal {
        export var routerConstructor = <any> Router;
    }
}
