"use strict";

let oid = 1;
let oidPropertyName = "__wx_oid__" + (new Date).getTime();

function isPrimitive(target: any): boolean {
    let t = typeof target;

    return t === "boolean" || t === "number" || t === "string";
}

/**
* Returns the objects unique id or assigns it if unassigned
* @param {any} o
*/
export function getOid(o: any): string {
    if (o == null)
        return undefined;

    if (isPrimitive(o))
        return (typeof o + ":" + o);

    let result = o[oidPropertyName];

    if (result === undefined) {
        result = (++oid).toString();
        
        // store as non-enumerable property to avoid confusing other libraries
        Object.defineProperty(o, oidPropertyName, {
            enumerable: false,
            configurable: false,
            writable: false,
            value: result
        });
    }

    return result;
}
