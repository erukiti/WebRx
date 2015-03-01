/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe('Directives', () => {
    describe('Module', () => {
        it('binds using module name', () => {
            loadFixtures('templates/Directives/Module.html');

            // register a directive that would not be available in default module
            wx.module("test").registerDirective("foo", wx.app.getDirective("text"));

            var el = document.querySelector("#module-name");
            var model = {};
            expect(() => wx.applyDirectives(model, el)).not.toThrow();

            expect($(el).children("#content").text()).toEqual("bar");
        });

        it('binds using module instance',() => {
            loadFixtures('templates/Directives/Module.html');

            // register a directive that would not be available in default module
            wx.module("test").registerDirective("foo", wx.app.getDirective("text"));

            var el = document.querySelector("#module-instance");
            var model = { module: wx.module("test") };
            expect(() => wx.applyDirectives(model, el)).not.toThrow();

            expect($(el).children("#content").text()).toEqual("bar");
        });

        it('nested modules should work',() => {
            loadFixtures('templates/Directives/Module.html');

            // register a directive that would not be available in default module
            wx.module("test1").registerDirective("foo", wx.app.getDirective("text"));
            wx.module("test2").registerDirective("bar", wx.app.getDirective("text"));

            var el = document.querySelector("#module-name-nested");
            var model = {};
            expect(() => wx.applyDirectives(model, el)).not.toThrow();

            expect($(el).children("#content").text()).toEqual("bar");
            expect($("#child-container").children("#content").text()).toEqual("bar");
        });
    });
});