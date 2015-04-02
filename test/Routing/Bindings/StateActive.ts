/// <reference path="../../typings/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-jquery.d.ts" />
/// <reference path="../../../build/web.rx.d.ts" />
/// <reference path="../../typings/URI.d.ts" />

describe('Routing',() => {
    var router = wx.injector.get<wx.IRouter>(wx.res.router);

    beforeEach(() => {
        router.reset();
        wx.app.history.reset();
    });

    afterEach(() => {
        wx.cleanNode(document.body);
    });

    describe('Bindings',() => {
        describe('StateActive',() => {
            it('binds using simple options',() => {
                loadFixtures('templates/Routing/Bindings/StateActive.html');

                router.state({
                    name: "foo"
                });

                var el = <HTMLAnchorElement> document.querySelector("#fixture1");
                var model = {};
                expect(() => wx.applyBindings(model, el)).not.toThrow();
                expect(el).not.toHaveClass("active");

                router.go("foo");
                expect(el).toHaveClass("active");
            });

            it('binds using params',() => {
                loadFixtures('templates/Routing/Bindings/StateActive.html');

                router.state({
                    name: "foo"
                });

                var el = <HTMLAnchorElement> document.querySelector("#fixture2");
                var model = {};
                expect(() => wx.applyBindings(model, el)).not.toThrow();
                expect(el).not.toHaveClass("active");

                router.go("foo", { id: 1 });
                expect(el).not.toHaveClass("active");

                router.go("foo", { id: 3 });
                expect(el).toHaveClass("active");
            });

            it('does not use strict equality when comparing params',() => {
                loadFixtures('templates/Routing/Bindings/StateActive.html');

                router.state({
                    name: "foo"
                });

                var el = <HTMLAnchorElement> document.querySelector("#fixture2");
                var model = {};
                expect(() => wx.applyBindings(model, el)).not.toThrow();
                expect(el).not.toHaveClass("active");

                router.go("foo", { id: 1 });
                expect(el).not.toHaveClass("active");

                router.go("foo", { id: "3" });
                expect(el).toHaveClass("active");
            });

            it('observes params',() => {
                loadFixtures('templates/Routing/Bindings/StateActive.html');

                router.state({
                    name: "foo"
                });

                var el = <HTMLAnchorElement> document.querySelector("#fixture3");
                var model = { stringProp: wx.property("5") };
                expect(() => wx.applyBindings(model, el)).not.toThrow();
                expect(el).not.toHaveClass("active");

                router.go("foo", { id: 1 });
                expect(el).not.toHaveClass("active");

                model.stringProp("1");
                expect(el).toHaveClass("active");
            });
        });
    });
});
