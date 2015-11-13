/// <reference path="../Interfaces.ts" />

import { isInUnitTest, whenAny, getObservable, args2Array, isFunction, throwError, using, isRxObservable, isRxScheduler, observeObject } from "../Core/Utils"
import { getOid } from "../Core/Oid"
import IID from "./../IID"
import Lazy from "./../Core/Lazy"
import { createScheduledSubject } from "./../Core/ScheduledSubject"
import {PropertyChangedEventArgs } from "../Core/Events"
import RefCountDisposeWrapper from "./../Core/RefCountDisposeWrapper"
import * as log from "./../Core/Log"
import { injector } from "../Core/Injector"
import * as res from "../Core/Resources"
import { property } from "../Core/Property"
import { PagedObservableListProjection } from "./ListPaged"

"use strict";

/**
* ReactiveUI's awesome ReactiveList ported to Typescript
* @class
*/
export class ObservableList<T> implements wx.IObservableList<T>, Rx.IDisposable, wx.IUnknown {
    constructor(initialContents?: Array<T>, resetChangeThreshold: number = 0.3, scheduler: Rx.IScheduler = null) {
        this.app = injector.get<wx.IWebRxApp>(res.app);
        this.setupRx(initialContents, resetChangeThreshold, scheduler);
    }

    //////////////////////////////////
    // IUnknown implementation

    public queryInterface(iid: string): boolean {
       return iid === IID.IObservableList || iid === IID.IDisposable;
    }

    //////////////////////////////////
    // IDisposable implementation

    public dispose(): void {
        this.clearAllPropertyChangeWatchers();

        this.disposables.dispose();
    }

    ////////////////////
    /// IObservableList<T>

    public get itemsAdded(): Rx.Observable<wx.IListChangeInfo<T>> {
        if (!this._itemsAdded)
            this._itemsAdded = this.itemsAddedSubject.value.asObservable();

        return this._itemsAdded;
    }

    public get beforeItemsAdded(): Rx.Observable<wx.IListChangeInfo<T>> {
        if (!this._beforeItemsAdded)
            this._beforeItemsAdded = this.beforeItemsAddedSubject.value.asObservable();

        return this._beforeItemsAdded;
    }

    public get itemsRemoved(): Rx.Observable<wx.IListChangeInfo<T>> {
        if (!this._itemsRemoved)
            this._itemsRemoved = this.itemsRemovedSubject.value.asObservable();

        return this._itemsRemoved;
    }

    public get beforeItemsRemoved(): Rx.Observable<wx.IListChangeInfo<T>> {
        if (!this._beforeItemsRemoved)
            this._beforeItemsRemoved = this.beforeItemsRemovedSubject.value.asObservable();

        return this._beforeItemsRemoved;
    }

    public get itemReplaced(): Rx.Observable<wx.IListChangeInfo<T>> {
        if (!this._itemReplaced)
            this._itemReplaced = this.itemReplacedSubject.value.asObservable();

        return this._itemReplaced;
    }

    public get beforeItemReplaced(): Rx.Observable<wx.IListChangeInfo<T>> {
        if (!this._beforeItemReplaced)
            this._beforeItemReplaced = this.beforeItemReplacedSubject.value.asObservable();

        return this._beforeItemReplaced;
    }

    public get beforeItemsMoved(): Rx.Observable<wx.IListChangeInfo<T>> {
        if (!this._beforeItemsMoved)
            this._beforeItemsMoved = this.beforeItemsMovedSubject.value.asObservable();

        return this._beforeItemsMoved;
    }

    public get itemsMoved(): Rx.Observable<wx.IListChangeInfo<T>> {
        if (!this._itemsMoved)
            this._itemsMoved = this.itemsMovedSubject.value.asObservable();

        return this._itemsMoved;
    }

    public get lengthChanging(): Rx.Observable<number> {
        if (!this._lengthChanging)
            this._lengthChanging = this.listChanging.select(_ =>
                this.inner.length).distinctUntilChanged();

        return this._lengthChanging;
    }

    public get lengthChanged(): Rx.Observable<number> {
        if (!this._lengthChanged)
            this._lengthChanged = this.listChanged.select(_ =>
                this.inner.length).distinctUntilChanged();

        return this._lengthChanged;
    }

    public isEmptyChanged: Rx.Observable<boolean>;

    public get itemChanging(): Rx.Observable<wx.IPropertyChangedEventArgs> {
        if (!this._itemChanging)
            this._itemChanging = this.itemChangingSubject.value.asObservable();

        return this._itemChanging;
    }

    public get itemChanged(): Rx.Observable<wx.IPropertyChangedEventArgs> {
        if (!this._itemChanged)
            this._itemChanged = this.itemChangedSubject.value.asObservable();

        return this._itemChanged;
    }

    public get shouldReset(): Rx.Observable<any> {
        return this.refcountSubscribers(
            this.listChanged.selectMany(x => !x ? Rx.Observable.empty<any>() :
                Rx.Observable.return<any>(null)), x => this.resetSubCount += x);
    }

    public get changeTrackingEnabled(): boolean {
        return this.propertyChangeWatchers != null;
    }

    public set changeTrackingEnabled(newValue: boolean) {
        if (this.propertyChangeWatchers != null && newValue)
            return;
        if (this.propertyChangeWatchers == null && !newValue)
            return;

        if (newValue) {
            this.propertyChangeWatchers = {};
            this.inner.forEach(x=> this.addItemToPropertyTracking(x));
        } else {
            this.clearAllPropertyChangeWatchers();
            this.propertyChangeWatchers = null;
        }
    }

    public get isReadOnly(): boolean {
        return false;
    }

    public length: wx.IObservableProperty<number>;

