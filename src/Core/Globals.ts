///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Services/ExpressionCompiler.ts" />

/**
* Global helpers in project root namespace
*/
 
module xi {
    /**
    * Mimics Wraps an action in try/finally block and disposes the resource after the action has completed even if it throws an exception (C# using statement)
    * @param {Rx.IDisposable} disp The resource to dispose after action completes
    * @param {() => void} action The action to wrap
    */
    export function using<T extends Rx.Disposable>(disp: T, action: (disp?: T) => void) {
        if (!disp)
            throw new Error("disp");
        if (!action)
            throw new Error("action");

        try {
            action(disp);
        } finally {
            disp.dispose();
        }
    }

    /**
    * Returns an observable that signals any changes of observable properties on the target object
    * @param {any} target The object to observe
    * @return {Rx.Observable<T>} An observable
    */
    export function observeObject(target: any, onChanging: boolean = false): Rx.Observable<IPropertyChangedEventArgs> {
        var thrownExceptionsSubject = utils.queryInterface(target, IID.IHandleObservableErrors) ?
            <Rx.Observer<Error>> <any> (<IHandleObservableErrors> target).thrownExceptions : App.defaultExceptionHandler;

        return Rx.Observable.create<IPropertyChangedEventArgs>(
            (observer: Rx.Observer<IPropertyChangedEventArgs>): Rx.IDisposable => {
                var result = new Rx.CompositeDisposable();
                var observableProperties = utils.getOwnPropertiesImplementingInterface<IObservableProperty<any>>(target, IID.IObservableProperty);

                observableProperties.forEach(x => {
                    var prop = x.property;

                    // subscribe
                    var obs = onChanging ? prop.changing : prop.changed;

                    result.add(obs.subscribe(newVal => {
                        //if (!areChangeNotificationsEnabled())
                        //    return;

                        var e = new PropertyChangedEventArgs(self, x.propertyName);

                        try {
                            observer.onNext(e);
                        } catch (ex) {
                            //rxObj.Log().ErrorException("ReactiveObject Subscriber threw exception", ex);
                            thrownExceptionsSubject.onNext(ex);
                        }
                    }));
                });

                return result;
            })
            .publish()
            .refCount();
    }

    export function whenAny<TRet, T1>(
        property1: IObservableProperty<T1>,
        selector: (T1) => TRet): Rx.Observable<TRet>;

    export function whenAny<TRet, T1, T2>(
        property1: IObservableProperty<T1>, property2: IObservableProperty<T2>,
        selector: (T1, T2, T3, T4, T5) => TRet): Rx.Observable<TRet>;

    export function whenAny<TRet, T1, T2, T3>(
        property1: IObservableProperty<T1>, property2: IObservableProperty<T2>,
        property3: IObservableProperty<T3>, 
        selector: (T1, T2, T3, T4, T5) => TRet): Rx.Observable<TRet>;

    export function whenAny<TRet, T1, T2, T3, T4>(
        property1: IObservableProperty<T1>, property2: IObservableProperty<T2>,
        property3: IObservableProperty<T3>, property4: IObservableProperty<T4>,
        selector: (T1, T2, T3, T4, T5) => TRet): Rx.Observable<TRet>;

    export function whenAny<TRet, T1, T2, T3, T4, T5>(
        property1: IObservableProperty<T1>, property2: IObservableProperty<T2>,
        property3: IObservableProperty<T3>, property4: IObservableProperty<T4>,
        property5: IObservableProperty<T5>,
        selector: (T1, T2, T3, T4, T5) => TRet): Rx.Observable<TRet>;

    /// <summary>
    /// whenAny allows you to observe whenever the value of one or more
    /// properties on an object have changed, providing an initial value when
    /// the Observable is set up.
    /// </summary>
    export function whenAny<TRet>(): Rx.Observable<TRet> {
        if (arguments.length === 2) {
            return arguments[0].changed.select(arguments[1]);
        }

        var args = Array.prototype.slice.call(arguments);

        // extract selector
        var selector = args.pop();

        // make sure the current value is prepended to the sequence in order to satisfy combineLatest
        args = args.map(x => x.changed.startWith(x()));

        // finally append the selector
        args.push(selector);

        return (<Rx.Observable<TRet>> Rx.Observable.combineLatest.apply(this, args));
    }
}
