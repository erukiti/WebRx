/// <reference path="../Interfaces.d.ts" />
export declare var noop: () => void;
/**
* Returns true if a ECMAScript5 strict-mode is active
*/
export declare function isStrictMode(): boolean;
/**
* Returns true if target is a javascript primitive
*/
export declare function isPrimitive(target: any): boolean;
/**
* Tests if the target supports the interface
* @param {any} target
* @param {string} iid
*/
export declare function queryInterface(target: any, iid: string): boolean;
/**
* Returns all own properties of target implementing interface iid
* @param {any} target
* @param {string} iid
*/
export declare function getOwnPropertiesImplementingInterface<T>(target: any, iid: string): PropertyInfo<T>[];
/**
* Determines if target is an instance of a IObservableProperty
* @param {any} target
*/
export declare function isProperty(target: any): boolean;
/**
* Determines if target is an instance of a Rx.Scheduler
* @param {any} target
*/
export declare function isRxScheduler(target: any): boolean;
/**
* Determines if target is an instance of a Rx.Observable
* @param {any} target
*/
export declare function isRxObservable(target: any): boolean;
/**
* If the prop is an observable property return its value
* @param {any} prop
*/
export declare function unwrapProperty(prop: any): any;
/**
* Returns true if a Unit-Testing environment is detected
*/
export declare function isInUnitTest(): boolean;
/**
* Transforms the current method's arguments into an array
*/
export declare function args2Array(args: IArguments): Array<any>;
/**
* Formats a string using .net style format string
* @param {string} fmt The format string
* @param {any[]} ...args Format arguments
*/
export declare function formatString(fmt: string, ...args: any[]): string;
/**
* Copies own properties from src to dst
*/
export declare function extend(src: Object, dst: Object, inherited?: boolean): Object;
export declare class PropertyInfo<T> {
    constructor(propertyName: string, property: T);
    propertyName: string;
    property: T;
}
/**
* Toggles one ore more css classes on the specified DOM element
* @param {Node} node The target element
* @param {boolean} shouldHaveClass True if the classes should be added to the element, false if they should be removed
* @param {string[} classNames The list of classes to process
*/
export declare function toggleCssClass(node: HTMLElement, shouldHaveClass: boolean, ...classNames: string[]): void;
/**
 * Trigger a reflow on the target element
 * @param {HTMLElement} el
 */
export declare function triggerReflow(el: HTMLElement): void;
/**
 * Returns true if the specified element may be disabled
 * @param {HTMLElement} el
 */
export declare function elementCanBeDisabled(el: HTMLElement): boolean;
/**
 * Returns true if object is a Function.
 * @param obj
 */
export declare function isFunction(obj: any): boolean;
/**
 * Returns true if object is a Disposable
 * @param obj
 */
export declare function isDisposable(obj: any): boolean;
/**
 * Performs an optimized deep comparison between the two objects, to determine if they should be considered equal.
 * @param a Object to compare
 * @param b Object to compare to
 */
export declare function isEqual(a: any, b: any, aStack?: any, bStack?: any): boolean;
/**
* Returns an array of clones of the nodes in the source array
*/
export declare function cloneNodeArray(nodes: Array<Node>): Array<Node>;
/**
 * Converts a NodeList into a javascript array
 * @param {NodeList} nodes
 */
export declare function nodeListToArray(nodes: NodeList): Node[];
/**
 * Converts the node's children into a javascript array
 * @param {Node} node
 */
export declare function nodeChildrenToArray<T>(node: Node): T[];
/**
* Wraps an action in try/finally block and disposes the resource after the action has completed even if it throws an exception
* (mimics C# using statement)
* @param {Rx.IDisposable} disp The resource to dispose after action completes
* @param {() => void} action The action to wrap
*/
export declare function using<T extends Rx.Disposable>(disp: T, action: (disp?: T) => void): void;
/**
* Turns an AMD-Style require call into an observable
* @param {string} Module The module to load
* @return {Rx.Observable<any>} An observable that yields a value and completes as soon as the module has been loaded
*/
export declare function observableRequire<T>(module: string): Rx.Observable<T>;
/**
* Returns an observable that notifes of any observable property changes on the target
* @param {any} target The object to observe
* @return {Rx.Observable<T>} An observable
*/
export declare function observeObject(target: any, defaultExceptionHandler: Rx.Observer<Error>, onChanging?: boolean): Rx.Observable<wx.IPropertyChangedEventArgs>;
export declare function whenAny<TRet, T1>(property1: wx.IObservableProperty<T1>, selector: (T1) => TRet): Rx.Observable<TRet>;
export declare function whenAny<TRet, T1, T2>(property1: wx.IObservableProperty<T1>, property2: wx.IObservableProperty<T2>, selector: (T1, T2, T3, T4, T5) => TRet): Rx.Observable<TRet>;
export declare function whenAny<TRet, T1, T2, T3>(property1: wx.IObservableProperty<T1>, property2: wx.IObservableProperty<T2>, property3: wx.IObservableProperty<T3>, selector: (T1, T2, T3, T4, T5) => TRet): Rx.Observable<TRet>;
export declare function whenAny<TRet, T1, T2, T3, T4>(property1: wx.IObservableProperty<T1>, property2: wx.IObservableProperty<T2>, property3: wx.IObservableProperty<T3>, property4: wx.IObservableProperty<T4>, selector: (T1, T2, T3, T4, T5) => TRet): Rx.Observable<TRet>;
export declare function whenAny<TRet, T1, T2, T3, T4, T5>(property1: wx.IObservableProperty<T1>, property2: wx.IObservableProperty<T2>, property3: wx.IObservableProperty<T3>, property4: wx.IObservableProperty<T4>, property5: wx.IObservableProperty<T5>, selector: (T1, T2, T3, T4, T5) => TRet): Rx.Observable<TRet>;
export declare function whenAny<TRet, T1, T2, T3, T4, T5, T6>(property1: wx.IObservableProperty<T1>, property2: wx.IObservableProperty<T2>, property3: wx.IObservableProperty<T3>, property4: wx.IObservableProperty<T4>, property5: wx.IObservableProperty<T5>, property6: wx.IObservableProperty<T6>, selector: (T1, T2, T3, T4, T5, T6) => TRet): Rx.Observable<TRet>;
export declare function whenAny<TRet, T1, T2, T3, T4, T5, T6, T7>(property1: wx.IObservableProperty<T1>, property2: wx.IObservableProperty<T2>, property3: wx.IObservableProperty<T3>, property4: wx.IObservableProperty<T4>, property5: wx.IObservableProperty<T5>, property6: wx.IObservableProperty<T6>, property7: wx.IObservableProperty<T7>, selector: (T1, T2, T3, T4, T5, T6, T7) => TRet): Rx.Observable<TRet>;
export declare function whenAny<TRet, T1, T2, T3, T4, T5, T6, T7, T8>(property1: wx.IObservableProperty<T1>, property2: wx.IObservableProperty<T2>, property3: wx.IObservableProperty<T3>, property4: wx.IObservableProperty<T4>, property5: wx.IObservableProperty<T5>, property6: wx.IObservableProperty<T6>, property7: wx.IObservableProperty<T7>, property8: wx.IObservableProperty<T8>, selector: (T1, T2, T3, T4, T5, T6, T7, T8) => TRet): Rx.Observable<TRet>;
/**
* FOR INTERNAL USE ONLY
* Throw an error containing the specified description
*/
export declare function throwError(fmt: string, ...args: any[]): void;
