/// <reference path="../../typings/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-jquery.d.ts" />
/// <reference path="../../../build/web.rx.d.ts" />

describe('Routing', () => {
    var router = wx.injector.resolve<wx.IRouter>(wx.res.router);
    var domManager = wx.injector.resolve<wx.IDomManager>(wx.res.domManager);

    beforeEach(() => {
        router.reset();
        wx.app.history.reset();
    });

    afterEach(() => {
        wx.cleanNode(document.body);
    });

    describe('Bindings',() => {
        describe('View', () => {
            it('binds using view name',() => {
                loadFixtures('templates/Routing/Bindings/View.html');

                var el = document.querySelector("#fixture1");
                var model = {};
                expect(() => wx.applyBindings(model, el)).not.toThrow();
            });

            it('reacts to router state change by instantiating designated component',() => {
                loadFixtures('templates/Routing/Bindings/View.html');

                var items = [3, 2, 1];

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

                var el = <HTMLElement> document.querySelector("#fixture1");
                var model = {};
                expect(() => wx.applyBindings(model, el)).not.toThrow();

                router.go("foo");

                // there should be a fully initialized wx-select component
                el = <HTMLElement> el.childNodes[0].childNodes[0];
                expect(el.childNodes.length).toEqual(items.length);
                expect(testutils.nodeChildrenToArray<HTMLElement>(el).filter(x=> x instanceof HTMLOptionElement)
                    .map(x => wx.internal.getNodeValue(x, domManager))).toEqual(items);
            });
        });
    });
});
