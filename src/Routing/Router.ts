///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Collections/WeakMap.ts" />
/// <reference path="../Core/Resources.ts" />
/// <reference path="../Core/Injector.ts" />
/// <reference path="../Core/Globals.ts" />
/// <reference path="../Collections/Set.ts" />
/// <reference path="../Core/Environment.ts" />
/// <reference path="../Core/Module.ts" />

module wx {
    class Router implements IRouter {
        constructor(domService: IDomService) {
            this.domService = domService;

            // Implicit root state that is always active
            this.root = this.registerStateInternal({
                name: "",
                url: "^",
                "abstract": true
            });

            //this.root.navigable = null;
            this.state(this.root);

            // make sure new subscribers immediately receive the current state
            this.currentState = Rx.Observable.defer(() => {
                return this.state.changed.startWith(this.state());
            });

            // hook into navigation events
            window.onpopstate = (e) => {
                // construct relative url from location
                //var url = document.location.pathname + document.location.search;
            
                // navigate
                //this.navigate(url, false, e.state);
            };
        }

        public registerState(name: string, config: IState): IRouter {
            config.name = name;
            this.registerStateInternal(config);
            return this;
        }

        public go(to: string, params?: {}, options?: IStateOptions): Rx.Observable<any> {
            throw new Error("Not implemented");
        }

        public getState(state: string): IState {
            return this.states[state];
        }

        public currentState: Rx.Observable<IState>;

        //////////////////////////////////
        // Implementation

        private states: { [name: string]: IState } = {};
        private root: IState;
        private domService: IDomService;
        private state = wx.property<IState>();

        private registerStateInternal(state: IState) {
            // Wrap a new object around the state so we can store our private details easily.
            this.states[state.name] = utils.extend(state, {
                self: state,
                toString() { return self.name; }
            });

            return state;
        }
    }

    export module internal {
        export var routerConstructor = <any> Router;
    }
}
