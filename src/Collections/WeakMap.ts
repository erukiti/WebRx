/// <reference path="../../node_modules/typescript/bin/lib.es6.d.ts" />

import { getOid } from "../Core/Utils"

"use strict";

/**
* The WeakMap object is a collection of key/value pairs in which the keys are objects and the values can be arbitrary values. The keys are held using weak references.
* @interface 
**/
export interface IWeakMap<TKey extends Object, T> {
    set(key: TKey, value: T): void;
    get(key: TKey): T;
    has(key: TKey): boolean;
    delete(key: TKey): void;
    isEmulated: boolean;
}

/**
* This class emulates the semantics of a WeakMap.
* Even though this implementation is indeed "weak", it has the drawback of
* requiring manual housekeeping of entries otherwise they are kept forever.
* @class
*/
class WeakMapEmulated<TKey extends Object, T> implements IWeakMap<TKey, T> {
    ////////////////////
    /// IWeakMap

    public set(key: TKey, value: T) {
        let oid = getOid(key);
        this.inner[oid] = value;
    }

    public get(key: TKey): T {
        let oid = getOid(key);
        return this.inner[oid];
    }

    public has(key: TKey): boolean {
        let oid = getOid(key);
        return this.inner.hasOwnProperty(oid);
    }

    public delete(key: TKey): boolean {
        let oid = getOid(key);
        return delete this.inner[oid];
    }

    public get isEmulated(): boolean {
        return true;
    }

    ////////////////////
    /// Implementation

    private inner: { [key: string]: T } = {};
}

let hasNativeSupport = typeof WeakMap === "function";

/**
* Creates a new WeakMap instance
* @param {boolean} disableNativeSupport Force creation of an emulated implementation, regardless of browser native support.
* @return {IWeakMap<TKey, T>} A new instance of a suitable IWeakMap implementation
*/
export function createWeakMap<TKey, T>(disableNativeSupport?: boolean): IWeakMap<TKey, T> {
    if (disableNativeSupport || !hasNativeSupport) {
        return new WeakMapEmulated<TKey, T>();
    }

    return <IWeakMap<TKey, T>> <any> new WeakMap();
}