    public addRange(items: T[]): void {
        if (items == null) {
            throwError("items");
        }

        let disp = this.isLengthAboveResetThreshold(items.length) ? this.suppressChangeNotifications() : Rx.Disposable.empty;

        using(disp, () => {
            // reset notification
            if (!this.areChangeNotificationsEnabled()) {

                // this._inner.splice(this._inner.length, 0, items)
                Array.prototype.push.apply(this.inner, items);

                if (this.changeTrackingEnabled) {
                    items.forEach(x => {
                        this.addItemToPropertyTracking(x);
                    });
                }
            }
            // range notification
            else {
                var from = this.inner.length;   // need to capture this before "inner" gets modified

                if (this.beforeItemsAddedSubject.isValueCreated) {
                    this.beforeItemsAddedSubject.value.onNext({ items: items, from: from });
                }

                Array.prototype.push.apply(this.inner, items);

                if (this.itemsAddedSubject.isValueCreated) {
                    this.itemsAddedSubject.value.onNext({ items: items, from: from });
                }

                if (this.changeTrackingEnabled) {
                    items.forEach(x => {
                        this.addItemToPropertyTracking(x);
                    });
                }
            }
        });
    }

    public insertRange(index: number, items: T[]): void {
        if (items == null) {
            throwError("collection");
        }

        if (index > this.inner.length) {
            throwError("index");
        }

        let disp = this.isLengthAboveResetThreshold(items.length) ? this.suppressChangeNotifications() : Rx.Disposable.empty;

        using(disp, () => {
            // reset notification
            if (!this.areChangeNotificationsEnabled()) {

                // this._inner.splice(index, 0, items)
                Array.prototype.splice.apply(this.inner, (<T[]><any>[index, 0]).concat(items));

                if (this.changeTrackingEnabled) {
                    items.forEach(x => {
                        this.addItemToPropertyTracking(x);
                    });
                }
            }
            // range notification
            else {
                if (this.beforeItemsAddedSubject.isValueCreated) {
                    this.beforeItemsAddedSubject.value.onNext({ items: items, from: index });
                }

                Array.prototype.splice.apply(this.inner, (<T[]><any>[index, 0]).concat(items));

                if (this.itemsAddedSubject.isValueCreated) {
                    this.itemsAddedSubject.value.onNext({ items: items, from: index });
                }

                if (this.changeTrackingEnabled) {
                    items.forEach(x => {
                        this.addItemToPropertyTracking(x);
                    });
                }
            }
        });
    }

    public removeAll(items: T[]): void {
        if (items == null) {
            throwError("items");
        }

        let disp = this.isLengthAboveResetThreshold(items.length) ?
            this.suppressChangeNotifications() : Rx.Disposable.empty;

        using(disp, () => {
            // NB: If we don't do this, we'll break Collection<T>'s
            // accounting of the length
            items.forEach(x => this.remove(x));
        });
    }

    public removeRange(index: number, count: number): void {
        let disp = this.isLengthAboveResetThreshold(count) ? this.suppressChangeNotifications() : Rx.Disposable.empty;

        using(disp, () => {
            // construct items
            let items: T[] = this.inner.slice(index, index + count);

            // reset notification
            if (!this.areChangeNotificationsEnabled()) {
                this.inner.splice(index, count);

                if (this.changeTrackingEnabled) {
                    items.forEach(x => {
                        this.removeItemFromPropertyTracking(x);
                    });
                }
            }
            // range notification
            else {
                if (this.beforeItemsRemovedSubject.isValueCreated) {
                    this.beforeItemsRemovedSubject.value.onNext({ items: items, from: index });
                }

                this.inner.splice(index, count);

                if (this.changeTrackingEnabled) {
                    items.forEach(x => {
                        this.removeItemFromPropertyTracking(x);
                    });
                }

                if (this.itemsRemovedSubject.isValueCreated) {
                    this.itemsRemovedSubject.value.onNext({ items: items, from: index });
                }
            }
        });
    }

    public toArray(): Array<T> {
        return this.inner;
    }

    public reset(contents?: Array<T>): void {
        if (contents == null) {
            this.publishResetNotification();
        } else {
            using(this.suppressChangeNotifications(), (suppress)=> {
                this.clear();
                this.addRange(contents);
            });
        }
    }

    public add(item: T): void {
        this.insertItem(this.inner.length, item);
    }

    public clear(): void {
        this.clearItems();
    }

    public contains(item: T): boolean {
        return this.inner.indexOf(item) !== -1;
    }

    public remove(item: T): boolean {
        let index = this.inner.indexOf(item);
        if (index === -1)
            return false;

        this.removeItem(index);
        return true;
    }

    public indexOf(item: T): number {
        return this.inner.indexOf(item);
    }

    public insert(index: number, item: T): void {
        this.insertItem(index, item);
    }

    public removeAt(index: number): void {
        this.removeItem(index);
    }

    public move(oldIndex, newIndex): void  {
        this.moveItem(oldIndex, newIndex);
    }

    public project<TNew, TDontCare>(filter?: (item: T) => boolean, orderer?: (a: TNew, b: TNew) => number,
        selector?: (T) => TNew, refreshTrigger?: Rx.Observable<TDontCare>, scheduler?: Rx.IScheduler): wx.IProjectableObservableReadOnlyList<TNew>;

    public project<TDontCare>(filter?: (item: T) => boolean, orderer?: (a: T, b: T) => number,
        refreshTrigger?: Rx.Observable<TDontCare>, scheduler?: Rx.IScheduler): wx.IProjectableObservableReadOnlyList<T>;

    public project<TDontCare>(filter?: (item: T) => boolean, refreshTrigger?: Rx.Observable<TDontCare>,
        scheduler?: Rx.IScheduler): wx.IProjectableObservableReadOnlyList<T>;

    public project<TDontCare>(refreshTrigger?: Rx.Observable<TDontCare>, scheduler?: Rx.IScheduler): wx.IProjectableObservableReadOnlyList<T>;

