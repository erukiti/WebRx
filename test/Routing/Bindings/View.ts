/// <reference path="../../typings/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-jquery.d.ts" />
/// <reference path="../../../src/web.rx.d.ts" />
/// <reference path="../../TestUtils.ts" />

describe('Routing', () => {
    var router = wx.injector.get<wx.IRouter>(wx.res.router);
    var domManager = wx.injector.get<wx.IDomManager>(wx.res.domManager);

    beforeEach(() => {
        router.reset();
        wx.app.history.reset();

        testutils.ensureDummyAnimations();
    });

    afterEach(() => {
        wx.cleanNode(document.body);
    });

    describe('Bindings',() => {
        function testImpl(animated: boolean) {
            describe('View' + (animated ? " - animated" : ""), () => {
                it('binds using view name', () => {
                    loadFixtures('templates/Routing/Bindings/View.html');

                    var el = document.querySelector("#fixture1");
                    var model = {};
                    expect(() => wx.applyBindings(model, el)).not.toThrow();
                });

                it('reacts to router state change by instantiating designated component', () => {
                    loadFixtures('templates/Routing/Bindings/View.html');

                    var items = [3, 2, 1];

                    if (!animated) {
                        router.state({
                            name: "foo",
                            views: {
                                'main': {
                                    component: "wx-select",
                                    params: {
                                        items: items
                                    }
                                }
                            }
                        });
                    } else {
                        router.state({
                            name: "foo",
                            views: {
                                'main': {
                                    component: "wx-select",
                                    params: {
                                        items: items
                                    },
                                    animations: {
                                        enter: "dummyEnter",
                                        leave: "dummyLeave"
                                    }
                                }
                            }
                        });
                    }

                    var el = <HTMLElement> document.querySelector("#fixture1");
                    var model = {};
                    expect(() => wx.applyBindings(model, el)).not.toThrow();

                    router.go("foo");

                    // there should be a fully initialized wx-select component
                    el = <HTMLElement> el.childNodes[0].childNodes[0];
                    expect(el.childNodes.length).toEqual(items.length);
                    expect(testutils.nodeChildrenToArray<HTMLElement>(el).filter(x => x instanceof HTMLOptionElement)
                        .map(x => wx.getNodeValue(x, domManager))).toEqual(items);
                });

                it("cleans up view if there's no component registered for the current state", () => {
                    loadFixtures('templates/Routing/Bindings/View.html');

                    if (!animated) {
                        router.state({
                            name: "foo",
                            views: {
                                'main': {
                                    component: "wx-select",
                                    animations: {
                                        enter: "dummyEnter",
                                        leave: "dummyLeave"
                                    }
                                }
                            }
                        }).state({
                            name: "foo.bar",
                            views: {
                                'main': null
                            }
                        });
                    } else {
                        router.state({
                            name: "foo",
                            views: {
                                'main': {
                                    component: "wx-select",
                                    animations: {
                                        enter: "dummyEnter",
                                        leave: "dummyLeave"
                                    }
                                }
                            }
                        }).state({
                            name: "foo.bar",
                            views: {
                                'main': null
                            }
                        });
                    }

                    var el = <HTMLElement> document.querySelector("#fixture1");
                    var model = {};
                    expect(() => wx.applyBindings(model, el)).not.toThrow();

                    router.go("foo");
                    router.go("foo.bar");

                    // there should be a fully initialized wx-select component
                    expect(el.childNodes.length).toEqual(0);
                });
            });
        }

        testImpl(false);
        testImpl(true);
    });
});
