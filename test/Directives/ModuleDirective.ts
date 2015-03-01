/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe('Directives', () => {
    describe('Module', () => {
        it('binds using module name', () => {
            loadFixtures('templates/Directives/Module.html');

            // register a directive that would not be available in default module
            var m = wx.module("test");
            m.registerDirective("foo", wx.app.getDirective("text"));

            var el = document.querySelector("#module-name");
            var model = {};
            expect(() => wx.applyDirectives(model, el)).not.toThrow();

            expect($(el).find("#content").text()).toEqual("bar");
        });

        it('binds using module instance',() => {
            loadFixtures('templates/Directives/Module.html');

            // register a directive that would not be available in default module
            var m = wx.module("test");
            m.registerDirective("foo", wx.app.getDirective("text"));

            var el = document.querySelector("#module-instance");
            var model = { module: wx.module("test") };
            expect(() => wx.applyDirectives(model, el)).not.toThrow();

            expect($(el).find("#content").text()).toEqual("bar");
        });
});
});