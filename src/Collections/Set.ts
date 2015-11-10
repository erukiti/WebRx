/// <reference path="../../node_modules/typescript/lib/lib.es6.d.ts" />
/// <reference path="../Interfaces.ts" />

import { getOid } from "../Core/Oid"

"use strict";

/**
* ES6 Set Shim
* @class
*/
class SetEmulated<T> implements wx.ISet<T> {
    ////////////////////
    /// ISet

    public add(value: T): wx.ISet<T> {
        let key = getOid(value);

        if (!this.keys[key]) {
            this.values.push(value);
            this.keys[key] = true;
        }

        return this;
    }

    public delete(value: T): boolean {
        let key = getOid(value);

        if (this.keys[key]) {
            let index = this.values.indexOf(value);
            this.values.splice(index, 1);

            delete this.keys[key];
            return true;
        }

        return false;
    }

    public has(value: T): boolean {
        let key = getOid(value);
        return this.keys.hasOwnProperty(key);
    }

    public clear(): void {
        this.keys = {};
        this.values.length = 0;
    }

    public forEach(callback: (T) => void, thisArg?): void {
        this.values.forEach(callback, thisArg);
    }

    public get size(): number {
        return this.values.length;
    }

    public get isEmulated(): boolean {
        return true;
    }

    ////////////////////
    /// Implementation

    public values: Array<T> = [];
    private keys: { [key: string]: boolean } = {};
}

function isFunction(o: any): boolean {
    return typeof o === 'function';
}

var proto: wx.ISet<any> = <any> Set.prototype;

var hasNativeSupport = isFunction(Set) && isFunction(proto.forEach) &&
    isFunction(proto.add) && isFunction(proto.clear) &&
    isFunction(proto.delete) && isFunction(proto.has);

/**
* Creates a new Set instance
* @param {boolean} disableNativeSupport Force creation of an emulated implementation, regardless of browser native support.
* @return {ISet<T>} A new instance of a suitable ISet implementation
*/
export function createSet<T>(disableNativeSupport?: boolean): wx.ISet<T> {
    if (disableNativeSupport || !hasNativeSupport) {
        return new SetEmulated<T>();
    }

    return <wx.ISet<T>> <any> new Set();
}

/**
* Extracts the values of a Set by invoking its forEach method and capturing the output
*/
export function setToArray<T>(src: wx.ISet<T>): Array<T> {
    let result = new Array<T>();
    src.forEach(x => result.push(x));
    return result;
}
