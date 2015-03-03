/// <reference path="Utils.ts" />
/// <reference path="Resources.ts" />
/// <reference path="Globals.ts" />

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
            var args = utils.args2Array(arguments);
            var key = args.shift();
            var factory: (deps: any) => any;
            var isConstructor = false;
            var isSingleton = false;

            if (this.registrations.hasOwnProperty(key))
                internal.throwError("'{0}' is already registered", key);

            var val = args.shift();

            if (typeof val !== "boolean") {
                // third overload
                // singleton
                factory = (deps) => val;
            } else {
                isSingleton = val;
                val = args.shift();

                if (typeof val !== "boolean") {
                    // second overload
                    // it's a factory function
                    factory = (deps) => val();
                } else {
                    // first overload
                    // array assumed to be inline array notation
                    isConstructor = val;
                    args = args.pop();
                    var self = this;
                    var _constructor = args.pop();
                    var dependencies = args;

                    factory = (deps) => {
                        // resolve dependencies
                        var resolved = dependencies.map(x => {
                            try {
                                return self.resolve(x, deps);
                            } catch (e) {
                                internal.throwError("error resolving dependency '{0}' for '{1}': {2}", x, key, e);
                            }
                        });
                    
                        // invoke constructor
                        if (!isConstructor)
                            return _constructor.apply(null, resolved);
                        else {
                            var args = [null].concat(resolved);
                            var factoryFunction = _constructor.bind.apply(_constructor, args);
                            return new factoryFunction();
                        }
                    };
                }
            }

            this.registrations[key] = { factory: factory, isSingleton: isSingleton };
        }

        public resolve<T>(key: string, deps?: any): T {
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
            utils.extend(deps, newDeps);

            // create it
            var result = registration.factory(newDeps);

            // cache if singleton
            if (registration.isSingleton)
                registration.value = result;

            return result;
        }

        //////////////////////////////////
        // Implementation

        private registrations: { [exp: string]: { factory: (deps) => any; isSingleton: boolean; value?: any } } = {};
    }

    export var injector: IInjector = new Injector();

    injector.register(res.injector, false, () => new Injector());
}