/// <reference path="../../node_modules/typescript/lib/lib.es6.d.ts" />
/// <reference path="../Interfaces.ts" />

import { getOid } from "../Core/Oid"

"use strict";

/**
* ES6 Map Shim
* @class
*/
class MapEmulated<TKey extends Object, T> implements wx.IMap<TKey, T> {
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

    public set(key: any, value: any): wx.IMap<any, any> {
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

    public forEach(callback: (value: any, key: any, map: wx.IMap<any, any>) => void, thisArg?: any): void {
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

function isFunction(o: any): boolean {
    return typeof o === 'function';
}

var proto: wx.IMap<any, any> = window["Map"] !== undefined ? <any> Map.prototype : undefined;

var hasNativeSupport = isFunction(window["Map"]) && isFunction(proto.forEach) &&
    isFunction(proto.set) && isFunction(proto.clear) &&
    isFunction(proto.delete) && isFunction(proto.has);

/**
* Creates a new WeakMap instance
* @param {boolean} disableNativeSupport Force creation of an emulated implementation, regardless of browser native support.
* @return {IWeakMap<TKey, T>} A new instance of a suitable IWeakMap implementation
*/
export function createMap<TKey, T>(disableNativeSupport?: boolean): wx.IMap<TKey, T> {
    if (disableNativeSupport || !hasNativeSupport) {
        return new MapEmulated<TKey, T>();
    }

    return <wx.IMap<TKey, T>> <any> new Map();
}
