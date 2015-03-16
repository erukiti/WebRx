/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />
/// <reference path="../TestUtils.ts" />
/// <reference path="../typings/l2o.d.ts" />
/// <reference path="../typings/ix.d.ts" />

describe('Routing',() => {
    var router = wx.injector.resolve<wx.IRouter>(wx.res.router);

    beforeEach(() => {
        router.resetStates();
        wx.app.history.reset();
    });

    afterEach(() => {
        wx.cleanNode(document.body);
    });

    describe('Router',() => {
        it('child state should override views of parent',() => {
            router.registerState({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            router.registerState({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            router.go("foo");
            expect(router.currentState().views['main']).toEqual("foo");

            router.go("foo.bar");
            expect(router.currentState().views['main']).toEqual("bar");
        });

        it('child states can override absolute-Uri',() => {
            router.registerState({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            router.registerState({
                name: "foo.bar",
                route: "/baz/:id",
                views: {
                    'main': "bar"
                }
            });

            router.go("foo.bar", { id: 5 });
            expect(router.currentState().absoluteUri).toEqual("/baz/5");
        });

        it('currentState-route should reflect state-route hierarchy',() => {
            router.registerState({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            router.registerState({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            router.go("foo");
            expect(router.currentState().absoluteUri).toEqual("/foo");

            router.go("foo.bar");
            expect(router.currentState().absoluteUri).toEqual("/foo/bar");

            router.resetStates();

            router.registerState({
                name: "foo",
                route: "foo/:fooId",
                views: {
                    'main': "foo"
                }
            });

            router.registerState({
                name: "foo.bar",
                route: "bar/:barId",
                views: {
                    'main': "bar"
                }
            });

            router.go("foo.bar", { fooId: 3, barId: 5 });
            expect(router.currentState().absoluteUri).toEqual("/foo/3/bar/5");
        });

        it('go(history: true) should push a history record',() => {
            router.registerState({
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
            expect(router.currentState().absoluteUri).toEqual("/foo");
            expect(fireCount).toEqual(1);
        });

        it('navigating back should pick up the correct state',() => {
            router.registerState({
                name: "foo",
                route: "foo/:fooId",
                views: {
                    'main': "foo"
                }
            });

            router.registerState({
                name: "foo.bar",
                route: "bar/:barId",
                views: {
                    'main': "bar"
                }
            });

            router.go("foo.bar", { fooId: 3, barId: 5 }, { location: true });
            expect(router.currentState().name).toEqual("foo.bar");
            expect(wx.app.history.length).toEqual(1);

            router.go("foo", { fooId: 3 }, { location: true });
            expect(router.currentState().name).toEqual("foo");
            expect(wx.app.history.length).toEqual(2);

            wx.app.history.back();
            expect(router.currentState().name).toEqual("foo.bar");
            expect(wx.app.history.length).toEqual(2);
        });
    });
});
