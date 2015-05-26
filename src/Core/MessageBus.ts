/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import { injector } from "./Injector"
import { createScheduledSubject } from "./../Core/ScheduledSubject"
import * as res from "./Resources"

// ReactiveUI's MessageBus

"use strict";

/**
* IMessageBus represents an object that can act as a "Message Bus", a
* simple way for ViewModels and other objects to communicate with each
* other in a loosely coupled way.
* 
* Specifying which messages go where is done via the contract parameter
**/
export interface IMessageBus {
    /**
    * Registers a scheduler for the type, which may be specified at
    * runtime, and the contract.
    * 
    * If a scheduler is already registered for the specified
    * runtime and contract, this will overrwrite the existing
    * registration.
    * 
    * @param {string} contract A unique string to distinguish messages with
    * identical types (i.e. "MyCoolViewModel")
    **/
    registerScheduler(scheduler: Rx.IScheduler, contract: string): void;

    /**
    * Listen provides an Observable that will fire whenever a Message is
    * provided for this object via RegisterMessageSource or SendMessage.
    * 
    * @param {string} contract A unique string to distinguish messages with
    * identical types (i.e. "MyCoolViewModel")
    **/
    listen<T>(contract: string): Rx.IObservable<T>;

    /**
    * Determines if a particular message Type is registered.
    * @param {string} The type of the message.
    * 
    * @param {string} contract A unique string to distinguish messages with
    * identical types (i.e. "MyCoolViewModel")
    * @return True if messages have been posted for this message Type.
    **/
    isRegistered(contract: string): boolean;

    /**
    * Registers an Observable representing the stream of messages to send.
    * Another part of the code can then call Listen to retrieve this
    * Observable.
    * 
    * @param {string} contract A unique string to distinguish messages with
    * identical types (i.e. "MyCoolViewModel")
    **/
    registerMessageSource<T>(source: Rx.Observable<T>, contract: string): Rx.IDisposable;

    /**
    * Sends a single message using the specified Type and contract.
    * Consider using RegisterMessageSource instead if you will be sending
    * messages in response to other changes such as property changes
    * or events.
    * 
    * @param {T} message The actual message to send
    * @param {string} contract A unique string to distinguish messages with
    * identical types (i.e. "MyCoolViewModel")
    **/
    sendMessage<T>(message: T, contract: string): void;
}

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
