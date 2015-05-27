///<reference path="../node_modules/rx/ts/rx.all.d.ts" />
import { IObservableProperty } from "./Interfaces"

declare module Rx {
    export interface Observable<T> extends IObservable<T> {
        toProperty(initialValue?: T): IObservableProperty<T>;
    }
}
