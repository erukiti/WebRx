/// <reference path="../Interfaces.ts" />

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

    //////////////////////////////////
    // wx.IUnknown implementation

    accessor.queryInterface = (iid: string)=> {
       return iid === IID.IObservableProperty || iid === IID.IDisposable;
    }
    
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
    accessor.changed = accessor.changedSubject.asObservable()

    accessor.changingSubject = new Rx.Subject<T>();
    accessor.changing = accessor.changingSubject.asObservable()

    return accessor;
}
