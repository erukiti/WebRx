/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe('Bindings', () => {
    describe('Module', () => {
        it('binds using module name', () => {
            loadFixtures('templates/Bindings/Module.html');

            // register a binding that would not be available in default module
            wx.module("test", (m)=> m.binding("foo", wx.app.binding("text")));

            var el = document.querySelector("#module-name");
            var model = {};
            expect(() => wx.applyBindings(model, el)).not.toThrow();

            expect($(el).children("#content").text()).toEqual("bar");
        });

        it('binds using multiple module names',() => {
            loadFixtures('templates/Bindings/Module.html');

            // register a binding that would not be available in default module
            wx.module("test",(m) => m.binding("foo", wx.app.binding("text")));
            wx.module("test2",(m) => m.binding("bar", wx.app.binding("text")));

            var el = document.querySelector("#multiple-module-names");
            var model = {};
            expect(() => wx.applyBindings(model, el)).not.toThrow();

            expect($(el).children("#content").text()).toEqual("bar");
            expect($(el).children("#content2").text()).toEqual("foo");
        });

        it('nested module contexts inherit bindings of parent',() => {
            loadFixtures('templates/Bindings/Module.html');

            // register a binding that would not be available in default module
            wx.module("test1",(m) => m.binding("foo", wx.app.binding("text")));
            wx.module("test2",(m) => m.binding("bar", wx.app.binding("text")));

            var el = document.querySelector("#module-name-nested");
            var model = {};
            expect(() => wx.applyBindings(model, el)).not.toThrow();

            expect($(el).children("#content1").text()).toEqual("bar");
            expect($("#child-container").children("#content2").text()).toEqual("baz");
        });

        it('nested modules work as expected',() => {
            loadFixtures('templates/Bindings/Module.html');

            // register a binding that would not be available in default module
            wx.module("test1", (m) => m.binding("foo", wx.app.binding("text")));
            wx.module("test2", (m) => m.binding("bar", wx.app.binding("text")));

            var el = document.querySelector("#module-name-nested");
            var model = {};
            expect(() => wx.applyBindings(model, el)).not.toThrow();

            expect($(el).children("#content1").text()).toEqual("bar");
            expect($("#child-container").children("#content").text()).toEqual("bar");
            expect($(el).children("#content2").text()).toEqual("baz");
        });
    });
});
