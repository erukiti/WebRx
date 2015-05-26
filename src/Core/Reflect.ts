/// <reference path="../Interfaces.d.ts" />

import { createWeakMap } from "../Collections/WeakMap"
import { createSet } from "../Collections/Set"
import { createMap } from "../Collections/Map"

/*! *****************************************************************************
Copyright (C) Microsoft. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use 
this file except in compliance with the License. You may obtain a copy of the 
License at http://www.apache.org/licenses/LICENSE-2.0 

Unless required by applicable law or agreed to in writing, software 
distributed under the License is distributed on an "AS IS" BASIS, 
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 

See the License for the specific language governing permissions and 
limitations under the License. 
***************************************************************************** */

"use strict";

declare var global: any;
declare var msCrypto: any;
declare var WorkerGlobalScope: any;
declare var module: any;
declare var crypto: Crypto;
declare var require: Function;

// Load global or shim versions of Map, Set, and WeakMap
const functionPrototype = Object.getPrototypeOf(Function);

// [[Metadata]] internal slot
const __Metadata__ = createWeakMap<Object, wx.IMap<string | symbol, wx.IMap<any, any>>>();

/**
  * Applies a set of decorators to a target object.
  * @param decorators An array of decorators.
  * @param target The target object.
  * @returns The result of applying the provided decorators.
  * @remarks Decorators are applied in reverse order of their positions in the array.
  * @example
  *
  *     class C { }
  *
  *     // constructor
  *     C = Reflect.decorate(decoratorsArray, C);
  *
  */
export function decorate(decorators: ClassDecorator[], target: Function): Function;

/**
  * Applies a set of decorators to a property of a target object.
  * @param decorators An array of decorators.
  * @param target The target object.
  * @param targetKey The property key to decorate.
  * @param descriptor A property descriptor      
  * @remarks Decorators are applied in reverse order.
  * @example
  *
  *     class C {
  *         // property declarations are not part of ES6, though they are valid in TypeScript:
  *         // static staticProperty;      
  *         // property;
  *    
  *         static staticMethod() { }
  *         method() { }
  *     }
  *
  *     // property (on constructor)
  *     Reflect.decorate(decoratorsArray, C, "staticProperty");
  *
  *     // property (on prototype)
  *     Reflect.decorate(decoratorsArray, C.prototype, "property");
  *
  *     // method (on constructor)
  *     Object.defineProperty(C, "staticMethod", 
  *         Reflect.decorate(decoratorsArray, C, "staticMethod", 
  *             Object.getOwnPropertyDescriptor(C, "staticMethod")));
  *
  *     // method (on prototype)
  *     Object.defineProperty(C.prototype, "method", 
  *         Reflect.decorate(decoratorsArray, C.prototype, "method", 
  *             Object.getOwnPropertyDescriptor(C.prototype, "method")));
  *
  */
export function decorate(decorators: (PropertyDecorator | MethodDecorator)[], target: Object, targetKey: string | symbol, descriptor?: PropertyDescriptor): PropertyDescriptor;

/**
  * Applies a set of decorators to a property of a target object.
  * @param decorators An array of decorators.
  * @param target The target object.
  * @param targetKey (Optional) The property key to decorate.
  * @param targetDescriptor (Optional) The property descriptor for the target key
  * @remarks Decorators are applied in reverse order.
  * @example
  *
  *     class C {
  *         // property declarations are not part of ES6, though they are valid in TypeScript:
  *         // static staticProperty;      
  *         // property;
  *
  *         constructor(p) { }
  *         static staticMethod(p) { }
  *         method(p) { } 
  *     }
  *
  *     // constructor
  *     C = Reflect.decorate(decoratorsArray, C);
  *
  *     // property (on constructor)
  *     Reflect.decorate(decoratorsArray, C, "staticProperty");
  *
  *     // property (on prototype)
  *     Reflect.decorate(decoratorsArray, C.prototype, "property");
  *
  *     // method (on constructor)
  *     Object.defineProperty(C, "staticMethod", 
  *         Reflect.decorate(decoratorsArray, C, "staticMethod", 
  *             Object.getOwnPropertyDescriptor(C, "staticMethod")));
  *
  *     // method (on prototype)
  *     Object.defineProperty(C.prototype, "method", 
  *         Reflect.decorate(decoratorsArray, C.prototype, "method", 
  *             Object.getOwnPropertyDescriptor(C.prototype, "method")));
  *
  */
