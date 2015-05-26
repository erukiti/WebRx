/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import IID from "../IID"
import { extend, isInUnitTest, args2Array, isFunction, isRxObservable, isDisposable, isRxScheduler, throwError, getOid } from "../Core/Utils"
import * as res from "./Resources"
import * as log from "./Log"
import { property } from "./Property"

"use strict";

/**
* Dependency Injector and service locator
* @interface 
**/
export interface IInjector {
    register(key: string, factory: Array<any>, singleton?: boolean): IInjector;
    register(key: string, factory: () => any, singleton?: boolean): IInjector;
    register(key: string, instance: any): IInjector;

    get<T>(key: string, args?: any): T;
    resolve<T>(iaa: Array<any>, args?: any): T;
}

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
        let key = arguments[0];
        let val = arguments[1];
        let isSingleton: boolean = arguments[2];
        let factory: (deps: any, args: any) => any;

        if (this.registrations.hasOwnProperty(key))
            throwError("'{0}' is already registered", key);

        if (isFunction(val)) {
            // second overload
            // it's a factory function
            factory = (args: any, deps) => val.apply(null, args);
        } else if(Array.isArray(val)) {
            // first overload
            // array assumed to be inline array notation with constructor
            let self = this;
            let ctor = val.pop();
            let dependencies = val;

            factory = (args: any, deps) => {
                // resolve dependencies
                let resolved = dependencies.map(x => {
                    try {
                        return self.get(x, undefined, deps);
                    } catch (e) {
                        throwError("Error resolving dependency '{0}' for '{1}': {2}", x, key, e);
                    }
                });
                
                // invoke constructor
                let _args = [null].concat(resolved).concat(args);
                let ctorFunc = ctor.bind.apply(ctor, _args);
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
            throwError("Detected circular dependency a from '{0}' to '{1}'", Object.keys(deps).join(", "), key);

        // registered?
        let registration = this.registrations[key];
        if (registration === undefined)
            throwError("'{0}' is not registered", key);

        // already instantiated?
        if (registration.isSingleton && registration.value)
            return registration.value;

        // append current key
        let newDeps = {};
        newDeps[key] = true;
        extend(deps, newDeps);

        // create it
        let result = registration.factory(args, newDeps);

        // cache if singleton
        if (registration.isSingleton)
            registration.value = result;

        return result;
    }

    public resolve<T>(iaa: Array<any>, args?: any): T {
        let ctor = iaa.pop();
        if (!isFunction(ctor))
            throwError("Error resolving inline-annotated-array. Constructor must be of type 'function' but is '{0}", typeof ctor);

        let self = this;

        // resolve dependencies
        let resolved = iaa.map(x => {
            try {
                return self.get(x, undefined, iaa);
            } catch (e) {
                throwError("Error resolving dependency '{0}' for '{1}': {2}", x, Object.getPrototypeOf(ctor), e);
            }
        });
                
        // invoke constructor
        let _args = [null].concat(resolved).concat(args);
        let ctorFunc = ctor.bind.apply(ctor, _args);
        return new ctorFunc();
    }

    //////////////////////////////////
    // Implementation

    private registrations: { [exp: string]: { factory: (args: any, deps) => any; isSingleton: boolean; value?: any } } = {};
}

export var injector: IInjector = new Injector();

injector.register(res.injector, () => new Injector());
