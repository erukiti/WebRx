///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../RTTI/IID.ts" />
/// <reference path="../Core/Lazy.ts" />
/// <reference path="../Core/RefCountDisposeWrapper.ts" />
/// <reference path="../RxJsExtensions.ts" />

module wx {
    "use strict";

    /**
    * ReactiveUI's awesome derived ReactiveList ported to Typescript
    * @class
    */
    //class DerivedObservableList<T> implements IObservableReadOnlyList<T>, IUnknown, Rx.IDisposable {
    //}

    //export module internal {
    //    export var derivedListConstructor = <any> DerivedObservableList;
    //}

    /**
     * Creates a collection whose contents will "follow" another collection; 
     * this method is useful for creating ViewModel collections that are 
     * automatically updated when the respective Model collection is updated.
     * @param src {IObservableList<T>|Array<T>} The source collection to follow
     * @param selector {(T) => TNew} A Select function that will be run on each item
     * @param filter {(item: T) => boolean} A filter to determine whether to exclude items in the derived collection
     * @param orderer {(a: TNew, b: TNew) => number} A comparator method to determine the ordering of the resulting collection
     * @param signalReset {Rx.Observable<TDontCare>} When this Observable is signalled, the derived collection will be manually reordered/refiltered.
     */
    export function derivedList<T, TNew, TDontCare>(src: IObservableList<T>|Array<T>, selector?: (T) => TNew, filter?: (item: T) => boolean,
        orderer?: (a: TNew, b: TNew) => number, signalReset?: Rx.Observable<TDontCare>, scheduler?: Rx.IScheduler): IObservableReadOnlyList<TNew>;

    export function derivedList(): IObservableReadOnlyList<any> {
        return <any> undefined;
    }
}