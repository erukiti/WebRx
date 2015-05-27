/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import { IMessageBus } from "../Interfaces"
import { injector } from "./Injector"
import { createScheduledSubject } from "./../Core/ScheduledSubject"
import * as res from "./Resources"

// ReactiveUI's MessageBus

"use strict";

export default class MessageBus implements IMessageBus {
    //////////////////////////////////
    // IMessageBus

    public listen<T>(contract: string): Rx.IObservable<T> {
        return this.setupSubjectIfNecessary<T>(contract).skip(1);
    }

    public isRegistered(contract: string): boolean {
        return this.messageBus.hasOwnProperty(contract);
    }

    public registerMessageSource<T>(source: Rx.Observable<T>, contract: string): Rx.IDisposable {
        return source.subscribe(this.setupSubjectIfNecessary<T>(contract));
    }

    public sendMessage<T>(message: T, contract: string): void {
        this.setupSubjectIfNecessary(contract).onNext(message);
    }

    public registerScheduler(scheduler: Rx.IScheduler, contract: string): void {
        this.schedulerMappings[contract] = scheduler;
    }

    //////////////////////////////////
    // Implementation

    private messageBus: { [topic: string]: any } = {};
    private schedulerMappings: { [topic: string]: Rx.IScheduler } = {};

    private setupSubjectIfNecessary<T>(contract: string): Rx.Subject<T> {
        let ret: Rx.Subject<T> = this.messageBus[contract];

        if(ret == null) {
            ret = createScheduledSubject<T>(this.getScheduler(contract), null, new Rx.BehaviorSubject<T>(undefined));
            this.messageBus[contract] = ret;
        }

        return ret;
    }

    private getScheduler(contract: string): Rx.IScheduler {
        let scheduler = this.schedulerMappings[contract];
        return scheduler || Rx.Scheduler.currentThread;
   }
}