    public project(): any {
        let args = args2Array(arguments);
        let filter = args.shift();

        if (filter != null && isRxObservable(filter)) {
            return new ObservableListProjection<any, any>(<any> this, undefined, undefined, undefined, filter, args.shift());
        }

        let orderer = args.shift();

        if (orderer != null && isRxObservable(orderer)) {
            return new ObservableListProjection<any, any>(<any> this, filter, undefined, undefined, orderer, args.shift());
        }

        let selector = args.shift();

        if (selector != null && isRxObservable(selector)) {
            return new ObservableListProjection<any, any>(<any> this, filter, orderer, undefined, selector, args.shift());
        }

        return new ObservableListProjection<any, any>(<any> this, filter, orderer, selector, args.shift(), args.shift());
    }

    public page(pageSize: number, currentPage?: number, scheduler?: Rx.IScheduler): wx.IPagedObservableReadOnlyList<T> {
        return new PagedObservableListProjection<T>(this, pageSize, currentPage, scheduler);
    }

    public suppressChangeNotifications(): Rx.IDisposable {
        this.changeNotificationsSuppressed++;

        if (!this.hasWhinedAboutNoResetSub && this.resetSubCount === 0 && !isInUnitTest()) {
            log.hint("suppressChangeNotifications was called (perhaps via addRange), yet you do not have a subscription to shouldReset. This probably isn't what you want, as itemsAdded and friends will appear to 'miss' items");
            this.hasWhinedAboutNoResetSub = true;
        }

        return Rx.Disposable.create(() => {
            this.changeNotificationsSuppressed--;

            if (this.changeNotificationsSuppressed === 0) {
                this.publishBeforeResetNotification();
                this.publishResetNotification();
            }
        });
    }

    public get(index: number): T {
        return this.inner[index];
    }

    public set(index: number, item: T): void {
        if (!this.areChangeNotificationsEnabled()) {

            if (this.changeTrackingEnabled) {
                this.removeItemFromPropertyTracking(this.inner[index]);
                this.addItemToPropertyTracking(item);
            }

            this.inner[index] = item;
            return;
        }

        if (this.beforeItemReplacedSubject.isValueCreated)
            this.beforeItemReplacedSubject.value.onNext({ from: index, items: [item] });

        if (this.changeTrackingEnabled) {
            this.removeItemFromPropertyTracking(this.inner[index]);
            this.addItemToPropertyTracking(item);
        }

        this.inner[index] = item;

        if (this.itemReplacedSubject.isValueCreated)
            this.itemReplacedSubject.value.onNext({ from: index, items: [item] });
    }

    public isEmpty: wx.IObservableProperty<boolean>;

    public listChanging: Rx.Observable<boolean>;
    public listChanged: Rx.Observable<boolean>;

    //////////////////////////
    // Some array convenience members

    public push = this.add;

    public sort(comparison: (a: T, b: T) => number): void {
        this.publishBeforeResetNotification();

        this.inner.sort(comparison);

        this.publishResetNotification();
    }

    public forEach(callbackfn: (value: T, from: number, array: T[]) => void, thisArg?: any): void {
        this.inner.forEach(callbackfn, thisArg);
    }

    public map<U>(callbackfn: (value: T, from: number, array: T[]) => U, thisArg?: any): U[] {
        return this.inner.map(callbackfn, thisArg);
    }

    public filter(callbackfn: (value: T, from: number, array: T[]) => boolean, thisArg?: any): T[] {
        return this.inner.filter(callbackfn, thisArg);
    }

    public some(callbackfn: (value: T, from: number, array: T[]) => boolean, thisArg?: any): boolean {
        return this.inner.some(callbackfn, thisArg);
    }

    public every(callbackfn: (value: T, from: number, array: T[]) => boolean, thisArg?: any): boolean {
        return this.inner.every(callbackfn, thisArg);
    }

    ////////////////////
    // Implementation

    protected inner: Array<T>;
    private beforeItemsAddedSubject: Lazy<Rx.Subject<wx.IListChangeInfo<T>>>;
    private itemsAddedSubject: Lazy<Rx.Subject<wx.IListChangeInfo<T>>>;
    private beforeItemsRemovedSubject: Lazy<Rx.Subject<wx.IListChangeInfo<T>>>;
    private itemsRemovedSubject: Lazy<Rx.Subject<wx.IListChangeInfo<T>>>;
    private beforeItemReplacedSubject: Lazy<Rx.Subject<wx.IListChangeInfo<T>>>;
    private itemReplacedSubject: Lazy<Rx.Subject<wx.IListChangeInfo<T>>>;
    private itemChangingSubject: Lazy<Rx.Subject<wx.IPropertyChangedEventArgs>>;
    private itemChangedSubject: Lazy<Rx.Subject<wx.IPropertyChangedEventArgs>>;
    private beforeItemsMovedSubject: Lazy<Rx.Subject<wx.IListChangeInfo<T>>>;
    private itemsMovedSubject: Lazy<Rx.Subject<wx.IListChangeInfo<T>>>;
    private resetSubject: Rx.Subject<any>;
    private beforeResetSubject: Rx.Subject<any>;
    private changeNotificationsSuppressed: number = 0;
    private propertyChangeWatchers: { [uniqueObjectId: string]: RefCountDisposeWrapper } = null;
    private resetChangeThreshold = 0;
    private resetSubCount = 0;
    private hasWhinedAboutNoResetSub = false;
    protected app: wx.IWebRxApp;
    protected readonlyExceptionMessage = "Derived collections cannot be modified.";
    private disposables = new Rx.CompositeDisposable();

