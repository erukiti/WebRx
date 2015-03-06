///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="Utils.ts" />
/// <reference path="../Collections/WeakMap.ts" />

module wx.env {
    var _window = <any> window;
    var userAgent = _window.navigator.userAgent;

    export interface IBrowserProperties {
        version: number;
    }

    export interface IIEIBrowserProperties extends IBrowserProperties {
        getSelectionChangeObservable(el: HTMLElement): Rx.Observable<Document>;
    }

    export var ie: IIEIBrowserProperties;
    export var opera: IBrowserProperties;
    export var safari: IBrowserProperties;
    export var firefox: IBrowserProperties;

    var parseVersion = matches => {
        if (matches) {
            return parseFloat(matches[1]);
        }

        return undefined;
    }

    // Detect Opera
    if (_window.opera && _window.opera.version) {
        opera = { version: parseInt(_window.opera.version()) };
    }

    // Detect IE versions for bug workarounds (uses IE conditionals, not UA string, for robustness)
    // Note that, since IE 10 does not support conditional comments, the following logic only detects IE < 10.
    // Currently this is by design, since IE 10+ behaves correctly when treated as a standard browser.
    // If there is a future need to detect specific versions of IE10+, we will amend this.
    var version = document && ((() => {
        var version = 3, div = document.createElement('div'), iElems = div.getElementsByTagName('i');

        // Keep constructing conditional HTML blocks until we hit one that resolves to an empty fragment
        while (
            div.innerHTML === "<!--[if gt IE " + (++version) + "]><i></i><![endif]-->",
            iElems[0]
        ) { }
        return version > 4 ? version : undefined;
    })());

    if (version) {
        ie = <IIEIBrowserProperties> { version: version };

        if (version < 10) {
            // for IE9 and lower, provide an accessor for document scoped
            // observables which allow monitoring the selectionchange event
            var map = wx.createWeakMap<Document, Rx.Observable<Document>>();

            ie.getSelectionChangeObservable = (el: HTMLElement) => {
                var doc = el.ownerDocument;
                var result = map.get(doc);

                if (result)
                    return result;

                result = Rx.Observable.defer(() => {
                        return Rx.Observable.fromEvent(doc, 'selectionchange');
                    })
                    .select(x => doc)
                    .publish()
                    .refCount();

                map.set(doc, result);
                return result;
            };
        }
    }

    // Detect Safari (not Chrome or WebKit)
    version = parseVersion(userAgent.match(/^(?:(?!chrome).)*version\/([^ ]*) safari/i));
    if (version) {
        safari = { version: version };
    }

    // Detect FF
    version = parseVersion(userAgent.match(/Firefox\/([^ ]*)/));
    if (version) {
        firefox = { version: version };
    }

    export var isSupported = (!ie || ie.version >= 9) ||
        (!safari || safari.version >= 5) ||
        (!firefox || firefox.version >= 4);
}

