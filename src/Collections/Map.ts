/// <reference path="../../node_modules/typescript/bin/lib.es6.d.ts" />

import { getOid } from "../Core/Utils"

"use strict";

/**
* The Map object is a simple key/value map. Any value (both objects and primitive values) may be used as either a key or a value.
* @interface 
**/
export interface IMap<TKey extends Object, T> {
    set(key: TKey, value: T): void;
    get(key: TKey): T;
    has(key: TKey): boolean;
    delete(key: TKey): void;
    clear(): void;
    forEach(callback: (value: any, key: any, map: IMap<any, any>) => void, thisArg?: any): void;
    size: number;
    isEmulated: boolean;
}

/**
* ES6 Map Shim
* @class
*/
class MapEmulated<TKey extends Object, T> implements IMap<TKey, T> {
    ////////////////////
    /// IMap

    public get size() {
        return this.keys.length;
    }

    public has(key: any): boolean {
        if (key === this.cache) {
            return true;
        }
        if (this.find(key) >= 0) {
            this.cache = key;
            return true;
        }
        return false;
    }

    public get(key: any): any {
        var index = this.find(key);
        if (index >= 0) {
            this.cache = key;
            return this.values[index];
        }
        return undefined;
    }

    public set(key: any, value: any): IMap<any, any> {
        this.delete(key);
        this.keys.push(key);
        this.values.push(value);
        this.cache = key;
        return this;
    }

    public delete(key: any): boolean {
        var index = this.find(key);
        if (index >= 0) {
            this.keys.splice(index, 1);
            this.values.splice(index, 1);
            this.cache = this.cacheSentinel;
            return true;
        }
        return false;
    }

    public clear(): void {
        this.keys.length = 0;
        this.values.length = 0;
        this.cache = this.cacheSentinel;
    }

    public forEach(callback: (value: any, key: any, map: IMap<any, any>) => void, thisArg?: any): void {
        var size = this.size;
        for (var i = 0; i < size; ++i) {
            var key = this.keys[i];
            var value = this.values[i];
            this.cache = key;
            callback.call(this, value, key, this);
        }
    }
    
    public get isEmulated(): boolean {
        return true;
    }

    ////////////////////
    /// Implementation

    cacheSentinel = {};
    keys = [];
    values = [];
    cache = this.cacheSentinel;

    private find(key: any): number {
        var keys = this.keys;
        var size = keys.length;
        for (var i = 0; i < size; ++i) {
            if (keys[i] === key) {
                return i;
            }
        }
        return -1;
    }
}

var hasNativeSupport = typeof Map === "function" && Map.prototype.hasOwnProperty("forEach")
    && Map.prototype.hasOwnProperty("add") && Map.prototype.hasOwnProperty("clear")
    && Map.prototype.hasOwnProperty("devare") && Map.prototype.hasOwnProperty("has");

/**
* Creates a new WeakMap instance
* @param {boolean} disableNativeSupport Force creation of an emulated implementation, regardless of browser native support.
* @return {IWeakMap<TKey, T>} A new instance of a suitable IWeakMap implementation
*/
export function createMap<TKey, T>(disableNativeSupport?: boolean): IMap<TKey, T> {
    if (disableNativeSupport || !hasNativeSupport) {
        return new MapEmulated<TKey, T>();
    }

    return <IMap<TKey, T>> <any> new Map();
}
