/// <reference path="../../typings/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-jquery.d.ts" />
/// <reference path="../../../src/web.rx.d.ts" />
/// <reference path="../../typings/URI.d.ts" />
/// <reference path="../../TestUtils.ts" />

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
        describe('StateRef',() => {
            it('binds using simple options',() => {
                loadFixtures('templates/Routing/Bindings/StateRef.html');

                router.state({
                    name: "foo"
                });

                var el = <HTMLAnchorElement> document.querySelector("#fixture1");
                var model = {};
                expect(() => wx.applyBindings(model, el)).not.toThrow();

                expect(new URI(el.href).pathname()).toEqual("/foo");
            });

            it('binds using complex options',() => {
                loadFixtures('templates/Routing/Bindings/StateRef.html');

                router.state({
                    name: "foo",
                    url: "foo/:bar"
                });

                var el = <HTMLAnchorElement> document.querySelector("#fixture2");

                var model = {
                    stringProp: wx.property("voodoo"),
                    boolProp: wx.property(false)
                };

                expect(() => wx.applyBindings(model, el)).not.toThrow();

                expect(new URI(el.href).pathname()).toEqual("/foo/voodoo");

                // link should update in response to an observable property change
                model.stringProp("magic");
                expect(new URI(el.href).pathname()).toEqual("/foo/magic");
            });

            it('state-name can be observable too',() => {
                loadFixtures('templates/Routing/Bindings/StateRef.html');

                router.state({
                    name: "foo"
                }).state({
                    name: "bar"
                });

                var el = <HTMLAnchorElement> document.querySelector("#fixture3");
                var model = { state: wx.property("foo") };
                expect(() => wx.applyBindings(model, el)).not.toThrow();

                expect(new URI(el.href).pathname()).toEqual("/foo");
                model.state("bar");
                expect(new URI(el.href).pathname()).toEqual("/bar");
            });

            it('clicking an anchor element should trigger a state-transition',() => {
                loadFixtures('templates/Routing/Bindings/StateRef.html');

                router.state({
                    name: "foo"
                });

                var el = <HTMLAnchorElement> document.querySelector("#fixture1");
                var model = {};
                expect(() => wx.applyBindings(model, el)).not.toThrow();

                expect(router.current().name).toEqual("$");

                testutils.triggerEvent(el, "click");
                expect(router.current().name).toEqual("foo");
            });

            it('clicking a button element should trigger a state-transition',() => {
                loadFixtures('templates/Routing/Bindings/StateRef.html');

                router.state({
                    name: "foo"
                });

                var el = <HTMLElement> document.querySelector("#fixture4");
                var model = {};
                expect(() => wx.applyBindings(model, el)).not.toThrow();

                expect(router.current().name).toEqual("$");

                testutils.triggerEvent(el, "click");
                expect(router.current().name).toEqual("foo");
            });
        });
    });
});
