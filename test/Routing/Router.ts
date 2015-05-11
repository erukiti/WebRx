/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />
/// <reference path="../TestUtils.ts" />
/// <reference path="../typings/l2o.d.ts" />
/// <reference path="../typings/ix.d.ts" />

describe('Routing',() => {
    beforeEach(() => {
        wx.router.reset();
        wx.app.history.reset();
    });

    afterEach(() => {
        wx.cleanNode(document.body);
    });

    describe('Router',() => {
        it('throws on attempt to register invalid state-path',() => {
            expect(()=> wx.router.state({
                name: "fo$o"
            })).toThrowError(/invalid state-path/);
        });

        it('infers route from state-name if not specified',() => {
            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            wx.router.go("foo");
            expect(wx.router.current().url).toEqual("/foo");

            wx.router.reset();

            wx.router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar");
            expect(wx.router.current().url).toEqual("/foo/bar");
        });

        it('preserves properties which have been manually added to current state params',() => {
            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo", {}, { location: true });
            wx.router.updateCurrentStateParams((params) => params.baz = 42);

            wx.router.go("foo.bar", {}, { location: true });
            wx.app.history.back();
            expect(wx.router.current().params.baz).toEqual(42);

            wx.app.history.forward();
            wx.router.updateCurrentStateParams((params) => params.foobar = 3);
            wx.app.history.back();
            wx.app.history.forward();
            expect(wx.router.current().params.foobar).toEqual(3);
        });

        it('child states inherit views of parent',() => {
            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo",
                    'details': "baz"
                }
            });

            wx.router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar");
            expect(wx.router.current().views['details']).toEqual("baz");
        });

        it('child states inherit params of parent',() => {
            wx.router.state({
                name: "foo",
                params: {
                    'main': "foo",
                    'details': "baz"
                }
            });

            wx.router.state({
                name: "foo.bar",
                params: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar");
            expect(wx.router.current().params['details']).toEqual("baz");
        });

        it('child states can override views of parent',() => {
            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo");
            expect(wx.router.current().views['main']).toEqual("foo");

            wx.router.go("foo.bar");
            expect(wx.router.current().views['main']).toEqual("bar");
        });

        it('child states can override current.url',() => {
            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                route: "/baz/:id",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar", { id: 5 });
            expect(wx.router.current().url).toEqual("/baz/5");
        });

        it('current.url reflects state-hierarchy',() => {
            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo");
            expect(wx.router.current().url).toEqual("/foo");

            wx.router.go("foo.bar");
            expect(wx.router.current().url).toEqual("/foo/bar");

            wx.router.reset();

            wx.router.state({
                name: "foo",
                route: "foo/:fooId",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                route: "bar/:barId",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar", { fooId: 3, barId: 5 });
            expect(wx.router.current().url).toEqual("/foo/3/bar/5");
        });

        it('go() with history = true pushes a history record',() => {
            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            wx.router.go("foo", {}, { location: true });
            expect(wx.router.current().url).toEqual("/foo");
            expect(wx.app.history.length).toEqual(1);
        });

        it('transitions to the the correct state on history.popstate event',() => {
            wx.router.state({
                name: "foo",
                route: "foo/:fooId",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                route: "bar/:barId",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar", { fooId: 3, barId: 5 }, { location: true });
            expect(wx.router.current().name).toEqual("foo.bar");

            wx.router.go("foo", { fooId: 3 }, { location: true });
            expect(wx.router.current().name).toEqual("foo");

            wx.app.history.back();
            expect(wx.router.current().name).toEqual("foo.bar");

            wx.app.history.forward();
            expect(wx.router.current().name).toEqual("foo");
        });

        it('monitors wx.app.title and reflects current value in document.title',() => {
            expect(wx.app.title()).not.toEqual("foo");
            expect(document.title).not.toEqual("foo");

            wx.app.title("foo");
            expect(document.title).toEqual(wx.app.title());

            wx.router.state({
                name: "foo.bar",
                route: "bar/:barId",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar", { barId: 5 }, { location: true });
            wx.app.title("bar");
            expect(document.title).toEqual(wx.app.title());

            wx.app.history.back();
            expect(document.title).toEqual("foo");
            expect(document.title).toEqual(wx.app.title());

            wx.app.history.forward();
            expect(document.title).toEqual("bar");
            expect(wx.router.is("foo.bar", { barId: 5 })).toBeTruthy();
        });

        it('includes() correctly tests child and parent states including params',() => {
            wx.router.state({
                name: "foo",
                route: "foo/:fooId",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                route: "bar/:barId",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar", { fooId: 3, barId: 5 }, { location: true });
            expect(wx.router.includes("foo")).toBeTruthy();
            expect(wx.router.includes("foo.bar")).toBeTruthy();
            expect(wx.router.includes("baz")).toBeFalsy();

            expect(wx.router.includes("foo.bar", { fooId: 3 })).toBeTruthy();
            expect(wx.router.includes("foo.bar", { fooId: 5 })).toBeFalsy();

            expect(wx.router.includes("foo.bar", { fooId: 3, barId: 5 })).toBeTruthy();
        });

        it('is() correctly tests state including missing-, too many-, too few-params or different param values',() => {
            wx.router.state({
                name: "foo.bar",
                route: "bar/:barId",
                params: { fooId: 3 },
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar", { fooId: 3, barId: 5 }, { location: true });
            expect(wx.router.is("foo")).toBeFalsy();

            // no params
            expect(wx.router.is("foo.bar")).toBeFalsy();

            // too few params
            expect(wx.router.is("foo.bar", { fooId: 3 })).toBeFalsy();

            // too many params
            expect(wx.router.is("foo.bar", { fooId: 3, barId: 5, bazId: 10 })).toBeFalsy();

            // matching names but not values
            expect(wx.router.is("foo.bar", { fooId: 3, barId: 42 })).toBeFalsy();

            // should match
            expect(wx.router.is("foo.bar", { fooId: 3, barId: 5 })).toBeTruthy();
        });

        it('correctly maps parent path if parent is registered',() => {
            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar", { fooId: 3, barId: 5 }, { location: true });
            expect(wx.router.current().name).toEqual("foo.bar");

            // now go "up"
            wx.router.go("^");
            expect(wx.router.current().name).toEqual("foo");
        });

        it('correctly maps parent path to root if parent is _not_ registered',() => {
            wx.router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar", { fooId: 3, barId: 5 }, { location: true });
            expect(wx.router.current().name).toEqual("foo.bar");

            // now go "up"
            wx.router.go("^");
            expect(wx.router.current().name).toEqual("$");
        });

        it('correctly maps sibling-path if both sibling and parent are registered',() => {
            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.state({
                name: "foo.baz",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar", { fooId: 3, barId: 5 }, { location: true });
            expect(wx.router.current().name).toEqual("foo.bar");

            // now go "up"
            wx.router.go("^.baz");
            expect(wx.router.current().name).toEqual("foo.baz");
        });

        it('correctly maps sibling-path if sibling is registered and parent is not',() => {
            wx.router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.state({
                name: "foo.baz",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo.bar", { fooId: 3, barId: 5 }, { location: true });
            expect(wx.router.current().name).toEqual("foo.bar");

            // now go "up"
            wx.router.go("^.baz");
            expect(wx.router.current().name).toEqual("foo.baz");
        });

        it('correctly maps child-path if child is registered',() => {
            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo");
            expect(wx.router.current().name).toEqual("foo");

            // now go "down"
            wx.router.go(".bar");
            expect(wx.router.current().name).toEqual("foo.bar");
        });

        it('invokes enter- and leave-callbacks',() => {
            var fooEntered = false;
            var fooLeft = false;

            wx.router.state({
                name: "foo",
                views: {
                    'main': "foo"
                },
                onEnter: () => fooEntered = true,
                onLeave: () => fooLeft = true
            });

            wx.router.state({
                name: "bar",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("foo");
            expect(fooEntered).toBeTruthy();
            expect(fooLeft).toBeFalsy();

            wx.router.go("bar");
            expect(fooLeft).toBeTruthy();
        });

        it('sync() correctly inferes the state from the browsers current location',() => {
            wx.router.state({
                name: "foo",
                route: "foo/:fooId",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "bar",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                route: "bar/:barId",
                views: {
                    'main': "bar"
                }
            });

            wx.router.go("$", { }, { location: 2 });
            expect(wx.router.is("$")).toBeTruthy();

            wx.app.history.location.pathname = "/foo";
            wx.router.sync();
            expect(wx.router.is("foo", { fooId: 3 })).toBeFalsy();

            wx.app.history.location.pathname = "/foo/3";
            wx.router.sync();
            expect(wx.router.is("foo", { fooId: 3 })).toBeTruthy();

            wx.app.history.location.pathname = "/bar";
            wx.router.sync();
            expect(wx.router.is("bar", { })).toBeTruthy();

            wx.app.history.location.pathname = "/foo/3/bar/5";
            wx.router.sync();
            expect(wx.router.is("foo.bar", { fooId: 3, barId: 5 })).toBeTruthy();

            wx.app.history.location.pathname = "/";
            wx.router.sync();
            expect(wx.router.is("$")).toBeTruthy();
        });

        it('getViewComponent() only returns params present at the state that introduced the view into the hierarchy',() => {
            wx.router.state({
                name: "foo",
                route: "foo/:fooId",
                params: { baz: 3 },
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.bar",
                route: "bar/:barId",
                views: {
                    'main': "foo"
                }
            });

            wx.router.state({
                name: "foo.baz",
                route: "bar/:barId",
                views: {
                    'main': {
                        component: "foo",
                        animations: {
                            leave: "leave",
                            enter: "enter "
                        }
                    }
                }
            });

            wx.router.state({
                name: "foo.bad",
                route: "bar/:barId",
                views: {
                    'details': "bar"
                }
            });


            wx.router.go("foo", { fooId: 3 }, { location: true });
            var config = wx.router.getViewComponent("main");
            expect(config.component).toEqual("foo");
            expect(Object.keys(config.params)).toEqual(["baz", "fooId"]);

            // test using derived state that uncessearily includes the 'main' view
            wx.router.go("foo.bar", { fooId: 3, barId: 5 }, { location: true });
            config = wx.router.getViewComponent("main");
            expect(config.component).toEqual("foo");
            expect(Object.keys(config.params)).toEqual(["baz", "fooId"]);

            // test using derived state inherits the 'main' view from state "foo"
            wx.router.go("foo.bad", { fooId: 3, barId: 5 }, { location: true });
            config = wx.router.getViewComponent("main");
            expect(config.component).toEqual("foo");
            expect(Object.keys(config.params)).toEqual(["baz", "fooId"]);

            // views configured using object rather than string
            wx.router.go("foo.baz", { fooId: 3, barId: 5 }, { location: true });
            config = wx.router.getViewComponent("main");
            expect(config.component).toEqual("foo");
            expect(Object.keys(config.params)).toEqual(["baz", "fooId"]);
            expect(config.animations).toBeDefined();
        });
    });
});
