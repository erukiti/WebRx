///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../RTTI/IID.ts" />
/// <reference path="../Core/Lazy.ts" />
/// <reference path="../Core/RefCountDisposeWrapper.ts" />
/// <reference path="../RxJsExtensions.ts" />

module wx {
    /**
    * ReactiveUI's awesome ReactiveList ported to Typescript (including tests)
    * @class
    */
    class ObservableList<T> implements IObservableList<T>, IUnknown, Rx.IDisposable {
        constructor(initialContents?: Array<T>, resetChangeThreshold: number = 0.3, scheduler: Rx.IScheduler = null) {
            this.setupRx(initialContents, resetChangeThreshold, scheduler);
        }

        ////////////////////
        /// IUnknown

        public queryInterface(iid: string) {
            if (iid === IID.IUnknown ||
                iid === IID.IDisposable ||
                iid === IID.IObservableList ||
                iid === IID.IReadOnlyList ||
                iid === IID.IList)
                return true;

            return false;
        }

        //////////////////////////////////
        // IDisposable implementation

        public dispose(): void {
            this.clearAllPropertyChangeWatchers();
        }

        ////////////////////
        /// IObservableList<T>

        public get isReadOnly(): boolean {
            return false;
        }

        public get itemsAdded(): Rx.Observable<IListChangeInfo<T>> {
            if (!this._itemsAdded)
                this._itemsAdded = this.itemsAddedSubject.value.asObservable();

            return this._itemsAdded;
        }

        public get beforeItemsAdded(): Rx.Observable<IListChangeInfo<T>> {
            if (!this._beforeItemsAdded)
                this._beforeItemsAdded = this.beforeItemsAddedSubject.value.asObservable();

            return this._beforeItemsAdded;
        }

        public get itemsRemoved(): Rx.Observable<IListChangeInfo<T>> {
            if (!this._itemsRemoved)
                this._itemsRemoved = this.itemsRemovedSubject.value.asObservable();

            return this._itemsRemoved;
        }

        public get beforeItemsRemoved(): Rx.Observable<IListChangeInfo<T>> {
            if (!this._beforeItemsRemoved)
                this._beforeItemsRemoved = this.beforeItemsRemovedSubject.value.asObservable();

            return this._beforeItemsRemoved;
        }

        public get itemReplaced(): Rx.Observable<IListChangeInfo<T>> {
            if (!this._itemReplaced)
                this._itemReplaced = this.itemReplacedSubject.value.asObservable();

            return this._itemReplaced;
        }

        public get beforeItemReplaced(): Rx.Observable<IListChangeInfo<T>> {
            if (!this._beforeItemReplaced)
                this._beforeItemReplaced = this.beforeItemReplacedSubject.value.asObservable();

            return this._beforeItemReplaced;
        }

        public get beforeItemsMoved(): Rx.Observable<IListChangeInfo<T>> {
            if (!this._beforeItemsMoved)
                this._beforeItemsMoved = this.beforeItemsMovedSubject.value.asObservable();

            return this._beforeItemsMoved;
        }

        public get itemsMoved(): Rx.Observable<IListChangeInfo<T>> {
            if (!this._itemsMoved)
                this._itemsMoved = this.itemsMovedSubject.value.asObservable();

            return this._itemsMoved;
        }

        public get lengthChanging(): Rx.Observable<number> {
            if (!this._lengthChanging)
                this._lengthChanging = this.listChanging.select(_ => this.inner.length).distinctUntilChanged();

            return this._lengthChanging;
        }

        public get lengthChanged(): Rx.Observable<number> {
            if (!this._lengthChanged)
                this._lengthChanged = this.listChanged.select(_ => this.inner.length).distinctUntilChanged();

            return this._lengthChanged;
        }

        public isEmptyChanged: Rx.Observable<boolean>;

        public get itemChanging(): Rx.Observable<IPropertyChangedEventArgs> {
            if (!this._itemChanging)
                this._itemChanging = this.itemChangingSubject.value.asObservable();

            return this._itemChanging;
        }

        public get itemChanged(): Rx.Observable<IPropertyChangedEventArgs> {
            if (!this._itemChanged)
                this._itemChanged = this.itemChangedSubject.value.asObservable();

            return this._itemChanged;
        }

