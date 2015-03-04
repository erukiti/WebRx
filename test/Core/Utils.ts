/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe("Utils",() => {
    it("isStrictMode should be off for this file",() => {
        expect(wx.utils.isStrictMode()).toBeFalsy();
    });

    it("isInUnitTest smoke-test",() => {
        expect(wx.utils.isInUnitTest()).toBeTruthy();
    });

    it("getOid smoke-test",() => {
        var o1 = new Object();
        var o2 = new Object();

        var id1 = wx.utils.getOid(o1);
        var id2 = wx.utils.getOid(o2);

        expect(typeof id1 === "string").toBeTruthy();
        expect(typeof id2 === "string").toBeTruthy();
        expect(id1).not.toEqual(id2);

        // id for same object should always return the same value
        var id1b = wx.utils.getOid(o1);
        expect(id1).toEqual(id1b);

        // should not throw for primitive 
        expect(() => wx.utils.getOid(1)).not.toThrowError();
        expect(() => wx.utils.getOid("foo")).not.toThrowError();
        expect(wx.utils.getOid(1)).toEqual("number:1");
        expect(wx.utils.getOid("foo")).toEqual("string:foo");

        // should not throw for primitive objects
        var n = new Number(1);
        var s = new String("foo");
        expect(() => wx.utils.getOid(n)).not.toThrowError();
        expect(() => wx.utils.getOid(s)).not.toThrowError();

        // should work with primitive objects
        expect(wx.utils.getOid(n)).toEqual(wx.utils.getOid(n));
        expect(wx.utils.getOid(s)).toEqual(wx.utils.getOid(s));
    });

    it("isProperty smoke-test",() => {
        expect(wx.utils.isProperty(1)).toBeFalsy();
        expect(wx.utils.isProperty("foo")).toBeFalsy();
        expect(wx.utils.isProperty(new String("foo"))).toBeFalsy();
        expect(wx.utils.isProperty(new Object())).toBeFalsy();
        expect(wx.utils.isProperty(function () { })).toBeFalsy();

        expect(wx.utils.isProperty(wx.property())).toBeTruthy();
        expect(wx.utils.isProperty(Rx.Observable.return(1).toProperty())).toBeTruthy();
    });

    it("isCommand smoke-test",() => {
        expect(wx.utils.isCommand(1)).toBeFalsy();
        expect(wx.utils.isCommand("foo")).toBeFalsy();
        expect(wx.utils.isCommand(new String("foo"))).toBeFalsy();
        expect(wx.utils.isCommand(new Object())).toBeFalsy();
        expect(wx.utils.isCommand(function () { })).toBeFalsy();

        expect(wx.utils.isCommand(wx.command())).toBeTruthy();
    });

    it("isRxScheduler smoke-test",() => {
        expect(wx.utils.isRxScheduler(1)).toBeFalsy();
        expect(wx.utils.isRxScheduler("foo")).toBeFalsy();
        expect(wx.utils.isRxScheduler(new String("foo"))).toBeFalsy();
        expect(wx.utils.isRxScheduler(new Object())).toBeFalsy();
        expect(wx.utils.isRxScheduler(function () { })).toBeFalsy();
        expect(wx.utils.isRxScheduler(wx.command())).toBeFalsy();

        expect(wx.utils.isRxScheduler(Rx.Scheduler.immediate)).toBeTruthy();
        expect(wx.utils.isRxScheduler(Rx.Scheduler.currentThread)).toBeTruthy();
        expect(wx.utils.isRxScheduler(new Rx.TestScheduler)).toBeTruthy();
    });

    it("isRxObservable smoke-test",() => {
        expect(wx.utils.isRxObservable(1)).toBeFalsy();
        expect(wx.utils.isRxObservable("foo")).toBeFalsy();
        expect(wx.utils.isRxObservable(new String("foo"))).toBeFalsy();
        expect(wx.utils.isRxObservable(new Object())).toBeFalsy();
        expect(wx.utils.isRxObservable(function () { })).toBeFalsy();
        expect(wx.utils.isRxObservable(wx.command())).toBeFalsy();

        expect(wx.utils.isRxObservable(new Rx.Subject<any>())).toBeTruthy();
        expect(wx.utils.isRxObservable(new Rx.Subject<any>().asObservable())).toBeTruthy();
        expect(wx.utils.isRxObservable(Rx.Observable.return(true))).toBeTruthy();
        expect(wx.utils.isRxObservable(Rx.Observable.create(obs=> Rx.Disposable.empty))).toBeTruthy();
    });

    it("toggleCssClass smoke-test",() => {
        loadFixtures('templates/Core/Utils.html');

        var el = <HTMLMapElement> document.querySelector('#fixture');
        expect($(el)).toHaveClass("foo bar");

        // test with single class
        expect($(el)).not.toHaveClass("hidden");
        wx.utils.toggleCssClass(el, true, "hidden");
        expect($(el)).toHaveClass("hidden");

        wx.utils.toggleCssClass(el, false, "hidden");
        expect($(el)).not.toHaveClass("hidden");

        // everything should be as it was when we began
        expect($(el)).toHaveClass("foo bar");

        // test with multiple classes
        expect($(el)).not.toHaveClass("bold italic");
        wx.utils.toggleCssClass(el, true, "bold", "italic");
        expect($(el)).toHaveClass("bold italic");

        wx.utils.toggleCssClass(el, false, "bold", "italic");
        expect($(el)).not.toHaveClass("bold italic");

        // everything should be as it was when we began
        expect($(el)).toHaveClass("foo bar");
    });
});
