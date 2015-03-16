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

        it('currentState path should reflect state url hierarchy',() => {
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
            expect(router.currentState().absolutePath).toEqual("/foo");

            router.go("foo.bar");
            expect(router.currentState().absolutePath).toEqual("/foo/bar");

            router.resetStates();

            router.registerState({
                name: "foo",
                path: "foo/:fooId",
                views: {
                    'main': "foo"
                }
            });

            router.registerState({
                name: "foo.bar",
                path: "bar/:barId",
                views: {
                    'main': "bar"
                }
            });

            router.go("foo.bar", { fooId: 3, barId: 5 });
            expect(router.currentState().absolutePath).toEqual("/foo/3/bar/5");
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
            expect(router.currentState().absolutePath).toEqual("/foo");
            expect(fireCount).toEqual(1);
        });
    });
});
