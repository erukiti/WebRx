///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../RTTI/IID.ts" />
/// <reference path="../Core/Lazy.ts" />
/// <reference path="../Core/RefCountDisposeWrapper.ts" />
/// <reference path="../RxJsExtensions.ts" />
/// <reference path="../core/Log.ts" />

module wx {
    "use strict";

    /**
    * ReactiveUI's awesome ReactiveList ported to Typescript
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

        public length: IObservableProperty<number>;

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
                else {
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
                else {
                    if (this.beforeItemsAddedSubject.isValueCreated) {
                        items.forEach(x => {
                            this.beforeItemsAddedSubject.value.onNext({ items: items, from: index });
                        });
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
                else {
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

        public project<TNew, TDontCare>(filter?: (item: T) => boolean, orderer?: (a: TNew, b: TNew) => number,
            selector?: (T) => TNew, signalReset?: Rx.Observable<TDontCare>, scheduler?: Rx.IScheduler): IObservableReadOnlyList<TNew>;

        public project<TDontCare>(filter?: (item: T) => boolean, orderer?: (a: T, b: T) => number,
            signalReset?: Rx.Observable<TDontCare>, scheduler?: Rx.IScheduler): IObservableReadOnlyList<T>;

        public project<TDontCare>(filter?: (item: T) => boolean, signalReset?: Rx.Observable<TDontCare>,
            scheduler?: Rx.IScheduler): IObservableReadOnlyList<T>;

        public project<TDontCare>(signalReset?: Rx.Observable<TDontCare>, scheduler?: Rx.IScheduler): IObservableReadOnlyList<T>;

        public project<TNew, TDontCare>(): any {
            var args = args2Array(arguments);
            var filter = args.shift();

            if (filter != null && isRxObservable(filter)) {
                return new ObservableListProjection<any, any>(<any> this, undefined, undefined, undefined, filter, args.shift());
            }

            var orderer = args.shift();

            if (orderer != null && isRxObservable(orderer)) {
                return new ObservableListProjection<any, any>(<any> this, filter, undefined, undefined, orderer, args.shift());
            }

            var selector = args.shift();

            if (selector != null && isRxObservable(selector)) {
                return new ObservableListProjection<any, any>(<any> this, filter, orderer, undefined, selector, args.shift());
            }

            return new ObservableListProjection<any, any>(<any> this, filter, orderer, selector, args.shift(), args.shift());
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

        public isEmpty: IObservableProperty<boolean>;

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

            if (initialContents) {
                Array.prototype.splice.apply(this.inner,(<T[]><any>[0, 0]).concat(initialContents));
            }

            this.length = this.lengthChanged.toProperty(this.inner.length);

            this.isEmpty = this.lengthChanged
                .select(x => <boolean> (x === 0))
                .toProperty(this.inner.length === 0);
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

        private isLengthAboveResetThreshold(toChangeLength: number): boolean {
            return toChangeLength / this.inner.length > this.resetChangeThreshold && toChangeLength > 10;
        }
    }

    class ObservableListProjection<T, TValue> extends ObservableList<TValue> implements IObservableReadOnlyList<TValue> {
        constructor(source: IObservableList<T>, filter?: (item: T) => boolean,
            orderer?: (a: TValue, b: TValue) => number, selector?: (T) => TValue,
            signalReset?: Rx.Observable<any>, scheduler?: Rx.IScheduler) {
            super();

            this.source = source;
            this.selector = selector || ((x)=> x);
            this._filter = filter;
            this.orderer = orderer;
            this.signalReset = signalReset;
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
            internal.throwError(this.readonlyExceptionMessage);
        }

        public addRange(items: TValue[]): void {
            internal.throwError(this.readonlyExceptionMessage);
        }

        public insertRange(index: number, items: TValue[]): void {
            internal.throwError(this.readonlyExceptionMessage);
        }

        public removeAll(items: TValue[]): void {
            internal.throwError(this.readonlyExceptionMessage);
        }

        public removeRange(index: number, count: number): void {
            internal.throwError(this.readonlyExceptionMessage);
        }

        public add(item: TValue): void {
            internal.throwError(this.readonlyExceptionMessage);
        }

        public clear(): void {
            internal.throwError(this.readonlyExceptionMessage);
        }

        public remove(item: TValue): boolean {
            internal.throwError(this.readonlyExceptionMessage);
            return undefined;
        }

        public insert(index: number, item: TValue): void {
            internal.throwError(this.readonlyExceptionMessage);
        }

        public removeAt(index: number): void {
            internal.throwError(this.readonlyExceptionMessage);
        }

        public move(oldIndex, newIndex): void {
            internal.throwError(this.readonlyExceptionMessage);
        }

        public sort(comparison: (a: TValue, b: TValue) => number): void {
            internal.throwError(this.readonlyExceptionMessage);
        }

        public reset(): void {
            using(super.suppressChangeNotifications(),() => {
                super.clear();
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

        private readonlyExceptionMessage = "Derived collections cannot be modified.";
        private source: IObservableList<T>;
        private selector: (T) => TValue;
        private _filter: (item: T) => boolean;
        private orderer: (a: TValue, b: TValue) => number;
        private signalReset: Rx.Observable<any>;
        private scheduler: Rx.IScheduler;

        private static defaultOrderer = (a, b) => {
            var result: number;

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

            this.disp.add(this.source.itemChanged.select(x => x.sender).observeOn(this.scheduler).subscribe(x => this.onItemChanged(x)));

            if (this.signalReset != null) {
                this.disp.add(this.signalReset.observeOn(this.scheduler).subscribe(_ => this.reset()));
            }
        }

        private onItemsAdded(e: IListChangeInfo<T>) {
            this.shiftIndicesAtOrOverThreshold(e.from, e.items.length);

            for (var i = 0; i < e.items.length; i++) {
                var sourceItem = e.items[i];
                this.sourceCopy.splice(e.from + i, 0, sourceItem);

                if (this._filter && !this._filter(sourceItem)) {
                    continue;
                }

                var destinationItem = this.selector(sourceItem);
                this.internalInsertAndMap(e.from + i, destinationItem);
            }
        }

        private onItemsRemoved(e: IListChangeInfo<T>) {
            this.sourceCopy.splice(e.from, e.items.length);

            for (var i = 0; i < e.items.length; i++) {
                var destinationIndex = this.getIndexFromSourceIndex(e.from + i);
                if (destinationIndex !== -1) {
                    this.internalRemoveAt(destinationIndex);
                }
            }

            var removedCount = e.items.length;
            this.shiftIndicesAtOrOverThreshold(e.from + removedCount, -removedCount);
        }

        private onItemsMoved(e: IListChangeInfo<T>) {
            if (e.items.length > 1) {
                internal.throwError("Derived collections doesn't support multi-item moves");
            }

            if (e.from === e.to) {
                return;
            }

            var oldSourceIndex = e.from;
            var newSourceIndex = e.to;

            this.sourceCopy.splice(oldSourceIndex, 1);
            this.sourceCopy.splice(newSourceIndex, 0, e.items[0]);

            var currentDestinationIndex = this.getIndexFromSourceIndex(oldSourceIndex);

            this.moveSourceIndexInMap(oldSourceIndex, newSourceIndex);

            if (currentDestinationIndex === -1) {
                return;
            }

            if (this.orderer == null) {
                // We mirror the order of the source collection so we'll perform the same move operation
                // as the source. As is the case with when we have an orderer we don't test whether or not
                // the item should be included or not here. If it has been included at some point it'll
                // stay included until onItemChanged picks up a change which filters it.
                var newDestinationIndex = ObservableListProjection.newPositionForExistingItem2(
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

        private onItemsReplaced(e: IListChangeInfo<T>) {
            for (var i = 0; i < e.items.length; i++) {
                var sourceItem = e.items[i];
                this.sourceCopy[e.from + i] = sourceItem;

                this.onItemChanged(sourceItem);
            }
        }

        private onItemChanged(changedItem: T): void {
            var sourceIndices = this.indexOfAll(this.sourceCopy, changedItem);
            var shouldBeIncluded = !this._filter || this._filter(changedItem);

            sourceIndices.forEach((sourceIndex: number) => {
                var currentDestinationIndex = this.getIndexFromSourceIndex(sourceIndex);
                var isIncluded = currentDestinationIndex >= 0;

                if (isIncluded && !shouldBeIncluded) {
                    this.internalRemoveAt(currentDestinationIndex);
                } else if (!isIncluded && shouldBeIncluded) {
                    this.internalInsertAndMap(sourceIndex, this.selector(changedItem));
                } else if (isIncluded && shouldBeIncluded) {
                    // The item is already included and it should stay there but it's possible that the change that
                    // caused this event affects the ordering. This gets a little tricky so let's be verbose.

                    var newItem = this.selector(changedItem);

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

                                var newDestinationIndex = this.newPositionForExistingItem(
                                    sourceIndex, currentDestinationIndex, newItem);

                                // Debug.Assert(newDestinationIndex != currentDestinationIndex, "This can't be, canItemStayAtPosition said it this couldn't happen");

                                this.indexToSourceIndexMap.splice(currentDestinationIndex, 1);
                                this.indexToSourceIndexMap.splice(newDestinationIndex, 0, sourceIndex);

                                super.move(currentDestinationIndex, newDestinationIndex);

                            } else {
                                this.internalRemoveAt(currentDestinationIndex);
                                this.internalInsertAndMap(sourceIndex, newItem);
                            }
                        }
                    }
                }
            });
        }

        /// <summary>
        /// Gets a value indicating whether or not the item fits (sort-wise) at the provided index. The determination
        /// is made by checking whether or not it's considered larger than or equal to the preceeding item and if
        /// it's less than or equal to the succeeding item.
        /// </summary>
        private canItemStayAtPosition(item: TValue, currentIndex: number): boolean {
            var hasPrecedingItem = currentIndex > 0;

            if (hasPrecedingItem) {
                var isGreaterThanOrEqualToPrecedingItem = this.orderer(item, this[currentIndex - 1]) >= 0;
                if (!isGreaterThanOrEqualToPrecedingItem) {
                    return false;
                }
            }

            var hasSucceedingItem = currentIndex < this.length() - 1;

            if (hasSucceedingItem) {
                var isLessThanOrEqualToSucceedingItem = this.orderer(item, this[currentIndex + 1]) <= 0;
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
        /// Returns one or more positions in the source collection where the given item is found super. on the
        /// provided equality comparer.
        /// </summary>
        private indexOfAll(source, item: T): Array<number> {
            var indices = [];
            var sourceIndex = 0;

            source.forEach((x) => {
                if (this.referenceEquals(x, item)) {
                    indices.push(sourceIndex);
                }

                sourceIndex++;
            });

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
            for (var i = 0; i < this.indexToSourceIndexMap.length; i++) {
                if (this.indexToSourceIndexMap[i] >= threshold) {
                    this.indexToSourceIndexMap[i] += value;
                }
            }
        }

        /// <summary>
        /// Increases (or decreases) all source indices within the range (lower inclusive, upper exclusive). 
        /// </summary>
        private shiftSourceIndicesInRange(rangeStart: number, rangeStop: number, value: number): void {
            for (var i = 0; i < this.indexToSourceIndexMap.length; i++) {
                var sourceIndex = this.indexToSourceIndexMap[i];
                if (sourceIndex >= rangeStart && sourceIndex < rangeStop) {
                    this.indexToSourceIndexMap[i] += value;
                }
            }
        }

        private addAllItemsFromSourceCollection(): void {
            // Debug.Assert(sourceCopy.length == 0, "Expected source copy to be empty");
            var sourceIndex = 0;

            this.source.forEach(sourceItem => {
                this.sourceCopy.push(sourceItem);

                if (!this._filter || this._filter(sourceItem)) {
                    var destinationItem = this.selector(sourceItem);
                    this.internalInsertAndMap(sourceIndex, destinationItem);
                }

                sourceIndex++;
            });
        }

        protected internalClear(): void {
            this.indexToSourceIndexMap = [];
            this.sourceCopy = [];

            super.clear();
        }

        private internalInsertAndMap(sourceIndex: number, value: TValue): void {
            var destinationIndex = this.positionForNewItem(sourceIndex, value);

            this.indexToSourceIndexMap.splice(destinationIndex, 0, sourceIndex);
            super.insert(destinationIndex, value);
        }

        protected internalRemoveAt(destinationIndex: number): void {
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

            var low = index, hi = index + count - 1;
            var cmp;

            while (low <= hi) {
                var mid = Math.floor(low + (hi - low) / 2);
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

            var precedingIndex = currentIndex - 1;
            var succeedingIndex = currentIndex + 1;

            // The item on the preceding or succeeding index relative to currentIndex.
            var comparand = array[precedingIndex >= 0 ? precedingIndex : succeedingIndex];

            if (orderer == null) {
                orderer = ObservableListProjection.defaultOrderer;
            }

            // Compare that to the (potentially) new value.
            var cmp = orderer(item, comparand);

            var min = 0;
            var max = array.length;

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

            var ix = ObservableListProjection.positionForNewItemArray2(array, min, max - min, item, orderer);

            // If the item moves 'forward' in the collection we have to account for the index where
            // the item currently resides getting removed first.
            return ix >= currentIndex ? ix - 1 : ix;
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

