/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../../build/xircular.d.ts" />

import IInjector = wx.IInjector;

function getInjector() {
    return wx.injector.resolve<IInjector>("wx.injector");
}

describe("Injector",() => {
    it("should support creating instances of itself",() => {
        var injector: IInjector;
        expect(() => injector = getInjector()).not.toThrowError();
        expect(injector).toBeDefined();
    });

    it("throws when attempting to resolve unregistered type",() => {
        var injector = getInjector();
        expect(() => injector.resolve("foo")).toThrowError(/not registered/);
    });

    it("resolve singleton registration",() => {
        var injector = getInjector();

        var foo = new Object();
        injector.register("foo", foo);
        var result;
        expect(() => result = injector.resolve("foo")).not.toThrowError();
        expect(result).toBe(foo);
    });

    it("resolve singleton primitive registration",() => {
        var injector = getInjector();

        var foo = "string";
        injector.register("foo", foo);
        var result;
        expect(() => result = injector.resolve("foo")).not.toThrowError();
        expect(result).toBe(foo);
    });

    it("resolve factory method registration",() => {
        var injector = getInjector();

        var foo = new Object();
        injector.register("foo", false,() => foo);
        var result;
        expect(() => result = injector.resolve("foo")).not.toThrowError();
        expect(result).toBe(foo);

        // should always return a new instance
        injector.register("bar", false, () => new Object());
        expect(injector.resolve("bar")).not.toBe(injector.resolve("bar"));

        // should always return the same instance
        injector.register("baz", true, () => new Object());
        expect(injector.resolve("baz")).toBe(injector.resolve("baz"));
    });

    it("resolve inline array notation registration",() => {
        var injector = getInjector();
        var val;

        var bar = { key: "baz" };
        injector.register("bar", false, () => bar);

        // foo factory method expecting dependency
        var foo = (_bar: any) => {
            val = _bar.key;

            return "done";
        };

        injector.register("foo", false, false, ["bar", foo]);

        var result;
        expect(() => result = injector.resolve("foo")).not.toThrowError();
        expect(result).toEqual("done");
        expect(val).toEqual("baz");
    });

    it("resolve inline array notation registration for constructor",() => {
        var injector = getInjector();

        var foo = new Object();
        injector.register("foo", false, () => foo);

        var bar = { key: "baz" };
        injector.register("bar", false, () => bar);

        // foo factory method expecting dependency
        injector.register("test1", false, true, ["foo", "bar", Tuple]);
        injector.register("test2", false, true, ["foo", "bar", Tuple]);

        var result:Tuple<any, any>;
        expect(() => result = injector.resolve<Tuple<any, any>>("test1")).not.toThrowError();
        expect(result.Item1).toBe(foo);
        expect(result.Item2.key).toEqual("baz");

        // should return different items because not registered as singleton
        expect(injector.resolve<Tuple<any, any>>("test1")).not.toBe(injector.resolve<Tuple<any, any>>("test1"));

        // should return same item because not registered as singleton
        expect(injector.resolve<Tuple<any, any>>("test2")).not.toBe(injector.resolve<Tuple<any, any>>("test2"));
    });

    it("properly detects circular dependencies",() => {
        var injector = getInjector();

        injector.register("foo", false, false, ["bar", (_bar) => 1]);
        injector.register("bar", false, false, ["foo", (_foo) => 2]);

        expect(() => injector.resolve("bar")).toThrowError(/circular dependency/);
    });
});
