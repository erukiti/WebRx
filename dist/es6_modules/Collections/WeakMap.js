/// <reference path="../../node_modules/typescript/lib/lib.es6.d.ts" />
/// <reference path="../Interfaces.ts" />
import { getOid } from "../Core/Oid";
"use strict";
/**
* This class emulates the semantics of a WeakMap.
* Even though this implementation is indeed "weak", it has the drawback of
* requiring manual housekeeping of entries otherwise they are kept forever.
* @class
*/
class WeakMapEmulated {
    constructor() {
        ////////////////////
        /// Implementation
        this.inner = {};
    }
    ////////////////////
    /// IWeakMap
    set(key, value) {
        let oid = getOid(key);
        this.inner[oid] = value;
    }
    get(key) {
        let oid = getOid(key);
        return this.inner[oid];
    }
    has(key) {
        let oid = getOid(key);
        return this.inner.hasOwnProperty(oid);
    }
    delete(key) {
        let oid = getOid(key);
        return delete this.inner[oid];
    }
    get isEmulated() {
        return true;
    }
}
let hasNativeSupport = typeof WeakMap === "function";
//let hasNativeSupport = false;
/**
* Creates a new WeakMap instance
* @param {boolean} disableNativeSupport Force creation of an emulated implementation, regardless of browser native support.
* @return {IWeakMap<TKey, T>} A new instance of a suitable IWeakMap implementation
*/
export function createWeakMap(disableNativeSupport) {
    if (disableNativeSupport || !hasNativeSupport) {
        return new WeakMapEmulated();
    }
    return new WeakMap();
}
//# sourceMappingURL=WeakMap.js.map