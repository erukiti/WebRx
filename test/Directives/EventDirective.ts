/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe('Directives', () => {
    describe('Event',() => {
        it('binds a single event to a handler function',() => {
            loadFixtures('templates/Directives/Event.html');

            var el = document.querySelector("#event-single");

            var called = false;
            var eventName = undefined;
            var calledWithValidContext = false;
            var calledWithValidEvent = false;
            var callCount = 0;

            var model = {
                clickHandler: (ctx: wx.IDataContext, e: Event) => {
                    callCount++;
                    called = true;
                    eventName = e.type;

                    if (ctx.hasOwnProperty("$data"))
                        calledWithValidContext = true;

                    if (e instanceof window['Event'])
                        calledWithValidEvent = true;
                }
            };

            expect(() => wx.applyDirectives(model, el)).not.toThrowError();

            expect(called).not.toBeTruthy();
            expect(eventName).not.toEqual("click");
            expect(calledWithValidContext).not.toBeTruthy();
            expect(calledWithValidEvent).not.toBeTruthy();

            $(el).click();

            expect(called).toBeTruthy();
            expect(eventName).toEqual("click");
            expect(calledWithValidContext).toBeTruthy();
            expect(calledWithValidEvent).toBeTruthy();

            wx.cleanNode(el);
            called = false;

            // should no longer fire
            $(el).click();

            expect(called).toBeFalsy();
        });

        it('binds multiple events to handler functions',() => {
            loadFixtures('templates/Directives/Event.html');

            var el = <HTMLInputElement> document.querySelector("#event-multiple");

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

            expect(() => wx.applyDirectives(model, el)).not.toThrowError();

            expect(clickCallCount).toEqual(0);
            expect(inputCallCount).toEqual(0);

            $(el).click();
            expect(clickCallCount).toEqual(1);

            $(el).val("new");
            testutils.triggerEvent(el, "input");
            expect(inputCallCount).toEqual(1);

            wx.cleanNode(el);
            clickCallCount = 0;
            inputCallCount = 0;

            // should no longer fire
            $(el).click();
            expect(clickCallCount).toEqual(0);

            $(el).val("old");
            testutils.triggerEvent(el, "input");
            expect(inputCallCount).toEqual(0);
        });

        it('binds multiple events to observers',() => {
            loadFixtures('templates/Directives/Event.html');

            var el = <HTMLInputElement> document.querySelector("#event-multiple-observer");

            var clickCallCount = 0;
            var inputCallCount = 0;

            var model = {
                clickObserver: new Rx.Subject<Event>(),
                inputObserver: new Rx.Subject<Event>()
            };

            model.clickObserver.subscribe(x => clickCallCount++);
            model.inputObserver.subscribe(x => inputCallCount++);

            expect(() => wx.applyDirectives(model, el)).not.toThrowError();

            expect(clickCallCount).toEqual(0);
            expect(inputCallCount).toEqual(0);

            $(el).click();
            expect(clickCallCount).toEqual(1);

            el.value = "new";
            testutils.triggerEvent(el, "input");
            expect(inputCallCount).toEqual(1);

            wx.cleanNode(el);
            clickCallCount = 0;
            inputCallCount = 0;

            // should no longer fire
            $(el).click();
            expect(clickCallCount).toEqual(0);

            el.value = "old";
            testutils.triggerEvent(el, "input");
            expect(inputCallCount).toEqual(0);
        });
    });
});