export function decorate(decorators: (ClassDecorator | MethodDecorator | PropertyDecorator)[], target: Object, targetKey?: string | symbol, targetDescriptor?: PropertyDescriptor): any {
    if (!IsUndefined(targetDescriptor)) {
        if (!IsArray(decorators)) {
            throw new TypeError();
        }
        else if (!IsObject(target)) {
            throw new TypeError();
        }
        else if (IsUndefined(targetKey)) {
            throw new TypeError();
        }
        else if (!IsObject(targetDescriptor)) {
            throw new TypeError();
        }

        targetKey = ToPropertyKey(targetKey);
        return DecoratePropertyWithDescriptor(<MethodDecorator[]>decorators, target, targetKey, targetDescriptor);
    }
    else if (!IsUndefined(targetKey)) {
        if (!IsArray(decorators)) {
            throw new TypeError();
        }
        else if (!IsObject(target)) {
            throw new TypeError();
        }

        targetKey = ToPropertyKey(targetKey);
        return DecoratePropertyWithoutDescriptor(<PropertyDecorator[]>decorators, target, targetKey);
    }
    else {
        if (!IsArray(decorators)) {
            throw new TypeError();
        }
        else if (!IsConstructor(target)) {
            throw new TypeError();
        }

        return DecorateConstructor(<ClassDecorator[]>decorators, <Function>target);
    }
}

/**
  * A default metadata decorator factory that can be used on a class, class member, or parameter.
  * @param metadataKey The key for the metadata entry.
  * @param metadataValue The value for the metadata entry.
  * @returns A decorator function.
  * @remarks 
  * If `metadataKey` is already defined for the target and target key, the 
  * metadataValue for that key will be overwritten.
  * @example
  *
  *     // constructor
  *     @Reflect.metadata(key, value)
  *     class C {
  *     }
  *
  *     // property (on constructor, TypeScript only)
  *     class C {
  *         @Reflect.metadata(key, value)
  *         static staticProperty;
  *     }
  *
  *     // property (on prototype, TypeScript only)
  *     class C {
  *         @Reflect.metadata(key, value)
  *         property;
  *     }
  *
  *     // method (on constructor)
  *     class C {
  *         @Reflect.metadata(key, value)
  *         static staticMethod() { }
  *     }
  *
  *     // method (on prototype)
  *     class C {
  *         @Reflect.metadata(key, value)
  *         method() { }
  *     }
  *
  */
export function metadata(metadataKey: any, metadataValue: any) {
    function decorator(target: Function): void;
    function decorator(target: Object, targetKey: string | symbol): void;
    function decorator(target: Object, targetKey?: string | symbol): void {
        if (!IsUndefined(targetKey)) {
            if (!IsObject(target)) {
                throw new TypeError();
            }

            targetKey = ToPropertyKey(targetKey);
            OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, targetKey);
        }
        else {
            if (!IsConstructor(target)) {
                throw new TypeError();
            }

            OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, /*targetKey*/ undefined);
        }
    }

    return decorator;
}

/**
  * Define a unique metadata entry on the target.
  * @param metadataKey A key used to store and retrieve metadata.
  * @param metadataValue A value that contains attached metadata.
  * @param target The target object on which to define metadata.
  * @example
  *
  *     class C {
  *     }
  *
  *     // constructor
  *     Reflect.defineMetadata("custom:annotation", options, C);
  *
  *     // decorator factory as metadata-producing annotation.
  *     function MyAnnotation(options): ClassDecorator {
  *         return target => Reflect.defineMetadata("custom:annotation", options, target);
  *     }
  *
  */
export function defineMetadata(metadataKey: any, metadataValue: any, target: Object): void;

/**
  * Define a unique metadata entry on the target.
  * @param metadataKey A key used to store and retrieve metadata.
  * @param metadataValue A value that contains attached metadata.
  * @param target The target object on which to define metadata.
  * @param targetKey The property key for the target.
  * @example
  *
  *     class C {
  *         // property declarations are not part of ES6, though they are valid in TypeScript:
  *         // static staticProperty;      
  *         // property;
  *
  *         static staticMethod(p) { }
  *         method(p) { } 
  *     }
  *
  *     // property (on constructor)
  *     Reflect.defineMetadata("custom:annotation", Number, C, "staticProperty");
  *
  *     // property (on prototype)
  *     Reflect.defineMetadata("custom:annotation", Number, C.prototype, "property");
  *
  *     // method (on constructor)
  *     Reflect.defineMetadata("custom:annotation", Number, C, "staticMethod");
  *
  *     // method (on prototype)
  *     Reflect.defineMetadata("custom:annotation", Number, C.prototype, "method");
  *
  *     // decorator factory as metadata-producing annotation.
  *     function MyAnnotation(options): PropertyDecorator {
  *         return (target, key) => Reflect.defineMetadata("custom:annotation", options, target, key);
  *     }
  *
  */
export function defineMetadata(metadataKey: any, metadataValue: any, target: Object, targetKey: string | symbol): void;

/**
  * Define a unique metadata entry on the target.
  * @param metadataKey A key used to store and retrieve metadata.
  * @param metadataValue A value that contains attached metadata.
  * @param target The target object on which to define metadata.
  * @param targetKey (Optional) The property key for the target.
  * @example
  *
  *     class C {
  *         // property declarations are not part of ES6, though they are valid in TypeScript:
  *         // static staticProperty;      
  *         // property;
  *
  *         constructor(p) { }
  *         static staticMethod(p) { }
  *         method(p) { } 
  *     }
  *
  *     // constructor
  *     Reflect.defineMetadata("custom:annotation", options, C);
  *
  *     // property (on constructor)
  *     Reflect.defineMetadata("custom:annotation", options, C, "staticProperty");
  *
  *     // property (on prototype)
  *     Reflect.defineMetadata("custom:annotation", options, C.prototype, "property");
  *
  *     // method (on constructor)
  *     Reflect.defineMetadata("custom:annotation", options, C, "staticMethod");
  *
  *     // method (on prototype)
  *     Reflect.defineMetadata("custom:annotation", options, C.prototype, "method");
  *
  *     // decorator factory as metadata-producing annotation.
  *     function MyAnnotation(options): Decorator {
  *         return (target, key?) => Reflect.defineMetadata("custom:annotation", options, target, key);
  *     }
  *
  */
