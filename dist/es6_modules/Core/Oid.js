"use strict";
let oid = 1;
let oidPropertyName = "__wx_oid__" + (new Date).getTime();
function isPrimitive(target) {
    let t = typeof target;
    return t === "boolean" || t === "number" || t === "string";
}
/**
* Returns the objects unique id or assigns it if unassigned
* @param {any} o
*/
export function getOid(o) {
    if (o == null)
        return undefined;
    if (isPrimitive(o))
        return (typeof o + ":" + o);
    // already set?
    if (o.hasOwnProperty(oidPropertyName))
        return o[oidPropertyName];
    // assign new one
    let result = (++oid).toString();
    // store as non-enumerable property to avoid confusing other libraries
    Object.defineProperty(o, oidPropertyName, {
        enumerable: false,
        configurable: false,
        writable: false,
        value: result
    });
    return result;
}
//# sourceMappingURL=Oid.js.map