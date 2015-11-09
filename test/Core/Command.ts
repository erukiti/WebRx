/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../TestUtils.ts" />
/// <reference path="../../node_modules/rx/ts/rx.virtualtime.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.testing.d.ts" />

describe("Command", () => {
    it("implements ICommand", () => {
        var cmd = wx.command();
        expect(wx.queryInterface(cmd, wx.IID.ICommand)).toBeTruthy();
    });

    it("completely default reactive command should fire", () => {
        var sched = new Rx.TestScheduler();
        var fixture = wx.command(null, sched);
        expect(fixture.canExecute(null)).toBeTruthy();

        var result = null;

        fixture.results.subscribe(x => {
            result = x.toString();
        });

        fixture.execute("Test");
        sched.start();
        expect("Test").toEqual(result);
        fixture.execute("Test2");
        sched.start();
        expect("Test2").toEqual(result);
    });

    it("register sync function smoke-test",() => {
        var invoked = false;
        var fixture = wx.command(()=> invoked = true);

        var results = new Array<number>();
        fixture.results.subscribe(x => results.push(x));

        expect(invoked).toBeFalsy();
        expect(fixture.canExecute(null)).toBeTruthy();

        fixture.execute(null);
        expect(invoked).toBeTruthy();
        expect(results.length).toEqual(1);
    });

    it("execute with sync function doesnt throw on error",() => {
        var fixture = wx.command(() => { throw new Error("foo"); });

        var results = new Array<Error>();
        fixture.thrownExceptions.subscribe(x => results.push(x));

        expect(() => fixture.execute(null)).not.toThrowError();
        expect(results.length).toEqual(1);
        expect("foo").toEqual(results[0].message);
    });

    it("observable canExecute should show up in command", () => {
        var input = [true, false, false, true, false, true];
        var result = testutils.withScheduler(new Rx.TestScheduler(), sched => {
            var can_execute = new Rx.Subject<boolean>();
            var fixture = wx.command(can_execute, sched);
            var changes_as_observable = [];

            var change_event_count = 0;

            fixture.canExecuteObservable.subscribe(x => {
                change_event_count++;
                changes_as_observable.push(x);
            });

            testutils.run(input, x => {
                can_execute.onNext(x);
                sched.start();
                expect(x).toEqual(fixture.canExecute(null));
            });

            // N.B. We check against '5' instead of 6 because we're supposed to 
            // suppress changes that aren't actually changes i.e. false => false
            sched.advanceTo(10 * 1000);
            return changes_as_observable;
        });

        // NB: Skip(1) is because canExecuteObservable should have
        // BehaviorSubject Nature(tm)
        expect(testutils.distinctUntilChanged(input)).toEqual(result);
    });

    it("observable execute func should be observable and act", () => {
        var executed_params = new Array<any>();
        var fixture = wx.command();
        fixture.results.subscribe(x => executed_params.push(x));

        var observed_params = new Rx.ReplaySubject<any>();
        fixture.results.subscribe(x=> observed_params.onNext(x), x=> observed_params.onError(x), ()=> observed_params.onCompleted());

        var range = Ix.Enumerable.range(0, 5).toArray();
        range.forEach(x => fixture.execute(x));

        expect(range).toEqual(executed_params.filter(x => typeof x === "number"));

        Rx.Observable.zip(Rx.Observable.fromArray(range), observed_params, (expected, actual) => [expected, actual])
            .subscribe(x => expect(x[0]).toEqual(x[1]));
    });

    it("canExecuteObservable is not null after canExecute called", () => {
        var fixture = wx.command(null);

        fixture.canExecute(null);

        expect(fixture.canExecuteObservable).not.toBeNull();
    });

    it("no results are emitted when attempting to execute a command that is not allowed to execute", () => {
        var fixture = wx.command(()=> {}, Rx.Observable.return(false));

        var resultsCount = 0, executingCount = 0;
        fixture.results.subscribe(x=> resultsCount++);
        fixture.isExecuting.subscribe(x=> executingCount += (x ? 1 : 0));

        fixture.execute(null);
        fixture.execute(null);

        expect(resultsCount).toEqual(0);
        expect(executingCount).toEqual(0);
    });

    it("multiple subscribes shouldn't result in multiple notifications", () => {
        var input = [1, 2, 1, 2];
        var fixture = wx.command(null);

        var odd_list = new Array<number>();
        var even_list = new Array<number>();
        fixture.results.where(x => x % 2 !== 0).subscribe(x => odd_list.push(x));
        fixture.results.where(x => x % 2 === 0).subscribe(x => even_list.push(x));

        testutils.run(input, x => fixture.execute(x));

        expect([1, 1]).toEqual(odd_list);
        expect([2, 2]).toEqual(even_list);
    });

    it("canExecute exception shouldnt perma-break commands", () => {
        var canExecute = new Rx.Subject<boolean>();
        var fixture = wx.command(canExecute);

        var exceptions = new Array<Error>();
        var canExecuteStates = new Array<boolean>();
        fixture.canExecuteObservable.subscribe(x => canExecuteStates.push(x));
        fixture.thrownExceptions.subscribe(x => exceptions.push(x));

        canExecute.onNext(false);
        expect(fixture.canExecute(null)).toBeFalsy();

        canExecute.onNext(true);
        expect(fixture.canExecute(null)).toBeTruthy();

        canExecute.onError(new Error("Aieeeee!"));

        // The command should latch to false forever
        expect(fixture.canExecute(null)).toBeFalsy();

        expect(1).toEqual(exceptions.length);
        expect("Aieeeee!").toEqual(exceptions[0].message);

        expect(false).toEqual(canExecuteStates[canExecuteStates.length - 1]);
        expect(true).toEqual(canExecuteStates[canExecuteStates.length - 2]);
    });

    it("execute doesnt throw on error", () => {
        var command = wx.asyncCommand(_ =>
            Rx.Observable.throw(new Error("Aieeeee!")));

        command.thrownExceptions.subscribe();

        expect(() => command.execute(null)).not.toThrowError();
    });

    it("register async function smoke-test", () => {
        testutils.withScheduler(new Rx.TestScheduler(), sched => {
            var fixture = wx.asyncCommand(Rx.Observable.return(true),
                _ => Rx.Observable.return(5).delay(5000, sched));

            var results: Array<number> = [];
            fixture.results.subscribe(x => results.push(x));

            var inflightResults: Array<boolean> = [];
            fixture.isExecuting.subscribe(x => inflightResults.push(x));
            sched.advanceTo(10);
            expect(fixture.canExecute(null)).toBeTruthy();

            fixture.execute(null);
            sched.advanceTo(1005);
            expect(fixture.canExecute(null)).toBeFalsy();

            sched.advanceTo(5100);
            expect(fixture.canExecute(null)).toBeTruthy();

            expect([false, true, false]).toEqual(inflightResults);
            expect([5]).toEqual(results);
        });
    });

    it("multiple subscribers shouldnt decrement refCount below zero", () => {
        testutils.withScheduler(new Rx.TestScheduler(), sched => {
            var fixture = wx.asyncCommand(Rx.Observable.return(true),
                _ => Rx.Observable.return(5).delay(5000, sched));

            var results = new Array<number>();
            var subscribers = [false, false, false, false, false];


            fixture.results.subscribe(x => results.push(x));

            testutils.run(Ix.Enumerable.range(0, 5).toArray(), x => fixture.results.subscribe(_ => subscribers[x] = true));

            expect(fixture.canExecute(null)).toBeTruthy();

            fixture.execute(null);
            sched.advanceTo(2000);
            expect(fixture.canExecute(null)).toBeFalsy();

            sched.advanceTo(6000);
            expect(fixture.canExecute(null)).toBeTruthy();

            expect(results.length === 1).toBeTruthy();
            expect(results[0] === 5).toBeTruthy();
            expect(Ix.Enumerable.fromArray(subscribers).all(x => x)).toBeTruthy();
        });
    });

    it("mulftiple results from observable shouldnt decrement refCount below zero", () => {
        testutils.withScheduler(new Rx.TestScheduler(), sched => {
            var latestExecuting = false;

            var fixture = wx.asyncCommand(Rx.Observable.return(true),
                _ => Rx.Observable.fromArray([1, 2, 3]),
                sched);

            var results = [];
            fixture.results.subscribe(x => results.push(x));

            fixture.isExecuting.subscribe(x => latestExecuting = x);

            fixture.execute(1);
            sched.start();

            expect(3).toEqual(results.length);
            expect(false).toEqual(latestExecuting);
        });
    });

    it("canExecute should change on in-flight op", () => {
        testutils.withScheduler(new Rx.TestScheduler(), sched => {
            var canExecute = sched.createHotObservable<boolean>(
                testutils.recordNext(sched, 0, true),
                testutils.recordNext(sched, 250, false),
                testutils.recordNext(sched, 500, true),
                testutils.recordNext(sched, 750, false),
                testutils.recordNext(sched, 1000, true),
                testutils.recordNext(sched, 1100, false)
            );

            var fixture = wx.asyncCommand(canExecute,
                x => Rx.Observable.return(x * 5).delay(900, wx.app.mainThreadScheduler));

            var calculatedResult = -1;
            var latestcanExecute = false;

            fixture.results.subscribe(x => calculatedResult = x);
            fixture.canExecuteObservable.subscribe(x => latestcanExecute = x);

            // canExecute should be true, both input observable is true
            // and we don't have anything inflight
            sched.advanceTo(10);
            expect(fixture.canExecute(1)).toBeTruthy();
            expect(latestcanExecute).toBeTruthy();

            // Invoke a command 10ms in
            fixture.execute(1);

            // At 300ms, input is false
            sched.advanceTo(300);
            expect(fixture.canExecute(1)).toBeFalsy();
            expect(latestcanExecute).toBeFalsy();

            // At 600ms, input is true, but the command is still running
            sched.advanceTo(600);
            expect(fixture.canExecute(1)).toBeFalsy();
            expect(latestcanExecute).toBeFalsy();

            // After we've completed, we should still be false, since from
            // 750ms-1000ms the input observable is false
            sched.advanceTo(900);
            expect(fixture.canExecute(1)).toBeFalsy();
            expect(latestcanExecute).toBeFalsy();
            expect(-1).toEqual(calculatedResult);

            sched.advanceTo(1010);
            expect(fixture.canExecute(1)).toBeTruthy();
            expect(latestcanExecute).toBeTruthy();
            expect(calculatedResult).toEqual(5);

            sched.advanceTo(1200);
            expect(fixture.canExecute(1)).toBeFalsy();
            expect(latestcanExecute).toBeFalsy();
        });
    });

    it("disallow concurrent execution test", () => {
        testutils.withScheduler(new Rx.TestScheduler(), sched => {
            var fixture = wx.asyncCommand(Rx.Observable.return(true),
                _ => Rx.Observable.return(4).delay(5000, sched),
                sched);

            expect(fixture.canExecute(null)).toBeTruthy();

            var result = [];
            fixture.results.subscribe(x => result.push(x));
            expect(0).toEqual(result.length);

            sched.advanceTo(25);
            expect(0).toEqual(result.length);

            fixture.execute(null);
            expect(fixture.canExecute(null)).toBeFalsy();
            expect(0).toEqual(result.length);

            sched.advanceTo(2500);
            expect(fixture.canExecute(null)).toBeFalsy();
            expect(0).toEqual(result.length);

            sched.advanceTo(5500);
            expect(fixture.canExecute(null)).toBeTruthy();
            expect(1).toEqual(result.length);
        });
    });

    it("command can execute on whenAny",() => {
        var prop = wx.property();
        var commandExecuted = false;
        var command = wx.command(_=> commandExecuted = true, wx.whenAny(prop, x=> !!x));
        expect(commandExecuted).toBeFalsy();

        prop(undefined);
        expect(command.canExecute(null)).toBeFalsy();

        prop(false);
        expect(command.canExecute(null)).toBeFalsy();

        prop(true);
        expect(command.canExecute(null)).toBeTruthy();

        command.execute(null);
        expect(commandExecuted).toBeTruthy();
    });

    it("command executes in context of thisArg",() => {
        var vm = new Object();

        // test wx.command() overload
        var thisWas: any = undefined;
        // WARNING: don't convert this to a lamba or the test will suddenly fail due to Typescript's this-capturing
        var command = wx.command(function (_) { thisWas = this }, Rx.Observable.return(true), vm);   
        command.execute(null);
        expect(thisWas).toBe(vm);

        // test wx.command() overload
        thisWas = undefined;
        command = wx.command(function (_) { thisWas = this }, Rx.Observable.return(true), Rx.Scheduler.immediate, vm);
        command.execute(null);
        expect(thisWas).toBe(vm);

        // test wx.command() overload
        thisWas = undefined;
        command = wx.command(function (_) { thisWas = this }, vm);
        command.execute(null);
        expect(thisWas).toBe(vm);
    });
});