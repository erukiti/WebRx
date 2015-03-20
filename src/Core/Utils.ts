///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Interfaces.ts" />
/// <reference path="../RTTI/IUnknown.ts" />

/**
* Global helpers
*/

module wx {
    var cssClassNameRegex = /\S+/g;
    var RxObsConstructor = (<any> Rx.Observable); // this hack is neccessary because the .d.ts for RxJs declares Observable as an interface)

    /**
    * Returns true if a ECMAScript5 strict-mode is active
    */
    export function isStrictMode(): boolean {
        return typeof this === "undefined";
    }

    /**
    * Returns true if target is a javascript primitive
    */
    export function isPrimitive(target: any): boolean {
        var t = typeof target;

        return t === "boolean" || t === "number" || t === "string";
    }

    /**
    * Determines if target is an instance of a IObservableProperty
    * @param {any} target
    */
    export function isProperty(target: any): boolean {
        if (target == null)
            return false;

        return queryInterface(target, IID.IObservableProperty);
    }

    /**
    * Determines if target is an instance of a wx.ICommand
    * @param {any} target
    */
    export function isCommand(target: any): boolean {
        if (target == null)
            return false;

        return target instanceof internal.commandConstructor ||
            queryInterface(target, IID.ICommand);
    }

    /**
    * Determines if target is an instance of a wx.IObservableList
    * @param {any} target
    */
    export function isList(target: any): boolean {
        if (target == null)
            return false;

        return target instanceof internal.listConstructor ||
            queryInterface(target, IID.IObservableList);
    }

    /**
    * Determines if target is an instance of a Rx.Scheduler
    * @param {any} target
    */
    export function isRxScheduler(target: any): boolean {
        if (target == null)
            return false;

        return Rx.helpers.isScheduler(target);
    }

    /**
    * Determines if target is an instance of a Rx.Observable
    * @param {any} target
    */
    export function isRxObservable(target: any): boolean {
        if (target == null)
            return false;

        return target instanceof RxObsConstructor;
    }

    /**
    * If the prop is an observable property return its value
    * @param {any} prop
    */
    export function unwrapProperty(prop: any) {
        if (isProperty(prop))
            return prop();

        return prop;
    }

    /**
    * Returns true if a Unit-Testing environment is detected
    */
    export function isInUnitTest(): boolean {
        // detect jasmine 1.x
        if (window && window["jasmine"] && window["jasmine"].version_ !== undefined) {
            return true;
        }

        // detect jasmine 2.x
        if (window && window["getJasmineRequireObj"] && typeof window["getJasmineRequireObj"] === "function") {
            return true;
        }

        return false;
    }

    /**
    * Transforms the current method's arguments into an array
    */
    export function args2Array(args: IArguments): Array<any> {
        var result = [];

        for (var i = 0, len = args.length; i < len; i++) {
            result.push(args[i]);
        }

        return result;
    }

    /**
    * Formats a string using .net style format string
    * @param {string} fmt The format string
    * @param {any[]} ...args Format arguments
    */
    export function formatString(fmt: string, ...args: any[]): string {
        var pattern = /\{\d+\}/g;

        return (<any> fmt).replace(pattern, (capture) => {
            return args[capture.match(/\d+/)];
        });
    }

    /**
    * Removes all leading and trailing white-space characters from a string.
    * @param {string} The format string
    */
    export function trimString(str: string): string {
        return str.replace(/[ \t]+$/g, "").replace(/^[ \t]+/g, "");
    }

    /**
    * Copies own properties from src to dst
    */
    export function extend(src: Object, dst: Object): Object {
        var ownProps = Object.getOwnPropertyNames(src);
        for (var i = 0; i < ownProps.length;i++) {
            var prop = ownProps[i];
            dst[prop] = src[prop];
        }

        return dst;
    }

    var oid = 1;
    var oidPropertyName = "__rxui_oid__" + (new Date).getTime();

