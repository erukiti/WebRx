///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../RTTI/IID.ts" />
/// <reference path="../Services/App.ts" />

// NOTE: The factory method approach is necessary because it is  
// currently impossible to implement a Typescript interface 
// with a function signature in a Typescript class.

module wx {
    /**
    * Creates an observable property with an optional default value
    * @param {T} initialValue?
    */
    export function property<T>(initialValue?: T): IObservableProperty<T> {
        // initialize accessor function
        var accessor: any = (newVal?: T): T => {
            if (arguments.length !== 0 && newVal !== accessor.value) {
                accessor.changingSubject.onNext(newVal);
                accessor.value = newVal;
                accessor.changedSubject.onNext(newVal);
            } else {
                return accessor.value;
            }
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
        };

        //////////////////////////////////
        // IObservableProperty<T> implementation

        accessor.value = initialValue || undefined;

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
}
