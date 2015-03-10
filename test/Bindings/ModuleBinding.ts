/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe('Bindings', () => {
    describe('Module', () => {
        it('binds using module name', () => {
            loadFixtures('templates/Bindings/Module.html');

            // register a binding that would not be available in default module
            wx.module("test").registerBinding("foo", wx.app.getBinding("text"));

            var el = document.querySelector("#module-name");
            var model = {};
            expect(() => wx.applyBindings(model, el)).not.toThrow();

            expect($(el).children("#content").text()).toEqual("bar");
        });

        it('binds using module instance',() => {
            loadFixtures('templates/Bindings/Module.html');

            // register a binding that would not be available in default module
            wx.module("test").registerBinding("foo", wx.app.getBinding("text"));

            var el = document.querySelector("#module-instance");
            var model = { module: wx.module("test") };
            expect(() => wx.applyBindings(model, el)).not.toThrow();

            expect($(el).children("#content").text()).toEqual("bar");
        });

        it('nested modules should work',() => {
            loadFixtures('templates/Bindings/Module.html');

            // register a binding that would not be available in default module
            wx.module("test1").registerBinding("foo", wx.app.getBinding("text"));
            wx.module("test2").registerBinding("bar", wx.app.getBinding("text"));

            var el = document.querySelector("#module-name-nested");
            var model = {};
            expect(() => wx.applyBindings(model, el)).not.toThrow();

            expect($(el).children("#content1").text()).toEqual("bar");
            expect($("#child-container").children("#content").text()).toEqual("bar");
            expect($(el).children("#content2").text()).toEqual("baz");
        });
    });
});