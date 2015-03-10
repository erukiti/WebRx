/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../TestUtils.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe('Bindings', () => {
    describe('Checked', () => {
        it('Triggering a click should toggle a checkbox\'s checked state before the event handler fires', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            // This isn't strictly to do with the checked binding, but if this doesn't work, the rest of the specs aren't meaningful
            testNode.innerHTML = "<input type='checkbox' />";
            var clickHandlerFireCount = 0, expectedCheckedStateInHandler;
            Rx.Observable.fromEvent(testNode.childNodes[0], "click").subscribe (x=> {
                clickHandlerFireCount++;
                expect(testNode.childNodes[0].checked).toEqual(expectedCheckedStateInHandler);
            });
            expect(testNode.childNodes[0].checked).toEqual(false);
            expectedCheckedStateInHandler = true;
            testNode.childNodes[0].click();
            expect(testNode.childNodes[0].checked).toEqual(true);
            expect(clickHandlerFireCount).toEqual(1);

            expectedCheckedStateInHandler = false;
            testNode.childNodes[0].click();
            expect(testNode.childNodes[0].checked).toEqual(false);
            expect(clickHandlerFireCount).toEqual(2);
        });

        it('Should be able to control a checkbox\'s checked state', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            var myobservable = wx.property(true);
            testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />";

            wx.applyBindings({ someProp: myobservable }, testNode);
            expect(testNode.childNodes[0].checked).toEqual(true);

            myobservable(false);
            expect(testNode.childNodes[0].checked).toEqual(false);
        });

        it('Should update observable properties on the underlying model when the checkbox click event fires', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            var myobservable = wx.property(false);
            testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />";
            wx.applyBindings({ someProp: myobservable }, testNode);

            testNode.childNodes[0].click();
            expect(myobservable()).toEqual(true);
        });

        it('Should only notify observable properties on the underlying model once even if the checkbox change events fire multiple times', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            var myobservable = wx.property();
            var timesNotified = 0;
            myobservable.changed.subscribe(()=> { timesNotified++ });
            testNode.innerHTML = "<input type='checkbox' data-bind='checked:someProp' />";
            wx.applyBindings({ someProp: myobservable }, testNode);

            // Multiple events only cause one notification...
            testNode.childNodes[0].click();
            testutils.triggerEvent(testNode.childNodes[0], "change");
            testutils.triggerEvent(testNode.childNodes[0], "change");
            expect(timesNotified).toEqual(1);

            // ... until the checkbox value actually changes
            testNode.childNodes[0].click();
            testutils.triggerEvent(testNode.childNodes[0], "change");
            expect(timesNotified).toEqual(2);
        });
    });
});
