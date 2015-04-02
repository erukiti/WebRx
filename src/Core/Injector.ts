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

        public register(key: string, factory: Array<any>, singleton: boolean): IInjector;
        public register(key: string, factory: () => any, singleton: boolean): IInjector;
        public register(key: string, instance: any): IInjector;

        public register(): IInjector {
            var key = arguments[0];
            var val = arguments[1];
            var isSingleton: boolean = arguments[2];
            var factory: (deps: any, args: any) => any;

            if (this.registrations.hasOwnProperty(key))
                internal.throwError("'{0}' is already registered", key);

            if (isFunction(val)) {
                // second overload
                // it's a factory function
                factory = (args: any, deps) => val.apply(null, args);
            } else if(Array.isArray(val)) {
                // first overload
                // array assumed to be inline array notation with constructor
                var self = this;
                var ctor = val.pop();
                var dependencies = val;

                factory = (args: any, deps) => {
                    // resolve dependencies
                    var resolved = dependencies.map(x => {
                        try {
                            return self.get(x, undefined, deps);
                        } catch (e) {
                            internal.throwError("Error resolving dependency '{0}' for '{1}': {2}", x, key, e);
                        }
                    });
                    
                    // invoke constructor
                    var _args = [null].concat(resolved).concat(args);
                    var ctorFunc = ctor.bind.apply(ctor, _args);
                    return new ctorFunc();
                };
            } else {
                // third overload
                // singleton
                factory = (args: any, deps) => val;
            }

            this.registrations[key] = { factory: factory, isSingleton: isSingleton };

            return this;
        }

        public get<T>(key: string, args: any, deps?: any): T {
            deps = deps || {};
            if (deps.hasOwnProperty(key))
                internal.throwError("Detected circular dependency a from '{0}' to '{1}'", Object.keys(deps).join(", "), key);

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

        public resolve<T>(iaa: Array<any>, args?: any): T {
            var ctor = iaa.pop();
            if (!isFunction(ctor))
                internal.throwError("Error resolving inline-annotated-array. Constructor must be of type 'function' but is '{0}", typeof ctor);

            var self = this;

            // resolve dependencies
            var resolved = iaa.map(x => {
                try {
                    return self.get(x, undefined, iaa);
                } catch (e) {
                    internal.throwError("Error resolving dependency '{0}' for '{1}': {2}", x, Object.getPrototypeOf(ctor), e);
                }
            });
                    
            // invoke constructor
            var _args = [null].concat(resolved).concat(args);
            var ctorFunc = ctor.bind.apply(ctor, _args);
            return new ctorFunc();
        }

        //////////////////////////////////
        // Implementation

        private registrations: { [exp: string]: { factory: (args: any, deps) => any; isSingleton: boolean; value?: any } } = {};
    }

    export var injector: IInjector = new Injector();

    injector.register(res.injector, () => new Injector());
}