    export class PropertyInfo<T> {
        constructor(propertyName: string, property: T) {
            this.property = property;
            this.propertyName = propertyName;
        }

        propertyName: string;
        property: T;
    }

    /**
    * Tests if the target supports the interface
    * @param {any} target
    * @param {string} iid
    */
    export function queryInterface(target: any, iid: string): boolean {
        // test for IUnknown first
        if (supportsQueryInterface(target)) {
            return (<IUnknown> target).queryInterface(iid);
        }

        return false;
    }

    /**
    * Checks if the target supports queryInterface
    * @param {any} target
    */
    export function supportsQueryInterface(target: any): boolean {
        return target !== undefined && target !== null &&
            typeof target.queryInterface === "function";
    }

    /**
    * Returns all own properties of target implementing interface iid
    * @param {any} target
    * @param {string} iid
    */
    export function getOwnPropertiesImplementingInterface<T>(target: any, iid: string): PropertyInfo<T>[] {
        return Object.keys(target).filter(propertyName => {
            // lookup object for name
            var o = target[propertyName];

            // is it an ObservableProperty?
            return queryInterface(o, iid);
        }).map(x => new PropertyInfo<T>(x, <T> target[x]));
    }

    /**
    * Returns the objects unique id or assigns it if unassigned
    * @param {any} o
    */
    export function getOid(o: any): string {
        if (isPrimitive(o))
            return (typeof o + ":" + o);

        var result = o[oidPropertyName];

        if (result === undefined) {
            result = (++oid).toString();
            o[oidPropertyName] = result;
        }

        return result;
    }

    /**
    * Toggles one ore more css classes on the specified DOM element
    * @param {Node} node The target element
    * @param {boolean} shouldHaveClass True if the classes should be added to the element, false if they should be removed
    * @param {string[} classNames The list of classes to process
    */
    export function toggleCssClass(node: HTMLElement, shouldHaveClass: boolean, ...classNames: string[]): void {
        if (classNames) {
            var currentClassNames = node.className.match(cssClassNameRegex) || [];
            var index: number;
            var i;
            var className;

            if (shouldHaveClass) {
                for (i = 0; i < classNames.length; i++) {
                    className = classNames[i];

                    index = currentClassNames.indexOf(className);
                    if (index === -1)
                        currentClassNames.push(className);
                }
            } else {
                for (i = 0; i < classNames.length; i++) {
                    className = classNames[i];
                    index = currentClassNames.indexOf(className);
                    if (index !== -1)
                        currentClassNames.splice(index, 1);
                }
            }

            node.className = currentClassNames.join(" ");
        }
    }

    /**
     * Returns true if object is a Function.
     * @param obj
     */
    export function isFunction(obj) {
        return typeof obj == 'function' || false;
    }

