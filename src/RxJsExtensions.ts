///<reference path="../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="Core/ScheduledSubject.ts" />
/// <reference path="RTTI/IID.ts" />

module wx {
    "use strict";

    var RxObsConstructor = (<any> Rx.Observable);   // this hack is neccessary because the .d.ts for RxJs declares Observable as an interface)

    /**
    * Creates an read-only observable property with an optional default value from the current (this) observable
    * (Note: This is the equivalent to Knockout's ko.computed)
    * @param {T} initialValue? Optional initial value, valid until the observable produces a value
    */
    RxObsConstructor.prototype.toProperty = function(initialValue?: any, scheduler?: Rx.IScheduler) {
        scheduler = scheduler || Rx.Scheduler.currentThread;

        // initialize accessor function (read-only)
        var accessor: any = (newVal?: any): any => {
            if (arguments.length > 0) {
                internal.throwError("attempt to write to a read-only observable property");
            }

            if (accessor.sub == null) {
                accessor.sub = accessor._source.connect();
            }

            return accessor.value;
        };

        //////////////////////////////////
        // IUnknown implementation

        accessor.queryInterface = (iid: string) => {
            if (iid === IID.IUnknown ||
                iid === IID.IObservableProperty ||
                iid === IID.IDisposable)
                return true;

            return false;
        };

        //////////////////////////////////
        // IDisposable implementation

        accessor.dispose = () => {
            if (accessor.sub) {
                accessor.sub.dispose();
                accessor.sub = null;
            }
        };

        //////////////////////////////////
        // IObservableProperty<T> implementation

        accessor.value = initialValue;

        // setup observables
        accessor.changedSubject = new Rx.Subject<any>();
        accessor.changed = accessor.changedSubject
            .publish()
            .refCount();

        accessor.changingSubject = new Rx.Subject<any>();
        accessor.changing = accessor.changingSubject
            .publish()
            .refCount();

        accessor.source = this;
        accessor.thrownExceptions = internal.createScheduledSubject<Error>(scheduler, app.defaultExceptionHandler);

        //////////////////////////////////
        // implementation

        var firedInitial = false;

        accessor.sub = this
            .distinctUntilChanged()
            .subscribe(x => {
                // Suppress a non-change between initialValue and the first value
                // from a Subscribe
                if (firedInitial && x === accessor.value) {
                    return;
                }

                firedInitial = true;

                accessor.changingSubject.onNext(x);
                accessor.value = x;
                accessor.changedSubject.onNext(x);
            }, x=> accessor.thrownExceptions.onNext(x));

        return accessor;
    }

    RxObsConstructor.startDeferred = <T>(action: () => T): Rx.Observable<T> => {
        return Rx.Observable.defer(() => {
            return Rx.Observable.create<T>(observer => {
                var cancelled = false;

                if(!cancelled)
                    action();

                observer.onNext(<any> undefined);
                observer.onCompleted();

                return Rx.Disposable.create(()=> cancelled = true);
            });
        });
    }
}