    // backing-fields for subjects exposed as observables
    private _itemsAdded: Rx.Observable<wx.IListChangeInfo<T>>;
    private _beforeItemsAdded: Rx.Observable<wx.IListChangeInfo<T>>;
    private _itemsRemoved: Rx.Observable<wx.IListChangeInfo<T>>;
    private _beforeItemsRemoved: Rx.Observable<wx.IListChangeInfo<T>>;
    private _beforeItemsMoved: Rx.Observable<wx.IListChangeInfo<T>>;
    private _itemReplaced: Rx.Observable<wx.IListChangeInfo<T>>;
    private _beforeItemReplaced: Rx.Observable<wx.IListChangeInfo<T>>;
    private _itemsMoved: Rx.Observable<wx.IListChangeInfo<T>>;
    private _lengthChanging: Rx.Observable<number>;
    private _lengthChanged: Rx.Observable<number>;
    private _itemChanging: Rx.Observable<wx.IPropertyChangedEventArgs>;
    private _itemChanged: Rx.Observable<wx.IPropertyChangedEventArgs>;

    private setupRx(initialContents: Array<T>, resetChangeThreshold: number = 0.3, scheduler: Rx.IScheduler = null) {
        scheduler = scheduler || injector.get<wx.IWebRxApp>(res.app).mainThreadScheduler;

        this.resetChangeThreshold = resetChangeThreshold;

        if (this.inner === undefined)
            this.inner = new Array<T>();

        this.beforeItemsAddedSubject = new Lazy<Rx.Subject<wx.IListChangeInfo<T>>>(() => new Rx.Subject<wx.IListChangeInfo<T>>());
        this.itemsAddedSubject = new Lazy<Rx.Subject<wx.IListChangeInfo<T>>>(() => new Rx.Subject<wx.IListChangeInfo<T>>());
        this.beforeItemsRemovedSubject = new Lazy<Rx.Subject<wx.IListChangeInfo<T>>>(() => new Rx.Subject<wx.IListChangeInfo<T>>());
        this.itemsRemovedSubject = new Lazy<Rx.Subject<wx.IListChangeInfo<T>>>(() => new Rx.Subject<wx.IListChangeInfo<T>>());
        this.beforeItemReplacedSubject = new Lazy<Rx.Subject<wx.IListChangeInfo<T>>>(() => new Rx.Subject<wx.IListChangeInfo<T>>());
        this.itemReplacedSubject = new Lazy<Rx.Subject<wx.IListChangeInfo<T>>>(() => new Rx.Subject<wx.IListChangeInfo<T>>());
        this.resetSubject = new Rx.Subject<any>();
        this.beforeResetSubject = new Rx.Subject<any>();

        this.itemChangingSubject = new Lazy<Rx.Subject<wx.IPropertyChangedEventArgs>>(() =>
            <any> createScheduledSubject<wx.IPropertyChangedEventArgs>(scheduler));

        this.itemChangedSubject = new Lazy<Rx.Subject<wx.IPropertyChangedEventArgs>>(() =>
            <any> createScheduledSubject<wx.IPropertyChangedEventArgs>(scheduler));

        this.beforeItemsMovedSubject = new Lazy<Rx.Subject<wx.IListChangeInfo<T>>>(() => new Rx.Subject<wx.IListChangeInfo<T>>());
        this.itemsMovedSubject = new Lazy<Rx.Subject<wx.IListChangeInfo<T>>>(() => new Rx.Subject<wx.IListChangeInfo<T>>());

        this.listChanged = Rx.Observable.merge(
            this.itemsAdded.select(x => false),
            this.itemsRemoved.select(x => false),
            this.itemReplaced.select(x => false),
            this.itemsMoved.select(x => false),
            this.resetSubject.select(x => true))
            .publish()
            .refCount();

        this.listChanging = Rx.Observable.merge(
            this.beforeItemsAdded.select(x => false),
            this.beforeItemsRemoved.select(x => false),
            this.beforeItemReplaced.select(x => false),
            this.beforeItemsMoved.select(x => false),
            this.beforeResetSubject.select(x => true))
            .publish()
            .refCount();

        if (initialContents) {
            Array.prototype.splice.apply(this.inner,(<T[]><any>[0, 0]).concat(initialContents));
        }

        this.length = this.lengthChanged.toProperty(this.inner.length);

        this.disposables.add(this.length);

        this.isEmpty = this.lengthChanged
            .select(x => <boolean> (x === 0))
            .toProperty(this.inner.length === 0);

        this.disposables.add(this.isEmpty);
    }

    private areChangeNotificationsEnabled(): boolean {
        return this.changeNotificationsSuppressed === 0;
    }

    protected insertItem(index: number, item: T): void {
        if (!this.areChangeNotificationsEnabled()) {
            this.inner.splice(index, 0, item);

            if (this.changeTrackingEnabled)
                this.addItemToPropertyTracking(item);

            return;
        }

        if (this.beforeItemsAddedSubject.isValueCreated)
            this.beforeItemsAddedSubject.value.onNext({ items: [item], from: index });

        this.inner.splice(index, 0, item);

        if (this.itemsAddedSubject.isValueCreated)
            this.itemsAddedSubject.value.onNext({ items: [item], from: index });

        if (this.changeTrackingEnabled)
            this.addItemToPropertyTracking(item);
    }

    private removeItem(index: number): void {
        let item = this.inner[index];

        if (!this.areChangeNotificationsEnabled()) {
            this.inner.splice(index, 1);

            if (this.changeTrackingEnabled)
                this.removeItemFromPropertyTracking(item);

            return;
        }

        if (this.beforeItemsRemovedSubject.isValueCreated)
            this.beforeItemsRemovedSubject.value.onNext({ items: [item], from: index });

        this.inner.splice(index, 1);

        if (this.itemsRemovedSubject.isValueCreated)
            this.itemsRemovedSubject.value.onNext({ items: [item], from: index });

        if (this.changeTrackingEnabled)
            this.removeItemFromPropertyTracking(item);
    }

    private moveItem(oldIndex: number, newIndex: number): void {
        let item = this.inner[oldIndex];

        if (!this.areChangeNotificationsEnabled()) {
            this.inner.splice(oldIndex, 1);
            this.inner.splice(newIndex, 0, item);

            return;
        }

        let mi = { items: [item], from: oldIndex, to: newIndex};

        if (this.beforeItemsMovedSubject.isValueCreated)
            this.beforeItemsMovedSubject.value.onNext(mi);

        this.inner.splice(oldIndex, 1);
        this.inner.splice(newIndex, 0, item);

        if (this.itemsMovedSubject.isValueCreated)
            this.itemsMovedSubject.value.onNext(mi);
    }

