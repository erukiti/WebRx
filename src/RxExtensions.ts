///<reference path="../node_modules/rx/ts/rx.all.d.ts" />

import { IWebRxApp, IObservableProperty } from "./Interfaces"
import { args2Array, isFunction, isCommand, isRxObservable, throwError } from "./Core/Utils"
import IID from "./IID"
import { createScheduledSubject } from "./Core/ScheduledSubject"
import { Implements } from "./Core/Reflect"
import { injector } from "./Core/Injector"
import * as res from "./Core/Resources"

"use strict";

let RxObsConstructor = <any> Rx.Observable;   // this hack is neccessary because the .d.ts for RxJs declares Observable as an interface)

/**
* Creates an read-only observable property with an optional default value from the current (this) observable
* (Note: This is the equivalent to Knockout's ko.computed)
* @param {T} initialValue? Optional initial value, valid until the observable produces a value
*/
function toProperty(initialValue?: any, scheduler?: Rx.IScheduler) {
    scheduler = scheduler || Rx.Scheduler.currentThread;

    // initialize accessor function (read-only)
    let accessor: any = function propertyAccessor(newVal?: any): any {
        if (arguments.length > 0) {
            throwError("attempt to write to a read-only observable property");
        }

        if (accessor.sub == null) {
            accessor.sub = accessor._source.connect();
        }

        return accessor.value;
    };

    Implements(IID.IObservableProperty)(accessor);
    Implements(IID.IDisposable)(accessor);

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
    accessor.thrownExceptions = createScheduledSubject<Error>(scheduler, injector.get<IWebRxApp>(res.app).defaultExceptionHandler);

    //////////////////////////////////
    // implementation

    let firedInitial = false;

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

RxObsConstructor.prototype.toProperty = toProperty;

RxObsConstructor.prototype.continueWith = function() {
    let args = args2Array(arguments);
    let val = args.shift();
    let obs: Rx.Observable<any> = undefined;

    if (isRxObservable(val)) {
        obs = <Rx.Observable<any>> val;
    } else if(isFunction(val)) {
        let action = <() => any> val;
        obs = Rx.Observable.startDeferred(action);
    }

    return this.selectMany(_ => obs);
}

RxObsConstructor.startDeferred = <T>(action: () => T): Rx.Observable<T> => {
    return Rx.Observable.defer(() => {
        return Rx.Observable.create<T>(observer => {
            let cancelled = false;

            if(!cancelled)
                action();

            observer.onNext(<any> undefined);
            observer.onCompleted();

            return Rx.Disposable.create(()=> cancelled = true);
        });
    });
}
