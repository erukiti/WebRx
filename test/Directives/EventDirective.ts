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

                    if (e.hasOwnProperty("bubbles"))
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

            var el = document.querySelector("#event-multiple");

            var clickCallCount = 0;
            var focusCallCount = 0;

            var model = {
                clickHandler: (ctx: wx.IDataContext, e: Event) => {
                    clickCallCount++;
                },
                focusHandler: (ctx: wx.IDataContext, e: Event) => {
                    focusCallCount++;
                }
            };

            expect(() => wx.applyDirectives(model, el)).not.toThrowError();

            expect(clickCallCount).toEqual(0);
            expect(focusCallCount).toEqual(0);

            $(el).click();
            expect(clickCallCount).toEqual(1);

            $(el).focus();
            expect(focusCallCount).toEqual(1);

            wx.cleanNode(el);
            clickCallCount = 0;
            focusCallCount = 0;

            // should no longer fire
            $(el).click();
            expect(clickCallCount).toEqual(0);

            $(el).focus();
            expect(focusCallCount).toEqual(0);
        });

        it('binds multiple events to observers',() => {
            loadFixtures('templates/Directives/Event.html');

            var el = document.querySelector("#event-multiple-observer");

            var clickCallCount = 0;
            var focusCallCount = 0;

            var model = {
                clickObserver: new Rx.Subject<Event>(),
                focusObserver: new Rx.Subject<Event>()
            };

            model.clickObserver.subscribe(x => clickCallCount++);
            model.focusObserver.subscribe(x => focusCallCount++);

            expect(() => wx.applyDirectives(model, el)).not.toThrowError();

            expect(clickCallCount).toEqual(0);
            expect(focusCallCount).toEqual(0);

            $(el).click();
            expect(clickCallCount).toEqual(1);

            $(el).focus();
            expect(focusCallCount).toEqual(1);

            wx.cleanNode(el);
            clickCallCount = 0;
            focusCallCount = 0;

            // should no longer fire
            $(el).click();
            expect(clickCallCount).toEqual(0);

            $(el).focus();
            expect(focusCallCount).toEqual(0);
        });
    });
});