/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../../build/xircular.d.ts" />

describe("WeakMap",() => {
    function crudSmokeTestImpl(forceEmulated: boolean) {
        var wm = xi.weakmap<String, Object>(forceEmulated);

        // set/has/get
        var key = new String("foo");
        var foo = new Object();
        wm.set(key, foo);
        expect(wm.has(key)).toBeTruthy();
        expect(wm.get(key)).toBe(foo);

        // set/has/get
        wm.delete(key);
        expect(wm.has(key)).toBeFalsy();
        expect(wm.get(key)).toBe(undefined);
    };

    it("emulated: creation",() => {
        var wm = xi.weakmap<String, Object>(true);
        expect(wm).not.toBeNull();
        expect(wm.isEmulatedWeakMap).toBeTruthy();
    });

    it("emulated: crud smoke-test",() => {
        crudSmokeTestImpl(true);
    });

    if (typeof WeakMap === "function") {
        it("native: creation",() => {
            var wm = xi.weakmap<String, Object>();
            expect(wm).not.toBeNull();
            expect(wm.isEmulatedWeakMap).toBeFalsy();
        });

        it("native: crud smoke-test",() => {
            crudSmokeTestImpl(false);
        });
    }
});
