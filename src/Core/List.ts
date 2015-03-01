///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="Utils.ts" />

module wx {
    /**
    * ReactiveUI's awesome ReactiveList ported to Typescript (including tests)
    * @class
    */
    class ObservableList<T> implements IObservableList<T>, IUnknown, Rx.IDisposable {
        constructor(initialContents?: Array<T>, resetChangeThreshold: number = 0.3 /*, scheduler: Rx.IScheduler = null */) {
            this.setupRx(initialContents, resetChangeThreshold /*, scheduler */);
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

        public get itemsAdded(): Rx.Observable<T> {
            if (!this._itemsAdded)
                this._itemsAdded = this.itemsAddedSubject.value.asObservable();

            return this._itemsAdded;
        }

        public get beforeItemsAdded(): Rx.Observable<T> {
            if (!this._beforeItemsAdded)
                this._beforeItemsAdded = this.beforeItemsAddedSubject.value.asObservable();

            return this._beforeItemsAdded;
        }

        public get itemsRemoved(): Rx.Observable<T> {
            if (!this._itemsRemoved)
                this._itemsRemoved = this.itemsRemovedSubject.value.asObservable();

            return this._itemsRemoved;
        }

        public get beforeItemsRemoved(): Rx.Observable<T> {
            if (!this._beforeItemsRemoved)
                this._beforeItemsRemoved = this.beforeItemsRemovedSubject.value.asObservable();

            return this._beforeItemsRemoved;
        }

        public get beforeItemsMoved(): Rx.Observable<IMoveInfo<T>> {
            if (!this._beforeItemsMoved)
                this._beforeItemsMoved = this.beforeItemsMovedSubject.value.asObservable();

            return this._beforeItemsMoved;
        }

        public get itemsMoved(): Rx.Observable<IMoveInfo<T>> {
            if (!this._itemsMoved)
                this._itemsMoved = this.itemsMovedSubject.value.asObservable();

            return this._itemsMoved;
        }

        public get collectionChanging(): Rx.Observable<INotifyCollectionChangedEventArgs> {
            if (!this._collectionChanging)
                this._collectionChanging = this.changingSubject.asObservable();

            return this._collectionChanging;
        }

        public get collectionChanged(): Rx.Observable<INotifyCollectionChangedEventArgs> {
            if (!this._collectionChanged)
                this._collectionChanged = this.changedSubject.asObservable();

            return this._collectionChanged;
        }

        public get countChanging(): Rx.Observable<number> {
            if (!this._countChanging)
                this._countChanging = this.collectionChanging.select(_ => this.inner.length).distinctUntilChanged();

            return this._countChanging;
        }

        public get countChanged(): Rx.Observable<number> {
            if (!this._countChanged)
                this._countChanged = this.collectionChanged.select(_ => this.inner.length).distinctUntilChanged();

            return this._countChanged;
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
            return this.refcountSubscribers(this.collectionChanged.selectMany(x =>
                x.action !== NotifyCollectionChangedAction.Reset ?
                    Rx.Observable.empty<any>() :
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

        public get count(): number {
            return this.inner.length;
        }

        public addRange(items: T[]): void {
            if (items == null) {
                internal.throwError("collection");
            }

            var disp = this.isLengthAboveResetThreshold(items.length) ? this.suppressChangeNotifications() : Rx.Disposable.empty;

            using(disp, () => {
                // reset notification
                if (!this.areChangeNotificationsEnabled()) {

                    // this._inner.splice(this._inner.length, 0, items)
                    Array.prototype.splice.apply(this.inner, (<T[]><any>[this.inner.length, 0]).concat(items));

                    if (this.changeTrackingEnabled) {
                        items.forEach(x => {
                            this.addItemToPropertyTracking(x);
                        });
                    }
                }
                // range notification
                else if (true) /* if (wx.App.SupportsRangeNotifications) */
                {
                    var ea = NotifyCollectionChangedEventArgs.create(NotifyCollectionChangedAction.Add, <Array<any>> <any> items, this.inner.length /*we are appending a range*/);

                    this.changingSubject.onNext(ea);

                    if (this.beforeItemsAddedSubject.isValueCreated) {
                        items.forEach(x => {
                            this.beforeItemsAddedSubject.value.onNext(x);
                        });
                    }

                    Array.prototype.splice.apply(this.inner, (<T[]><any>[this.inner.length, 0]).concat(items));
                    this.changedSubject.onNext(ea);

                    if (this.itemsAddedSubject.isValueCreated) {
                        items.forEach(x => {
                            this.itemsAddedSubject.value.onNext(x);
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
                else if (true) /* if (wx.App.SupportsRangeNotifications) */
                {
                    var ea = NotifyCollectionChangedEventArgs.create(NotifyCollectionChangedAction.Add, <Array<any>> <any> items, this.inner.length /*we are appending a range*/);

                    this.changingSubject.onNext(ea);

                    if (this.beforeItemsAddedSubject.isValueCreated) {
                        items.forEach(x => {
                            this.beforeItemsAddedSubject.value.onNext(x);
                        });
                    }

                    Array.prototype.splice.apply(this.inner, (<T[]><any>[index, 0]).concat(items));
                    this.changedSubject.onNext(ea);

                    if (this.itemsAddedSubject.isValueCreated) {
                        items.forEach(x => {
                            this.itemsAddedSubject.value.onNext(x);
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
                else if (true) /* if (wx.App.SupportsRangeNotifications) */
                {
                    var ea = NotifyCollectionChangedEventArgs.create(NotifyCollectionChangedAction.Remove, <Array<any>> <any> items, index);

                    this.changingSubject.onNext(ea);

                    if (this.beforeItemsRemovedSubject.isValueCreated) {
                        items.forEach(x => {
                            this.beforeItemsRemovedSubject.value.onNext(x);
                        });
                    }

                    this.inner.splice(index, count);
                    this.changedSubject.onNext(ea);

                    if (this.changeTrackingEnabled) {
                        items.forEach(x => {
                            this.removeItemFromPropertyTracking(x);
                        });
                    }

                    if (this.itemsRemovedSubject.isValueCreated) {
                        items.forEach(x => {
                            this.itemsRemovedSubject.value.onNext(x);
                        });
                    }
                } else {
                    items.forEach(x => {
                        this.remove(x);
                    });
                }

            });
        }

        public sort(comparison: (a: T, b: T) => number): void {
            this.inner.sort(comparison);

            this.publishResetNotification();            
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

            if (!this.hasWhinedAboutNoResetSub && this.resetSubCount === 0 && !utils.isInUnitTest()) {
                console.log("suppressChangeNotifications was called (perhaps via addRange), yet you do not have a subscription to shouldReset. This probably isn't what you want, as itemsAdded and friends will appear to 'miss' items");
                this.hasWhinedAboutNoResetSub = true;
            }

            return Rx.Disposable.create(() => {
                this.changeNotificationsSuppressed--;

                if (this.changeNotificationsSuppressed === 0)
                    this.publishResetNotification();
            });
        }

        public get(index: number): T {
            return this.inner[index];
        }

        get isEmpty(): boolean {
            return this.inner.length === 0;
        }

        ////////////////////
        // Implementation

        private changingSubject: Rx.Subject<INotifyCollectionChangedEventArgs>;
        private changedSubject: Rx.Subject<INotifyCollectionChangedEventArgs>;
        private inner: Array<T>;
        private beforeItemsAddedSubject: Lazy<Rx.Subject<T>>;
        private itemsAddedSubject: Lazy<Rx.Subject<T>>;
        private beforeItemsRemovedSubject: Lazy<Rx.Subject<T>>;
        private itemsRemovedSubject: Lazy<Rx.Subject<T>>;
        private itemChangingSubject: Lazy<Rx.Subject<IPropertyChangedEventArgs>>;
        private itemChangedSubject: Lazy<Rx.Subject<IPropertyChangedEventArgs>>;
        private beforeItemsMovedSubject: Lazy<Rx.Subject<IMoveInfo<T>>>;
        private itemsMovedSubject: Lazy<Rx.Subject<IMoveInfo<T>>>;
        private changeNotificationsSuppressed: number = 0;
        private propertyChangeWatchers: { [uniqueObjectId: string]: RefCountDisposeWrapper } = null;
        private resetChangeThreshold = 0;
        private resetSubCount = 0;
        private hasWhinedAboutNoResetSub = false;

        // backing-fields for subjects exposed as observables
        private _itemsAdded: Rx.Observable<T>;
        private _beforeItemsAdded: Rx.Observable<T>;
        private _itemsRemoved: Rx.Observable<T>;
        private _beforeItemsRemoved: Rx.Observable<T>;
        private _beforeItemsMoved: Rx.Observable<IMoveInfo<T>>;
        private _itemsMoved: Rx.Observable<IMoveInfo<T>>;
        private _collectionChanging: Rx.Observable<INotifyCollectionChangedEventArgs>;
        private _collectionChanged: Rx.Observable<INotifyCollectionChangedEventArgs>;
        private _countChanging: Rx.Observable<number>;
        private _countChanged: Rx.Observable<number>;
        private _itemChanging: Rx.Observable<IPropertyChangedEventArgs>;
        private _itemChanged: Rx.Observable<IPropertyChangedEventArgs>;

        private setupRx(initialContents: Array<T>, resetChangeThreshold: number = 0.3 /* , scheduler: Rx.IScheduler = null */) {
            //scheduler = scheduler || wx.App.mainThreadScheduler;

            this.resetChangeThreshold = resetChangeThreshold;

            if (this.inner === undefined)
                this.inner = new Array<T>();

            this.changingSubject = new Rx.Subject<INotifyCollectionChangedEventArgs>();
            this.changedSubject = new Rx.Subject<INotifyCollectionChangedEventArgs>();

            this.beforeItemsAddedSubject = new Lazy<Rx.Subject<T>>(() => new Rx.Subject<T>());
            this.itemsAddedSubject = new Lazy<Rx.Subject<T>>(() => new Rx.Subject<T>());
            this.beforeItemsRemovedSubject = new Lazy<Rx.Subject<T>>(() => new Rx.Subject<T>());
            this.itemsRemovedSubject = new Lazy<Rx.Subject<T>>(() => new Rx.Subject<T>());

            this.itemChangingSubject = new Lazy<Rx.ISubject<IPropertyChangedEventArgs>>(() =>
                <any> new Rx.Subject<IPropertyChangedEventArgs>());
                //<any> new ScheduledSubject<ReactiveIPropertyChangedEventArgs>(scheduler));

            this.itemChangedSubject = new Lazy<Rx.ISubject<IPropertyChangedEventArgs>>(() =>
                <any> new Rx.Subject<IPropertyChangedEventArgs>());
                //<any> new ScheduledSubject<ReactiveIPropertyChangedEventArgs>(scheduler));

            this.beforeItemsMovedSubject = new Lazy<Rx.Subject<IMoveInfo<T>>>(() => new Rx.Subject<IMoveInfo<T>>());
            this.itemsMovedSubject = new Lazy<Rx.Subject<IMoveInfo<T>>>(() => new Rx.Subject<IMoveInfo<T>>());

            // NB: We have to do this instead of initializing this._inner so that
            // Collection<T>'s accounting is correct
            if (initialContents) {
                initialContents.forEach(x => {
                    this.add(x);
                });
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

            var ea = NotifyCollectionChangedEventArgs.create(NotifyCollectionChangedAction.Add, item, index);

            this.changingSubject.onNext(ea);

            if (this.beforeItemsAddedSubject.isValueCreated)
                this.beforeItemsAddedSubject.value.onNext(item);

            this.inner.splice(index, 0, item);

            this.changedSubject.onNext(ea);

            if (this.itemsAddedSubject.isValueCreated)
                this.itemsAddedSubject.value.onNext(item);

            if (this.changeTrackingEnabled)
                this.addItemToPropertyTracking(item);
        }

        private removeItem(index: number): void {
            var item = this.inner[index];

            if (!this.areChangeNotificationsEnabled()) {
                this.inner.splice(index, 1);

                if (this.changeTrackingEnabled) this.removeItemFromPropertyTracking(item);
                return;
            }

            var ea = NotifyCollectionChangedEventArgs.create(NotifyCollectionChangedAction.Remove, item, index);

            this.changingSubject.onNext(ea);

            if (this.beforeItemsRemovedSubject.isValueCreated)
                this.beforeItemsRemovedSubject.value.onNext(item);

            this.inner.splice(index, 1);

            this.changedSubject.onNext(ea);

            if (this.itemsRemovedSubject.isValueCreated)
                this.itemsRemovedSubject.value.onNext(item);

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

            var ea = NotifyCollectionChangedEventArgs.create(NotifyCollectionChangedAction.Move, [item], newIndex, oldIndex);
            var mi = new MoveInfo<T>([item], oldIndex, newIndex);

            this.changingSubject.onNext(ea);

            if (this.beforeItemsMovedSubject.isValueCreated)
                this.beforeItemsMovedSubject.value.onNext(mi);

            this.inner.splice(oldIndex, 1);
            this.inner.splice(newIndex, 0, item);

            this.changedSubject.onNext(ea);

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

            var ea = NotifyCollectionChangedEventArgs.create(NotifyCollectionChangedAction.Replace, item, this.inner[index], index);

            this.changingSubject.onNext(ea);

            if (this.changeTrackingEnabled) {
                this.removeItemFromPropertyTracking(this.inner[index]);
                this.addItemToPropertyTracking(item);
            }

            this.inner[index] = item;
            this.changedSubject.onNext(ea);
        }

        private clearItems(): void {
            if (!this.areChangeNotificationsEnabled()) {
                this.inner.length = 0;    // see http://stackoverflow.com/a/1232046/88513

                if (this.changeTrackingEnabled)
                    this.clearAllPropertyChangeWatchers();

                return;
            }

            var ea = NotifyCollectionChangedEventArgs.create(NotifyCollectionChangedAction.Reset);

            this.changingSubject.onNext(ea);
            this.inner.length = 0;    // see http://stackoverflow.com/a/1232046/88513
            this.changedSubject.onNext(ea);

            if (this.changeTrackingEnabled)
                this.clearAllPropertyChangeWatchers();
        }

        private addItemToPropertyTracking(toTrack: T): void {
            var rcd = this.propertyChangeWatchers[utils.getOid(toTrack)];
            var self = this;

            if (rcd) {
                rcd.addRef();
                return;
            }

            var changing = observeObject(toTrack, true)
                .select(i => new PropertyChangedEventArgs(toTrack, i.propertyName));

            var changed = observeObject(toTrack, false)
                .select(i => new PropertyChangedEventArgs(toTrack, i.propertyName));

            var disp = new Rx.CompositeDisposable(
                changing.where(_ => self.areChangeNotificationsEnabled()).subscribe(x=> self.itemChangingSubject.value.onNext(x)),
                changed.where(_ => self.areChangeNotificationsEnabled()).subscribe(x=> self.itemChangedSubject.value.onNext(x)));

            this.propertyChangeWatchers[utils.getOid(toTrack)] = new RefCountDisposeWrapper(
                Rx.Disposable.create(() => {
                    disp.dispose();
                    delete self.propertyChangeWatchers[utils.getOid(toTrack)];
                }));
        }

        private removeItemFromPropertyTracking(toUntrack: T): void {
            var rcd = this.propertyChangeWatchers[utils.getOid(toUntrack)];

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
            var ea = NotifyCollectionChangedEventArgs.create(NotifyCollectionChangedAction.Reset);
            this.changingSubject.onNext(ea);
            this.changedSubject.onNext(ea);
        }

        private isLengthAboveResetThreshold(toChangeLength: number): boolean {
            return toChangeLength / this.inner.length > this.resetChangeThreshold && toChangeLength > 10;
        }
    }

    class MoveInfo<T> implements IMoveInfo<T> {
        constructor(movedItems: Array<T>, from: number, to: number) {
            this.movedItems = movedItems;
            this.from = from;
            this.to = to;
        }

        movedItems: Array<T>;
        from: number;
        to: number;
    }

    /**
    * Creates a new observable list with optional default contents
    * @param {Array<T>} initialContents The initial contents of the list
    * @param {number = 0.3} resetChangeThreshold
    */
    export function list<T>(initialContents?: Array<T>, resetChangeThreshold: number = 0.3 /*, scheduler: Rx.IScheduler = null */): IObservableList<T> {
        return new ObservableList<T>(initialContents, resetChangeThreshold);
    }
}