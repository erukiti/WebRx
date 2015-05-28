///<reference path="../Interfaces.ts" />

import { Implements } from "./Reflect"
import IID from "../IID"

// NOTE: The factory method approach is necessary because it is  
// currently impossible to implement a Typescript interface 
// with a function signature in a Typescript class.

"use strict";

/**
* Creates an observable property with an optional default value
* @param {T} initialValue?
*/
export function property<T>(initialValue?: T): wx.IObservableProperty<T> {
    // initialize accessor function
    let accessor: any = function(newVal?: T): T {
        if (arguments.length > 0) {
            // set
            if (newVal !== accessor.value) {
                accessor.changingSubject.onNext(newVal);
                accessor.value = newVal;
                accessor.changedSubject.onNext(newVal);
            }
        } else {
            // get
            return accessor.value;
        }
    };
    
    Implements(IID.IObservableProperty)(accessor);
    Implements(IID.IDisposable)(accessor);

    //////////////////////////////////
    // IDisposable implementation

    accessor.dispose = () => {
    };

    //////////////////////////////////
    // IObservableProperty<T> implementation

    if (initialValue !== undefined)
        accessor.value = initialValue;

    // setup observables
    accessor.changedSubject = new Rx.Subject<T>();
    accessor.changed = accessor.changedSubject
        .publish()
        .refCount();

    accessor.changingSubject = new Rx.Subject<T>();
    accessor.changing = accessor.changingSubject
        .publish()
        .refCount();

    return accessor;
}