export function defineMetadata(metadataKey: any, metadataValue: any, target: Object, targetKey?: string | symbol): void {
    if (!IsObject(target)) {
        throw new TypeError();
    }
    else if (!IsUndefined(targetKey)) {
        targetKey = ToPropertyKey(targetKey);
    }

    return OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, targetKey);
}

/**
  * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
  * @param metadataKey A key used to store and retrieve metadata.
  * @param target The target object on which the metadata is defined.
  * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
  * @example
  *
  *     class C {
  *     }
  *
  *     // constructor
  *     result = Reflect.hasMetadata("custom:annotation", C);
  *
  */
export function hasMetadata(metadataKey: any, target: Object): boolean;

/**
  * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
  * @param metadataKey A key used to store and retrieve metadata.
  * @param target The target object on which the metadata is defined.
  * @param targetKey The property key for the target.
  * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
  * @example
  *
  *     class C {
  *         // property declarations are not part of ES6, though they are valid in TypeScript:
  *         // static staticProperty;      
  *         // property;
  *
  *         static staticMethod(p) { }
  *         method(p) { } 
  *     }
  *
  *     // property (on constructor)
  *     result = Reflect.hasMetadata("custom:annotation", C, "staticProperty");
  *
  *     // property (on prototype)
  *     result = Reflect.hasMetadata("custom:annotation", C.prototype, "property");
  *
  *     // method (on constructor)
  *     result = Reflect.hasMetadata("custom:annotation", C, "staticMethod");
  *
  *     // method (on prototype)
  *     result = Reflect.hasMetadata("custom:annotation", C.prototype, "method");
  *
  */
export function hasMetadata(metadataKey: any, target: Object, targetKey: string | symbol): boolean;

/**
  * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
  * @param metadataKey A key used to store and retrieve metadata.
  * @param target The target object on which the metadata is defined.
  * @param targetKey (Optional) The property key for the target.
  * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
  * @example
  *
  *     class C {
  *         // property declarations are not part of ES6, though they are valid in TypeScript:
  *         // static staticProperty;      
  *         // property;
  *
  *         constructor(p) { }
  *         static staticMethod(p) { }
  *         method(p) { } 
  *     }
  *
  *     // constructor
  *     result = Reflect.hasMetadata("custom:annotation", C);
  *
  *     // property (on constructor)
  *     result = Reflect.hasMetadata("custom:annotation", C, "staticProperty");
  *
  *     // property (on prototype)
  *     result = Reflect.hasMetadata("custom:annotation", C.prototype, "property");
  *
  *     // method (on constructor)
  *     result = Reflect.hasMetadata("custom:annotation", C, "staticMethod");
  *
  *     // method (on prototype)
  *     result = Reflect.hasMetadata("custom:annotation", C.prototype, "method");
  *
  */
export function hasMetadata(metadataKey: any, target: Object, targetKey?: string | symbol): boolean {
    if (!IsObject(target)) {
        throw new TypeError();
    }
    else if (!IsUndefined(targetKey)) {
        targetKey = ToPropertyKey(targetKey);
    }

    return OrdinaryHasMetadata(metadataKey, target, targetKey);
}

/**
  * Gets a value indicating whether the target object has the provided metadata key defined.
  * @param metadataKey A key used to store and retrieve metadata.
  * @param target The target object on which the metadata is defined.
  * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
  * @example
  *
  *     class C {
  *     }
  *
  *     // constructor
  *     result = Reflect.hasOwnMetadata("custom:annotation", C);
  *
  */
export function hasOwnMetadata(metadataKey: any, target: Object): boolean;

/**
  * Gets a value indicating whether the target object has the provided metadata key defined.
  * @param metadataKey A key used to store and retrieve metadata.
  * @param target The target object on which the metadata is defined.
  * @param targetKey The property key for the target.
  * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
  * @example
  *
  *     class C {
  *         // property declarations are not part of ES6, though they are valid in TypeScript:
  *         // static staticProperty;      
  *         // property;
  *
  *         static staticMethod(p) { }
  *         method(p) { } 
  *     }
  *
  *     // property (on constructor)
  *     result = Reflect.hasOwnMetadata("custom:annotation", C, "staticProperty");
  *
  *     // property (on prototype)
  *     result = Reflect.hasOwnMetadata("custom:annotation", C.prototype, "property");
  *
  *     // method (on constructor)
  *     result = Reflect.hasOwnMetadata("custom:annotation", C, "staticMethod");
  *
  *     // method (on prototype)
  *     result = Reflect.hasOwnMetadata("custom:annotation", C.prototype, "method");
  *
  */
