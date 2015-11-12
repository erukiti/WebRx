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

"use strict";

/**
* PagedObservableListProjection implements a virtual paging projection over
* an existing observable list. The class solely relies on index translation
* and change notifications from its upstream source. It does not maintain data.
* @class
*/
export class PagedObservableListProjection<T> implements wx.IObservablePagedReadOnlyList<T>, wx.IUnknown {
    constructor(source: wx.IObservableReadOnlyList<T>, pageSize: number, currentPage?: number, scheduler?: Rx.IScheduler) {
        this.source = source;
        this.scheduler = scheduler || (isRxScheduler(currentPage) ? <Rx.IScheduler> <any> currentPage : Rx.Scheduler.immediate);

        // IObservablePagedReadOnlyList
        this.pageSize = property(pageSize);
        this.currentPage = property(currentPage || 0);

        let updateLengthTrigger = Rx.Observable.merge(
                this.updateLengthTrigger,
                source.lengthChanged)
            .startWith(true)
            .observeOn(Rx.Scheduler.immediate);

        this.pageCount = whenAny(this.pageSize, updateLengthTrigger, (ps, _)=> Math.ceil(source.length() / ps))
            .distinctUntilChanged()
            .toProperty();

        this.disp.add(this.pageCount);

        // length
        this.length = whenAny(this.currentPage, this.pageSize, updateLengthTrigger, (cp, ps, _)=> Math.max(Math.min(source.length() - (ps * cp), ps), 0))
            .distinctUntilChanged()
            .toProperty();

        this.disp.add(this.length);

        // isEmptyChanged
        this.isEmptyChanged = whenAny(this.length, (len)=> len == 0)
            .distinctUntilChanged();

        // IObservableReadOnlyList
        this.beforeItemsAddedSubject = new Lazy<Rx.Subject<wx.IListChangeInfo<T>>>(() => new Rx.Subject<wx.IListChangeInfo<T>>());
        this.itemsAddedSubject = new Lazy<Rx.Subject<wx.IListChangeInfo<T>>>(() => new Rx.Subject<wx.IListChangeInfo<T>>());
        this.beforeItemsRemovedSubject = new Lazy<Rx.Subject<wx.IListChangeInfo<T>>>(() => new Rx.Subject<wx.IListChangeInfo<T>>());
        this.itemsRemovedSubject = new Lazy<Rx.Subject<wx.IListChangeInfo<T>>>(() => new Rx.Subject<wx.IListChangeInfo<T>>());
        this.beforeItemReplacedSubject = new Lazy<Rx.Subject<wx.IListChangeInfo<T>>>(() => new Rx.Subject<wx.IListChangeInfo<T>>());
        this.itemReplacedSubject = new Lazy<Rx.Subject<wx.IListChangeInfo<T>>>(() => new Rx.Subject<wx.IListChangeInfo<T>>());
        this.itemChangingSubject = new Lazy<Rx.Subject<wx.IPropertyChangedEventArgs>>(() =>
            <any> createScheduledSubject<wx.IPropertyChangedEventArgs>(scheduler));
        this.itemChangedSubject = new Lazy<Rx.Subject<wx.IPropertyChangedEventArgs>>(() =>
            <any> createScheduledSubject<wx.IPropertyChangedEventArgs>(scheduler));
        this.beforeItemsMovedSubject = new Lazy<Rx.Subject<wx.IListChangeInfo<T>>>(() => new Rx.Subject<wx.IListChangeInfo<T>>());
        this.itemsMovedSubject = new Lazy<Rx.Subject<wx.IListChangeInfo<T>>>(() => new Rx.Subject<wx.IListChangeInfo<T>>());

        // shouldReset (short-circuit)
        this.shouldReset = this.resetSubject.asObservable();

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

        this.wireUpChangeNotifications();
    }

    //////////////////////////////////
    // IUnknown implementation

    public queryInterface(iid: string): boolean {
       return iid === IID.IObservableList || iid === IID.IDisposable;
    }

    //////////////////////////////////
    // IObservablePagedReadOnlyList

    public source: wx.IObservableReadOnlyList<T>;
    public pageSize: wx.IObservableProperty<number>;
    public currentPage: wx.IObservableProperty<number>;
    public pageCount: wx.IObservableProperty<number>;

