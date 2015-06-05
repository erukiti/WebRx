/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />
/// <reference path="../TestUtils.ts" />

describe('Bindings', () => {
    function createCommandModel(commandAction: (any) => void) {
        var canExecute = wx.property(false);

        return {
            cmd: wx.command(commandAction, canExecute.changed),
            canExecute: canExecute
        }
    };

    describe('Command',() => {
        it('reacts to changes when bound to observable properties holding command and parameter',() => {
            loadFixtures('templates/Bindings/Command.html');

            var el = <HTMLButtonElement> document.querySelector("#command-button-observable");

            var fooExecuteCount = 0;
            var barExecuteCount = 0;
            var executeParam = undefined;

            var model = {
                cmd: wx.property(),
                param: wx.property()
            };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect(fooExecuteCount).toEqual(0);
            expect(barExecuteCount).toEqual(0);

            model.cmd(wx.command((x) => { fooExecuteCount++; executeParam = x }));
            testutils.triggerEvent(el, "click");
            expect(fooExecuteCount).toEqual(1);
            expect(executeParam).toEqual(model.param());

            model.param(42);
            testutils.triggerEvent(el, "click");
            expect(fooExecuteCount).toEqual(2);
            expect(executeParam).toEqual(model.param());

            model.cmd(wx.command((x) => { barExecuteCount++; executeParam = x }));
            testutils.triggerEvent(el, "click");
            expect(barExecuteCount).toEqual(1);
            expect(executeParam).toEqual(model.param());

            model.param(3);
            testutils.triggerEvent(el, "click");
            expect(barExecuteCount).toEqual(2);
            expect(executeParam).toEqual(model.param());
        });

        function commandBindingSmokeTestImpl(sel: string) {
            var executed = false;
            var el = <HTMLElement> document.querySelector(sel);
            var model = createCommandModel((_) => executed = true);

            // canExecute tests
            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            expect((<any> el).disabled).toBeTruthy();
            model.canExecute(true);
            expect((<any> el).disabled).toBeFalsy();

            // execute test
            testutils.triggerEvent(el, "click");
            expect(executed).toBeTruthy();

            // disposed tests
            wx.cleanNode(el);
            executed = false;
            model.canExecute(false);
            expect((<any> el).disabled).toBeFalsy();
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