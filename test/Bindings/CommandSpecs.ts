/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe('Bindings', () => {
    function createCommandModel(commandAction: (any) => void) {
        var canExecute = wx.property(false);

        return {
            cmd: wx.command(commandAction, canExecute.changed),
            canExecute: canExecute
        }
    };

    describe('Command',() => {
        it('binding to non-command source should throw', () => {
            loadFixtures('templates/Bindings/Command.html');

            var el = document.querySelector("#command-invalid-binding-target");
            var model = createCommandModel((_) => {});

            expect(() => wx.applyBindings(model, el)).toThrowError(/Reactive Command/);
        });

        function commandBindingSmokeTestImpl(sel: string) {
            var executed = false;
            var el = <HTMLElement> document.querySelector(sel);
            var model = createCommandModel((_) => executed = true);

            // canExecute tests
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect(el.disabled).toBeTruthy();
            model.canExecute(true);
            expect(el.disabled).toBeFalsy();

            // execute test
            testutils.triggerEvent(el, "click");
            expect(executed).toBeTruthy();

            // disposed tests
            wx.cleanNode(el);
            executed = false;
            model.canExecute(false);
            expect(el.disabled).toBeFalsy();
            testutils.triggerEvent(el, "click");
            expect(executed).toBeFalsy();
        }

        it('button smoke-test - bound to options', () => {
            loadFixtures('templates/Bindings/Command.html');

            commandBindingSmokeTestImpl("#command-button-options");
        });

        it('hyperlink smoke-test - bound to options', () => {
            loadFixtures('templates/Bindings/Command.html');

            commandBindingSmokeTestImpl("#command-link-options");
        });

        it('button smoke-test - bound to command', () => {
            loadFixtures('templates/Bindings/Command.html');

            commandBindingSmokeTestImpl("#command-button");
        });

        it('hyperlink smoke-test - bound to command', () => {
            loadFixtures('templates/Bindings/Command.html');

            commandBindingSmokeTestImpl("#command-link");
        });
    });
});