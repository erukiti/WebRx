/// <reference path="../../node_modules/typescript/lib/lib.es6.d.ts" />
/// <reference path="../Interfaces.ts" />
import { getOid } from "../Core/Oid";
"use strict";
/**
* ES6 Set Shim
* @class
*/
class SetEmulated {
    constructor() {
        ////////////////////
        /// Implementation
        this.values = [];
        this.keys = {};
    }
    ////////////////////
    /// ISet
    add(value) {
        let key = getOid(value);
        if (!this.keys[key]) {
            this.values.push(value);
            this.keys[key] = true;
        }
        return this;
    }
    delete(value) {
        let key = getOid(value);
        if (this.keys[key]) {
            let index = this.values.indexOf(value);
            this.values.splice(index, 1);
            delete this.keys[key];
            return true;
        }
        return false;
    }
    has(value) {
        let key = getOid(value);
        return this.keys.hasOwnProperty(key);
    }
    clear() {
        this.keys = {};
        this.values.length = 0;
    }
    forEach(callback, thisArg) {
        this.values.forEach(callback, thisArg);
    }
    get size() {
        return this.values.length;
    }
    get isEmulated() {
        return true;
    }
}
let hasNativeSupport = typeof Set === "function" && Set.prototype.hasOwnProperty("forEach")
    && Set.prototype.hasOwnProperty("add") && Set.prototype.hasOwnProperty("clear")
    && Set.prototype.hasOwnProperty("delete") && Set.prototype.hasOwnProperty("has");
/**
* Creates a new Set instance
* @param {boolean} disableNativeSupport Force creation of an emulated implementation, regardless of browser native support.
* @return {ISet<T>} A new instance of a suitable ISet implementation
*/
export function createSet(disableNativeSupport) {
    if (disableNativeSupport || !hasNativeSupport) {
        return new SetEmulated();
    }
    return new Set();
}
/**
* Extracts the values of a Set by invoking its forEach method and capturing the output
*/
export function setToArray(src) {
    let result = new Array();
    src.forEach(x => result.push(x));
    return result;
}
//# sourceMappingURL=Set.js.map