/// <reference path="../Interfaces.ts" />
/// <reference path="Utils.ts" />

module wx.internal {
    "use strict";

    class ScheduledSubject<T> implements Rx.IDisposable {
        constructor(scheduler: Rx.IScheduler, defaultObserver?: Rx.Observer<T>, defaultSubject?: Rx.ISubject<T>) {
            this._scheduler = scheduler;
            this._defaultObserver = defaultObserver;
            this._subject = defaultSubject || new Rx.Subject<T>();

            if (defaultObserver != null) {
                this._defaultObserverSub = this._subject
                    .observeOn(this._scheduler)
                    .subscribe(this._defaultObserver);
            }
        }

        public dispose(): void {
            if (isDisposable(this._subject)) {
                (<Rx.IDisposable> this._subject).dispose();
            }
        }

        public onCompleted(): void {
            this._subject.onCompleted();
        }

        public onError(error: Error): void {
            this._subject.onError(error);
        }

        public onNext(value: T): void {
            this._subject.onNext(value);
        }

        public subscribe(observer: Rx.Observer<T>): Rx.IDisposable {
            if (this._defaultObserverSub)
                this._defaultObserverSub.dispose();

            this._observerRefCount++;

            return new Rx.CompositeDisposable(
                this._subject.observeOn(this._scheduler).subscribe(observer),

                Rx.Disposable.create(() => {
                    if ((--this._observerRefCount) <= 0 && this._defaultObserver != null) {
                        this._defaultObserverSub = this._subject.observeOn(this._scheduler).subscribe(this._defaultObserver);
                    }
                }));
        }

        //////////////////////////////////
        // Implementation

        private _defaultObserver: Rx.Observer<T>;
        private _scheduler: Rx.IScheduler;
        private _subject: Rx.ISubject<T>;
        private _observerRefCount = 0;
        private _defaultObserverSub = Rx.Disposable.empty;
    }
    
    export function createScheduledSubject<T>(scheduler: Rx.IScheduler, defaultObserver?: Rx.Observer<T>, defaultSubject?: Rx.ISubject<T>): Rx.Subject<T> {
        var scheduled = new ScheduledSubject(scheduler, defaultObserver, defaultSubject);
        var result = extend(scheduled, new Rx.Subject<T>(), true);

        return <any> result;
    }
}