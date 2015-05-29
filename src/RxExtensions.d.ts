/// <reference path="./Interfaces.ts" />

declare module Rx {
    export interface Observable<T> extends IObservable<T> {
        toProperty(initialValue?: T): wx.IObservableProperty<T>;

        continueWith(action: () => void): Observable<any>;
        continueWith<TResult>(action: (T) => TResult): Observable<TResult>;
        continueWith<TOther>(obs: Rx.Observable<TOther>): Observable<TOther>;
    }

    export interface ObservableStatic {
        startDeferred<T>(action:()=> T): Rx.Observable<T>;
    }

    // TODO: as of RxJs 2.5.2 this is missing in rx.all.d.ts
    export interface SchedulerStatic {
        isScheduler(o: any): boolean;
    }
}
