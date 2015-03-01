///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="Utils.ts" />
/// <reference path="Injector.ts" />
/// <reference path="Resources.ts" />

module wx {
    class Module implements IModule {
        constructor(name: string) {
            this.name = name;
        }

        //////////////////////////////////
        // IModule

        public registerComponent(name: string, handler: IComponent): void;
        public registerComponent(name: string, handler: string): void;

        public registerComponent(): void {
            var args = utils.args2Array(arguments);
            var name = args.shift();
            var handler = args.shift();

            this.components[name] = handler;
        }

        public unregisterComponent(name: string): void {
            delete this.components[name];
        }

        public getComponent(name: string): IComponent {
            var component = this.components[name];

            // if the component has been registered as resource, resolve it now and update registry
            if (typeof component === "string") {
                component = injector.resolve<IDirective>(component);
                this.components[name] = component;
                return component;
            }

            return this.components[name];
        }

        public registerDirective(name: string, handler: IDirective): void;
        public registerDirective(name: string, handler: string): void;

        public registerDirective(): void {
            var args = utils.args2Array(arguments);
            var name = args.shift();
            var handler = args.shift();

            this.directives[name] = handler;
        }

        public unregisterDirective(name: string): void {
            delete this.directives[name];
        }

        public getDirective(name: string): IDirective {
            var directive = this.directives[name];

            // if the component has been registered as resource, resolve it now and update registry
            if (typeof directive === "string") {
                directive = injector.resolve<IDirective>(directive);
                this.directives[name] = directive;
                return directive;
            }

            return this.directives[name];
        }

        public name: string;

        //////////////////////////////////
        // Implementation

        private directives: { [name: string]: any } = {};
        private components: { [name: string]: any } = {};
    }

    class App extends Module implements IWebRxApp  {
        constructor() {
            super("app");
        }

        /// <summary>
        /// This Observer is signalled whenever an object that has a
        /// ThrownExceptions property doesn't Subscribe to that Observable. Use
        /// Observer.Create to set up what will happen - the default is to crash
        /// the application with an error message.
        /// </summary>
        public defaultExceptionHandler: Rx.Observer<Error> = Rx.Observer.create<Error>(ex => {
            if (!utils.isInUnitTest()) {
                console.log(utils.formatString("An onError occurred on an object (usually a computedProperty) that would break a binding or command. To prevent this, subscribe to the thrownExceptions property of your objects: {0}", ex));
            }
        });

        private _mainThreadScheduler: Rx.IScheduler;
        private static _unitTestMainThreadScheduler: Rx.IScheduler;

        /// <summary>
        /// MainThreadScheduler is the scheduler used to schedule work items that
        /// should be run "on the UI thread". In normal mode, this will be
        /// DispatcherScheduler, and in Unit Test mode this will be Immediate,
        /// to simplify writing common unit tests.
        /// </summary>
        public get mainThreadScheduler(): Rx.IScheduler {
            return App._unitTestMainThreadScheduler || this._mainThreadScheduler
                || Rx.Scheduler.currentThread;  // OW: return a default if schedulers haven't been setup by in
        }

        public set mainThreadScheduler(value: Rx.IScheduler) {
            if (utils.isInUnitTest()) {
                App._unitTestMainThreadScheduler = value;
                this._mainThreadScheduler = this._mainThreadScheduler || value;
            } else {
                this._mainThreadScheduler = value;
            }
        }
    }

    export var app: IWebRxApp = new App();

    var modules: { [name: string]: IModule } = {
         'app': app
    };

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