    private clearItems(): void {
        if (!this.areChangeNotificationsEnabled()) {
            this.inner.length = 0;    // see http://stackoverflow.com/a/1232046/88513

            if (this.changeTrackingEnabled)
                this.clearAllPropertyChangeWatchers();

            return;
        }

        this.publishBeforeResetNotification();
        this.inner.length = 0;    // see http://stackoverflow.com/a/1232046/88513
        this.publishResetNotification();

        if (this.changeTrackingEnabled)
            this.clearAllPropertyChangeWatchers();
    }

    private addItemToPropertyTracking(toTrack: T): void {
        let rcd = this.propertyChangeWatchers[getOid(toTrack)];
        let self = this;

        if (rcd) {
            rcd.addRef();
            return;
        }

        let changing = observeObject(toTrack, this.app.defaultExceptionHandler, true)
            .select(i => new PropertyChangedEventArgs(toTrack, i.propertyName));

        let changed = observeObject(toTrack, this.app.defaultExceptionHandler, false)
            .select(i => new PropertyChangedEventArgs(toTrack, i.propertyName));

        let disp = new Rx.CompositeDisposable(
            changing.where(_ => self.areChangeNotificationsEnabled()).subscribe(x=> self.itemChangingSubject.value.onNext(x)),
            changed.where(_ => self.areChangeNotificationsEnabled()).subscribe(x=> self.itemChangedSubject.value.onNext(x)));

        this.propertyChangeWatchers[getOid(toTrack)] = new RefCountDisposeWrapper(
            Rx.Disposable.create(() => {
                disp.dispose();
                delete self.propertyChangeWatchers[getOid(toTrack)];
            }));
    }

    private removeItemFromPropertyTracking(toUntrack: T): void {
        let rcd = this.propertyChangeWatchers[getOid(toUntrack)];

        if (rcd) {
            rcd.release();
        }
    }

    private clearAllPropertyChangeWatchers(): void {
        if (this.propertyChangeWatchers != null) {
            Object.keys(this.propertyChangeWatchers).forEach(x => {
                this.propertyChangeWatchers[x].release();
            });

            this.propertyChangeWatchers = null;
        }
    }

    private refcountSubscribers<TObs>(input: Rx.Observable<TObs>, block:(number)=> void): Rx.Observable<TObs> {
        return Rx.Observable.create<TObs>(subj => {
            block(1);

            return new Rx.CompositeDisposable(
                input.subscribe(subj),
                Rx.Disposable.create(() => block(-1)));
        });
    }

    private publishResetNotification() {
        this.resetSubject.onNext(true);
    }

    private publishBeforeResetNotification() {
        this.beforeResetSubject.onNext(true);
    }

    protected isLengthAboveResetThreshold(toChangeLength: number): boolean {
        return toChangeLength / this.inner.length > this.resetChangeThreshold && toChangeLength > 10;
    }
}

/**
* Creates a new observable list with optional default contents
* @param {Array<T>} initialContents The initial contents of the list
* @param {number = 0.3} resetChangeThreshold
*/
export function list<T>(initialContents?: Array<T>, resetChangeThreshold: number = 0.3, scheduler: Rx.IScheduler = null): wx.IObservableList<T> {
    return new ObservableList<T>(initialContents, resetChangeThreshold, scheduler);
}

class ObservableListProjection<T, TValue> extends ObservableList<TValue> implements wx.IObservableReadOnlyList<TValue> {
    constructor(source: wx.IProjectableObservableReadOnlyList<T>, filter?: (item: T) => boolean,
        orderer?: (a: TValue, b: TValue) => number, selector?: (T) => TValue,
        refreshTrigger?: Rx.Observable<any>, scheduler?: Rx.IScheduler) {
        super();

        this.source = source;
        this.selector = selector || ((x)=> x);
        this._filter = filter;
        this.orderer = orderer;
        this.refreshTrigger = refreshTrigger;
        this.scheduler = scheduler || Rx.Scheduler.immediate;

        this.addAllItemsFromSourceCollection();
        this.wireUpChangeNotifications();
    }

    //////////////////////////////////
    // ObservableList overrides to enforce readonly contract

    public get isReadOnly(): boolean {
        return true;
    }

    public set(index: number, item: TValue): void {
        throwError(this.readonlyExceptionMessage);
    }

    public addRange(items: TValue[]): void {
        throwError(this.readonlyExceptionMessage);
    }

    public insertRange(index: number, items: TValue[]): void {
        throwError(this.readonlyExceptionMessage);
    }

    public removeAll(items: TValue[]): void {
        throwError(this.readonlyExceptionMessage);
    }

    public removeRange(index: number, count: number): void {
        throwError(this.readonlyExceptionMessage);
    }

    public add(item: TValue): void {
        throwError(this.readonlyExceptionMessage);
    }

    public clear(): void {
        throwError(this.readonlyExceptionMessage);
    }

    public remove(item: TValue): boolean {
        throwError(this.readonlyExceptionMessage);
        return undefined;
    }

    public insert(index: number, item: TValue): void {
        throwError(this.readonlyExceptionMessage);
    }

    public removeAt(index: number): void {
        throwError(this.readonlyExceptionMessage);
    }

    public move(oldIndex, newIndex): void {
        throwError(this.readonlyExceptionMessage);
    }

    public sort(comparison: (a: TValue, b: TValue) => number): void {
        throwError(this.readonlyExceptionMessage);
    }

    public reset(): void {
        using(super.suppressChangeNotifications(),() => {
            super.clear();

            this.indexToSourceIndexMap = [];
            this.sourceCopy = [];

            this.addAllItemsFromSourceCollection();
        });
    }