export function hasOwnMetadata(metadataKey: any, target: Object, targetKey: string | symbol): boolean;

/**
  * Gets a value indicating whether the target object has the provided metadata key defined.
  * @param metadataKey A key used to store and retrieve metadata.
  * @param target The target object on which the metadata is defined.
  * @param targetKey (Optional) The property key for the target.
  * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
  * @example
  *
  *     class C {
  *         // property declarations are not part of ES6, though they are valid in TypeScript:
  *         // static staticProperty;      
  *         // property;
  *
  *         constructor(p) { }
  *         static staticMethod(p) { }
  *         method(p) { } 
  *     }
  *
  *     // constructor
  *     result = Reflect.hasOwnMetadata("custom:annotation", C);
  *
  *     // property (on constructor)
  *     result = Reflect.hasOwnMetadata("custom:annotation", C, "staticProperty");
  *
  *     // property (on prototype)
  *     result = Reflect.hasOwnMetadata("custom:annotation", C.prototype, "property");
  *
  *     // method (on constructor)
  *     result = Reflect.hasOwnMetadata("custom:annotation", C, "staticMethod");
  *
  *     // method (on prototype)
  *     result = Reflect.hasOwnMetadata("custom:annotation", C.prototype, "method");
  *
  */
export function hasOwnMetadata(metadataKey: any, target: Object, targetKey?: string | symbol): boolean {
    if (!IsObject(target)) {
        throw new TypeError();
    }
    else if (!IsUndefined(targetKey)) {
        targetKey = ToPropertyKey(targetKey);
    }

    return OrdinaryHasOwnMetadata(metadataKey, target, targetKey);
}

/**
  * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
  * @param metadataKey A key used to store and retrieve metadata.
  * @param target The target object on which the metadata is defined.
  * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
  * @example
  *
  *     class C {
  *     }
  *
  *     // constructor
  *     result = Reflect.getMetadata("custom:annotation", C);
  *
  */
export function getMetadata(metadataKey: any, target: Object): any;

/**
  * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
  * @param metadataKey A key used to store and retrieve metadata.
  * @param target The target object on which the metadata is defined.
  * @param targetKey The property key for the target.
  * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
  * @example
  *
  *     class C {
  *         // property declarations are not part of ES6, though they are valid in TypeScript:
  *         // static staticProperty;      
  *         // property;
  *
  *         static staticMethod(p) { }
  *         method(p) { } 
  *     }
  *
  *     // property (on constructor)
  *     result = Reflect.getMetadata("custom:annotation", C, "staticProperty");
  *
  *     // property (on prototype)
  *     result = Reflect.getMetadata("custom:annotation", C.prototype, "property");
  *
  *     // method (on constructor)
  *     result = Reflect.getMetadata("custom:annotation", C, "staticMethod");
  *
  *     // method (on prototype)
  *     result = Reflect.getMetadata("custom:annotation", C.prototype, "method");
  *
  */
export function getMetadata(metadataKey: any, target: Object, targetKey: string | symbol): any;

/**
  * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
  * @param metadataKey A key used to store and retrieve metadata.
  * @param target The target object on which the metadata is defined.
  * @param targetKey (Optional) The property key for the target.
  * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
  * @example
  *
  *     class C {
  *         // property declarations are not part of ES6, though they are valid in TypeScript:
  *         // static staticProperty;      
  *         // property;
  *
  *         constructor(p) { }
  *         static staticMethod(p) { }
  *         method(p) { } 
  *     }
  *
  *     // constructor
  *     result = Reflect.getMetadata("custom:annotation", C);
  *
  *     // property (on constructor)
  *     result = Reflect.getMetadata("custom:annotation", C, "staticProperty");
  *
  *     // property (on prototype)
  *     result = Reflect.getMetadata("custom:annotation", C.prototype, "property");
  *
  *     // method (on constructor)
  *     result = Reflect.getMetadata("custom:annotation", C, "staticMethod");
  *
  *     // method (on prototype)
  *     result = Reflect.getMetadata("custom:annotation", C.prototype, "method");
  *
  */
export function getMetadata(metadataKey: any, target: Object, targetKey?: string | symbol): any {
    if (!IsObject(target)) {
        throw new TypeError();
    }
    else if (!IsUndefined(targetKey)) {
        targetKey = ToPropertyKey(targetKey);
    }

    return OrdinaryGetMetadata(metadataKey, target, targetKey);
}

/**
  * Gets the metadata value for the provided metadata key on the target object.
  * @param metadataKey A key used to store and retrieve metadata.
  * @param target The target object on which the metadata is defined.
  * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
  * @example
  *
  *     class C {
  *     }
  *
  *     // constructor
  *     result = Reflect.getOwnMetadata("custom:annotation", C);
  *
  */
export function getOwnMetadata(metadataKey: any, target: Object): any;

