/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />

describe('Bindings', () => {
    describe('Component', () => {
        it('Loads a component using simple string options',() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = '<span>foo</span>';

            wx.app.component("test1", {
                template: template
            });

            var el = <HTMLElement> document.querySelector("#fixture1");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect((<HTMLElement> el.children[0]).innerHTML).toEqual(template);
        });

        it('Loads a component using object-literal options',() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = '<span>foo</span>';

            wx.app.component("test1", {
                template: template
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect((<HTMLElement> el.children[0]).innerHTML).toEqual(template);
        });

        it('Loads a component using its name as tag',() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";

            wx.app.component("test1", {
                template: template
            });

            var el = <HTMLElement> document.querySelector("#fixture3");
            expect(() => wx.applyBindings({ foo: 'bar' }, el)).not.toThrow();

            expect(el.children[0].textContent).toEqual('bar');
        });

        it("Loads a component through an AMD module loader",(done) => {
            loadFixtures('templates/Bindings/Component.html');

            wx.app.component("test1", {
                require: 'templates/AMD/component1'
            });

            var el = <HTMLElement> document.querySelector("#fixture4");

            window["vmHook"] = (params) => {
                expect(params).toBeDefined();
                expect(params.foo).toEqual(42);

                // now install new hook for postBindingInit
                window["vmHook"] = () => {
                    delete window["vmHook"];

                    expect((<HTMLElement> el.children[0]).childNodes[0].textContent).toEqual('bar');
                    done();
                }
            }

            expect(() => wx.applyBindings(undefined, el)).not.toThrow();
        });

        it('Loads a template from a string',() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = '<span>foo</span>';

            wx.app.component("test1", {
                template: template
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect((<HTMLElement> el.children[0]).innerHTML).toEqual(template);
        });

        it('Loads a template from a node-array',() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = '<span>foo</span>';

            wx.app.component("test1", {
                template: wx.app.templateEngine.parse(template)
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect((<HTMLElement> el.children[0]).innerHTML).toEqual(template);
        });

        it('Loads a template from a selector',() => {
            loadFixtures('templates/Bindings/Component.html');

            wx.app.component("test1", {
                template: { select: '#template1' }
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect((<HTMLElement> el.children[0]).innerHTML).toEqual((<HTMLElement> document.querySelector("#template1")).innerHTML);
        });

        it('Loads a template from a node instance',() => {
            loadFixtures('templates/Bindings/Component.html');

            wx.app.component("test1", {
                template: [document.querySelector("#template1").childNodes[0]]
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect((<HTMLElement> el.children[0]).innerHTML).toEqual((<HTMLElement> document.querySelector("#template1")).innerHTML);
        });

        it('Loads a template through injector',() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = '<span>foo</span>';
            wx.injector.register("#template1", ()=> wx.app.templateEngine.parse(template));

            wx.app.component("test1", {
                template: { resolve: "#template1" }
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect((<HTMLElement> el.children[0]).innerHTML).toEqual(template);
        });

        it("Loads a template through an AMD module loader",(done) => {
            loadFixtures('templates/Bindings/Component.html');

            var el = <HTMLElement> document.querySelector("#fixture2");

            var vm = {
                init: function () {
                    expect((<HTMLElement> el.children[0]).innerHTML).toEqual("<span>foo</span>");
                    done();
                }
            };

            wx.app.component("test1", {
                template: {
                     require: 'text!templates/AMD/template1.html'
                },
                viewModel: { instance: vm },
                postBindingInit: "init"
            });

            expect(() => wx.applyBindings(undefined, el)).not.toThrow();
        });

        it("When the component isn't supplying a view-model, binding against parent-context works as expected",() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";

            wx.app.component("test1", {
                template: template
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings({ foo: 'bar' }, el)).not.toThrow();

            expect((<HTMLElement> el.children[0]).children[0].textContent).toEqual('bar');
        });

        it("Loads a view-model from a factory method",() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";

            wx.app.component("test1", {
                template: template,
                viewModel: (params) => { return { foo: 'bar' }; }
            });

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect((<HTMLElement> el.children[0]).childNodes[0].textContent).toEqual('bar');
        });

        it("Loads a view-model through injector",() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";
            wx.injector.register("vm1", { foo: 'bar' });

            wx.app.component("test1", {
                template: template,
                viewModel: { resolve: 'vm1' }
            });


            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect((<HTMLElement> el.children[0]).childNodes[0].textContent).toEqual('bar');
        });

        it("Loads a view-model through injector using inline-annotated-array",() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = "<span data-bind='text: childVm.foo'>invalid</span>";
            wx.injector.register("vm2", { foo: 'bar' });

            wx.app.component("test1", {
                template: template,
                viewModel: ["vm2", function(childVm, params) {
                    this.childVm = childVm;
                    this.params = params;
                }]
            });


            var el = <HTMLElement> document.querySelector("#fixture4");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect((<HTMLElement> el.children[0]).childNodes[0].textContent).toEqual('bar');
        });

        it("Loads a view-model from an instance",() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";

            wx.app.component("test1", {
                template: template,
                viewModel: { instance: { foo: 'bar' } }
            });


            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect((<HTMLElement> el.children[0]).childNodes[0].textContent).toEqual('bar');
        });

        it("Loads a view-model from an observable returning an object",() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";

            wx.app.component("test1", {
                template: template,
                viewModel: { observable: Rx.Observable.return<any>({ foo: 'bar' }) }
            });


            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect((<HTMLElement> el.children[0]).childNodes[0].textContent).toEqual('bar');
        });

        it("Loads a view-model from an observable returning a constructor",() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";

            wx.app.component("test1", {
                template: template,
                viewModel: { observable: Rx.Observable.return<any>(function(arg: any) { this.foo = 'bar'; }) }
            });


            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect((<HTMLElement> el.children[0]).childNodes[0].textContent).toEqual('bar');
        });

        it("Loads a view-model through an AMD module loader - object with postBindingInit",(done) => {
            loadFixtures('templates/Bindings/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";

            wx.app.component("test1", {
                template: template,
                viewModel: { require: 'templates/AMD/vm1' },
                postBindingInit: "init"
            });


            var el = <HTMLElement> document.querySelector("#fixture2");

            window["vmHook"] = () => {
                delete window["vmHook"];

                expect((<HTMLElement> el.children[0]).childNodes[0].textContent).toEqual('bar');
                done();
            }

            expect(() => wx.applyBindings(undefined, el)).not.toThrow();
        });

        it("Loads a view-model through an AMD module loader - constructor function",(done) => {
            loadFixtures('templates/Bindings/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";

            wx.app.component("test1", {
                template: template,
                viewModel: { require: 'templates/AMD/vm2' },
                postBindingInit: "init"
            });

            var el = <HTMLElement> document.querySelector("#fixture4");

            window["vmHook"] = (params) => {
                expect(params).toBeDefined();
                expect(params.foo).toEqual(42);

                // now install new hook for postBindingInit
                window["vmHook"] = () => {
                    delete window["vmHook"];

                    expect((<HTMLElement> el.children[0]).childNodes[0].textContent).toEqual('bar');
                    done();
                }
            }

            expect(() => wx.applyBindings(undefined, el)).not.toThrow();
        });

        it("Params get passed to view-model constructor",() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = '<span>foo</span>';
            var fooVal: number;

            wx.app.component("test1", {
                template: template,
                viewModel: (params) => {
                    fooVal = params.foo;
                    return { foo: 'bar' };
                }
             });

            var el = <HTMLElement> document.querySelector("#fixture4");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect(fooVal).toEqual(42);
        });

        it("invokes preBindingInit",() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = '<span>foo</span>';
            var invoked = false;
            var __this: any;
            var elementArg = false;
            var vm: any;

            vm = {
                init: function (el: HTMLElement) {  // don't convert this to a lamba or the test will suddenly fail due to Typescript's this-capturing
                    invoked = true;
                    __this = this;
                    elementArg = el instanceof HTMLElement;
                }
            };

            wx.app.component("test1", {
                template: template,
                viewModel: { instance: vm },
                preBindingInit: "init"
            });

            var el = <HTMLElement> document.querySelector("#fixture5");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect(invoked).toBeTruthy();
            expect(__this).toBe(vm);
            expect(elementArg).toBeTruthy();
        });

        it("invokes postBindingInit",() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = '<span>foo</span>';
            var invoked = false;
            var __this: any;
            var elementArg = false;

            var vm: any;

            vm = {
                init: function(el: HTMLElement) {   // don't convert this to a lamba or the test will suddenly fail due to Typescript's this-capturing
                    invoked = true;
                    __this = this;
                    elementArg = el instanceof HTMLElement;
                }
            };

            wx.app.component("test1", {
                template: template,
                viewModel: { instance: vm },
                postBindingInit: "init"
            });

            var el = <HTMLElement> document.querySelector("#fixture5");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect(invoked).toBeTruthy();
            expect(__this).toBe(vm);
            expect(elementArg).toBeTruthy();
        });

        it("Disposes a component's viewmodel if it's disposable",() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = '<span>foo</span>';
            let disposed = false;

            function vm() {
                this.dispose = ()=> disposed = true;
            }

            wx.app.component("test1", {
                template: template,
                viewModel: vm
            });

            expect(disposed).toBeFalsy();

            var el = <HTMLElement> document.querySelector("#fixture1");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            wx.cleanNode(el);
            expect(disposed).toBeTruthy();
        });

        it("Loads a component from an observable returning a descriptor",() => {
            loadFixtures('templates/Bindings/Component.html');

            var template = "<span data-bind='text: foo'>invalid</span>";

            let descriptor = {
                template: template,
                viewModel: { observable: Rx.Observable.return<any>({ foo: 'bar' }) }
            };

            wx.app.component("test1", Rx.Observable.return(descriptor));

            var el = <HTMLElement> document.querySelector("#fixture2");
            expect(() => wx.applyBindings(undefined, el)).not.toThrow();

            expect((<HTMLElement> el.children[0]).childNodes[0].textContent).toEqual('bar');
        });
    });
});