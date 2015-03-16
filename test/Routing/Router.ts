/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />
/// <reference path="../TestUtils.ts" />
/// <reference path="../typings/l2o.d.ts" />
/// <reference path="../typings/ix.d.ts" />

describe('Routing',() => {
    var router = wx.injector.resolve<wx.IRouter>(wx.res.router);

    beforeEach(() => {
        router.reset();
        wx.app.history.reset();
    });

    afterEach(() => {
        wx.cleanNode(document.body);
    });

    describe('Router',() => {
        it('inferres route from state-name if not specified',() => {
            router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            router.go("foo");
            expect(router.current().uri).toEqual("/foo");

            router.reset();

            router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            router.go("foo.bar");
            expect(router.current().uri).toEqual("/foo/bar");
        });

        it('child state override views of parent',() => {
            router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            router.go("foo");
            expect(router.current().views['main']).toEqual("foo");

            router.go("foo.bar");
            expect(router.current().views['main']).toEqual("bar");
        });

        it('child states can override absolute-Uri',() => {
            router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            router.state({
                name: "foo.bar",
                route: "/baz/:id",
                views: {
                    'main': "bar"
                }
            });

            router.go("foo.bar", { id: 5 });
            expect(router.current().uri).toEqual("/baz/5");
        });

        it('current-route should reflect state-route hierarchy',() => {
            router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            router.go("foo");
            expect(router.current().uri).toEqual("/foo");

            router.go("foo.bar");
            expect(router.current().uri).toEqual("/foo/bar");

            router.reset();

            router.state({
                name: "foo",
                route: "foo/:fooId",
                views: {
                    'main': "foo"
                }
            });

            router.state({
                name: "foo.bar",
                route: "bar/:barId",
                views: {
                    'main': "bar"
                }
            });

            router.go("foo.bar", { fooId: 3, barId: 5 });
            expect(router.current().uri).toEqual("/foo/3/bar/5");
        });

        it('go() with history = true should push a history record',() => {
            router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            var fireCount = 0;
            wx.app.history.onPushState.subscribe(x => {
                fireCount++;
            });

            router.go("foo", {}, { location: true });
            expect(router.current().uri).toEqual("/foo");
            expect(fireCount).toEqual(1);
        });

        it('browser navigation picks up the correct state',() => {
            router.state({
                name: "foo",
                route: "foo/:fooId",
                views: {
                    'main': "foo"
                }
            });

            router.state({
                name: "foo.bar",
                route: "bar/:barId",
                views: {
                    'main': "bar"
                }
            });

            router.go("foo.bar", { fooId: 3, barId: 5 }, { location: true });
            expect(router.current().name).toEqual("foo.bar");
            expect(wx.app.history.length).toEqual(1);

            router.go("foo", { fooId: 3 }, { location: true });
            expect(router.current().name).toEqual("foo");
            expect(wx.app.history.length).toEqual(2);

            wx.app.history.back();
            expect(router.current().name).toEqual("foo.bar");
            expect(wx.app.history.length).toEqual(2);
        });
    });
});