/**
  * Gets the metadata value for the provided metadata key on the target object.
  * @param metadataKey A key used to store and retrieve metadata.
  * @param target The target object on which the metadata is defined.
  * @param targetKey The property key for the target.
  * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
  * @example
  *
  *     class C {
  *         // property declarations are not part of ES6, though they are valid in TypeScript:
  *         // static staticProperty;      
  *         // property;
  *
  *         static staticMethod(p) { }
  *         method(p) { } 
  *     }
  *
  *     // property (on constructor)
  *     result = Reflect.getOwnMetadata("custom:annotation", C, "staticProperty");
  *
  *     // property (on prototype)
  *     result = Reflect.getOwnMetadata("custom:annotation", C.prototype, "property");
  *
  *     // method (on constructor)
  *     result = Reflect.getOwnMetadata("custom:annotation", C, "staticMethod");
  *
  *     // method (on prototype)
  *     result = Reflect.getOwnMetadata("custom:annotation", C.prototype, "method");
  *
  */
export function getOwnMetadata(metadataKey: any, target: Object, targetKey: string | symbol): any;

/**
  * Gets the metadata value for the provided metadata key on the target object.
  * @param metadataKey A key used to store and retrieve metadata.
  * @param target The target object on which the metadata is defined.
  * @param targetKey (Optional) The property key for the target.
  * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
  * @example
  *
  *     class C {
  *         // property declarations are not part of ES6, though they are valid in TypeScript:
  *         // static staticProperty;      
  *         // property;
  *
  *         constructor(p) { }
  *         static staticMethod(p) { }
  *         method(p) { } 
  *     }
  *
  *     // constructor
  *     result = Reflect.getOwnMetadata("custom:annotation", C);
  *
  *     // property (on constructor)
  *     result = Reflect.getOwnMetadata("custom:annotation", C, "staticProperty");
  *
  *     // property (on prototype)
  *     result = Reflect.getOwnMetadata("custom:annotation", C.prototype, "property");
  *
  *     // method (on constructor)
  *     result = Reflect.getOwnMetadata("custom:annotation", C, "staticMethod");
  *
  *     // method (on prototype)
  *     result = Reflect.getOwnMetadata("custom:annotation", C.prototype, "method");
  *
  */
export function getOwnMetadata(metadataKey: any, target: Object, targetKey?: string | symbol): any {
    if (!IsObject(target)) {
        throw new TypeError();
    }
    else if (!IsUndefined(targetKey)) {
        targetKey = ToPropertyKey(targetKey);
    }

    return OrdinaryGetOwnMetadata(metadataKey, target, targetKey);
}

/**
  * Gets the metadata keys defined on the target object or its prototype chain.
  * @param target The target object on which the metadata is defined.
  * @returns An array of unique metadata keys.
  * @example
  *
  *     class C {
  *     }
  *
  *     // constructor
  *     result = Reflect.getMetadataKeys(C);
  *
  */
export function getMetadataKeys(target: Object): any[];

/**
  * Gets the metadata keys defined on the target object or its prototype chain.
  * @param target The target object on which the metadata is defined.
  * @param targetKey The property key for the target.
  * @returns An array of unique metadata keys.
  * @example
  *
  *     class C {
  *         // property declarations are not part of ES6, though they are valid in TypeScript:
  *         // static staticProperty;      
  *         // property;
  *
  *         static staticMethod(p) { }
  *         method(p) { } 
  *     }
  *
  *     // property (on constructor)
  *     result = Reflect.getMetadataKeys(C, "staticProperty");
  *
  *     // property (on prototype)
  *     result = Reflect.getMetadataKeys(C.prototype, "property");
  *
  *     // method (on constructor)
  *     result = Reflect.getMetadataKeys(C, "staticMethod");
  *
  *     // method (on prototype)
  *     result = Reflect.getMetadataKeys(C.prototype, "method");
  *
  */
export function getMetadataKeys(target: Object, targetKey: string | symbol): any[];

/**
  * Gets the metadata keys defined on the target object or its prototype chain.
  * @param target The target object on which the metadata is defined.
  * @param targetKey (Optional) The property key for the target.
  * @returns An array of unique metadata keys.
  * @example
  *
  *     class C {
  *         // property declarations are not part of ES6, though they are valid in TypeScript:
  *         // static staticProperty;      
  *         // property;
  *
  *         constructor(p) { }
  *         static staticMethod(p) { }
  *         method(p) { } 
  *     }
  *
  *     // constructor
  *     result = Reflect.getMetadataKeys(C);
  *
  *     // property (on constructor)
  *     result = Reflect.getMetadataKeys(C, "staticProperty");
  *
  *     // property (on prototype)
  *     result = Reflect.getMetadataKeys(C.prototype, "property");
  *
  *     // method (on constructor)
  *     result = Reflect.getMetadataKeys(C, "staticMethod");
  *
  *     // method (on prototype)
  *     result = Reflect.getMetadataKeys(C.prototype, "method");
  *
  */
