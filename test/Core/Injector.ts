/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />

import IInjector = wx.IInjector;

function getInjector() {
    return wx.injector.get<IInjector>("wx.injector");
}

describe("Injector",() => {
    it("should support creating instances of itself",() => {
        var injector: IInjector;
        expect(() => injector = getInjector()).not.toThrowError();
        expect(injector).toBeDefined();
    });

    it("throws when attempting to get unregistered type",() => {
        var injector = getInjector();
        expect(() => injector.get("foo")).toThrowError(/not registered/);
    });

    it("get singleton",() => {
        var injector = getInjector();

        var foo = new Object();
        injector.register("foo", foo);
        var result;
        expect(() => result = injector.get("foo")).not.toThrowError();
        expect(result).toBe(foo);
    });

    it("get singleton primitive",() => {
        var injector = getInjector();

        var foo = "string";
        injector.register("foo", foo);
        var result;
        expect(() => result = injector.get("foo")).not.toThrowError();
        expect(result).toBe(foo);
    });

    it("get using factory method",() => {
        var injector = getInjector();

        var foo = new Object();
        injector.register("foo", () => foo);
        var result;
        expect(() => result = injector.get("foo")).not.toThrowError();
        expect(result).toBe(foo);

        // should always return a new instance
        injector.register("bar", () => new Object());
        expect(injector.get("bar")).not.toBe(injector.get("bar"));

        // should always return the same instance
        injector.register("baz", () => new Object(), true);
        expect(injector.get("baz")).toBe(injector.get("baz"));
    });

    it("get using inline array notation with additional args",() => {
        var injector = getInjector();
        var val;
        var arg1: any;

        var bar = { key: "baz" };
        injector.register("bar", () => bar);

        // foo factory method expecting dependency
        function foo(_bar: any, _arg1: any) {
            val = _bar.key;
            arg1 = _arg1;
        };

        injector.register("foo", ["bar", foo]);

        var result;
        expect(() => result = injector.get("foo", ["test"])).not.toThrowError();
        expect(arg1).toEqual("test");
    });

    it("get inline using array notation",() => {
        var injector = getInjector();

        var foo = new Object();
        injector.register("foo", () => foo);

        var bar = { key: "baz" };
        injector.register("bar", () => bar);

        // foo factory method expecting dependency
        injector.register("test1", ["foo", "bar", Tuple]);
        injector.register("test2", ["foo", "bar", Tuple]);

        var result:Tuple<any, any>;
        expect(() => result = injector.get<Tuple<any, any>>("test1")).not.toThrowError();
        expect(result.Item1).toBe(foo);
        expect(result.Item2.key).toEqual("baz");

        // should return different items because not registered as singleton
        expect(injector.get<Tuple<any, any>>("test1")).not.toBe(injector.get<Tuple<any, any>>("test1"));

        // should return same item because not registered as singleton
        expect(injector.get<Tuple<any, any>>("test2")).not.toBe(injector.get<Tuple<any, any>>("test2"));
    });

    it("resolve inline annotated array",() => {
        var injector = getInjector();

        var foo = new Object();
        injector.register("foo",() => foo);

        var bar = { key: "baz" };
        injector.register("bar",() => bar);

        var result: Tuple<any, any>;
        expect(() => result = injector.resolve<Tuple<any, any>>(["foo", "bar", Tuple])).not.toThrowError();
        expect(result.Item1).toBe(foo);
        expect(result.Item2.key).toEqual("baz");
    });

    it("properly detects circular dependencies",() => {
        var injector = getInjector();

        injector.register("foo", ["bar", (_bar) => 1]);
        injector.register("bar", ["foo", (_foo) => 2]);

        expect(() => injector.get("bar")).toThrowError(/circular dependency/);
    });
});
