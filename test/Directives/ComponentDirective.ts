/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe('Directives', () => {
    describe('Component', () => {
        it('Loads a component using simple string options',() => {
            loadFixtures('templates/Directives/Component.html');

            var template = '<span>foo</span>';

            wx.module("test").registerComponent("test1", <wx.IComponent> {
                template: template
            });

            var el = <HTMLElement> document.querySelector("#fixture1");
            expect(() => wx.applyDirectives(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual(template);
        });

        it('Loads a component using object-literal options',() => {
            loadFixtures('templates/Directives/Component.html');

            var template = '<span>foo</span>';

            wx.module("test").registerComponent("test1", <wx.IComponent> {
                template: template
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyDirectives(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual(template);
        });

        it('Loads a template from a string',() => {
            loadFixtures('templates/Directives/Component.html');

            var template = '<span>foo</span>';

            wx.module("test").registerComponent("test1", <wx.IComponent> {
                template: template
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyDirectives(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual(template);
        });

        it('Loads a template from a node-array',() => {
            loadFixtures('templates/Directives/Component.html');

            var template = '<span>foo</span>';

            wx.module("test").registerComponent("test1", <wx.IComponent> {
                template: <any> wx.app.templateEngine.parse(template)
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyDirectives(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual(template);
        });

        it('Loads a template from a selector',() => {
            loadFixtures('templates/Directives/Component.html');

            wx.module("test").registerComponent("test1", <wx.IComponent> {
                template: <any> { element: '#template1' }
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyDirectives(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual((<HTMLElement> document.querySelector("#template1")).outerHTML);
        });

        it('Loads a template from a node instance',() => {
            loadFixtures('templates/Directives/Component.html');

            wx.module("test").registerComponent("test1", <wx.IComponent> {
                template: <any> { element: document.querySelector("#template1") }
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyDirectives(undefined, el)).not.toThrow();

            expect(el.innerHTML).toEqual((<HTMLElement> document.querySelector("#template1")).outerHTML);
        });

        it('Loads a template through injector',() => {
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

        it("Loads a template through module loader",(done) => {
            loadFixtures('templates/Directives/Component.html');

            wx.module("test").registerComponent("test1", <wx.IComponent> {
                template: <any> { require: 'text!templates/AMD/template1.html' }
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyDirectives(undefined, el)).not.toThrow();

            setTimeout(() => {
                expect(el.innerHTML).toEqual("<span>foo</span>");
                done();
            }, 1000);
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

        it("Loads a view-model from a factory method",() => {
            loadFixtures('templates/Directives/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";

            wx.module("test").registerComponent("test1", <wx.IComponent> <any> {
                template: template,
                viewModel: (params) => { return { foo: 'bar' }; }
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyDirectives(undefined, el)).not.toThrow();
            
            expect(el.childNodes[0].textContent).toEqual('bar');
        });

        it("Loads a view-model through injector",() => {
            loadFixtures('templates/Directives/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";
            wx.injector.register("vm1", { foo: 'bar' });

            wx.module("test").registerComponent("test1", <wx.IComponent> <any> {
                template: template,
                viewModel: <any> { resolve: 'vm1' }
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyDirectives(undefined, el)).not.toThrow();

            expect(el.childNodes[0].textContent).toEqual('bar');
        });

        it("Loads a view-model from an instance",() => {
            loadFixtures('templates/Directives/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";

            wx.module("test").registerComponent("test1", <wx.IComponent> <any> {
                template: template,
                viewModel: <any> { instance: { foo: 'bar' } } 
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyDirectives(undefined, el)).not.toThrow();

            expect(el.childNodes[0].textContent).toEqual('bar');
        });

        it("Loads a view-model through module loader",(done) => {
            loadFixtures('templates/Directives/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";

            wx.module("test").registerComponent("test1", <wx.IComponent> <any>  {
                template: template,
                viewModel: <any> { require: 'templates/AMD/vm1' }
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyDirectives(undefined, el)).not.toThrow();

            setTimeout(() => {
                expect(el.childNodes[0].textContent).toEqual('bar');
                done();
            }, 1000);
        });
    });
});