export function getMetadataKeys(target: Object, targetKey?: string | symbol): any[] {
    if (!IsObject(target)) {
        throw new TypeError();
    }
    else if (!IsUndefined(targetKey)) {
        targetKey = ToPropertyKey(targetKey);
    }

    return OrdinaryMetadataKeys(target, targetKey);
}

/**
  * Gets the unique metadata keys defined on the target object.
  * @param target The target object on which the metadata is defined.
  * @returns An array of unique metadata keys.
  * @example
  *
  *     class C {
  *     }
  *
  *     // constructor
  *     result = Reflect.getOwnMetadataKeys(C);
  *
  */
export function getOwnMetadataKeys(target: Object): any[];

/**
  * Gets the unique metadata keys defined on the target object.
  * @param target The target object on which the metadata is defined.
  * @param targetKey The property key for the target.
  * @returns An array of unique metadata keys.
  * @example
  *
  *     class C {
  *         // property declarations are not part of ES6, though they are valid in TypeScript:
  *         // static staticProperty;      
  *         // property;
  *
  *         static staticMethod(p) { }
  *         method(p) { } 
  *     }
  *
  *     // property (on constructor)
  *     result = Reflect.getOwnMetadataKeys(C, "staticProperty");
  *
  *     // property (on prototype)
  *     result = Reflect.getOwnMetadataKeys(C.prototype, "property");
  *
  *     // method (on constructor)
  *     result = Reflect.getOwnMetadataKeys(C, "staticMethod");
  *
  *     // method (on prototype)
  *     result = Reflect.getOwnMetadataKeys(C.prototype, "method");
  *
  */
export function getOwnMetadataKeys(target: Object, targetKey: string | symbol): any[];

/**
  * Gets the unique metadata keys defined on the target object.
  * @param target The target object on which the metadata is defined.
  * @param targetKey (Optional) The property key for the target.
  * @returns An array of unique metadata keys.
  * @example
  *
  *     class C {
  *         // property declarations are not part of ES6, though they are valid in TypeScript:
  *         // static staticProperty;      
  *         // property;
  *
  *         constructor(p) { }
  *         static staticMethod(p) { }
  *         method(p) { } 
  *     }
  *
  *     // constructor
  *     result = Reflect.getOwnMetadataKeys(C);
  *
  *     // property (on constructor)
  *     result = Reflect.getOwnMetadataKeys(C, "staticProperty");
  *
  *     // property (on prototype)
  *     result = Reflect.getOwnMetadataKeys(C.prototype, "property");
  *
  *     // method (on constructor)
  *     result = Reflect.getOwnMetadataKeys(C, "staticMethod");
  *
  *     // method (on prototype)
  *     result = Reflect.getOwnMetadataKeys(C.prototype, "method");
  *
  */
export function getOwnMetadataKeys(target: Object, targetKey?: string | symbol): any[] {
    if (!IsObject(target)) {
        throw new TypeError();
    }
    else if (!IsUndefined(targetKey)) {
        targetKey = ToPropertyKey(targetKey);
    }

    return OrdinaryOwnMetadataKeys(target, targetKey);
}

/**
  * Deletes the metadata entry from the target object with the provided key.
  * @param metadataKey A key used to store and retrieve metadata.
  * @param target The target object on which the metadata is defined.
  * @returns `true` if the metadata entry was found and deleted; otherwise, false.
  * @example
  *
  *     class C {
  *     }
  *
  *     // constructor
  *     result = Reflect.deleteMetadata("custom:annotation", C);
  *
  */
export function deleteMetadata(metadataKey: any, target: Object): boolean;

/**
  * Deletes the metadata entry from the target object with the provided key.
  * @param metadataKey A key used to store and retrieve metadata.
  * @param target The target object on which the metadata is defined.
  * @param targetKey The property key for the target.
  * @returns `true` if the metadata entry was found and deleted; otherwise, false.
  * @example
  *
  *     class C {
  *         // property declarations are not part of ES6, though they are valid in TypeScript:
  *         // static staticProperty;      
  *         // property;
  *
  *         static staticMethod(p) { }
  *         method(p) { } 
  *     }
  *
  *     // property (on constructor)
  *     result = Reflect.deleteMetadata("custom:annotation", C, "staticProperty");
  *
  *     // property (on prototype)
  *     result = Reflect.deleteMetadata("custom:annotation", C.prototype, "property");
  *
  *     // method (on constructor)
  *     result = Reflect.deleteMetadata("custom:annotation", C, "staticMethod");
  *
  *     // method (on prototype)
  *     result = Reflect.deleteMetadata("custom:annotation", C.prototype, "method");
  *
  */
export function deleteMetadata(metadataKey: any, target: Object, targetKey: string | symbol): boolean;

