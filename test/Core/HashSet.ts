/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../../build/xircular.d.ts" />

import HashSet = wx.HashSet;

describe("HashSet",() => {
    it("smoke-test",() => {
        var hs = new HashSet<Object>();
        var o1 = new Object();
        var o2 = new Object();

        expect(hs.length).toEqual(0);

        // add o1
        hs.add(o1);
        expect(hs.length).toEqual(1);
        expect(hs.contains(o1)).toBeTruthy();
        // and again
        hs.add(o1);
        expect(hs.length).toEqual(1);
        expect(hs.contains(o1)).toBeTruthy();
        expect(hs.values[0]).toEqual(o1);
        expect(hs.values.indexOf(o1) !== -1).toBeTruthy();
        
        // add o2
        hs.add(o2);
        expect(hs.length).toEqual(2);
        expect(hs.contains(o1)).toBeTruthy();
        expect(hs.contains(o2)).toBeTruthy();
        expect(hs.values.length).toEqual(2);
        expect(hs.values.indexOf(o1) !== -1).toBeTruthy();
        expect(hs.values.indexOf(o2) !== -1).toBeTruthy();

        // remove o1
        hs.remove(o1);
        expect(hs.length).toEqual(1);
        expect(hs.contains(o1)).toBeFalsy();
        expect(hs.contains(o2)).toBeTruthy();
        expect(hs.values.length).toEqual(1);
        expect(hs.values.indexOf(o1) !== -1).toBeFalsy();
        expect(hs.values.indexOf(o2) !== -1).toBeTruthy();

        // remove o2
        hs.remove(o2);
        expect(hs.length).toEqual(0);
        expect(hs.contains(o2)).toBeFalsy();
        expect(hs.values.length).toEqual(0);
        expect(hs.values.indexOf(o2) !== -1).toBeFalsy();
    });
});