    //////////////////////////////////
    // IDisposable implementation

    public dispose(): void {
        this.disp.dispose();

        super.dispose();
    }

    ////////////////////
    // Implementation

    private source: wx.IProjectableObservableReadOnlyList<T>;
    private selector: (T) => TValue;
    private _filter: (item: T) => boolean;
    private orderer: (a: TValue, b: TValue) => number;
    private refreshTrigger: Rx.Observable<any>;
    private scheduler: Rx.IScheduler;

    private static defaultOrderer = (a, b) => {
        let result: number;

        if (a == null && b == null)
            result = 0;
        else if (a == null)
            result = -1;
        else if (b == null)
            result = 1;
        else
            result = a - b;

        return result;
    };

    // This list maps indices in this collection to their corresponding indices in the source collection.
    private indexToSourceIndexMap: Array<number> = [];
    private sourceCopy: Array<T> = [];
    private disp = new Rx.CompositeDisposable();

    private referenceEquals(a: any, b: any): boolean {
        return getOid(a) === getOid(b);
    }

    private refresh(): void {
        let length = this.sourceCopy.length;
        const sourceCopyIds = this.sourceCopy.map(x=> getOid(x));

        for(let i = 0; i < length; i++) {
            this.onItemChanged(this.sourceCopy[i], sourceCopyIds);
        }
    }

    private wireUpChangeNotifications() {
        this.disp.add(this.source.itemsAdded.observeOn(this.scheduler).subscribe((e) => {
            this.onItemsAdded(e);
        }));

        this.disp.add(this.source.itemsRemoved.observeOn(this.scheduler).subscribe((e) => {
            this.onItemsRemoved(e);
        }));

        this.disp.add(this.source.itemsMoved.observeOn(this.scheduler).subscribe((e) => {
            this.onItemsMoved(e);
        }));

        this.disp.add(this.source.itemReplaced.observeOn(this.scheduler).subscribe((e) => {
            this.onItemsReplaced(e);
        }));

        this.disp.add(this.source.shouldReset.observeOn(this.scheduler).subscribe((e) => {
            this.reset();
        }));

        this.disp.add(this.source.itemChanged.select(x => x.sender)
            .observeOn(this.scheduler)
            .subscribe(x => this.onItemChanged(x)));

        if (this.refreshTrigger != null) {
            this.disp.add(this.refreshTrigger.observeOn(this.scheduler).subscribe(_ => this.refresh()));
        }
    }

    private onItemsAdded(e: wx.IListChangeInfo<T>) {
        this.shiftIndicesAtOrOverThreshold(e.from, e.items.length);

        for(let i = 0; i < e.items.length; i++) {
            let sourceItem = e.items[i];
            this.sourceCopy.splice(e.from + i, 0, sourceItem);

            if (this._filter && !this._filter(sourceItem)) {
                continue;
            }

            let destinationItem = this.selector(sourceItem);
            this.insertAndMap(e.from + i, destinationItem);
        }
    }

    private onItemsRemoved(e: wx.IListChangeInfo<T>) {
        this.sourceCopy.splice(e.from, e.items.length);

        for(let i = 0; i < e.items.length; i++) {
            let destinationIndex = this.getIndexFromSourceIndex(e.from + i);
            if (destinationIndex !== -1) {
                this.removeAtInternal(destinationIndex);
            }
        }

        let removedCount = e.items.length;
        this.shiftIndicesAtOrOverThreshold(e.from + removedCount, -removedCount);
    }

    private onItemsMoved(e: wx.IListChangeInfo<T>) {
        if (e.items.length > 1) {
            throwError("Derived collections doesn't support multi-item moves");
        }

        if (e.from === e.to) {
            return;
        }

        let oldSourceIndex = e.from;
        let newSourceIndex = e.to;

        this.sourceCopy.splice(oldSourceIndex, 1);
        this.sourceCopy.splice(newSourceIndex, 0, e.items[0]);

        let currentDestinationIndex = this.getIndexFromSourceIndex(oldSourceIndex);

        this.moveSourceIndexInMap(oldSourceIndex, newSourceIndex);

        if (currentDestinationIndex === -1) {
            return;
        }

        if (this.orderer == null) {
            // We mirror the order of the source collection so we'll perform the same move operation
            // as the source. As is the case with when we have an orderer we don't test whether or not
            // the item should be included or not here. If it has been included at some point it'll
            // stay included until onItemChanged picks up a change which filters it.
            let newDestinationIndex = ObservableListProjection.newPositionForExistingItem2(
                this.indexToSourceIndexMap, newSourceIndex, currentDestinationIndex);

            if (newDestinationIndex !== currentDestinationIndex) {
                this.indexToSourceIndexMap.splice(currentDestinationIndex, 1);
                this.indexToSourceIndexMap.splice(newDestinationIndex, 0, newSourceIndex);

                super.move(currentDestinationIndex, newDestinationIndex);
            } else {
                this.indexToSourceIndexMap[currentDestinationIndex] = newSourceIndex;
            }
        } else {
            // TODO: Conceptually I feel like we shouldn't concern ourselves with ordering when we
            // receive a Move notification. If it affects ordering it should be picked up by the
            // onItemChange and resorted there instead.
            this.indexToSourceIndexMap[currentDestinationIndex] = newSourceIndex;
        }
    }

    private onItemsReplaced(e: wx.IListChangeInfo<T>) {
        const sourceOids = this.isLengthAboveResetThreshold(e.items.length) ?
            this.sourceCopy.map(x=> getOid(x)) :
            null;

        for(let i = 0; i < e.items.length; i++) {
            let sourceItem = e.items[i];
            this.sourceCopy[e.from + i] = sourceItem;

            if(sourceOids)
                sourceOids[e.from + i] = getOid(sourceItem);

            this.onItemChanged(sourceItem, sourceOids);
        }
    }

