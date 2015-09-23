/// <reference path="../Interfaces.ts" />
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import IID from "./../IID";
import { isInUnitTest, args2Array, isFunction, isRxScheduler, isRxObservable, queryInterface } from "././Utils";
import { Implements } from "././Reflect";
import { injector } from "../Core/Injector";
import * as res from "../Core/Resources";
"use strict";
export let Command = class {
    /// <summary>
    /// Don't use this directly, use commandXYZ instead
    /// </summary>
    constructor(canExecute, executeAsync, scheduler) {
        this.resultsSubject = new Rx.Subject();
        this.isExecutingSubject = new Rx.Subject();
        this.inflightCount = 0;
        this.canExecuteLatest = false;
        this.canExecuteDisp = null;
        this.scheduler = scheduler || injector.get(res.app).mainThreadScheduler;
        this.func = executeAsync;
        // setup canExecute
        this.canExecuteObs = canExecute
            .combineLatest(this.isExecutingSubject.startWith(false), (ce, ie) => ce && !ie)
            .catch(ex => {
            this.exceptionsSubject.onNext(ex);
            return Rx.Observable.return(false);
        })
            .do(x => {
            this.canExecuteLatest = x;
        })
            .publish();
        if (isInUnitTest()) {
            this.canExecuteObs.connect();
        }
        // setup thrownExceptions
        this.exceptionsSubject = new Rx.Subject();
        this.thrownExceptions = this.exceptionsSubject.asObservable();
        this.exceptionsSubject
            .observeOn(this.scheduler)
            .subscribe(injector.get(res.app).defaultExceptionHandler);
    }
    //////////////////////////////////
    // IDisposable implementation
    dispose() {
        let disp = this.canExecuteDisp;
        if (disp != null)
            disp.dispose();
    }
    ////////////////////
    /// wx.ICommand
    get canExecuteObservable() {
        // setup canExecuteObservable
        let ret = this.canExecuteObs.startWith(this.canExecuteLatest).distinctUntilChanged();
        if (this.canExecuteDisp != null)
            return ret;
        return Rx.Observable.create(subj => {
            let disp = ret.subscribe(subj);
            // NB: We intentionally leak the CanExecute disconnect, it's
            // cleaned up by the global Dispose. This is kind of a
            // "Lazy Subscription" to CanExecute by the command itself.
            this.canExecuteDisp = this.canExecuteObs.connect();
            return disp;
        });
    }
    get isExecuting() {
        return this.isExecutingSubject.startWith(this.inflightCount > 0);
    }
    get results() {
        return this.resultsSubject.asObservable();
    }
    canExecute(parameter) {
        if (this.canExecuteDisp == null)
            this.canExecuteDisp = this.canExecuteObs.connect();
        return this.canExecuteLatest;
    }
    execute(parameter) {
        this.executeAsync(parameter)
            .catch(Rx.Observable.empty())
            .subscribe();
    }
    executeAsync(parameter) {
        let self = this;
        let ret = Rx.Observable.create(subj => {
            if (++self.inflightCount === 1) {
                self.isExecutingSubject.onNext(true);
            }
            let decrement = new Rx.SerialDisposable();
            decrement.setDisposable(Rx.Disposable.create(() => {
                if (--self.inflightCount === 0) {
                    self.isExecutingSubject.onNext(false);
                }
            }));
            let disp = self.func(parameter)
                .observeOn(self.scheduler)
                .do(_ => { }, e => decrement.setDisposable(Rx.Disposable.empty), () => decrement.setDisposable(Rx.Disposable.empty))
                .do(x => self.resultsSubject.onNext(x), x => self.exceptionsSubject.onNext(x))
                .subscribe(subj);
            return new Rx.CompositeDisposable(disp, decrement);
        });
        return ret
            .publish()
            .refCount();
    }
};
Command = __decorate([
    Implements(IID.ICommand),
    Implements(IID.IDisposable), 
    __metadata('design:paramtypes', [Object, Function, Object])
], Command);
export var internal;
(function (internal) {
    internal.commandConstructor = Command;
})(internal || (internal = {}));
// factory method implementation
export function command() {
    let args = args2Array(arguments);
    let canExecute;
    let execute;
    let scheduler;
    let thisArg;
    if (isFunction(args[0])) {
        // first overload
        execute = args.shift();
        canExecute = isRxObservable(args[0]) ? args.shift() : Rx.Observable.return(true);
        scheduler = isRxScheduler(args[0]) ? args.shift() : undefined;
        thisArg = args.shift();
        if (thisArg != null)
            execute = execute.bind(thisArg);
        return asyncCommand(canExecute, (parameter) => Rx.Observable.create(obs => {
            try {
                execute(parameter);
                obs.onNext(null);
                obs.onCompleted();
            }
            catch (e) {
                obs.onError(e);
            }
            return Rx.Disposable.empty;
        }), scheduler);
    }
    // second overload
    canExecute = args.shift() || Rx.Observable.return(true);
    scheduler = isRxScheduler(args[0]) ? args.shift() : undefined;
    return new Command(canExecute, x => Rx.Observable.return(x), scheduler);
}
// factory method implementation
export function asyncCommand() {
    let args = args2Array(arguments);
    let canExecute;
    let executeAsync;
    let scheduler;
    let thisArg;
    if (isFunction(args[0])) {
        // second overload
        executeAsync = args.shift();
        scheduler = isRxScheduler(args[0]) ? args.shift() : undefined;
        thisArg = args.shift();
        if (thisArg != null)
            executeAsync = executeAsync.bind(thisArg);
        return new Command(Rx.Observable.return(true), executeAsync, scheduler);
    }
    // first overload
    canExecute = args.shift();
    executeAsync = args.shift();
    scheduler = isRxScheduler(args[0]) ? args.shift() : undefined;
    return new Command(canExecute, executeAsync, scheduler);
}
// factory method implementation
export function combinedCommand() {
    let args = args2Array(arguments);
    let commands = args
        .filter(x => isCommand(x));
    let canExecute = args
        .filter(x => isRxObservable(x))
        .pop();
    if (!canExecute)
        canExecute = Rx.Observable.return(true);
    let childrenCanExecute = Rx.Observable.combineLatest(commands.map(x => x.canExecuteObservable), (...latestCanExecute) => latestCanExecute.every(x => x));
    let canExecuteSum = Rx.Observable.combineLatest(canExecute.startWith(true), childrenCanExecute, (parent, child) => parent && child);
    let ret = command(canExecuteSum);
    ret.results.subscribe(x => commands.forEach(cmd => {
        cmd.execute(x);
    }));
    return ret;
}
/**
* Determines if target is an instance of a ICommand
* @param {any} target
*/
export function isCommand(target) {
    if (target == null)
        return false;
    return target instanceof Command ||
        queryInterface(target, IID.ICommand);
}
//# sourceMappingURL=Command.js.map