/// <reference path="Utils.ts" />
/// <reference path="Resources.ts" />
/// <reference path="Utils.ts" />

module wx {
    /**
    * Simple IoC & Service Locator
    */
    class Injector implements IInjector {
        //////////////////////////////////
        // IInjector implementation

        public register(key: string, singleton: boolean, isConstructor: boolean, factory: Array<any>): void;
        public register(key: string, singleton: boolean, factory: () => any): void;
        public register(key: string, instance: any): void;

        public register() {
            var args = args2Array(arguments);
            var key = args.shift();
            var factory: (deps: any, args: any) => any;
            var isConstructor = false;
            var isSingleton = false;

            if (this.registrations.hasOwnProperty(key))
                internal.throwError("'{0}' is already registered", key);

            var val = args.shift();

            if (typeof val !== "boolean") {
                // third overload
                // singleton
                factory = (args: any, deps) => val;
            } else {
                isSingleton = val;
                val = args.shift();

                if (typeof val !== "boolean") {
                    // second overload
                    // it's a factory function
                    var constructorArgs: Array<any>;
                    if (args) {
                        if (Array.isArray(args)) {
                            constructorArgs = args;
                        } else {
                            constructorArgs = [args];
                        }
                    } else {
                        constructorArgs = [];
                    }

                    factory = (args: any, deps) => val.apply(null, constructorArgs);
                } else {
                    // first overload
                    // array assumed to be inline array notation
                    isConstructor = val;
                    args = args.pop();
                    var self = this;
                    var _constructor = args.pop();
                    var dependencies = args;

                    factory = (args: any, deps) => {
                        // resolve dependencies
                        var resolved = dependencies.map(x => {
                            try {
                                return self.resolve(x, undefined, deps);
                            } catch (e) {
                                internal.throwError("error resolving dependency '{0}' for '{1}': {2}", x, key, e);
                            }
                        });
                    
                        // invoke constructor
                        var constructorArgs: Array<any>;
                        if (args) {
                            if (Array.isArray(args)) {
                                constructorArgs = args;
                            } else {
                                constructorArgs = [args];
                            }
                        } else {
                            constructorArgs = [];
                        }

                        if (!isConstructor) {
                            return _constructor.apply(null, resolved.concat(constructorArgs));
                        }
                        else {
                            var _args = [null].concat(resolved).concat(constructorArgs);
                            var factoryFunction = _constructor.bind.apply(_constructor, _args);
                            return new factoryFunction();
                        }
                    };
                }
            }

            this.registrations[key] = { factory: factory, isSingleton: isSingleton };
        }

        public resolve<T>(key: string, args: any, deps?: any): T {
            deps = deps || {};
            if (deps.hasOwnProperty(key))
                internal.throwError("detected circular dependency a from '{0}' to '{1}'", Object.keys(deps).join(", "), key);

            // registered?
            var registration = this.registrations[key];
            if (registration === undefined)
                internal.throwError("'{0}' is not registered", key);

            // already instantiated?
            if (registration.isSingleton && registration.value)
                return registration.value;

            // append current key
            var newDeps = {};
            newDeps[key] = true;
            extend(deps, newDeps);

            // create it
            var result = registration.factory(args, newDeps);

            // cache if singleton
            if (registration.isSingleton)
                registration.value = result;

            return result;
        }

        //////////////////////////////////
        // Implementation

        private registrations: { [exp: string]: { factory: (args: any, deps) => any; isSingleton: boolean; value?: any } } = {};
    }

    export var injector: IInjector = new Injector();

    injector.register(res.injector, false, () => new Injector());
}