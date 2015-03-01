/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />

import Lazy = wx.Lazy;

describe("Lazy",() => {
    it("should not create value in constructor",() => {
        var creatorInvoked = false;

        var lazy = new Lazy(() => {
            creatorInvoked = true;
            return "foobar";
        });

        expect(creatorInvoked).toBeFalsy();
    });

    it("should create the value on access",() => {
        var creatorInvoked = false;

        var lazy = new Lazy(() => {
            creatorInvoked = true;
            return "foobar";
        });

        var dummy = lazy.value;
        expect(creatorInvoked).toBeTruthy();
    });

    it("should return the correct value",() => {
        var expectedValue = "foobar";
        var lazy = new Lazy(() => expectedValue );

        expect(lazy.value).toEqual(expectedValue);
    });
});
