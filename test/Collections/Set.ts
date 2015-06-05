/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />
/// <reference path="../../node_modules/typescript/bin/lib.es6.d.ts" />

describe("ISet",() => {
    function crudSmokeTestImpl(forceEmulated: boolean) {
        var hs = wx.createSet<Object>(forceEmulated);
        var o1 = new Object();
        var o2 = new Object();

        expect(hs.size).toEqual(0);

        // add o1
        hs.add(o1);
        expect(hs.size).toEqual(1);
        expect(hs.has(o1)).toBeTruthy();
        // and again
        hs.add(o1);
        expect(hs.size).toEqual(1);
        expect(hs.has(o1)).toBeTruthy();
        expect(wx.setToArray(hs)[0]).toEqual(o1);
        expect(wx.setToArray(hs).indexOf(o1) !== -1).toBeTruthy();

        // add o2
        hs.add(o2);
        expect(hs.size).toEqual(2);
        expect(hs.has(o1)).toBeTruthy();
        expect(hs.has(o2)).toBeTruthy();
        expect(wx.setToArray(hs).length).toEqual(2);
        expect(wx.setToArray(hs).indexOf(o1) !== -1).toBeTruthy();
        expect(wx.setToArray(hs).indexOf(o2) !== -1).toBeTruthy();

        // remove o1
        hs.delete(o1);
        expect(hs.size).toEqual(1);
        expect(hs.has(o1)).toBeFalsy();
        expect(hs.has(o2)).toBeTruthy();
        expect(wx.setToArray(hs).length).toEqual(1);
        expect(wx.setToArray(hs).indexOf(o1) !== -1).toBeFalsy();
        expect(wx.setToArray(hs).indexOf(o2) !== -1).toBeTruthy();

        // remove o2
        hs.delete(o2);
        expect(hs.size).toEqual(0);
        expect(hs.has(o2)).toBeFalsy();
        expect(wx.setToArray(hs).length).toEqual(0);
        expect(wx.setToArray(hs).indexOf(o2) !== -1).toBeFalsy();
    }

    it("emulated: creation",() => {
        var hs = wx.createSet<Object>(true);
        expect(hs).not.toBeNull();
        expect(hs.isEmulated).toBeTruthy();
    });

    it("emulated: crud smoke-test",() => {
        crudSmokeTestImpl(true);
    });

    var hasNativeSupport = typeof Set === "function" && Set.prototype.hasOwnProperty("forEach")
        && Set.prototype.hasOwnProperty("add") && Set.prototype.hasOwnProperty("clear")
        && Set.prototype.hasOwnProperty("delete") && Set.prototype.hasOwnProperty("has");

    if (hasNativeSupport) {
        it("native: creation",() => {
            var hs = wx.createSet<Object>();
            expect(hs).not.toBeNull();
            expect(hs.isEmulated).toBeFalsy();
        });

        it("native: crud smoke-test",() => {
            crudSmokeTestImpl(false);
        });
    }
});
