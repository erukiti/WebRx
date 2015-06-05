/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />

describe('Bindings',() => {
    if (window["_phantom"] || wx.env.firefox || (wx.env.ie && wx.env.ie.version < 10))
        return;

    describe('KeyPress',() => {
        it('binds a single key to a handler function',() => {
            loadFixtures('templates/Bindings/KeyPress.html');

            var el = <HTMLElement> document.querySelector("#keypress-single");

            var called = false;
            var calledWithValidContext = false;
            var callCount = 0;

            var model = {
                clickHandler: (ctx: wx.IDataContext) => {
                    callCount++;
                    called = true;

                    if (ctx.hasOwnProperty("$data"))
                        calledWithValidContext = true;
                }
            };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();

            expect(called).not.toBeTruthy();
            expect(calledWithValidContext).not.toBeTruthy();

            testutils.triggerEvent(el, "keydown", 13);

            expect(called).toBeTruthy();
            expect(calledWithValidContext).toBeTruthy();

            wx.cleanNode(el);
            called = false;

            // should no longer fire
            testutils.triggerEvent(el, "click");

            expect(called).toBeFalsy();
        });

        it('binds multiple keys to handler functions',() => {
            loadFixtures('templates/Bindings/KeyPress.html');

            var el = <HTMLInputElement> document.querySelector("#keypress-multiple");

            var clickCallCount = 0;
            var inputCallCount = 0;

            var model = {
                clickHandler: (ctx: wx.IDataContext, e: Event) => {
                    clickCallCount++;
                },
                inputHandler: (ctx: wx.IDataContext, e: Event) => {
                    inputCallCount++;
                }
            };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();

            expect(clickCallCount).toEqual(0);
            expect(inputCallCount).toEqual(0);

            testutils.triggerEvent(el, "keydown", 9);
            expect(clickCallCount).toEqual(1);

            $(el).val("new");
            testutils.triggerEvent(el, "keydown", 13);
            expect(inputCallCount).toEqual(1);

            wx.cleanNode(el);
            clickCallCount = 0;
            inputCallCount = 0;

            // should no longer fire
            testutils.triggerEvent(el, "keydown", 9);
            expect(clickCallCount).toEqual(0);

            $(el).val("old");
            testutils.triggerEvent(el, "keydown", 13);
            expect(inputCallCount).toEqual(0);
        });

        it('binds multiple keys to commands',() => {
            loadFixtures('templates/Bindings/KeyPress.html');

            var el = <HTMLInputElement> document.querySelector("#keypress-multiple-command");

            var clickCallCount = 0;
            var inputCallCount = 0;

            var clickSubject = new Rx.Subject<Event>();
            var inputSubject = new Rx.Subject<Event>();

            var model = {
                clickCommand: wx.command((x) => { clickSubject.onNext(x) }),
                inputCommand: wx.command((x) => { inputSubject.onNext(x) })
            };

            clickSubject.subscribe(x => clickCallCount++);
            inputSubject.subscribe(x => inputCallCount++);

            expect(() => wx.applyBindings(model, el)).not.toThrowError();

            expect(clickCallCount).toEqual(0);
            expect(inputCallCount).toEqual(0);

            testutils.triggerEvent(el, "keydown", 9);
            expect(clickCallCount).toEqual(1);

            el.value = "new";
            testutils.triggerEvent(el, "keydown", 13);
            expect(inputCallCount).toEqual(1);

            wx.cleanNode(el);
            clickCallCount = 0;
            inputCallCount = 0;

            // should no longer fire
            testutils.triggerEvent(el, "keydown", 9);
            expect(clickCallCount).toEqual(0);

            el.value = "old";
            testutils.triggerEvent(el, "input");
            expect(inputCallCount).toEqual(0);
        });

        it('binds multiple keys to commands with params',() => {
            loadFixtures('templates/Bindings/KeyPress.html');

            var el = <HTMLInputElement> document.querySelector("#keypress-multiple-command-with-params");

            var clicks = [];

            var model = {
                clickCommand: wx.command((x) => { clicks.push(x); })
            };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();

            expect(clicks.length).toEqual(0);

            testutils.triggerEvent(el, "keydown", 9);
            expect(clicks.length).toEqual(1);
            expect(clicks[0]).toEqual('foo');

            wx.cleanNode(el);
            clicks = [];

            // should no longer fire
            testutils.triggerEvent(el, "keydown", 9);
            expect(clicks.length).toEqual(0);
        });
    });
});