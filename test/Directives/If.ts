/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/xircular.d.ts" />

describe('Directives', () => {
    describe('if', () => {
        it('binding to a boolean constant (true) using static template', () => {
            loadFixtures('templates/Directives/If.html');

            var el = <HTMLElement> document.querySelector("#if-constant-boolean-true");
            var backup = el.innerHTML;
            expect(() => xi.applyDirectives({}, el)).not.toThrowError();
            expect(el.innerHTML).toEqual(backup);
        });

        it('binding to a boolean constant (false) using static template', () => {
            loadFixtures('templates/Directives/If.html');

            var el = <HTMLElement> document.querySelector("#if-constant-boolean-false");
            var backup = el.innerHTML;
            expect(() => xi.applyDirectives({}, el)).not.toThrowError();
            expect(el.innerHTML).toEqual('');
        });

        it('binding to a boolean observable property using static template', () => {
            loadFixtures('templates/Directives/If.html');

            var el = <HTMLElement> document.querySelector("#if-observable-boolean-property");
            var backup = el.innerHTML;
            var prop = xi.property(true);
            expect(() => xi.applyDirectives(prop, el)).not.toThrowError();
            expect(el.innerHTML).toEqual(backup);
            prop(false);
            expect(el.innerHTML).toEqual('');

            // binding should stop updating after getting disposed
            xi.cleanNode(el);
            prop(true);
            expect(el.innerHTML).toEqual('');
        });

        it('binding to a boolean observable using static template', () => {
            loadFixtures('templates/Directives/If.html');

            var el = <HTMLElement> document.querySelector("#if-observable-boolean");
            var backup = el.innerHTML;
            var obs = new Rx.Subject<boolean>();
            expect(() => xi.applyDirectives(obs, el)).not.toThrowError();
            expect(el.innerHTML).toEqual(backup);
            obs.onNext(false);
            expect(el.innerHTML).toEqual('');

            // binding should stop updating after getting disposed
            xi.cleanNode(el);
            obs.onNext(true);
            expect(el.innerHTML).toEqual('');
        });

        it('binding to a boolean observable property using dynamic template', () => {
            loadFixtures('templates/Directives/If.html');

            var el = <HTMLElement> document.querySelector("#if-observable-boolean-dynamic");
            var prop = xi.property(true);
            expect(() => xi.applyDirectives(prop, el)).not.toThrowError();
            expect($(el).find("span")).toHaveText("foo");

            // try it again
            xi.cleanNode(el);
            expect(() => xi.applyDirectives(prop, el)).not.toThrowError();
            expect($(el).find("span").length).toEqual(1);
            expect($(el).find("span")).toHaveText("foo");
        });

        it('binding to a boolean observable property using dynamic template with command', () => {
            loadFixtures('templates/Directives/If.html');

            var model = {
                show: xi.property(true),
                cmd: xi.command(() => {})
            };

            var el = <HTMLElement> document.querySelector("#if-observable-boolean-command");
            expect(() => xi.applyDirectives(model, el)).not.toThrowError();

            var count = 0;
            var disp = model.cmd.results.subscribe(x => count++);
            expect(count).toEqual(0);
            $(el).find("button")[0].click();
            expect(count).toEqual(1);

            // try it again
            xi.cleanNode(el);
            $(el).find("button")[0].click(); // command shouldnt fire now
            expect(count).toEqual(1);
            disp.dispose();
        });
    });
});