        public get shouldReset(): Rx.Observable<any> {
            return this.refcountSubscribers(this.listChanged.selectMany(x =>
                !x ? Rx.Observable.empty<any>() :
                    Rx.Observable.return(null)), x => this.resetSubCount += x);
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

        public get length(): number {
            return this.inner.length;
        }

        public addRange(items: T[]): void {
            if (items == null) {
                internal.throwError("items");
            }

            var disp = this.isLengthAboveResetThreshold(items.length) ? this.suppressChangeNotifications() : Rx.Disposable.empty;

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
                else if (true) /* if (wx.App.SupportsRangeNotifications) */ {
                    if (this.beforeItemsAddedSubject.isValueCreated) {
                        this.beforeItemsAddedSubject.value.onNext({ items: items, from: this.inner.length });
                    }

                    Array.prototype.push.apply(this.inner, items);

                    if (this.itemsAddedSubject.isValueCreated) {
                        this.itemsAddedSubject.value.onNext({ items: items, from: this.inner.length });
                    }

                    if (this.changeTrackingEnabled) {
                        items.forEach(x => {
                            this.addItemToPropertyTracking(x);
                        });
                    }
                } else {
                    items.forEach(x => {
                        this.add(x);
                    });
                }

            });
        }
        
        public insertRange(index: number, items: T[]): void {
            if (items == null) {
                internal.throwError("collection");
            }

            if (index > this.inner.length) {
                internal.throwError("index");
            }

            var disp = this.isLengthAboveResetThreshold(items.length) ? this.suppressChangeNotifications() : Rx.Disposable.empty;

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
                else if (true) /* if (wx.App.SupportsRangeNotifications) */ {
                    if (this.beforeItemsAddedSubject.isValueCreated) {
                        items.forEach(x => {
                            this.beforeItemsAddedSubject.value.onNext({ items: items, from: index });
                        });
                    }

                    Array.prototype.splice.apply(this.inner, (<T[]><any>[index, 0]).concat(items));

                    if (this.itemsAddedSubject.isValueCreated) {
                        items.forEach(x => {
                            this.itemsAddedSubject.value.onNext({ items: items, from: index });
                        });
                    }

                    if (this.changeTrackingEnabled) {
                        items.forEach(x => {
                            this.addItemToPropertyTracking(x);
                        });
                    }
                } else {
                    items.forEach(x => {
                        this.add(x);
                    });
                }

            });
        }
        
        public removeAll(items: T[]): void {
            if (items == null) {
                internal.throwError("items");
            }

            var disp = this.isLengthAboveResetThreshold(items.length) ?
                this.suppressChangeNotifications() : Rx.Disposable.empty;

            using(disp, () => {
                // NB: If we don't do this, we'll break Collection<T>'s
                // accounting of the length
                items.forEach(x => this.remove(x));
            });
        }

        public removeRange(index: number, count: number): void {
            var disp = this.isLengthAboveResetThreshold(count) ? this.suppressChangeNotifications() : Rx.Disposable.empty;

            using(disp, () => {
                // construct items
                var items: T[] = this.inner.slice(index, index + count);

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
                else if (true) /* if (wx.App.SupportsRangeNotifications) */ {
                    if (this.beforeItemsRemovedSubject.isValueCreated) {
                        items.forEach(x => {
                            this.beforeItemsRemovedSubject.value.onNext({ items: items, from: index });
                        });
                    }

                    this.inner.splice(index, count);

                    if (this.changeTrackingEnabled) {
                        items.forEach(x => {
                            this.removeItemFromPropertyTracking(x);
                        });
                    }

                    if (this.itemsRemovedSubject.isValueCreated) {
                        items.forEach(x => {
                            this.itemsRemovedSubject.value.onNext({ items: items, from: index });
                        });
                    }
                } else {
                    items.forEach(x => {
                        this.remove(x);
                    });
                }

            });
        }

        public toArray(): Array<T> {
            return this.inner;
        }

        public reset(): void {
            this.publishResetNotification();
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
            var index = this.inner.indexOf(item);
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

        public suppressChangeNotifications(): Rx.IDisposable {
            this.changeNotificationsSuppressed++;

            if (!this.hasWhinedAboutNoResetSub && this.resetSubCount === 0 && !isInUnitTest()) {
                log.info("suppressChangeNotifications was called (perhaps via addRange), yet you do not have a subscription to shouldReset. This probably isn't what you want, as itemsAdded and friends will appear to 'miss' items");
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

        public isEmpty: IObservableProperty<boolean>;

        public listChanging: Rx.Observable<boolean>;
        public listChanged: Rx.Observable<boolean>;

        //////////////////////////
        // Expose some array convenience members

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

        private inner: Array<T>;
        private beforeItemsAddedSubject: Lazy<Rx.Subject<IListChangeInfo<T>>>;
        private itemsAddedSubject: Lazy<Rx.Subject<IListChangeInfo<T>>>;
        private beforeItemsRemovedSubject: Lazy<Rx.Subject<IListChangeInfo<T>>>;
        private itemsRemovedSubject: Lazy<Rx.Subject<IListChangeInfo<T>>>;
        private beforeItemReplacedSubject: Lazy<Rx.Subject<IListChangeInfo<T>>>;
        private itemReplacedSubject: Lazy<Rx.Subject<IListChangeInfo<T>>>;
        private itemChangingSubject: Lazy<Rx.Subject<IPropertyChangedEventArgs>>;
        private itemChangedSubject: Lazy<Rx.Subject<IPropertyChangedEventArgs>>;
        private beforeItemsMovedSubject: Lazy<Rx.Subject<IListChangeInfo<T>>>;
        private itemsMovedSubject: Lazy<Rx.Subject<IListChangeInfo<T>>>;
        private resetSubject: Rx.Subject<any>;
        private beforeResetSubject: Rx.Subject<any>;
        private changeNotificationsSuppressed: number = 0;
        private propertyChangeWatchers: { [uniqueObjectId: string]: RefCountDisposeWrapper } = null;
        private resetChangeThreshold = 0;
        private resetSubCount = 0;
        private hasWhinedAboutNoResetSub = false;

        // backing-fields for subjects exposed as observables
        private _itemsAdded: Rx.Observable<IListChangeInfo<T>>;
        private _beforeItemsAdded: Rx.Observable<IListChangeInfo<T>>;
        private _itemsRemoved: Rx.Observable<IListChangeInfo<T>>;
        private _beforeItemsRemoved: Rx.Observable<IListChangeInfo<T>>;
        private _beforeItemsMoved: Rx.Observable<IListChangeInfo<T>>;
        private _itemReplaced: Rx.Observable<IListChangeInfo<T>>;
        private _beforeItemReplaced: Rx.Observable<IListChangeInfo<T>>;
        private _itemsMoved: Rx.Observable<IListChangeInfo<T>>;
        private _lengthChanging: Rx.Observable<number>;
        private _lengthChanged: Rx.Observable<number>;
        private _itemChanging: Rx.Observable<IPropertyChangedEventArgs>;
        private _itemChanged: Rx.Observable<IPropertyChangedEventArgs>;

        private setupRx(initialContents: Array<T>, resetChangeThreshold: number = 0.3, scheduler: Rx.IScheduler = null) {
            scheduler = scheduler || wx.app.mainThreadScheduler;

            this.resetChangeThreshold = resetChangeThreshold;

            if (this.inner === undefined)
                this.inner = new Array<T>();

            this.beforeItemsAddedSubject = new Lazy<Rx.Subject<IListChangeInfo<T>>>(() => new Rx.Subject<IListChangeInfo<T>>());
            this.itemsAddedSubject = new Lazy<Rx.Subject<IListChangeInfo<T>>>(() => new Rx.Subject<IListChangeInfo<T>>());
            this.beforeItemsRemovedSubject = new Lazy<Rx.Subject<IListChangeInfo<T>>>(() => new Rx.Subject<IListChangeInfo<T>>());
            this.itemsRemovedSubject = new Lazy<Rx.Subject<IListChangeInfo<T>>>(() => new Rx.Subject<IListChangeInfo<T>>());
            this.beforeItemReplacedSubject = new Lazy<Rx.Subject<IListChangeInfo<T>>>(() => new Rx.Subject<IListChangeInfo<T>>());
            this.itemReplacedSubject = new Lazy<Rx.Subject<IListChangeInfo<T>>>(() => new Rx.Subject<IListChangeInfo<T>>());
            this.resetSubject = new Rx.Subject<any>();
            this.beforeResetSubject = new Rx.Subject<any>();

            this.itemChangingSubject = new Lazy<Rx.ISubject<IPropertyChangedEventArgs>>(() =>
                <any> internal.createScheduledSubject<IPropertyChangedEventArgs>(scheduler));

            this.itemChangedSubject = new Lazy<Rx.ISubject<IPropertyChangedEventArgs>>(() =>
                <any> internal.createScheduledSubject<IPropertyChangedEventArgs>(scheduler));

            this.beforeItemsMovedSubject = new Lazy<Rx.Subject<IListChangeInfo<T>>>(() => new Rx.Subject<IListChangeInfo<T>>());
            this.itemsMovedSubject = new Lazy<Rx.Subject<IListChangeInfo<T>>>(() => new Rx.Subject<IListChangeInfo<T>>());

            this.listChanged = Rx.Observable.merge(
                this.itemsAdded.select(x => false),
                this.itemsRemoved.select(x => false),
                this.itemReplaced.select(x => false),
                this.itemsMoved.select(x => false),
                this.resetSubject.select(x => true));

            this.listChanging = Rx.Observable.merge(
                this.beforeItemsAdded.select(x => false),
                this.beforeItemsRemoved.select(x => false),
                this.beforeItemReplaced.select(x => false),
                this.beforeItemsMoved.select(x => false),
                this.beforeResetSubject.select(x => true));

            this.isEmpty = this.lengthChanged
                .select(x => this.inner.length > 0)
                .startWith(this.inner.length > 0)
                .toProperty();

            if (initialContents) {
                Array.prototype.splice.apply(this.inner, (<T[]><any>[0, 0]).concat(initialContents));
            }
        }

        private areChangeNotificationsEnabled(): boolean {
            return this.changeNotificationsSuppressed === 0;
        }

        private insertItem(index: number, item: T): void {
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
            var item = this.inner[index];

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
            var item = this.inner[oldIndex];

            if (!this.areChangeNotificationsEnabled()) {
                this.inner.splice(oldIndex, 1);
                this.inner.splice(newIndex, 0, item);

                return;
            }

            var mi = { items: [item], from: oldIndex, to: newIndex};

            if (this.beforeItemsMovedSubject.isValueCreated)
                this.beforeItemsMovedSubject.value.onNext(mi);

            this.inner.splice(oldIndex, 1);
            this.inner.splice(newIndex, 0, item);

            if (this.itemsMovedSubject.isValueCreated)
                this.itemsMovedSubject.value.onNext(mi);
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
                this.beforeItemReplacedSubject.value.onNext({ from: index, items: [item]});

            if (this.changeTrackingEnabled) {
                this.removeItemFromPropertyTracking(this.inner[index]);
                this.addItemToPropertyTracking(item);
            }

            this.inner[index] = item;

            if (this.itemReplacedSubject.isValueCreated)
                this.itemReplacedSubject.value.onNext({ from: index, items: [item] });
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
            var rcd = this.propertyChangeWatchers[getOid(toTrack)];
            var self = this;

            if (rcd) {
                rcd.addRef();
                return;
            }

            var changing = observeObject(toTrack, true)
                .select(i => new internal.PropertyChangedEventArgs(toTrack, i.propertyName));

            var changed = observeObject(toTrack, false)
                .select(i => new internal.PropertyChangedEventArgs(toTrack, i.propertyName));

            var disp = new Rx.CompositeDisposable(
                changing.where(_ => self.areChangeNotificationsEnabled()).subscribe(x=> self.itemChangingSubject.value.onNext(x)),
                changed.where(_ => self.areChangeNotificationsEnabled()).subscribe(x=> self.itemChangedSubject.value.onNext(x)));

            this.propertyChangeWatchers[getOid(toTrack)] = new RefCountDisposeWrapper(
                Rx.Disposable.create(() => {
                    disp.dispose();
                    delete self.propertyChangeWatchers[getOid(toTrack)];
                }));
        }

        private removeItemFromPropertyTracking(toUntrack: T): void {
            var rcd = this.propertyChangeWatchers[getOid(toUntrack)];

            if (rcd) {
                rcd.release();
            }
        }

        private clearAllPropertyChangeWatchers(): void {
            Object.keys(this.propertyChangeWatchers).forEach(x => {
                this.propertyChangeWatchers[x].release();
            });
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

        private isLengthAboveResetThreshold(toChangeLength: number): boolean {
            return toChangeLength / this.inner.length > this.resetChangeThreshold && toChangeLength > 10;
        }
    }

    export module internal {
        export var listConstructor = <any> ObservableList;
    }

    /**
    * Creates a new observable list with optional default contents
    * @param {Array<T>} initialContents The initial contents of the list
    * @param {number = 0.3} resetChangeThreshold
    */
    export function list<T>(initialContents?: Array<T>, resetChangeThreshold: number = 0.3, scheduler: Rx.IScheduler = null): IObservableList<T> {
        return new ObservableList<T>(initialContents, resetChangeThreshold, scheduler);
    }
}