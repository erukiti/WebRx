import { formatString } from "../Core/Utils";
"use strict";
function log(...args) {
    try {
        console.log.apply(console, arguments);
    }
    catch (e) {
        try {
            window['opera'].postError.apply(window['opera'], arguments);
        }
        catch (e) {
            alert(Array.prototype.join.call(arguments, " "));
        }
    }
}
export function critical(fmt, ...args) {
    if (args.length) {
        fmt = formatString.apply(null, [fmt].concat(args));
    }
    log("**** WebRx Critical: " + fmt);
}
export function error(fmt, ...args) {
    if (args.length) {
        fmt = formatString.apply(null, [fmt].concat(args));
    }
    log("*** WebRx Error: " + fmt);
}
export function info(fmt, ...args) {
    if (args.length) {
        fmt = formatString.apply(null, [fmt].concat(args));
    }
    log("* WebRx Info: " + fmt);
}
//# sourceMappingURL=Log.js.map