/**
  * Deletes the metadata entry from the target object with the provided key.
  * @param metadataKey A key used to store and retrieve metadata.
  * @param target The target object on which the metadata is defined.
  * @param targetKey (Optional) The property key for the target.
  * @returns `true` if the metadata entry was found and deleted; otherwise, false.
  * @example
  *
  *     class C {
  *         // property declarations are not part of ES6, though they are valid in TypeScript:
  *         // static staticProperty;      
  *         // property;
  *
  *         constructor(p) { }
  *         static staticMethod(p) { }
  *         method(p) { } 
  *     }
  *
  *     // constructor
  *     result = Reflect.deleteMetadata("custom:annotation", C);
  *
  *     // property (on constructor)
  *     result = Reflect.deleteMetadata("custom:annotation", C, "staticProperty");
  *
  *     // property (on prototype)
  *     result = Reflect.deleteMetadata("custom:annotation", C.prototype, "property");
  *
  *     // method (on constructor)
  *     result = Reflect.deleteMetadata("custom:annotation", C, "staticMethod");
  *
  *     // method (on prototype)
  *     result = Reflect.deleteMetadata("custom:annotation", C.prototype, "method");
  *
  */
export function deleteMetadata(metadataKey: any, target: Object, targetKey?: string | symbol): boolean {
    if (!IsObject(target)) {
        throw new TypeError();
    }
    else if (!IsUndefined(targetKey)) {
        targetKey = ToPropertyKey(targetKey);
    }

    // https://github.com/jonathandturner/decorators/blob/master/specs/metadata.md#deletemetadata-metadatakey-p-
    let metadataMap = GetOrCreateMetadataMap(target, targetKey, /*create*/ false);
    if (IsUndefined(metadataMap)) {
        return false;
    }

    if (!metadataMap.delete(metadataKey)) {
        return false;
    }

    if (metadataMap.size > 0) {
        return true;
    }

    let targetMetadata = __Metadata__.get(target);
    targetMetadata.delete(targetKey);
    if (targetMetadata.size > 0) {
        return true;
    }

    __Metadata__.delete(target);
    return true;
}

function DecorateConstructor(decorators: ClassDecorator[], target: Function): Function {
    for (let i = decorators.length - 1; i >= 0; --i) {
        let decorator = decorators[i];
        let decorated = decorator(target);
        if (!IsUndefined(decorated)) {
            if (!IsConstructor(decorated)) {
                throw new TypeError();
            }
            target = <Function>decorated;
        }
    }
    return target;
}

