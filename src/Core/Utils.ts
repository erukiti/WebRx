///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Interfaces.ts" />
/// <reference path="../RTTI/IUnknown.ts" />

/**
* Global helpers in utils namespace
*/

module wx.utils {
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
    * Extracts the values of a Set by invoking its forEach method and capturing the output
    */
    export function getSetValues<T>(src: ISet<T>): Array<T> {
        var result = new Array<T>();
        src.forEach(x => result.push(x));
        return result;
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
}
