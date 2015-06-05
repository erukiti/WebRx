/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />
/// <reference path="../TestUtils.ts" />
/// <reference path="../typings/l2o.d.ts" />
/// <reference path="../typings/ix.d.ts" />

describe('Routing', () => {
    describe('RouteMatcher', () => {
        describe('parse', () => {
            it('regex route', () => {
                var r = wx.route(/^(users?)(?:\/(\d+)(?:\.\.(\d+))?)?/);
                expect(r.parse("foo")).toBe(null);
                expect(r.parse("user")).toEqual({ captures: ["user", undefined, undefined] });
                expect(r.parse("users")).toEqual({ captures: ["users", undefined, undefined] });
                expect(r.parse("user/123")).toEqual({ captures: ["user", "123", undefined] });
                expect(r.parse("user/123..456")).toEqual({ captures: ["user", "123", "456"] });
            });

            it('string route, basic', () => {
                var r = wx.route("users");
                expect(r.parse("fail")).toBe(null);
                expect(r.parse("users/")).toBe(null);
                expect(r.parse("users/foo")).toBe(null);
                expect(r.parse("users")).toEqual({});
            });

            it('string route, one variable', () => {
                var r = wx.route("users/:id");
                expect(r.parse("users")).toBe(null);
                expect(r.parse("users/123/456")).toBe(null);
                expect(r.parse("users/")).toEqual({ id: "" });
                expect(r.parse("users/123")).toEqual({ id: "123" });
            });

            it('string route, multiple variables', () => {
                var r = wx.route("users/:id/:other");
                expect(r.parse("users")).toBe(null);
                expect(r.parse("users/123")).toBe(null);
                expect(r.parse("users/123/456")).toEqual({ id: "123", other: "456" });
            });

            it('string route, one splat', () => {
                var r = wx.route("users/*stuff");
                expect(r.parse("users")).toBe(null);
                expect(r.parse("users/")).toEqual({ stuff: "" });
                expect(r.parse("users/123")).toEqual({ stuff: "123" });
                expect(r.parse("users/123/456")).toEqual({ stuff: "123/456" });
            });

            it('string route, multiple splats', () => {
                var r = wx.route("users/*stuff/*more");
                expect(r.parse("users")).toBe(null);
                expect(r.parse("users/123")).toBe(null);
                expect(r.parse("users/123/")).toEqual({ stuff: "123", more: "" });
                expect(r.parse("users//123")).toEqual({ stuff: "", more: "123" });
                expect(r.parse("users//")).toEqual({ stuff: "", more: "" });
                expect(r.parse("users///123")).toEqual({ stuff: "/", more: "123" });
                expect(r.parse("users/123/456")).toEqual({ stuff: "123", more: "456" });
                expect(r.parse("users/123/456/789")).toEqual({ stuff: "123/456", more: "789" });
            });

            it('string route, variables and splats', () => {
                var r = wx.route("users/:id/foo/*stuff/:other/*more");
                expect(r.parse("users/123/foo/aaa/456/bbb")).toEqual({ id: "123", other: "456", stuff: "aaa", more: "bbb" });

                r = wx.route("users/:id/:other/*stuff/*more");
                expect(r.parse("users/123/456/aaa/bbb/ccc")).toEqual({ id: "123", other: "456", stuff: "aaa/bbb", more: "ccc" });
            });

            // These were pulled from the backbone.js unit tests.
            it('a few backbone.js test routes', () => {
                var r = wx.route("search/:query/p:page");
                expect(r.parse("search/boston/p20")).toEqual({ query: "boston", page: "20" });

                r = wx.route("*first/complex-:part/*rest");
                expect(r.parse("one/two/three/complex-part/four/five/six/seven")).toEqual({ first: "one/two/three", part: "part", rest: "four/five/six/seven" });

                r = wx.route(":entity?*args");
                expect(r.parse("cowboy?a=b&c=d")).toEqual({ entity: "cowboy", args: "a=b&c=d" });

                r = wx.route("*anything");
                expect(r.parse("doesnt-match-a-route")).toEqual({ anything: "doesnt-match-a-route" });
            });

            it('specific matching rules', () => {
                var digitsOnlyFn = value => value.match(/^\d+$/);
                var digitsOnlyRe = /^\d+$/;

                var r = wx.route("users/:id", { id: digitsOnlyRe });
                expect(r.parse("users")).toBe(null);
                expect(r.parse("users/")).toBe(null);
                expect(r.parse("users/abc")).toBe(null);
                expect(r.parse("users/123.456")).toBe(null);
                expect(r.parse("users/123")).toEqual({ id: "123" });

                r = wx.route("users/:id", { id: digitsOnlyFn });
                expect(r.parse("users/abc")).toBe(null);
                expect(r.parse("users/123.456")).toBe(null);
                expect(r.parse("users/123")).toEqual({ id: "123" });

                r = wx.route("users/:id", { id: 456 });
                expect(r.parse("users/123")).toBe(null);
                expect(r.parse("users/456")).toEqual({ id: "456" });

                r = wx.route("users/:id", { id: "abc123" });
                expect(r.parse("users/abc")).toBe(null);
                expect(r.parse("users/abc123")).toEqual({ id: "abc123" });

                r = wx.route("users/:id/:other", { id: digitsOnlyRe, other: digitsOnlyFn });
                expect(r.parse("users/abc/def")).toBe(null);
                expect(r.parse("users/abc/123")).toBe(null);
                expect(r.parse("users/123/abc")).toBe(null);
                expect(r.parse("users/123/456")).toEqual({ id: "123", other: "456" });
            });
        });

        describe('stringify', () => {
            it('regex route', () => {
                var r = wx.route(/^(users?)(?:\/(\d+)(?:\.\.(\d+))?)?/);
                expect(r.stringify("anything")).toBe("");
            });

            it('one variable',() => {
                var r = wx.route("users/:id");
                expect(r.stringify({ id: "123" })).toBe("users/123");
                expect(r.stringify({ id: "" })).toBe("users/");
                expect(r.stringify({})).toBe("users/");
                expect(r.stringify()).toBe("users/");
            });

            it('multiple variables',() => {
                var r = wx.route("users/:id/:other");
                expect(r.stringify({ id: "123", other: "456" })).toBe("users/123/456");
                expect(r.stringify({ id: "", other: "456" })).toBe("users//456");
                expect(r.stringify({ id: "123", other: "" })).toBe("users/123/");
                expect(r.stringify({ id: "", other: "" })).toBe("users//");
                expect(r.stringify({ id: "123" })).toBe("users/123/");
                expect(r.stringify({ other: "456" })).toBe("users//456");
                expect(r.stringify({})).toBe("users//");
                expect(r.stringify()).toBe("users//");
            });

            it('one splat',() => {
                var r = wx.route("users/*stuff");
                expect(r.stringify({ stuff: "" })).toBe("users/");
                expect(r.stringify({ stuff: "123" })).toBe("users/123");
                expect(r.stringify({ stuff: "123/456" })).toBe("users/123/456");
                expect(r.stringify({})).toBe("users/");
                expect(r.stringify()).toBe("users/");
            });

            it('multiple splats',() => {
                var r = wx.route("users/*stuff/*more");
                expect(r.stringify({ stuff: "123", more: "456" })).toBe("users/123/456");
                expect(r.stringify({ stuff: "123", more: "" })).toBe("users/123/");
                expect(r.stringify({ stuff: "", more: "123" })).toBe("users//123");
                expect(r.stringify({ stuff: "", more: "" })).toBe("users//");
                expect(r.stringify({})).toBe("users//");
                expect(r.stringify()).toBe("users//");
            });

            it('possibly conflicting param names',() => {
                var r = wx.route(":a/:aa/*aaa/*aaaa");
                expect(r.stringify({ a: 1, aa: 2, aaa: 3, aaaa: 4 })).toBe("1/2/3/4");
                expect(r.stringify({ aaaa: 4, aaa: 3, aa: 2, a: 1 })).toBe("1/2/3/4");
            });
        });
    });
});
