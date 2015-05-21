/// <reference path="Utils.ts" />
/// <reference path="Injector.ts" />
/// <reference path="Resources.ts" />
/// <reference path="Property.ts" />

declare var createMockHistory: () => wx.IHistory;

module wx {
    "use strict";

    // extend descriptor
    interface IComponentDescriptorEx extends IComponentDescriptor {
        instance: any;
    }

    class Module implements IModule {
        constructor(name: string) {
            this.name = name;
        }

        //////////////////////////////////
        // IModule

        public merge(other: IModule): IModule {
            let _other = <Module> other;

            extend(_other.components, this.components);
            extend(_other.bindings, this.bindings);
            extend(_other.expressionFilters, this.expressionFilters);
            extend(_other.animations, this.animations);

            return this;
        }

        public component(name: string, component: IComponentDescriptor): IComponentRegistry {
            this.components[name] = <IComponentDescriptorEx> component;
            return this;
        }

        public hasComponent(name: string): boolean {
            return this.components[name] != null;
        }

        public loadComponent(name: string, params?: Object): Rx.Observable<IComponent> {
            return this.initializeComponent(this.instantiateComponent(name), params);
        }

        public binding(name: string, handler: IBindingHandler): IBindingRegistry;
        public binding(name: string, handler: string): IBindingRegistry;
        public binding(names: string[], handler: IBindingHandler): IBindingRegistry;
        public binding(names: string[], handler: string): IBindingRegistry;
        public binding(name: string): IBindingHandler;
        public binding() {
            let args = args2Array(arguments);
            let name = args.shift();
            let handler: IBindingHandler;

            // lookup?
            if (args.length === 0) {
                // if the handler has been registered as resource, resolve it now and update registry
                handler = this.bindings[name];

                if (typeof handler === "string") {
                    handler = injector.get<IBindingHandler>(<any> handler);
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
            let args = args2Array(arguments);
            let name = args.shift();
            let filter: IExpressionFilter;

            // lookup?
            if (args.length === 0) {
                // if the filter has been registered as resource, resolve it now and update registry
                filter = this.expressionFilters[name];

                if (typeof filter === "string") {
                    filter = injector.get<IExpressionFilter>(<any> filter);
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

        public animation(name: string, animation: IAnimation): IAnimationRegistry;
        public animation(name: string): IAnimation;
        public animation() {
            let args = args2Array(arguments);
            let name = args.shift();
            let animation: IAnimation;

            // lookup?
            if (args.length === 0) {
                // if the animation has been registered as resource, resolve it now and update registry
                animation = this.animations[name];

                if (typeof animation === "string") {
                    animation = injector.get<IAnimation>(<any> animation);
                    this.bindings[name] = animation;
                }

                return animation;
            }

            // registration
            animation = args.shift();
            this.animations[name] = animation;

            return <any> this;
        }

        public name: string;

        //////////////////////////////////
        // Implementation

        private bindings: { [name: string]: any } = {};
        private components: { [name: string]: IComponentDescriptorEx } = {};
        private expressionFilters: { [index: string]: IExpressionFilter; } = {};
        private animations: { [index: string]: IAnimation; } = {};

        private instantiateComponent(name: string): Rx.Observable<IComponentDescriptorEx> {
            let cd = this.components[name];
            let result: Rx.Observable<IComponentDescriptorEx> = undefined;

            if (cd != null) {
                // if the component has been registered as resource, resolve it now and update registry
                if (cd.instance) {
                    result = Rx.Observable.return<IComponentDescriptorEx>(cd.instance);
                } else if (cd.template) {
                    result = Rx.Observable.return<IComponentDescriptorEx>(cd);
                } else if (cd.resolve) {
                    let resolved = injector.get<IComponentDescriptorEx>(cd.resolve);
                    result = Rx.Observable.return<IComponentDescriptorEx>(resolved);
                } else if (cd.require) {
                    result = observableRequire<IComponentDescriptorEx>(cd.require);
                }
            } else {
                result = Rx.Observable.return<IComponentDescriptorEx>(undefined);
            }

            return result.do(x => this.components[name].instance = x); // cache instantiated component
        }

        private initializeComponent(obs: Rx.Observable<IComponentDescriptorEx>, params?: Object): Rx.Observable<IComponent> {
            return obs.take(1).selectMany(component => {
                    if (component == null) {
                        return Rx.Observable.return<IComponent>(undefined);
                    }

                    if (component.viewModel) {
                        // component with view-model & template
                        return Rx.Observable.combineLatest(
                            this.loadComponentTemplate(component.template, params),
                            this.loadComponentViewModel(component.viewModel, params),
                            (t, vm) => {
                                // if view-model factory yields a function, use it as constructor
                                if (isFunction(vm)) {
                                    vm = new vm(params);
                                }

                                return <IComponent> {
                                    template: t,
                                    viewModel: vm,
                                    preBindingInit: component.preBindingInit,
                                    postBindingInit: component.postBindingInit
                                }
                            });
                    }

                    // template-only component
                    return this.loadComponentTemplate(component.template, params)
                        .select(template => <IComponent> {
                            template: template,
                            preBindingInit: component.preBindingInit,
                            postBindingInit: component.postBindingInit
                        });
                })
                .take(1);
        }

        protected loadComponentTemplate(template: any, params: Object): Rx.Observable<Node[]> {
            let syncResult: Node[];
            let el: Element;

            if (isFunction(template)) {
                syncResult = template(params);

                if (typeof syncResult === "string") {
                    syncResult = app.templateEngine.parse(<string> template(params));
                }

                return Rx.Observable.return(syncResult);
            } else if (typeof template === "string") {
                syncResult = app.templateEngine.parse(<string> template);
                return Rx.Observable.return(syncResult);
            } else if (Array.isArray(template)) {
                return Rx.Observable.return(<Node[]> template);
            } else if (typeof template === "object") {
                let options = <IComponentTemplateDescriptor> template;

                if (options.resolve) {
                    syncResult = injector.get<Node[]>(options.resolve);
                    return Rx.Observable.return(syncResult);
                } else if (options.promise) {
                    let promise = <Rx.IPromise<Node[]>> <any> options.promise;
                    return Rx.Observable.fromPromise(promise);
                } else if (options.require) {
                    return observableRequire<string>(options.require).select(x => app.templateEngine.parse(x));
                } else if (options.element) {
                    if (typeof options.element === "string") {
                        // try both getElementById & querySelector
                        el = document.getElementById(<string> options.element) ||
                            document.querySelector(<string> options.element);

                        if (el != null) {
                            // only the nodes inside the specified element will be cloned for use as the component’s template
                            syncResult = app.templateEngine.parse((<HTMLElement> el).innerHTML);
                        } else {
                            syncResult = [];
                        }

                        return Rx.Observable.return(syncResult);
                    } else {
                        el = <Element> <any> options.element;

                        // unwrap text/html script nodes
                        if (el != null) {
                            // only the nodes inside the specified element will be cloned for use as the component’s template
                            syncResult = app.templateEngine.parse((<HTMLElement> el).innerHTML);
                        } else {
                            syncResult = [];
                        }

                        return Rx.Observable.return(syncResult);
                    }
                }
            }

            internal.throwError("invalid template descriptor");
        }

        protected loadComponentViewModel(vm: any, componentParams: Object): Rx.Observable<any> {
            let syncResult: any;

            if (isFunction(vm)) {
                return Rx.Observable.return(vm);
            } else if (Array.isArray(vm)) {
                // assumed to be inline-annotated-array
                syncResult = injector.resolve<any>(vm, componentParams);
                return Rx.Observable.return(syncResult);
            } else if (typeof vm === "object") {
                let options = <IComponentViewModelDescriptor> vm;

                if (options.resolve) {
                    syncResult = injector.get<any>(options.resolve, componentParams);
                    return Rx.Observable.return(syncResult);
                } else if (options.promise) {
                    let promise = <Rx.IPromise<any>> <any> options.promise;
                    return Rx.Observable.fromPromise(promise);
                } else if (options.require) {
                    return observableRequire(options.require);
                } else if (options.instance) {
                    return Rx.Observable.return(options.instance);
                }
            }

            internal.throwError("invalid view-model descriptor");
        }
    }

    class App extends Module implements IWebRxApp {
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
                || Rx.Scheduler.currentThread; // OW: return a default if schedulers haven't been setup by in
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
                this._templateEngine = injector.get<ITemplateEngine>(res.htmlTemplateEngine);
            }

            return this._templateEngine;
        }

        public set templateEngine(newVal: ITemplateEngine) {
            this._templateEngine = newVal;
        }

        public history: IHistory;
        public title: IObservableProperty<string> = property<string>(document.title);

        ///////////////////////
        // Implementation

        private _templateEngine: ITemplateEngine;
        private _mainThreadScheduler: Rx.IScheduler;
        private _unitTestMainThreadScheduler: Rx.IScheduler;

        private createHistory(): IHistory {
            // inherit default implementation
            let result = <IHistory> {
                back: window.history.back.bind(window.history),
                forward: window.history.forward.bind(window.history),
                //go: window.history.go,
                pushState: window.history.pushState.bind(window.history),
                replaceState: window.history.replaceState.bind(window.history)
            };

            Object.defineProperty(result, "length", {
                get() {
                    return window.history.length;
                },
                enumerable: true,
                configurable: true
            });

            Object.defineProperty(result, "state", {
                get() {
                    return window.history.state;
                },
                enumerable: true,
                configurable: true
            });

            Object.defineProperty(result, "location", {
                get() {
                    return window.location;
                },
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

    export module internal {
        export var moduleConstructor = <any> Module;
    }

    export var app: IWebRxApp = new App();

    var modules: { [name: string]: Array<any>|IModuleDescriptor } = {
        'app': <IModuleDescriptor> <any> { instance: app } // auto-register 'app' module
    };

    /**
    * Defines a module.
    * @param {string} name The module name
    * @return {IModule} The module handle
    */
    export function module(name: string, descriptor: Array<any>|IModuleDescriptor) {
        modules[name] = <IModuleDescriptor> descriptor;
        return wx;
    }

    /**
   * Instantiate a new module instance and configure it using the user supplied configuration
   * @param {string} name The module name
   * @return {IModule} The module handle
   */
    export function loadModule(name: string): Rx.Observable<IModule> {
        let md: Array<any>|IModuleDescriptor = modules[name];
        let result: Rx.Observable<IModule> = undefined;
        let module: IModule;

        if (md != null) {
            if (Array.isArray(md)) {
                // assumed to be inline-annotated-array
                // resolve the configuration function via DI and invoke it with the module instance as argument
                module = new Module(name);
                injector.resolve<IModule>(<Array<any>> md, module);
                result = Rx.Observable.return(module);
            } else if (isFunction(md)) {
                // configuration function
                module = new Module(name);
                (<any> md)(module);
                result = Rx.Observable.return(module);
            } else {
                let mdd = <IModuleDescriptor> md;

                if (mdd.instance) {
                    result = Rx.Observable.return<IModule>(mdd.instance);
                } else {
                    module = new Module(name);

                    if (mdd.resolve) {
                        // resolve the configuration function via DI and invoke it with the module instance as argument
                        injector.get<IModule>(mdd.resolve, module);
                        result = Rx.Observable.return<IModule>(module);
                    } else if (mdd.require) {
                        // load the configuration function from external module and invoke it with the module instance as argument
                        result = observableRequire<{ (any): any }>(mdd.require)
                            .do(x => x(module)) // configure the module
                            .select(x => module);
                    }
                }
            }
        } else {
            result = Rx.Observable.return<IModule>(undefined);
        }

        return result.take(1).do(x => modules[name] = <IModuleDescriptor> <any> { instance: x }); // cache instantiated module
    }
}