function DecoratePropertyWithDescriptor(decorators: MethodDecorator[], target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor {
    for (let i = decorators.length - 1; i >= 0; --i) {
        let decorator = decorators[i];
        let decorated = decorator(target, propertyKey, descriptor);
        if (!IsUndefined(decorated)) {
            if (!IsObject(decorated)) {
                throw new TypeError();
            }
            descriptor = <PropertyDescriptor>decorated;
        }
    }
    return descriptor;
}

function DecoratePropertyWithoutDescriptor(decorators: PropertyDecorator[], target: Object, propertyKey: string | symbol): void {
    for (let i = decorators.length - 1; i >= 0; --i) {
        let decorator = decorators[i];
        decorator(target, propertyKey);
    }
}

// https://github.com/jonathandturner/decorators/blob/master/specs/metadata.md#getorcreatemetadatamap--o-p-create-
function GetOrCreateMetadataMap(target: Object, targetKey: string | symbol, create: boolean): wx.IMap<any, any> {
    let targetMetadata = __Metadata__.get(target);
    if (!targetMetadata) {
        if (!create) {
            return undefined;
        }
        targetMetadata = createMap<string | symbol, wx.IMap<any, any>>();
        __Metadata__.set(target, targetMetadata);
    }

    let keyMetadata = targetMetadata.get(targetKey);
    if (!keyMetadata) {
        if (!create) {
            return undefined;
        }
        keyMetadata = createMap<any, any>();
        targetMetadata.set(targetKey, keyMetadata);
    }

    return keyMetadata;
}

// https://github.com/jonathandturner/decorators/blob/master/specs/metadata.md#ordinaryhasmetadata--metadatakey-o-p-
function OrdinaryHasMetadata(MetadataKey: any, O: Object, P: string | symbol): boolean {
    let hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
    if (hasOwn) {
        return true;
    }

    let parent = GetPrototypeOf(O);
    if (parent !== null) {
        return OrdinaryHasMetadata(MetadataKey, parent, P);
    }

    return false;
}

// https://github.com/jonathandturner/decorators/blob/master/specs/metadata.md#ordinaryhasownmetadata--metadatakey-o-p-
function OrdinaryHasOwnMetadata(MetadataKey: any, O: Object, P: string | symbol): boolean {
    let metadataMap = GetOrCreateMetadataMap(O, P, /*create*/ false);
    if (metadataMap === undefined) {
        return false;
    }

    return Boolean(metadataMap.has(MetadataKey));
}

// https://github.com/jonathandturner/decorators/blob/master/specs/metadata.md#ordinarygetmetadata--metadatakey-o-p-
function OrdinaryGetMetadata(MetadataKey: any, O: Object, P: string | symbol): any {
    let hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
    if (hasOwn) {
        return OrdinaryGetOwnMetadata(MetadataKey, O, P);
    }

    let parent = GetPrototypeOf(O);
    if (parent !== null) {
        return OrdinaryGetMetadata(MetadataKey, parent, P);
    }

    return undefined;
}

// https://github.com/jonathandturner/decorators/blob/master/specs/metadata.md#ordinarygetownmetadata--metadatakey-o-p-
function OrdinaryGetOwnMetadata(MetadataKey: any, O: Object, P: string | symbol): any {
    let metadataMap = GetOrCreateMetadataMap(O, P, /*create*/ false);
    if (metadataMap === undefined) {
        return undefined;
    }

    return metadataMap.get(MetadataKey);
}

// https://github.com/jonathandturner/decorators/blob/master/specs/metadata.md#ordinarydefineownmetadata--metadatakey-metadatavalue-o-p-
function OrdinaryDefineOwnMetadata(MetadataKey: any, MetadataValue: any, O: Object, P: string | symbol): void {
    let metadataMap = GetOrCreateMetadataMap(O, P, /*create*/ true);
    metadataMap.set(MetadataKey, MetadataValue);
}

// https://github.com/jonathandturner/decorators/blob/master/specs/metadata.md#ordinarymetadatakeys--o-p-
function OrdinaryMetadataKeys(O: Object, P: string | symbol): any[] {
    let ownKeys = OrdinaryOwnMetadataKeys(O, P);
    let parent = GetPrototypeOf(O);
    if (parent === null) {
        return ownKeys;
    }

    let parentKeys = OrdinaryMetadataKeys(parent, P);
    if (parentKeys.length <= 0) {
        return ownKeys;
    }
    if (ownKeys.length <= 0) {
        return parentKeys;
    }

    let set = createSet<any>();
    let keys: any[] = [];

    for (let key of ownKeys) {
        let hasKey = set.has(key);
        if (!hasKey) {
            set.add(key);
            keys.push(key);
        }
    }

    for (let key of parentKeys) {
        let hasKey = set.has(key);
        if (!hasKey) {
            set.add(key);
            keys.push(key);
        }
    }

    return keys;
}

// https://github.com/jonathandturner/decorators/blob/master/specs/metadata.md#ordinaryownmetadatakeys--o-p-
function OrdinaryOwnMetadataKeys(target: Object, targetKey: string | symbol): any[] {
    let metadataMap = GetOrCreateMetadataMap(target, targetKey, /*create*/ false);
    let keys: any[] = [];
    if (metadataMap) {
        metadataMap.forEach((_, key) => keys.push(key));
    }

    return keys;
}

// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-ecmascript-language-types-undefined-type
function IsUndefined(x: any): boolean {
    return x === undefined;
}

// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isarray
function IsArray(x: any): boolean {
    return Array.isArray(x);
}

// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object-type
function IsObject(x: any): boolean {
    return typeof x === "object" ? x !== null : typeof x === "function";
}

// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-isconstructor
function IsConstructor(x: any): boolean {
    return typeof x === "function";
}

// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-ecmascript-language-types-symbol-type
function IsSymbol(x: any): boolean {
    return typeof x === "symbol";
}

// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-topropertykey
function ToPropertyKey(value: any): string | symbol {
    if (IsSymbol(value)) {
        return <symbol>value;
    }
    return String(value);
}

function GetPrototypeOf(O: any): Object {
    let proto = Object.getPrototypeOf(O);
    if (typeof O !== "function" || O === functionPrototype) {
        return proto;
    }

    // TypeScript doesn't set __proto__ in ES5, as it's non-standard. 
    // Try to determine the superclass constructor. Compatible implementations
    // must either set __proto__ on a subclass constructor to the superclass constructor,
    // or ensure each class has a valid `constructor` property on its prototype that
    // points back to the constructor.

    // If this is not the same as Function.[[Prototype]], then this is definately inherited.
    // This is the case when in ES6 or when using __proto__ in a compatible browser.
    if (proto !== functionPrototype) {
        return proto;
    }

    // If the super prototype is Object.prototype, null, or undefined, then we cannot determine the heritage.
    let prototype = O.prototype;
    let prototypeProto = Object.getPrototypeOf(prototype);
    if (prototypeProto == null || prototypeProto === Object.prototype) {
        return proto;
    }

    // if the constructor was not a function, then we cannot determine the heritage.
    let constructor = prototypeProto.constructor;
    if (typeof constructor !== "function") {
        return proto;
    }

    // if we have some kind of self-reference, then we cannot determine the heritage.
    if (constructor === O) {
        return proto;
    }

    // we have a pretty good guess at the heritage.
    return constructor;
}

export const implementsMetaDataKey = "wx:interfaceImpl";

/**
* Interface decorator
* @param {string} interfaceName Name of an interface
*/
export function Implements(value: string|Array<string>) {
    return function (target: Function|Object) {
        let interfaces = getMetadata(implementsMetaDataKey, target) || {};

        if(typeof(value) === "string")
            value = (<string> value).split(/\s+/).map(x => x.trim()).filter(x => <any> x);

        for(let i=0;i<value.length;i++)            
            interfaces[value[i]] = true;

        defineMetadata(implementsMetaDataKey, interfaces, target);
    }
}
