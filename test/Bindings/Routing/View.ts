/// <reference path="../../typings/jasmine.d.ts" />
/// <reference path="../../typings/jasmine-jquery.d.ts" />
/// <reference path="../../../build/web.rx.d.ts" />

describe('Bindings', () => {
    describe('Routing', () => {
        describe('View', () => {
            it('binds using view name',() => {
                loadFixtures('templates/Bindings/Routing/View.html');

                var el = document.querySelector("#fixture1");
                var model = {};
                expect(() => wx.applyBindings(model, el)).not.toThrow();
            });
        });
    });
});
