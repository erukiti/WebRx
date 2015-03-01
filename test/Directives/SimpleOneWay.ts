/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />

function createModel() {
    return {
        constantString: "bar",
        constantBool: true,
        constantNumeric: 42,
        observableString: wx.property("voodoo"),
        observableBool: wx.property(true),
        observableNumeric: wx.property(96)
    }
};

describe('Directives', () => {
    describe('Text', () => {
        it('binding to a string constant', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#text-constant-string");
            var model = {};

            expect(el.textContent).toEqual('invalid');
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect(el.textContent).toEqual('foo');
        });

        it('binding to a numeric constant', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#text-constant-numeric");
            var model = {};

            expect(el.textContent).toEqual('invalid');
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect(el.textContent).toEqual('42');
        });

        it('binding to a boolean constant', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#text-constant-boolean");
            var model = {};

            expect(el.textContent).toEqual('invalid');
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect(el.textContent).toEqual('true');
        });

        it('binding to a non-observable model property', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#text-non-observable-model-property");
            var model = createModel();

            expect(el.textContent).toEqual('invalid');
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect(el.textContent).toEqual(model.constantString);
        });

        it('binding to a observable model property', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#text-observable-model-property");
            var model = createModel();

            expect(el.textContent).toEqual('invalid');
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect(el.textContent).toEqual(model.observableString());

            // should reflect property changes
            model.observableString("magic");
            expect(el.textContent).toEqual(model.observableString());

            // binding should stop updating after getting disposed
            var oldValue = model.observableString();
            wx.cleanNode(el);
            model.observableString("nope");
            expect(el.textContent).toEqual(oldValue);
        });

        it('binding to a model observable', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#text-observable-model");
            var model = createModel();
            model["changed"] = model.observableString.changed;

            expect(el.textContent).toEqual('invalid');
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();

            // should reflect property changes
            model.observableString("magic");
            expect(el.textContent).toEqual(model.observableString());

            // binding should stop updating after getting disposed
            var oldValue = model.observableString();
            wx.cleanNode(el);
            model.observableString("nope");
            expect(el.textContent).toEqual(oldValue);
        });
    });


    describe('Visible', () => {
        it('binding to a numeric constant', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#visible-constant-numeric");
            var model = {};

            expect($(el)).toBeHidden();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).toBeVisible();
        });

        it('binding to a boolean constant', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#visible-constant-boolean");
            var model = {};

            expect($(el)).toBeHidden();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).toBeVisible();
        });

        it('binding to a non-observable model property', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#visible-non-observable-model-property");
            var model = createModel();

            expect($(el)).toBeHidden();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).toBeVisible();
        });

        it('binding to a observable model property', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#visible-observable-model-property");
            var model = createModel();

            expect($(el)).toBeHidden();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).toBeVisible();

            // should reflect property changes
            model.observableBool(false);
            expect($(el)).toBeHidden();

            // binding should stop updating after getting disposed
            wx.cleanNode(el);
            model.observableBool(true);
            expect($(el)).toBeHidden();
        });

        it('binding to a model observable', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#visible-observable-model");
            var model = createModel();
            model["changed"] = model.observableBool.changed;

            expect($(el)).toBeHidden();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();

            // should reflect property changes
            model.observableBool(false);
            expect($(el)).toBeHidden();

            // binding should stop updating after getting disposed
            wx.cleanNode(el);
            model.observableBool(true);
            expect($(el)).toBeHidden();
        });

        it('binding to an observable model property (using css classes)', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#visible-observable-model-property-css");
            var model = createModel();

            // configure handler
            var domService = wx.injector.resolve<wx.IDomService>(wx.res.domService);
            var handler = domService.getDirective("visible");
            var handlerOptions: wx.IVisibleDirectiveOptions = { useCssClass: true, hiddenClass: 'hidden' };
            handler.configure(handlerOptions);

            var disp = Rx.Disposable.create(() => {
                handlerOptions.useCssClass = false;
                handler.configure(handlerOptions);
            });

            wx.using(disp, () => {
                expect($(el)).not.toHaveClass("hidden");
                expect(() => wx.applyDirectives(model, el)).not.toThrowError();
                expect($(el)).not.toHaveClass("hidden");

                // should reflect property changes
                model.observableBool(false);
                expect($(el)).toHaveClass("hidden");
                model.observableBool(true);
                expect($(el)).not.toHaveClass("hidden");

                // binding should stop updating after getting disposed
                wx.cleanNode(el);
                model.observableBool(false);
                expect($(el)).not.toHaveClass("hidden");
            });
        });
    });

    describe('Hidden', () => {
        it('binding to a numeric constant', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#hidden-constant-numeric");
            var model = {};

            expect($(el)).not.toBeHidden();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).not.toBeVisible();
        });

        it('binding to a boolean constant', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#hidden-constant-boolean");
            var model = {};

            expect($(el)).not.toBeHidden();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).not.toBeVisible();
        });

        it('binding to a non-observable model property', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#hidden-non-observable-model-property");
            var model = createModel();

            expect($(el)).not.toBeHidden();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).not.toBeVisible();
        });

        it('binding to a observable model property', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#hidden-observable-model-property");
            var model = createModel();

            expect($(el)).not.toBeHidden();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).not.toBeVisible();

            // should reflect property changes
            model.observableBool(false);
            expect($(el)).not.toBeHidden();

            // binding should stop updating after getting disposed
            wx.cleanNode(el);
            model.observableBool(true);
            expect($(el)).not.toBeHidden();
        });

        it('binding to a model observable', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#hidden-observable-model");
            var model = createModel();
            model["changed"] = model.observableBool.changed;

            expect($(el)).not.toBeHidden();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();

            // should reflect property changes
            model.observableBool(false);
            expect($(el)).not.toBeHidden();

            // binding should stop updating after getting disposed
            wx.cleanNode(el);
            model.observableBool(true);
            expect($(el)).not.toBeHidden();
        });

        it('binding to an observable model property (using css classes)', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#hidden-observable-model-property-css");
            var model = createModel();

            // configure handler
            var domService = wx.injector.resolve<wx.IDomService>(wx.res.domService);
            var handler = domService.getDirective("hidden");
            var handlerOptions: wx.IVisibleDirectiveOptions = { useCssClass: true, hiddenClass: 'hidden' };
            handler.configure(handlerOptions);

            var disp = Rx.Disposable.create(() => {
                handlerOptions.useCssClass = false;
                handler.configure(handlerOptions);
            });

            wx.using(disp, () => {
                expect($(el)).toHaveClass("hidden");
                expect(() => wx.applyDirectives(model, el)).not.toThrowError();
                expect($(el)).toHaveClass("hidden");

                // should reflect property changes
                model.observableBool(false);
                expect($(el)).not.toHaveClass("hidden");
                model.observableBool(true);
                expect($(el)).toHaveClass("hidden");

                // binding should stop updating after getting disposed
                wx.cleanNode(el);
                model.observableBool(false);
                expect($(el)).toHaveClass("hidden");
            });
        });
    });

    describe('Enable', () => {
        it('binding to a numeric constant', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#enabled-constant-numeric");
            var model = {};

            expect($(el)).toBeDisabled();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).not.toBeDisabled();
        });

        it('binding to a boolean constant', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#enabled-constant-boolean");
            var model = {};

            expect($(el)).toBeDisabled();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).not.toBeDisabled();
        });

        it('binding to a non-observable model property', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#enabled-non-observable-model-property");
            var model = createModel();

            expect($(el)).toBeDisabled();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).not.toBeDisabled();
        });

        it('binding to a observable model property', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#enabled-observable-model-property");
            var model = createModel();

            expect($(el)).toBeDisabled();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).not.toBeDisabled();

            // should reflect property changes
            model.observableBool(false);
            expect($(el)).toBeDisabled();
            model.observableBool(true);
            expect($(el)).not.toBeDisabled();

            // binding should stop updating after getting disposed
            wx.cleanNode(el);
            model.observableBool(false);
            expect($(el)).not.toBeDisabled();
        });

        it('binding to a model observable', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#enabled-observable-model");
            var model = createModel();
            model["changed"] = model.observableBool.changed;

            expect($(el)).toBeDisabled();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();

            // should reflect property changes
            model.observableBool(false);
            expect($(el)).toBeDisabled();
            model.observableBool(true);
            expect($(el)).not.toBeDisabled();

            // binding should stop updating after getting disposed
            wx.cleanNode(el);
            model.observableBool(false);
            expect($(el)).not.toBeDisabled();
        });
    });

    describe('Disable', () => {
        it('binding to a numeric constant', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#disabled-constant-numeric");
            var model = {};

            expect($(el)).not.toBeDisabled();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).toBeDisabled();
        });

        it('binding to a boolean constant', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#disabled-constant-boolean");
            var model = {};

            expect($(el)).not.toBeDisabled();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).toBeDisabled();
        });

        it('binding to a non-observable model property', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#disabled-non-observable-model-property");
            var model = createModel();

            expect($(el)).not.toBeDisabled();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).toBeDisabled();
        });

        it('binding to a observable model property', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#disabled-observable-model-property");
            var model = createModel();

            expect($(el)).not.toBeDisabled();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).toBeDisabled();

            // should reflect property changes
            model.observableBool(false);
            expect($(el)).not.toBeDisabled();
            model.observableBool(true);
            expect($(el)).toBeDisabled();

            // binding should stop updating after getting disposed
            wx.cleanNode(el);
            model.observableBool(false);
            expect($(el)).toBeDisabled();
        });

        it('binding to a model observable', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = document.querySelector("#disabled-observable-model");
            var model = createModel();
            model["changed"] = model.observableBool.changed;

            expect($(el)).not.toBeDisabled();
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();

            // should reflect property changes
            model.observableBool(false);
            expect($(el)).not.toBeDisabled();
            model.observableBool(true);
            expect($(el)).toBeDisabled();

            // binding should stop updating after getting disposed
            wx.cleanNode(el);
            model.observableBool(false);
            expect($(el)).toBeDisabled();
        });
    });

    describe('HTML', () => {
        it('binding to a string constant', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = <HTMLElement> document.querySelector("#html-constant-string");
            var model = {};

            expect(el.innerHTML).toEqual('invalid');
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect(el.innerHTML).toEqual('<span>bla</span>');
        });

        it('binding to a non-observable model property', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = <HTMLElement> document.querySelector("#html-non-observable-model-property");
            var model = createModel();
            model.constantString = '<span>bla</span>';

            expect(el.innerHTML).toEqual('invalid');
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect(el.innerHTML).toEqual(model.constantString);
        });

        it('binding to a observable model property', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = <HTMLElement> document.querySelector("#html-observable-model-property");
            var model = createModel();
            model.observableString('<span>bla</span>');

            expect(el.innerHTML).toEqual('invalid');
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();
            expect(el.innerHTML).toEqual(model.observableString());

            // should reflect property changes
            model.observableString("magic");
            expect(el.innerHTML).toEqual(model.observableString());

            // binding should stop updating after getting disposed
            var oldValue = model.observableString();
            wx.cleanNode(el);
            model.observableString("nope");
            expect(el.innerHTML).toEqual(oldValue);
        });

        it('binding to a model observable', () => {
            loadFixtures('templates/Directives/SimpleOneWay.html');

            var el = <HTMLElement> document.querySelector("#html-observable-model");
            var model = createModel();
            model.observableString('<span>bla</span>');
            model["changed"] = model.observableString.changed;

            expect(el.innerHTML).toEqual('invalid');
            expect(() => wx.applyDirectives(model, el)).not.toThrowError();

            // should reflect property changes
            model.observableString("magic");
            expect(el.innerHTML).toEqual(model.observableString());

            // binding should stop updating after getting disposed
            var oldValue = model.observableString();
            wx.cleanNode(el);
            model.observableString("nope");
            expect(el.innerHTML).toEqual(oldValue);
        });
    });
});