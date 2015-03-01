/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../../build/xircular.d.ts" />

describe("Utils",() => {
    it("isStrictMode should be off for this file",() => {
        expect(xi.utils.isStrictMode()).toBeFalsy();
    });

    it("isInUnitTest smoke-test",() => {
        expect(xi.utils.isInUnitTest()).toBeTruthy();
    });

    it("getOid smoke-test",() => {
        var o1 = new Object();
        var o2 = new Object();

        var id1 = xi.utils.getOid(o1);
        var id2 = xi.utils.getOid(o2);

        expect(typeof id1 === "string").toBeTruthy();
        expect(typeof id2 === "string").toBeTruthy();
        expect(id1).not.toEqual(id2);

        // id for same object should always return the same value
        var id1b = xi.utils.getOid(o1);
        expect(id1).toEqual(id1b);

        // should not throw for primitive 
        expect(() => xi.utils.getOid(1)).not.toThrowError();
        expect(() => xi.utils.getOid("foo")).not.toThrowError();
        expect(xi.utils.getOid(1)).toEqual("number:1");
        expect(xi.utils.getOid("foo")).toEqual("string:foo");

        // should not throw for primitive objects
        var n = new Number(1);
        var s = new String("foo");
        expect(() => xi.utils.getOid(n)).not.toThrowError();
        expect(() => xi.utils.getOid(s)).not.toThrowError();

        // should work with primitive objects
        expect(xi.utils.getOid(n)).toEqual(xi.utils.getOid(n));
        expect(xi.utils.getOid(s)).toEqual(xi.utils.getOid(s));
    });

    it("isRxuiProperty smoke-test",() => {
        expect(xi.utils.isRxuiProperty(1)).toBeFalsy();
        expect(xi.utils.isRxuiProperty("foo")).toBeFalsy();
        expect(xi.utils.isRxuiProperty(new String("foo"))).toBeFalsy();
        expect(xi.utils.isRxuiProperty(new Object())).toBeFalsy();
        expect(xi.utils.isRxuiProperty(function () { })).toBeFalsy();

        expect(xi.utils.isRxuiProperty(xi.property())).toBeTruthy();
        expect(xi.utils.isRxuiProperty(Rx.Observable.return(1).toProperty())).toBeTruthy();
    });

    it("isRxuiCommand smoke-test",() => {
        expect(xi.utils.isRxuiCommand(1)).toBeFalsy();
        expect(xi.utils.isRxuiCommand("foo")).toBeFalsy();
        expect(xi.utils.isRxuiCommand(new String("foo"))).toBeFalsy();
        expect(xi.utils.isRxuiCommand(new Object())).toBeFalsy();
        expect(xi.utils.isRxuiCommand(function () { })).toBeFalsy();

        expect(xi.utils.isRxuiCommand(xi.command())).toBeTruthy();
    });

    it("isRxScheduler smoke-test",() => {
        expect(xi.utils.isRxScheduler(1)).toBeFalsy();
        expect(xi.utils.isRxScheduler("foo")).toBeFalsy();
        expect(xi.utils.isRxScheduler(new String("foo"))).toBeFalsy();
        expect(xi.utils.isRxScheduler(new Object())).toBeFalsy();
        expect(xi.utils.isRxScheduler(function () { })).toBeFalsy();
        expect(xi.utils.isRxScheduler(xi.command())).toBeFalsy();

        expect(xi.utils.isRxScheduler(Rx.Scheduler.immediate)).toBeTruthy();
        expect(xi.utils.isRxScheduler(Rx.Scheduler.currentThread)).toBeTruthy();
        expect(xi.utils.isRxScheduler(new Rx.TestScheduler)).toBeTruthy();
    });

    it("isRxObservable smoke-test",() => {
        expect(xi.utils.isRxObservable(1)).toBeFalsy();
        expect(xi.utils.isRxObservable("foo")).toBeFalsy();
        expect(xi.utils.isRxObservable(new String("foo"))).toBeFalsy();
        expect(xi.utils.isRxObservable(new Object())).toBeFalsy();
        expect(xi.utils.isRxObservable(function () { })).toBeFalsy();
        expect(xi.utils.isRxObservable(xi.command())).toBeFalsy();

        expect(xi.utils.isRxObservable(new Rx.Subject<any>())).toBeTruthy();
        expect(xi.utils.isRxObservable(new Rx.Subject<any>().asObservable())).toBeTruthy();
        expect(xi.utils.isRxObservable(Rx.Observable.return(true))).toBeTruthy();
        expect(xi.utils.isRxObservable(Rx.Observable.create(obs=> Rx.Disposable.empty))).toBeTruthy();
    });

    it("toggleCssClass smoke-test",() => {
        loadFixtures('templates/Core/Utils.html');

        var el = <HTMLMapElement> document.querySelector('#fixture');
        expect($(el)).toHaveClass("foo bar");

        // test with single class
        expect($(el)).not.toHaveClass("hidden");
        xi.utils.toggleCssClass(el, true, "hidden");
        expect($(el)).toHaveClass("hidden");

        xi.utils.toggleCssClass(el, false, "hidden");
        expect($(el)).not.toHaveClass("hidden");

        // everything should be as it was when we began
        expect($(el)).toHaveClass("foo bar");

        // test with multiple classes
        expect($(el)).not.toHaveClass("bold italic");
        xi.utils.toggleCssClass(el, true, "bold", "italic");
        expect($(el)).toHaveClass("bold italic");

        xi.utils.toggleCssClass(el, false, "bold", "italic");
        expect($(el)).not.toHaveClass("bold italic");

        // everything should be as it was when we began
        expect($(el)).toHaveClass("foo bar");
    });
});
