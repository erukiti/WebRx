/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe('Directives', () => {
    describe('TextInput',() => {
        function smokeTestNonObservable(fixture: string) {
            loadFixtures('templates/Directives/TextInput.html');

            var model = {
                text: "foo"
            };

            var el = <HTMLInputElement> document.querySelector("#fixture1");

            expect(() => wx.applyDirectives(model, el)).not.toThrowError();

            expect(el.value).toEqual(model.text);
        }

        it('input element bound to non-observable string property smoke-test',() => {
            smokeTestNonObservable("fixture1");
        });

        it('textarea element bound to non-observable string property smoke-test',() => {
            smokeTestNonObservable("fixture2");
        });

        function smokeTestObservable(fixture: string) {
            loadFixtures('templates/Directives/TextInput.html');

            var model = {
                text: wx.property("foo")
            };

            var el = <HTMLInputElement> document.querySelector("#fixture1");

            expect(() => wx.applyDirectives(model, el)).not.toThrowError();

            expect(el.value).toEqual(model.text());
        }

        it('input element bound to observable string property smoke-test',() => {
            smokeTestObservable("fixture1");
        });

        it('textarea element bound to observable string property smoke-test',() => {
            smokeTestObservable("fixture2");
        });

        it('attempting to bind to other elements than input and textarea throws',() => {
            loadFixtures('templates/Directives/TextInput.html');

            var model = {
                text: wx.property("foo")
            };

            var el = <HTMLInputElement> document.querySelector("#fixture3");

            expect(() => wx.applyDirectives(model, el)).toThrowError(/textInput directive can only be applied/);
        });
    });
});