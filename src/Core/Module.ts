///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="Utils.ts" />
/// <reference path="Injector.ts" />
/// <reference path="Resources.ts" />

declare var createMockHistory: () => wx.IHistory;

module wx {
    class Module implements IModule {
        constructor(name: string) {
            this.name = name;
        }

        //////////////////////////////////
        // IModule

        public component(name: string, handler: IComponent): IComponentRegistry;
        public component(name: string, handler: string): IComponentRegistry;
        public component(name: string): IComponent;

        public component() {
            var args = args2Array(arguments);
            var name = args.shift();
            var component: IComponent;

            // lookup?
            if (args.length === 0) {
                // if the component has been registered as resource, resolve it now and update registry
                component = this.components[name];

                // if the component has been registered as resource, resolve it now and update registry
                if (typeof component === "string") {
                    component = injector.resolve<IComponent>(<any> component);
                    this.components[name] = component;
                }

                return <any> component;
            }

            // registration
            component = args.shift();
            this.components[name] = component;

            return this;
        }

        public binding(name: string, handler: IBindingHandler): IBindingRegistry;
        public binding(name: string, handler: string): IBindingRegistry;
        public binding(names: string[], handler: IBindingHandler): IBindingRegistry;
        public binding(names: string[], handler: string): IBindingRegistry;
        public binding(name: string): IBindingHandler;

        public binding() {
            var args = args2Array(arguments);
            var name = args.shift();
            var handler: IBindingHandler;

            // lookup?
            if (args.length === 0) {
                // if the handler has been registered as resource, resolve it now and update registry
                handler = this.bindings[name];

                if (typeof handler === "string") {
                    handler = injector.resolve<IBindingHandler>(<any> handler);
                    this.bindings[name] = handler;
                }

                return handler;
            }

            // registration
            handler = args.shift();

            if (Array.isArray(name)) {
                name.forEach(x => this.bindings[x] = handler);
            } else {
                this.bindings[name] = handler;
            }

            return <any> this;
        }

        public filter(name: string, filter: IExpressionFilter): IExpressionFilterRegistry;
        public filter(name: string): IExpressionFilter;

        public filter() {
            var args = args2Array(arguments);
            var name = args.shift();
            var filter: IExpressionFilter;

            // lookup?
            if (args.length === 0) {
                // if the filter has been registered as resource, resolve it now and update registry
                filter = this.expressionFilters[name];

                if (typeof filter === "string") {
                    filter = injector.resolve<IExpressionFilter>(<any> filter);
                    this.bindings[name] = filter;
                }

                return filter;
            }

            // registration
            filter = args.shift();
            this.expressionFilters[name] = filter;

            return <any> this;
        }

        public filters(): { [index: string]: IExpressionFilter; } {
            return this.expressionFilters;
        }

        public name: string;

        //////////////////////////////////
        // Implementation

        private bindings: { [name: string]: any } = {};
        private components: { [name: string]: any } = {};
        private expressionFilters: { [index: string]: IExpressionFilter; } = {};
    }

    class App extends Module implements IWebRxApp  {
        constructor() {
            super("app");

            if (!isInUnitTest()) {
                this.history = this.createHistory();
            } else {
                this.history = createMockHistory();
            }
        }

        /// <summary>
        /// This Observer is signalled whenever an object that has a
        /// ThrownExceptions property doesn't Subscribe to that Observable. Use
        /// Observer.Create to set up what will happen - the default is to crash
        /// the application with an error message.
        /// </summary>
        public defaultExceptionHandler: Rx.Observer<Error> = Rx.Observer.create<Error>(ex => {
            if (!isInUnitTest()) {
                log.error("An onError occurred on an object (usually a computedProperty) that would break a binding or command. To prevent this, subscribe to the thrownExceptions property of your objects: {0}", ex);
            }
        });

        /// <summary>
        /// MainThreadScheduler is the scheduler used to schedule work items that
        /// should be run "on the UI thread". In normal mode, this will be
        /// DispatcherScheduler, and in Unit Test mode this will be Immediate,
        /// to simplify writing common unit tests.
        /// </summary>
        public get mainThreadScheduler(): Rx.IScheduler {
            return this._unitTestMainThreadScheduler || this._mainThreadScheduler
                || Rx.Scheduler.currentThread;  // OW: return a default if schedulers haven't been setup by in
        }

        public set mainThreadScheduler(value: Rx.IScheduler) {
            if (isInUnitTest()) {
                this._unitTestMainThreadScheduler = value;
                this._mainThreadScheduler = this._mainThreadScheduler || value;
            } else {
                this._mainThreadScheduler = value;
            }
        }

        public get templateEngine(): ITemplateEngine {
            if (!this._templateEngine) {
                this._templateEngine = injector.resolve<ITemplateEngine>(res.htmlTemplateEngine);
            }

            return this._templateEngine;
        }

        public set templateEngine(newVal: ITemplateEngine){
            this._templateEngine = newVal;
        }

        public history: IHistory;

        ///////////////////////
        // Implementation

        private _templateEngine: ITemplateEngine;
        private _mainThreadScheduler: Rx.IScheduler;
        private _unitTestMainThreadScheduler: Rx.IScheduler;

        private createHistory(): IHistory {
            // inherit default implementation
            var result = <IHistory> {
                back: window.history.back.bind(window.history),
                forward: window.history.forward.bind(window.history),
                //go: window.history.go,
                pushState: window.history.pushState.bind(window.history),
                replaceState: window.history.replaceState.bind(window.history)
            };

            Object.defineProperty(result, "length", {
                get() { return window.history.length; },
                enumerable: true,
                configurable: true
            });

            Object.defineProperty(result, "state", {
                get() { return window.history.state; },
                enumerable: true,
                configurable: true
            });

            Object.defineProperty(result, "location", {
                get() { return window.location; },
                enumerable: true,
                configurable: true
            });

            // enrich with observable
            result.onPopState = Rx.Observable.fromEventPattern<PopStateEvent>(
                (h) => window.addEventListener("popstate", <EventListener> h),
                (h) => window.removeEventListener("popstate", <EventListener> h))
                .publish()
                .refCount();

            return result;
        }
    }

    export var app: IWebRxApp = new App();

    var modules: { [name: string]: IModule } = { 'app': app };

    /**
    * Defines or retrieves an application module.
    * @param {string} name The module name
    * @return {IModule} The module handle
    */
   export function module(name: string) {
       var result = modules[name];

       if (result === undefined) {
           result = new Module(name);
           modules[name] = result;
       }

       return result;
   }
}