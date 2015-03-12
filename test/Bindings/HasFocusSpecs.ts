/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../TestUtils.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe('Bindings', () => {
    describe('HasFocus',() => {
        var focusInEvent = !wx.env.firefox ? "focusin" : "focus";
        var focusOutEvent = !wx.env.firefox ? "focusout" : "blur";

        // OW: TODO: Need to figure out why this happens
        if (!wx.env.firefox) {
            it('Should respond to changes on an observable value by blurring or focusing the element', () => {
                loadFixtures('templates/Generic.html');
                var testNode = <any> document.querySelector("#fixture");

                var currentState = false;
                var model = { myVal: wx.property() }
                testNode.innerHTML = "<input data-bind='hasfocus: @myVal' /><input />";
                wx.applyBindings(model, testNode);
                testNode.childNodes[0].addEventListener(focusInEvent, () => { currentState = true });
                testNode.childNodes[0].addEventListener(focusOutEvent, () => { currentState = false });

                // When the value becomes true, we focus
                model.myVal(true);
                expect(currentState).toEqual(true);

                // When the value becomes false, we blur
                model.myVal(false);
                expect(currentState).toEqual(false);
            });

            it('Should set an observable value to be true on focus and false on blur', () => {
                loadFixtures('templates/Generic.html');
                var testNode = <any> document.querySelector("#fixture");

                var model = { myVal: wx.property() }
                testNode.innerHTML = "<input data-bind='hasfocus: @myVal' /><input />";
                wx.applyBindings(model, testNode);

                // Need to raise focusInEvent and focusOutEvent manually, because simply calling ".focus()" and ".blur()"
                // in IE doesn't reliably trigger the "focus" and "blur" events synchronously

                testNode.childNodes[0].focus();
                testutils.triggerEvent(testNode.childNodes[0], focusInEvent);
                expect(model.myVal()).toEqual(true);

                // Move the focus elsewhere
                testNode.childNodes[1].focus();
                testutils.triggerEvent(testNode.childNodes[0], focusOutEvent);
                expect(model.myVal()).toEqual(false);

                // If the model value becomes true after a blur, we re-focus the element
                // (Represents issue #672, where this wasn't working)
                var didFocusExpectedElement = false;
                testNode.childNodes[0].addEventListener(focusInEvent, () => { didFocusExpectedElement = true });
                model.myVal(true);
                expect(didFocusExpectedElement).toEqual(true);
            });
        }

        it('Should not unnecessarily focus or blur an element that is already focused/blurred', () => {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            // This is the closest we can get to representing issue #698 as a spec
            var model = { isFocused: wx.property({}) };
            testNode.innerHTML = "<input data-bind='hasfocus: @isFocused' />";
            wx.applyBindings(model, testNode);

            // The elem is already focused, so changing the model value to a different truthy value
            // shouldn't cause any additional focus events
            var didFocusAgain = false;
            testNode.childNodes[0].addEventListener(focusInEvent, () => { didFocusAgain = true });
            model.isFocused(1);
            expect(didFocusAgain).toEqual(false);

            // Similarly, when the elem is already blurred, changing the model value to a different
            // falsey value shouldn't cause any additional blur events
            model.isFocused(false);
            var didBlurAgain = false;
            testNode.childNodes[0].addEventListener(focusOutEvent, () => { didBlurAgain = true });
            model.isFocused(null);
            expect(didBlurAgain).toEqual(false);
        });
    });
});