    /**
     * Performs an optimized deep comparison between the two objects, to determine if they should be considered equal.
     * @param a Object to compare
     * @param b Object to compare to
     */
    export function isEqual(a, b, aStack?, bStack?) {
        var toString = ({}).toString;

        // Identical objects are equal. `0 === -0`, but they aren't identical.
        // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
        if (a === b) return a !== 0 || 1 / a === 1 / b;
        // A strict comparison is necessary because `null == undefined`.
        if (a == null || b == null) return a === b;

        // Unwrap any wrapped objects.
        //if (a instanceof _) a = a._wrapped;
        //if (b instanceof _) b = b._wrapped;

        // Compare `[[Class]]` names.
        var className = toString.call(a);
        if (className !== toString.call(b))
            return false;

        switch (className) {
            // Strings, numbers, regular expressions, dates, and booleans are compared by value.
            case '[object RegExp]':
            // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
            case '[object String]':
            // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
            // equivalent to `new String("5")`.
                return '' + a === '' + b;

            case '[object Number]':
                // `NaN`s are equivalent, but non-reflexive.
                // Object(NaN) is equivalent to NaN
                if (+a !== +a) return +b !== +b;
                // An `egal` comparison is performed for other numeric values.
                return +a === 0 ? 1 / +a === 1 / b : +a === +b;
            case '[object Date]':
            case '[object Boolean]':
                // Coerce dates and booleans to numeric primitive values. Dates are compared by their
                // millisecond representations. Note that invalid dates with millisecond representations
                // of `NaN` are not equivalent.
                return +a === +b;
        }

        var areArrays = className === '[object Array]';
        if (!areArrays) {
            if (typeof a != 'object' || typeof b != 'object')
                return false;

            // Objects with different constructors are not equivalent, but `Object`s or `Array`s
            // from different frames are.
            var aCtor = a.constructor, bCtor = b.constructor;
            if (aCtor !== bCtor && !(isFunction(aCtor) && aCtor instanceof aCtor &&
                    isFunction(bCtor) && bCtor instanceof bCtor)
                && ('constructor' in a && 'constructor' in b)) {
                return false;
            }
        }
        // Assume equality for cyclic structures. The algorithm for detecting cyclic
        // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

        // Initializing stack of traversed objects.
        // It's done here since we only need them for objects and arrays comparison.
        aStack = aStack || [];
        bStack = bStack || [];
        var length = aStack.length;
        while (length--) {
            // Linear search. Performance is inversely proportional to the number of
            // unique nested structures.
            if (aStack[length] === a)
                return bStack[length] === b;
        }

        // Add the first object to the stack of traversed objects.
        aStack.push(a);
        bStack.push(b);

        // Recursively compare objects and arrays.
        if (areArrays) {
            // Compare array lengths to determine if a deep comparison is necessary.
            length = a.length;
            if (length !== b.length)
                return false;
            // Deep compare the contents, ignoring non-numeric properties.
            while (length--) {
                if (!isEqual(a[length], b[length], aStack, bStack))
                    return false;
            }
        } else {
            // Deep compare objects.
            var keys = Object.keys(a), key;
            length = keys.length;
            // Ensure that both objects contain the same number of properties before comparing deep equality.
            if (Object.keys(b).length !== length)
                return false;
            while (length--) {
                // Deep compare each member
                key = keys[length];
                if (!(b.hasOwnProperty(key) && isEqual(a[key], b[key], aStack, bStack)))
                    return false;
            }
        }

        // Remove the first object from the stack of traversed objects.
        aStack.pop();
        bStack.pop();
        return true;
    }

    /**
    * Returns an array of clones of the nodes in the source array
    */
    export function cloneNodeArray(nodes: Array<Node>): Array<Node> {
        var length = nodes.length;
        var result = new Array<Node>(length);

        for (var i = 0; i < length; i++) {
            result[i] = nodes[i].cloneNode(true);
        }

        return result;
    }

    /**
    * Wraps an action in try/finally block and disposes the resource after the action has completed even if it throws an exception 
    * (mimics C# using statement)
    * @param {Rx.IDisposable} disp The resource to dispose after action completes
    * @param {() => void} action The action to wrap
    */
    export function using<T extends Rx.Disposable>(disp: T, action: (disp?: T) => void) {
        if (!disp)
            throw new Error("disp");
        if (!action)
            throw new Error("action");

        try {
            action(disp);
        } finally {
            disp.dispose();
        }
    }

    declare function require(modules: string[], successCB: (any) => any, errCB: (err) => any): void;

    /**
    * Turns an AMD-Style require call into an observable
    * @param {string} Module The module to load
    * @return {Rx.Observable<any>} An observable that yields a value and completes as soon as the module has been loaded
    */
    export function observableRequire(module: string): Rx.Observable<any> {
        if (typeof require === "undefined")
            internal.throwError("there's no AMD-module loader available (Hint: did you forget to include RequireJS in your project?)");

        return Rx.Observable.create<any>(observer => {
            try {
                require([module],(m) => {
                    observer.onNext(m);
                    observer.onCompleted();
                },(err) => {
                        observer.onError(err);
                    });
            } catch (e) {
                observer.onError(e);
            }
            return Rx.Disposable.empty;
        });
    }