    //////////////////////////////////
    // IObservableReadOnlyList

    public length: wx.IObservableProperty<number>;

    public get(index: number): T {
        index = this.pageSize() * this.currentPage() + index;

        return this.source.get(index);
    }

    public get isReadOnly(): boolean {
        return true;
    }

    public toArray(): Array<T> {
        let start = this.pageSize() * this.currentPage();
        return this.source.toArray().slice(start, start + this.length());
    }

    //////////////////////////////////
    // INotifyListChanged

    public listChanging: Rx.Observable<boolean>;
    public listChanged: Rx.Observable<boolean>;
    public isEmptyChanged: Rx.Observable<boolean>;
    public shouldReset: Rx.Observable<any>;

    public suppressChangeNotifications(): Rx.IDisposable {
        this.changeNotificationsSuppressed++;

        return Rx.Disposable.create(() => {
            this.changeNotificationsSuppressed--;

            if (this.changeNotificationsSuppressed === 0) {
                this.publishBeforeResetNotification();
                this.publishResetNotification();
            }
        });
    }

    //////////////////////////////////
    // IDisposable implementation

    public dispose(): void {
        this.disp.dispose();
    }

    ////////////////////
    // Implementation

    private disp = new Rx.CompositeDisposable();
    private changeNotificationsSuppressed: number = 0;
    private resetSubject = new Rx.Subject<any>();
    private beforeResetSubject = new Rx.Subject<any>();
    private scheduler: Rx.IScheduler;
    private updateLengthTrigger = new Rx.Subject<any>();

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
            this._lengthChanging = this.length.changing.distinctUntilChanged();

