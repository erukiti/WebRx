/// <reference path="typings/URI.d.ts" />
/// <reference path="../src/web.rx.d.ts" />
/// <reference path="../node_modules/rx/ts/rx.testing.d.ts" />
var testutils;
(function (testutils) {
    var knownEvents = {}, knownEventTypesByEventName = {};
    var keyEventTypeName = 'KeyboardEvent';
    knownEvents[keyEventTypeName] = ['keyup', 'keydown', 'keypress'];
    knownEvents['MouseEvents'] = ['click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave'];
    Object.keys(knownEvents).forEach(function (x) {
        var eventType = x;
        var knownEventsForType = knownEvents[x];
        if (knownEventsForType.length) {
            for (var i = 0, j = knownEventsForType.length; i < j; i++)
                knownEventTypesByEventName[knownEventsForType[i]] = eventType;
        }
    });
    function distinctUntilChanged(arr) {
        var isFirst = true;
        var lastValue;
        var result = new Array();
        arr.forEach(function (v) {
            if (isFirst) {
                lastValue = v;
                isFirst = false;
                result.push(v);
            }
            if (v !== lastValue) {
                result.push(v);
            }
            lastValue = v;
        });
        return result;
    }
    testutils.distinctUntilChanged = distinctUntilChanged;
    function run(arr, block) {
        arr.forEach(function (x) { return block(x); });
    }
    testutils.run = run;
    /// <summary>
    /// WithScheduler overrides the default Deferred and Taskpool schedulers
    /// with the given scheduler until the return value is disposed. This
    /// is useful in a unit test runner to force RxXaml objects to schedule
    /// via a TestScheduler object.
    /// </summary>
    /// <param name="sched">The scheduler to use.</param>
    /// <returns>An object that when disposed, restores the previous default
    /// schedulers.</returns>
    function _withScheduler(sched) {
        //schedGate.WaitOne();
        var prevDef = wx.app.mainThreadScheduler;
        //var prevTask = wx.wx.App.taskpoolScheduler;
        wx.app.mainThreadScheduler = sched;
        //wx.wx.App.TaskpoolScheduler = sched;
        return Rx.Disposable.create(function () {
            wx.app.mainThreadScheduler = prevDef;
            //wx.App.TaskpoolScheduler = prevTask;
            //schedGate.Set();
        });
    }
    function withScheduler(sched, block) {
        var ret;
        var disp;
        try {
            disp = _withScheduler(sched);
            ret = block(sched);
        }
        finally {
            disp.dispose();
        }
        return ret;
    }
    testutils.withScheduler = withScheduler;
    function recordNext(sched, milliseconds, value) {
        return new Rx.Recorded(milliseconds, Rx.Notification.createOnNext(value));
    }
    testutils.recordNext = recordNext;
    function trackSubscriptions(parent) {
        var result = { count: 0, observable: null };
        result.observable = Rx.Observable.create(function (obs) {
            result.count++;
            var sub = parent.subscribe(function (x) { return obs.onNext(x); }, function (x) { return obs.onError(x); }, function () { return obs.onCompleted(); });
            return new Rx.CompositeDisposable(sub, Rx.Disposable.create(function () { return result.count--; }));
        });
        return result;
    }
    testutils.trackSubscriptions = trackSubscriptions;
    function createHistory() {
        var stack = [];
        var location = {};
        var current = 0;
        var popStateSubject = new Rx.Subject();
        var pushStateSubject = new Rx.Subject();
        function updateLocation(uri) {
            var u = new URI(uri);
            location.host = u.host();
            location.href = u.href();
            location.pathname = u.pathname();
            location.port = u.port();
            location.protocol = u.protocol();
            location.search = u.search();
            location.hash = u.hash();
            location.toString = function () { return uri; };
        }
        function back() {
            if (current > 0) {
                current--;
            }
            updateLocation(stack[current].url);
            popStateSubject.onNext({ state: stack[current].data });
        }
        function forward() {
            if (current < stack.length - 1) {
                current++;
            }
            updateLocation(stack[current].url);
            popStateSubject.onNext({ state: stack[current].data });
        }
        function pushState(statedata, title, url) {
            if (current < stack.length - 1) {
                stack[current] = { data: jQuery.extend(true, {}, statedata), url: url };
            }
            else {
                stack.push({ data: jQuery.extend(true, {}, statedata), url: url });
                current = stack.length - 1;
            }
            updateLocation(stack[current].url);
        }
        function replaceState(statedata, title, url) {
            stack[current] = { data: jQuery.extend(true, {}, statedata), url: url };
            updateLocation(stack[current].url);
        }
        function reset() {
            stack = [];
            current = 0;
        }
        // inherit default implementation
        var result = {
            back: back,
            forward: forward,
            //go: window.history.go,
            pushState: pushState,
            replaceState: replaceState,
            reset: reset,
            getSearchParameters: function (query) {
                query = query || result.location.search.substr(1);
                if (query) {
                    var result_1 = {};
                    var params = query.split("&");
                    for (var i = 0; i < params.length; i++) {
                        var tmp = params[i].split("=");
                        result_1[tmp[0]] = decodeURIComponent(tmp[1]);
                    }
                    return result_1;
                }
                return {};
            }
        };
        Object.defineProperty(result, "length", {
            get: function () { return stack.length; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(result, "state", {
            get: function () { return current !== -1 ? stack[current].data : undefined; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(result, "location", {
            get: function () { return location; },
            enumerable: true,
            configurable: true
        });
        // enrich with observable
        result.onPopState = popStateSubject
            .publish()
            .refCount();
        result.onPushState = pushStateSubject
            .publish()
            .refCount();
        return result;
    }
    testutils.createHistory = createHistory;
    function createModelContext() {
        var models = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            models[_i - 0] = arguments[_i];
        }
        var ctx = {
            $data: models[0],
            $root: models[models.length - 1],
            $parent: models.length > 1 ? models[1] : null,
            $parents: models.slice(1)
        };
        return ctx;
    }
    testutils.createModelContext = createModelContext;
    function nodeListToArray(nodes) {
        return Array.prototype.slice.call(nodes);
    }
    testutils.nodeListToArray = nodeListToArray;
    function nodeChildrenToArray(node) {
        return nodeListToArray(node.childNodes);
    }
    testutils.nodeChildrenToArray = nodeChildrenToArray;
    function allAttributes2String(nodes, attr, except) {
        if (except)
            nodes = nodes.filter(function (x) { return except.indexOf(x) === -1; });
        return nodes.map(function (x) { return x.getAttribute(attr); }).join(", ");
    }
    testutils.allAttributes2String = allAttributes2String;
    function triggerEvent(element, eventType, keyCode) {
        if (typeof document.createEvent == "function") {
            if (typeof element.dispatchEvent == "function") {
                var eventCategory = knownEventTypesByEventName[eventType] || "HTMLEvents";
                var event;
                if (eventCategory !== 'KeyboardEvent') {
                    event = document.createEvent(eventCategory);
                    event.initEvent(eventType, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, element);
                }
                else {
                    var keyEvent = document.createEvent(eventCategory);
                    keyEvent.initKeyboardEvent(eventType, true, true, null, "", 0, "", false, null);
                    if (keyCode) {
                        Object.defineProperty(keyEvent, 'keyCode', {
                            get: function () {
                                return keyCode;
                            }
                        });
                    }
                    event = keyEvent;
                }
                element.dispatchEvent(event);
            }
            else
                throw new Error("The supplied element doesn't support dispatchEvent");
        }
        else if (element.click) {
            element.click();
        }
        else if (typeof element["fireEvent"] != "undefined") {
            element["fireEvent"]("on" + eventType);
        }
        else {
            throw new Error("Browser doesn't support triggering events");
        }
    }
    testutils.triggerEvent = triggerEvent;
    function ensureDummyAnimations() {
        // dummy animations
        if (!wx.app.animation("dummyEnter")) {
            wx.app.animation("dummyEnter", wx.animation(function (nodes, params) { return Rx.Observable.return(undefined); }));
            wx.app.animation("dummyLeave", wx.animation(function (nodes, params) { return Rx.Observable.return(undefined); }));
        }
    }
    testutils.ensureDummyAnimations = ensureDummyAnimations;
})(testutils || (testutils = {}));
window["createMockHistory"] = testutils.createHistory;
