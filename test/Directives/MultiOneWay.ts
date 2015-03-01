/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/xircular.d.ts" />

function createCssModel() {
    return {
        constantString: "bar",
        constantBool: true,
        constantNumeric: 42,
        observableString: xi.property("voodoo"),
        observableString2: xi.property("magic"),
        observableBool: xi.property(true),
        observableBool2: xi.property(false),
        observableNumeric: xi.property(96)
    }
};

describe('Directives', () => {
    describe('Css', () => {
        it('binding to a string constant', () => {
            loadFixtures('templates/Directives/MultiOneWay.html');

            var el = <HTMLElement> document.querySelector("#css-constant-string");
            var model = {};

            expect($(el)).not.toHaveClass('foo');
            expect(() => xi.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).toHaveClass('foo');
        });

        it('binding to a non-observable model property', () => {
            loadFixtures('templates/Directives/MultiOneWay.html');

            var el = <HTMLElement> document.querySelector("#css-non-observable-model-property");
            var model = createCssModel();
            model.constantString = 'foo';

            expect($(el)).not.toHaveClass('foo');
            expect(() => xi.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).toHaveClass('foo');
        });

        it('binding to a observable model property', () => {
            loadFixtures('templates/Directives/MultiOneWay.html');

            var el = <HTMLElement> document.querySelector("#css-observable-model-property");
            var model = createCssModel();

            expect($(el)).not.toHaveClass('foo');
            expect(() => xi.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).toHaveClass('foo');

            // should reflect property changes
            model.observableBool(false);
            expect($(el)).not.toHaveClass('foo');

            // binding should stop updating after getting disposed
            xi.cleanNode(el);
            model.observableBool(true);
            expect($(el)).not.toHaveClass('foo');
        });

        it('binding to a model observable', () => {
            loadFixtures('templates/Directives/MultiOneWay.html');

            var el = <HTMLElement> document.querySelector("#css-observable-model");
            var model = createCssModel();
            model["changed"] = model.observableBool.changed;
            model.observableBool(false);

            expect($(el)).not.toHaveClass('foo');
            expect(() => xi.applyDirectives(model, el)).not.toThrowError();
            model.observableBool(true);
            expect($(el)).toHaveClass('foo');
            model.observableBool(false);
            expect($(el)).not.toHaveClass('foo');

            // should reflect property changes
            model.observableBool(true);
            expect($(el)).toHaveClass('foo');

            // binding should stop updating after getting disposed
            xi.cleanNode(el);
            model.observableBool(false);
            expect($(el)).toHaveClass('foo');
        });

        it('binding multiple css classes to multiple observable model properties', () => {
            loadFixtures('templates/Directives/MultiOneWay.html');

            var el = <HTMLElement> document.querySelector("#css-observable-model-property2");
            var model = createCssModel();

            expect($(el)).not.toHaveClass('foo');
            expect($(el)).not.toHaveClass('bar');
            expect(() => xi.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).toHaveClass('foo');
            expect($(el)).not.toHaveClass('bar');

            // should reflect property changes
            model.observableBool(false);
            model.observableBool2(true);
            expect($(el)).not.toHaveClass('foo');
            expect($(el)).toHaveClass('bar');

            model.observableBool(false);
            model.observableBool2(false);
            expect($(el)).not.toHaveClass('foo');
            expect($(el)).not.toHaveClass('bar');

            model.observableBool(true);
            model.observableBool2(true);
            expect($(el)).toHaveClass('foo');
            expect($(el)).toHaveClass('bar');

            // binding should stop updating after getting disposed
            xi.cleanNode(el);
            model.observableBool(false);
            model.observableBool2(false);
            expect($(el)).toHaveClass('foo');
            expect($(el)).toHaveClass('bar');
        });
    });

    describe('Attr', () => {
        it('binding to a string constant', () => {
            loadFixtures('templates/Directives/MultiOneWay.html');

            var el = <HTMLElement> document.querySelector("#attr-constant-string");
            var model = {};

            expect($(el)).not.toHaveAttr('data-foo');
            expect(() => xi.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).toHaveAttr('data-foo', 'true');
        });

        it('binding to a non-observable model property', () => {
            loadFixtures('templates/Directives/MultiOneWay.html');

            var el = <HTMLElement> document.querySelector("#attr-non-observable-model-property");
            var model = createCssModel();
            model.constantString = 'data-foo';

            expect($(el)).not.toHaveAttr('data-foo');
            expect(() => xi.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).toHaveAttr('data-foo');
        });

        it('binding to a observable model property', () => {
            loadFixtures('templates/Directives/MultiOneWay.html');

            var el = <HTMLElement> document.querySelector("#attr-observable-model-property");
            var model = createCssModel();

            expect($(el)).not.toHaveAttr('data-foo');
            expect(() => xi.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).toHaveAttr('data-foo');

            // should reflect property changes
            model.observableString('');
            expect($(el)).toHaveAttr('data-foo');

            // binding should stop updating after getting disposed
            xi.cleanNode(el);
            model.observableString('voodoo');
            expect($(el)).toHaveAttr('data-foo', '');
        });

        it('binding to a model observable', () => {
            loadFixtures('templates/Directives/MultiOneWay.html');

            var el = <HTMLElement> document.querySelector("#attr-observable-model");
            var model = createCssModel();
            model["changed"] = model.observableString.changed;
            model.observableString('');

            expect($(el)).not.toHaveAttr('data-foo');
            expect(() => xi.applyDirectives(model, el)).not.toThrowError();
            model.observableString('voodoo');
            expect($(el)).toHaveAttr('data-foo', 'voodoo');
            model.observableString('');
            expect($(el)).toHaveAttr('data-foo', '');

            // should reflect property changes
            model.observableString('magic');
            expect($(el)).toHaveAttr('data-foo', 'magic');

            // binding should stop updating after getting disposed
            xi.cleanNode(el);
            model.observableString('');
            expect($(el)).toHaveAttr('data-foo', 'magic');
        });

        it('binding multiple attr classes to multiple observable model properties', () => {
            loadFixtures('templates/Directives/MultiOneWay.html');

            var el = <HTMLElement> document.querySelector("#attr-observable-model-property2");
            var model = createCssModel();

            expect($(el)).not.toHaveAttr('data-foo');
            expect($(el)).not.toHaveAttr('data-bar');
            expect(() => xi.applyDirectives(model, el)).not.toThrowError();
            expect($(el)).toHaveAttr('data-foo', 'voodoo');
            expect($(el)).toHaveAttr('data-bar', 'magic');

            // should reflect property changes
            model.observableString('');
            model.observableString2('doodle');
            expect($(el)).toHaveAttr('data-foo', '');
            expect($(el)).toHaveAttr('data-bar', 'doodle');

            model.observableString('');
            model.observableString2('');
            expect($(el)).toHaveAttr('data-foo', '');
            expect($(el)).toHaveAttr('data-bar', '');

            model.observableString('voodoo');
            model.observableString2('magic');
            expect($(el)).toHaveAttr('data-foo', 'voodoo');
            expect($(el)).toHaveAttr('data-bar', 'magic');

            // binding should stop updating after getting disposed
            xi.cleanNode(el);
            model.observableString('');
            model.observableString2('');
            expect($(el)).toHaveAttr('data-foo', 'voodoo');
            expect($(el)).toHaveAttr('data-bar', 'magic');
        });
    });
});