        return this._lengthChanging;
    }

    public get lengthChanged(): Rx.Observable<number> {
        if (!this._lengthChanged)
            this._lengthChanged = this.length.changed.distinctUntilChanged();

        return this._lengthChanged;
    }

    private wireUpChangeNotifications() {
        this.disp.add(this.source.itemsAdded.observeOn(this.scheduler).subscribe((e) => {
            // force immediate recalculation of length, pageCount etc.
            this.updateLengthTrigger.onNext(true);

            this.onItemsAdded(e);
        }));

        this.disp.add(this.source.itemsRemoved.observeOn(this.scheduler).subscribe((e) => {
            // force immediate recalculation of length, pageCount etc.
            this.updateLengthTrigger.onNext(true);

            this.onItemsRemoved(e);
        }));

        this.disp.add(this.source.itemsMoved.observeOn(this.scheduler).subscribe((e) => {
            this.onItemsMoved(e);
        }));

        this.disp.add(this.source.itemReplaced.observeOn(this.scheduler).subscribe((e) => {
            this.onItemsReplaced(e);
        }));

        this.disp.add(this.source.shouldReset.observeOn(this.scheduler).subscribe((e) => {
            // force immediate recalculation of length, pageCount etc.
            this.updateLengthTrigger.onNext(true);

            this.publishBeforeResetNotification();
            this.publishResetNotification();
        }));

        this.disp.add(whenAny(this.pageSize, this.currentPage, (ps, cp)=> true).observeOn(this.scheduler).subscribe((e) => {
            this.publishBeforeResetNotification();
            this.publishResetNotification();
        }));
    }

    private getPageRange(): wx.IRangeInfo {
        const from = this.currentPage() * this.pageSize();
        const result = { from: from, to: from + this.length() };
        return result;
    }

    private publishResetNotification() {
        this.resetSubject.onNext(true);
    }

    private publishBeforeResetNotification() {
        this.beforeResetSubject.onNext(true);
    }

    private onItemsAdded(e: wx.IListChangeInfo<T>) {
        const page = this.getPageRange();

        // items added beneath the window can be ignored
        if(e.from > page.to)
            return;

        // adding items before the window results in a reset
        if(e.from < page.from) {
            this.publishBeforeResetNotification();
            this.publishResetNotification();
        } else {
            // compute relative start index
            const from = e.from - page.from;
            const numItems = Math.min(this.length() - from, e.items.length);

            // limit items
            const items = e.items.length !== numItems ? e.items.slice(0, numItems) : e.items;

            // emit translated notifications
            const er = { from: from, items: items };

            if (this.beforeItemsAddedSubject.isValueCreated)
                this.beforeItemsAddedSubject.value.onNext(er);

            if (this.itemsAddedSubject.isValueCreated)
                this.itemsAddedSubject.value.onNext(er);
        }
    }

    private onItemsRemoved(e: wx.IListChangeInfo<T>) {
        const page = this.getPageRange();

        // items added beneath the window can be ignored
        if(e.from > page.to)
            return;

        // adding items before the window results in a reset
        if(e.from < page.from) {
            this.publishBeforeResetNotification();
            this.publishResetNotification();
        } else {
            // compute relative start index
            const from = e.from - page.from;
            const numItems = Math.min(this.length() - from, e.items.length);

            // limit items
            const items = e.items.length !== numItems ? e.items.slice(0, numItems) : e.items;

            // emit translated notifications
            const er = { from: from, items: items };

            if (this.beforeItemsRemovedSubject.isValueCreated)
                this.beforeItemsRemovedSubject.value.onNext(er);

            if (this.itemsRemovedSubject.isValueCreated)
                this.itemsRemovedSubject.value.onNext(er);
        }
    }

    private onItemsMoved(e: wx.IListChangeInfo<T>) {
        const page = this.getPageRange();
        let from = 0, to = 0;
        let er: wx.IListChangeInfo<T>;

        // a move completely above or below the window should be ignored
        if(e.from >= page.to && e.to >= page.to ||
            e.from < page.from && e.to < page.from) {
            return;
        }

        // from-index inside page?
        if(e.from >= page.from && e.from < page.to) {
            // to-index as well?
            if(e.to >= page.from && e.to < page.to) {
                // item was moved inside the page
                from = e.from - page.from;
                to = e.to - page.from;

                er = { from: from, to: to, items: e.items };

                if (this.beforeItemsMovedSubject.isValueCreated)
                    this.beforeItemsMovedSubject.value.onNext(er);

                if (this.itemsMovedSubject.isValueCreated)
                    this.itemsMovedSubject.value.onNext(er);

                return;
            } else if(e.to >= page.to) {
                // item was moved out of the page somewhere below window
                const lastValidIndex = this.length() - 1;

                // generate removed notification
                from = e.from - page.from;

                if(from !== lastValidIndex) {
                    er = { from: from, items: e.items };

                    if (this.beforeItemsRemovedSubject.isValueCreated)
                        this.beforeItemsRemovedSubject.value.onNext(er);

                    if (this.itemsRemovedSubject.isValueCreated)
                        this.itemsRemovedSubject.value.onNext(er);

                    // generate fake-add notification for last item in page
                    from = this.length() - 1;
                    er = { from: from, items: [this.get(from)] };

                    if (this.beforeItemsAddedSubject.isValueCreated)
                        this.beforeItemsAddedSubject.value.onNext(er);

                    if (this.itemsAddedSubject.isValueCreated)
                        this.itemsAddedSubject.value.onNext(er);
                } else {
                    // generate fake-replace notification for last item in page
                    from = this.length() - 1;
                    er = { from: from, items: [this.get(from)] };

                    if (this.beforeItemReplacedSubject.isValueCreated)
                        this.beforeItemReplacedSubject.value.onNext(er);

                    if (this.itemReplacedSubject.isValueCreated)
                        this.itemReplacedSubject.value.onNext(er);
                }

                return;
            }
        }

        // reset in all other cases
        this.publishBeforeResetNotification();
        this.publishResetNotification();
    }

    private onItemsReplaced(e: wx.IListChangeInfo<T>) {
        const page = this.getPageRange();

        // items replaced outside the window can be ignored
        if(e.from > page.to || e.from < page.from)
            return;

        // compute relative start index
        const from = e.from - page.from;

        // emit translated notifications
        const er = { from: from, items: e.items };

        if (this.beforeItemReplacedSubject.isValueCreated)
            this.beforeItemReplacedSubject.value.onNext(er);

        if (this.itemReplacedSubject.isValueCreated)
            this.itemReplacedSubject.value.onNext(er);
    }
}