    private onItemChanged(changedItem: T, sourceOids?: Array<string>): void {
        let sourceIndices = this.indexOfAll(this.sourceCopy, changedItem, sourceOids);
        let shouldBeIncluded = !this._filter || this._filter(changedItem);
        const sourceIndicesLength = sourceIndices.length;

        for(let i=0;i<sourceIndicesLength;i++) {
            const sourceIndex = sourceIndices[i];

            let currentDestinationIndex = this.getIndexFromSourceIndex(sourceIndex);
            let isIncluded = currentDestinationIndex >= 0;

            if (isIncluded && !shouldBeIncluded) {
                this.removeAtInternal(currentDestinationIndex);
            } else if (!isIncluded && shouldBeIncluded) {
                this.insertAndMap(sourceIndex, this.selector(changedItem));
            } else if (isIncluded && shouldBeIncluded) {
                // The item is already included and it should stay there but it's possible that the change that
                // caused this event affects the ordering. This gets a little tricky so let's be verbose.

                let newItem = this.selector(changedItem);

                if (this.orderer == null) {
                    // We don't have an orderer so we're currently using the source collection index for sorting
                    // meaning that no item change will affect ordering. Look at our current item and see if it's
                    // the exact (reference-wise) same object. If it is then we're done, if it's not (for example
                    // if it's an integer) we'll issue a replace event so that subscribers get the new value.
                    if (!this.referenceEquals(newItem, this.get(currentDestinationIndex))) {
                        super.set(currentDestinationIndex, newItem);
                    }
                } else {
                    // Don't be tempted to just use the orderer to compare the new item with the previous since
                    // they'll almost certainly be equal (for reference types). We need to test whether or not the
                    // new item can stay in the same position that the current item is in without comparing them.
                    if (this.canItemStayAtPosition(newItem, currentDestinationIndex)) {
                        // The new item should be in the same position as the current but there's no need to signal
                        // that in case they are the same object.
                        if (!this.referenceEquals(newItem, this.get(currentDestinationIndex))) {
                            super.set(currentDestinationIndex, newItem);
                        }
                    } else {
                        // The change is forcing us to reorder. We'll use a move operation if the item hasn't
                        // changed (ie it's the same object) and we'll implement it as a remove and add if the
                        // object has changed (ie the selector is not an identity function).
                        if (this.referenceEquals(newItem, this.get(currentDestinationIndex))) {

                            let newDestinationIndex = this.newPositionForExistingItem(
                                sourceIndex, currentDestinationIndex, newItem);

                            // Debug.Assert(newDestinationIndex != currentDestinationIndex, "This can't be, canItemStayAtPosition said it this couldn't happen");

                            this.indexToSourceIndexMap.splice(currentDestinationIndex, 1);
                            this.indexToSourceIndexMap.splice(newDestinationIndex, 0, sourceIndex);

                            super.move(currentDestinationIndex, newDestinationIndex);
                        } else {
                            this.removeAtInternal(currentDestinationIndex);
                            this.insertAndMap(sourceIndex, newItem);
                        }
                    }
                }
            }
        }
    }

    /// <summary>
    /// Gets a value indicating whether or not the item fits (sort-wise) at the provided index. The determination
    /// is made by checking whether or not it's considered larger than or equal to the preceeding item and if
    /// it's less than or equal to the succeeding item.
    /// </summary>
    private canItemStayAtPosition(item: TValue, currentIndex: number): boolean {
        let hasPrecedingItem = currentIndex > 0;

        if (hasPrecedingItem) {
            let isGreaterThanOrEqualToPrecedingItem = this.orderer(item, this.get(currentIndex - 1)) >= 0;
            if (!isGreaterThanOrEqualToPrecedingItem) {
                return false;
            }
        }

        let hasSucceedingItem = currentIndex < this.length() - 1;

        if (hasSucceedingItem) {
            let isLessThanOrEqualToSucceedingItem = this.orderer(item, this.get(currentIndex + 1)) <= 0;
            if (!isLessThanOrEqualToSucceedingItem) {
                return false;
            }
        }

        return true;
    }

    /// <summary>
    /// Gets the index of the dervived item super. on it's originating element index in the source collection.
    /// </summary>
    private getIndexFromSourceIndex(sourceIndex: number): number {
        return this.indexToSourceIndexMap.indexOf(sourceIndex);
    }

    /// <summary>
    /// Returns one or more positions in the source collection where the given item is found in source collection
    /// </summary>
    private indexOfAll(source: Array<T>, item: T, sourceOids?: Array<string>): Array<number> {
        let indices = [];
        let sourceIndex = 0;
        const sourceLength = source.length;

        if(sourceOids) {
            const itemOid = getOid(item);

            for(let i=0;i<sourceLength;i++) {
                const oid = sourceOids[i];

                if (itemOid === oid) {
                    indices.push(sourceIndex);
                }

                sourceIndex++;
            }
        } else {
            for(let i=0;i<sourceLength;i++) {
                const x = source[i];

                if (this.referenceEquals(x, item)) {
                    indices.push(sourceIndex);
                }

                sourceIndex++;
            }
        }

        return indices;
    }

    /// <summary>
    /// Increases (or decreases depending on move direction) all source indices between the source and destination
    /// move indices.
    /// </summary>
    private moveSourceIndexInMap(oldSourceIndex: number, newSourceIndex: number): void {
        if (newSourceIndex > oldSourceIndex) {
            // Item is moving towards the end of the list, everything between its current position and its
            // new position needs to be shifted down one index
            this.shiftSourceIndicesInRange(oldSourceIndex + 1, newSourceIndex + 1, -1);
        } else {
            // Item is moving towards the front of the list, everything between its current position and its
            // new position needs to be shifted up one index
            this.shiftSourceIndicesInRange(newSourceIndex, oldSourceIndex, 1);
        }
    }