    /**
    * Returns an observable that notifes of any observable property changes on the target
    * @param {any} target The object to observe
    * @return {Rx.Observable<T>} An observable
    */
    export function observeObject(target: any, onChanging: boolean = false): Rx.Observable<IPropertyChangedEventArgs> {
        var thrownExceptionsSubject = queryInterface(target, IID.IHandleObservableErrors) ?
            <Rx.Observer<Error>> <any> (<IHandleObservableErrors> target).thrownExceptions : app.defaultExceptionHandler;

        return Rx.Observable.create<IPropertyChangedEventArgs>(
            (observer: Rx.Observer<IPropertyChangedEventArgs>): Rx.IDisposable => {
                var result = new Rx.CompositeDisposable();
                var observableProperties = getOwnPropertiesImplementingInterface<IObservableProperty<any>>(target, IID.IObservableProperty);

                observableProperties.forEach(x => {
                    var prop = x.property;

                    // subscribe
                    var obs = onChanging ? prop.changing : prop.changed;

                    result.add(obs.subscribe(newVal => {
                        //if (!areChangeNotificationsEnabled())
                        //    return;

                        var e = new internal.PropertyChangedEventArgs(self, x.propertyName);

                        try {
                            observer.onNext(e);
                        } catch (ex) {
                            //rxObj.Log().ErrorException("ReactiveObject Subscriber threw exception", ex);
                            thrownExceptionsSubject.onNext(ex);
                        }
                    }));
                });

                return result;
            })
            .publish()
            .refCount();
    }

    export function whenAny<TRet, T1>(
        property1: IObservableProperty<T1>,
        selector: (T1) => TRet): Rx.Observable<TRet>;

    export function whenAny<TRet, T1, T2>(
        property1: IObservableProperty<T1>, property2: IObservableProperty<T2>,
        selector: (T1, T2, T3, T4, T5) => TRet): Rx.Observable<TRet>;

    export function whenAny<TRet, T1, T2, T3>(
        property1: IObservableProperty<T1>, property2: IObservableProperty<T2>,
        property3: IObservableProperty<T3>,
        selector: (T1, T2, T3, T4, T5) => TRet): Rx.Observable<TRet>;

    export function whenAny<TRet, T1, T2, T3, T4>(
        property1: IObservableProperty<T1>, property2: IObservableProperty<T2>,
        property3: IObservableProperty<T3>, property4: IObservableProperty<T4>,
        selector: (T1, T2, T3, T4, T5) => TRet): Rx.Observable<TRet>;

    export function whenAny<TRet, T1, T2, T3, T4, T5>(
        property1: IObservableProperty<T1>, property2: IObservableProperty<T2>,
        property3: IObservableProperty<T3>, property4: IObservableProperty<T4>,
        property5: IObservableProperty<T5>,
        selector: (T1, T2, T3, T4, T5) => TRet): Rx.Observable<TRet>;

    /// <summary>
    /// whenAny allows you to observe whenever the value of one or more
    /// properties on an object have changed, providing an initial value when
    /// the Observable is set up.
    /// </summary>
    export function whenAny<TRet>(): Rx.Observable<TRet> {
        // no need to invoke combineLatest for the simplest case
        if (arguments.length === 2) {
            return arguments[0].changed.startWith(arguments[0]()).select(arguments[1]);
        }

        var args = args2Array(arguments);

        // extract selector
        var selector = args.pop();

        // prepend sequence with current values to satisfy combineLatest
        args = args.map(x => x.changed.startWith(x()));

        // finally append the selector
        args.push(selector);

        return (<Rx.Observable<TRet>> Rx.Observable.combineLatest.apply(this, args));
    }

    export module internal {
        /**
        * FOR INTERNAL USE ONLY
        * Throw an error containing the specified description
        */
        export function throwError(fmt: string, ...args: any[]): void {
            var msg = "WebRx: " + formatString(fmt, args);
            throw new Error(msg);
        }
    }
}
