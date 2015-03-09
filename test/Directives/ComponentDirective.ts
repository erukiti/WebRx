/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe('Directives', () => {
    describe('Component', () => {
        it('Loads a component using a string as options',() => {
            loadFixtures('templates/Directives/Component.html');

            var template = '<span>foo</span>';

            wx.module("test").registerComponent("test1", <wx.IComponent> {
                template: template
            });

            var el = <HTMLElement> document.querySelector("#fixture1");
            expect(() => wx.applyDirectives(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual(template);
        });

        it('Loads a component using an object-literal as options',() => {
            loadFixtures('templates/Directives/Component.html');

            var template = '<span>foo</span>';

            wx.module("test").registerComponent("test1", <wx.IComponent> {
                template: template
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyDirectives(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual(template);
        });

        it('Loads a component template from a string',() => {
            loadFixtures('templates/Directives/Component.html');

            var template = '<span>foo</span>';

            wx.module("test").registerComponent("test1", <wx.IComponent> {
                template: template
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyDirectives(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual(template);
        });

        it('Loads a component template from a node-array',() => {
            loadFixtures('templates/Directives/Component.html');

            var template = '<span>foo</span>';

            wx.module("test").registerComponent("test1", <wx.IComponent> {
                template: <any> wx.app.templateEngine.parse(template)
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyDirectives(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual(template);
        });

        it('Loads a component template from a selector',() => {
            loadFixtures('templates/Directives/Component.html');

            wx.module("test").registerComponent("test1", <wx.IComponent> {
                template: <any> { element: '#template1' }
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyDirectives(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual((<HTMLElement> document.querySelector("#template1")).outerHTML);
        });

        it('Loads a component template from a node instance',() => {
            loadFixtures('templates/Directives/Component.html');

            wx.module("test").registerComponent("test1", <wx.IComponent> {
                template: <any> { element: document.querySelector("#template1") }
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyDirectives(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual((<HTMLElement> document.querySelector("#template1")).outerHTML);
        });

        it('Loads a component template by resolving through injector',() => {
            loadFixtures('templates/Directives/Component.html');

            var template = '<span>foo</span>';
            wx.injector.register("#template1", wx.app.templateEngine.parse(template));

            wx.module("test").registerComponent("test1", <wx.IComponent> {
                template: <any> { resolve: "#template1" }
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyDirectives(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual(template);
        });

        it("When the component isn't supplying a view-model, binding against parent-context works as expected",() => {
            loadFixtures('templates/Directives/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";

            wx.module("test").registerComponent("test1", <wx.IComponent> {
                template: template
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyDirectives({ foo: 'bar' }, el)).not.toThrow();

            expect(el.children[0].textContent).toEqual('bar');
        });
    });
});