    /// <summary>
    /// Increases (or decreases) all source indices equal to or higher than the threshold. Represents an
    /// insert or remove of one or more items in the source list thus causing all subsequent items to shift
    /// up or down.
    /// </summary>
    private shiftIndicesAtOrOverThreshold(threshold: number, value: number): void {
        for(let i = 0; i < this.indexToSourceIndexMap.length; i++) {
            if (this.indexToSourceIndexMap[i] >= threshold) {
                this.indexToSourceIndexMap[i] += value;
            }
        }
    }

    /// <summary>
    /// Increases (or decreases) all source indices within the range (lower inclusive, upper exclusive).
    /// </summary>
    private shiftSourceIndicesInRange(rangeStart: number, rangeStop: number, value: number): void {
        for(let i = 0; i < this.indexToSourceIndexMap.length; i++) {
            let sourceIndex = this.indexToSourceIndexMap[i];
            if (sourceIndex >= rangeStart && sourceIndex < rangeStop) {
                this.indexToSourceIndexMap[i] += value;
            }
        }
    }

    private addAllItemsFromSourceCollection(): void {
        // Debug.Assert(sourceCopy.length == 0, "Expected source copy to be empty");
        let sourceIndex = 0;
        const length = this.source.length();

        for(let i=0;i<length;i++) {
            const sourceItem = this.source.get(i);
            this.sourceCopy.push(sourceItem);

            if (!this._filter || this._filter(sourceItem)) {
                let destinationItem = this.selector(sourceItem);
                this.insertAndMap(sourceIndex, destinationItem);
            }

            sourceIndex++;
        }
    }

    private insertAndMap(sourceIndex: number, value: TValue): void {
        let destinationIndex = this.positionForNewItem(sourceIndex, value);

        this.indexToSourceIndexMap.splice(destinationIndex, 0, sourceIndex);
        super.insert(destinationIndex, value);
    }

    protected removeAtInternal(destinationIndex: number): void {
        this.indexToSourceIndexMap.splice(destinationIndex, 1);
        super.removeAt(destinationIndex);
    }

    private positionForNewItem(sourceIndex: number, value: TValue): number {
        // If we haven't got an orderer we'll simply match our items to that of the source collection.
        return this.orderer == null
            ? ObservableListProjection.positionForNewItemArray(<any> this.indexToSourceIndexMap, <any> sourceIndex,
                ObservableListProjection.defaultOrderer)
            : ObservableListProjection.positionForNewItemArray2(this.inner, 0, this.inner.length, value, this.orderer);
    }

    private static positionForNewItemArray<T>(array: Array<T>, item: T, orderer: (a: T, b: T) => number): number {
        return ObservableListProjection.positionForNewItemArray2(array, 0, array.length, item, orderer);
    }

    private static positionForNewItemArray2<T>(array: Array<T>, index: number, count: number, item: T, orderer: (a: T, b: T) => number): number {
        // Debug.Assert(index >= 0);
        // Debug.Assert(count >= 0);
        // Debug.Assert((list.length - index) >= count);

        if (count === 0) {
            return index;
        }

        if (count === 1) {
            return orderer(array[index], item) >= 0 ? index : index + 1;
        }

        if (orderer(array[index], item) >= 1) return index;

        let low = index, hi = index + count - 1;
        let cmp;

        while (low <= hi) {
            let mid = Math.floor(low + (hi - low) / 2);
            cmp = orderer(array[mid], item);

            if (cmp === 0) {
                return mid;
            }

            if (cmp < 0) {
                low = mid + 1;
            } else {
                hi = mid - 1;
            }
        }

        return low;
    }

    /// <summary>
    /// Calculates a new destination for an updated item that's already in the list.
    /// </summary>
    private newPositionForExistingItem(sourceIndex: number, currentIndex: number, item: TValue): number {
        // If we haven't got an orderer we'll simply match our items to that of the source collection.
        return this.orderer == null
            ? ObservableListProjection.newPositionForExistingItem2(<any> this.indexToSourceIndexMap, <any> sourceIndex, currentIndex)
            : ObservableListProjection.newPositionForExistingItem2(this.inner, item, currentIndex, this.orderer);
    }

    /// <summary>
    /// Calculates a new destination for an updated item that's already in the list.
    /// </summary>
    private static newPositionForExistingItem2<T>(array: Array<T>, item: T, currentIndex: number, orderer?: (a: T, b: T) => number): number {
        // Since the item changed is most likely a value type we must refrain from ever comparing it to itself.
        // We do this by figuring out how the updated item compares to its neighbors. By knowing if it's
        // less than or greater than either one of its neighbors we can limit the search range to a range exlusive
        // of the current index.

        // Debug.Assert(list.length > 0);

        if (array.length === 1) {
            return 0;
        }

        let precedingIndex = currentIndex - 1;
        let succeedingIndex = currentIndex + 1;

        // The item on the preceding or succeeding index relative to currentIndex.
        let comparand = array[precedingIndex >= 0 ? precedingIndex : succeedingIndex];

        if (orderer == null) {
            orderer = ObservableListProjection.defaultOrderer;
        }

        // Compare that to the (potentially) new value.
        let cmp = orderer(item, comparand);

        let min = 0;
        let max = array.length;

        if (cmp === 0) {
            // The new value is equal to the preceding or succeeding item, it may stay at the current position
            return currentIndex;
        } else if (cmp > 0) {
            // The new value is greater than the preceding or succeeding item, limit the search to indices after
            // the succeeding item.
            min = succeedingIndex;
        } else {
            // The new value is less than the preceding or succeeding item, limit the search to indices before
            // the preceding item.
            max = precedingIndex;
        }

        // Bail if the search range is invalid.
        if (min === array.length || max < 0) {
            return currentIndex;
        }

        let ix = ObservableListProjection.positionForNewItemArray2(array, min, max - min, item, orderer);

        // If the item moves 'forward' in the collection we have to account for the index where
        // the item currently resides getting removed first.
        return ix >= currentIndex ? ix - 1 : ix;
    }
}
