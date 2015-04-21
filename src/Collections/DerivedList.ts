///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../RTTI/IID.ts" />
/// <reference path="../Core/Lazy.ts" />
/// <reference path="../Core/RefCountDisposeWrapper.ts" />
/// <reference path="../RxJsExtensions.ts" />
/// <reference path="List.ts" />

module wx.internal {
    "use strict";

    /**
    * ReactiveUI's awesome derived ReactiveList ported to Typescript
    * @class
    */
    export class DerivedObservableList<T, TValue> extends internal.ObservableList<TValue> implements IObservableReadOnlyList<TValue> {
        constructor(source: IObservableList<T>, filter?: (item: T) => boolean,
            orderer?: (a: TValue, b: TValue) => number, selector?: (T) => TValue, scheduler?: Rx.IScheduler) {
            super();

            if (filter == null)
                filter = x => true;

            this.source = source;
            this.selector = selector;
            this._filter = filter;
            this.orderer = orderer;
            this.scheduler = scheduler;

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
            using(super.suppressChangeNotifications(), () => {
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
        private scheduler: Rx.IScheduler;
        private static defaultOrderer = (a, b) => 0;

        // This list maps indices in this collection to their corresponding indices in the source collection.
        private indexToSourceIndexMap: Array<number> = [];
        private sourceCopy: Array<T> = [];
        private disp = new Rx.CompositeDisposable();

        private referenceEquals(a: any, b: any): boolean {
            return getOid(a) === getOid(b);
        }

        private wireUpChangeNotifications() {
            var length: number;

            this.disp.add(this.source.itemsAdded.observeOn(this.scheduler).subscribe((e) => {
                // TODO
            }));

            this.disp.add(this.source.itemsRemoved.observeOn(this.scheduler).subscribe((e) => {
                // TODO
            }));

            this.disp.add(this.source.itemsMoved.observeOn(this.scheduler).subscribe((e) => {
                // TODO
            }));

            this.disp.add(this.source.itemReplaced.observeOn(this.scheduler).subscribe((e) => {
                // TODO
            }));

            this.disp.add(this.source.shouldReset.observeOn(this.scheduler).subscribe((e) => {
                // TODO
            }));

            this.disp.add(this.source.itemChanged.select(x => x.sender).observeOn(this.scheduler).subscribe(this.onItemChanged));
        }

/*
    private onSourceCollectionChanged(NotifyCollectionChangedEventArgs args): void
    {
        if (args.Action == NotifyCollectionChangedAction.Reset) {
            this.reset();
            return;
        }

            if (args.Action == NotifyCollectionChangedAction.Move) {

                // Debug.Assert(args.OldItems.length == args.NewItems.length);

                if (args.OldItems.length > 1 || args.NewItems.length > 1) {
                    throw new NotSupportedException("Derived collections doesn't support multi-item moves");
                }

                // Yeah apparently this can happen. ObservableCollection triggers this notification on Move(0,0)
                if (args.OldStartingIndex == args.NewStartingIndex) {
                    return;
                }

                oldSourceIndex: number = args.OldStartingIndex;
                newSourceIndex: number = args.NewStartingIndex;

                sourceCopy.RemoveAt(oldSourceIndex);
                sourceCopy.Insert(newSourceIndex,(T)args.NewItems[0]);

                currentDestinationIndex: number = getIndexFromSourceIndex(oldSourceIndex);

                moveSourceIndexInMap(oldSourceIndex, newSourceIndex);

                if (currentDestinationIndex == -1) {
                    return;
                }

                value: TValue = super.currentDestinationIndex];

                if (orderer == null) {
                    // We mirror the order of the source collection so we'll perform the same move operation
                    // as the source. As is the case with when we have an orderer we don't test whether or not
                    // the item should be included or not here. If it has been included at some point it'll
                    // stay included until onItemChanged picks up a change which filters it.
                    newDestinationIndex: number = newPositionForExistingItem(
                        indexToSourceIndexMap, newSourceIndex, currentDestinationIndex);

                    if (newDestinationIndex != currentDestinationIndex) {
                        this.indexToSourceIndexMap.RemoveAt(currentDestinationIndex);
                        this.indexToSourceIndexMap.Insert(newDestinationIndex, newSourceIndex);

                        super.internalMove(currentDestinationIndex, newDestinationIndex);
                    } else {
                        indexToSourceIndexMap[currentDestinationIndex] = newSourceIndex;
                    }
                } else {
                    // TODO: Conceptually I feel like we shouldn't concern ourselves with ordering when we 
                    // receive a Move notification. If it affects ordering it should be picked up by the
                    // onItemChange and resorted there instead.
                    indexToSourceIndexMap[currentDestinationIndex] = newSourceIndex;
                }

                return;
            }

        if (args.OldItems != null) {

            sourceCopy.RemoveRange(args.OldStartingIndex, args.OldItems.length);

            for (var i = 0; i < args.OldItems.length; i++) {
                destinationIndex: number = getIndexFromSourceIndex(args.OldStartingIndex + i);
                if (destinationIndex != -1) {
                    internalRemoveAt(destinationIndex);
                }
            }

            removedCount: number = args.OldItems.length;
            shiftIndicesAtOrOverThreshold(args.OldStartingIndex + removedCount, -removedCount);
        }

        if (args.NewItems != null) {

            shiftIndicesAtOrOverThreshold(args.NewStartingIndex, args.NewItems.length);

            for (var i = 0; i < args.NewItems.length; i++) {
                var sourceItem = (T)args.NewItems[i];
                sourceCopy.Insert(args.NewStartingIndex + i, sourceItem);

                if (!filter(sourceItem)) {
                    continue;
                }

                var destinationItem = selector(sourceItem);
                internalInsertAndMap(args.NewStartingIndex + i, destinationItem);
            }
        }
    }
*/
        private onItemChanged(changedItem: T): void {
            var sourceIndices = this.indexOfAll(this.sourceCopy, changedItem);
            var shouldBeIncluded = this._filter(changedItem);

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
                            this.internalReplace(currentDestinationIndex, newItem);
                        }
                    } else {
                        // Don't be tempted to just use the orderer to compare the new item with the previous since
                        // they'll almost certainly be equal (for reference types). We need to test whether or not the
                        // new item can stay in the same position that the current item is in without comparing them.
                        if (this.canItemStayAtPosition(newItem, currentDestinationIndex)) {
                            // The new item should be in the same position as the current but there's no need to signal
                            // that in case they are the same object.
                            if (!this.referenceEquals(newItem, this.get(currentDestinationIndex))) {
                                this.internalReplace(currentDestinationIndex, newItem);
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

        private internalReplace(destinationIndex: number, newItem: TValue): void {
            super.set(destinationIndex, newItem);
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
            var indices = [1];
            var sourceIndex: number = 0;

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
            // Debug.Assert(sourceCopy.length == 0, "Expceted source copy to be empty");
            var sourceIndex: number = 0;

            this.source.forEach(sourceItem => {

                this.sourceCopy.push(sourceItem);

                if (this._filter(sourceItem)) {
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
                ? DerivedObservableList.positionForNewItemArray(<any> this.indexToSourceIndexMap, <any> sourceIndex, DerivedObservableList.defaultOrderer)
                : DerivedObservableList.positionForNewItemArray2(this.inner, 0, this.inner.length, value, this.orderer);
        }

        private static positionForNewItemArray<T>(array: Array<T>, item: T, orderer: (a: T, b: T) => number): number {
            return DerivedObservableList.positionForNewItemArray2(array, 0, array.length, item, orderer);
        }

        private static positionForNewItemArray2<T>(array: Array<T>, index: number, count: number,
            item: T, orderer: (a: T, b: T) => number): number {
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

            var low: number = index, hi = index + count - 1;
            var mid: number, cmp;

            while (low <= hi) {
                mid = low + (hi - low) / 2;
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
                ? DerivedObservableList.newPositionForExistingItem2(<any> this.indexToSourceIndexMap, <any> sourceIndex, currentIndex)
                : DerivedObservableList.newPositionForExistingItem2(this.inner, item, currentIndex, this.orderer);
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

            var precedingIndex: number = currentIndex - 1;
            var succeedingIndex: number = currentIndex + 1;

            // The item on the preceding or succeeding index relative to currentIndex.
            var comparand = array[precedingIndex >= 0 ? precedingIndex : succeedingIndex];

            if (orderer == null) {
                orderer = DerivedObservableList.defaultOrderer;
            }

            // Compare that to the (potentially) new value.
            var cmp: number = orderer(item, comparand);

            var min: number = 0;
            var max: number = array.length;

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

            var ix: number = DerivedObservableList.positionForNewItemArray2(array, min, max - min, item, orderer);

            // If the item moves 'forward' in the collection we have to account for the index where
            // the item currently resides getting removed first.
            return ix >= currentIndex ? ix - 1 : ix;
        }
    }
}

module wx {
    "use strict";

    /**
     * Creates a live-projection over an existing list that can be filtered, re-ordered and mapped. 
     * @param src {IObservableList<T>|Array<T>} The source collection to follow
     * @param filter {(item: T) => boolean} A filter to determine whether to exclude items in the derived collection
     * @param orderer {(a: TNew, b: TNew) => number} A comparator method to determine the ordering of the resulting collection
     * @param selector {(T) => TNew} A function that will be run on each item to project it to a different type
     */
    export function derivedList<T, TNew, TDontCare>(src: IObservableList<T>, filter?: (item: T) => boolean,
        orderer?: (a: TNew, b: TNew) => number, selector?: (T) => TNew, signalReset?: Rx.Observable<TDontCare>,
        scheduler?: Rx.IScheduler): IObservableReadOnlyList<TNew> {
        return new internal.DerivedObservableList<T, TNew>(src, filter, orderer, selector, scheduler);
    }
}