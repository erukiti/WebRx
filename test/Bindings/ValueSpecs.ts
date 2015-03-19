/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../TestUtils.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe('Bindings', () => {
    describe('Value', () => {
       it('Should treat null values as empty strings', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            testNode.innerHTML = "<input data-bind='value: @myProp' />";
            wx.applyBindings({ myProp: wx.property(0) }, testNode);
            expect(testNode.childNodes[0].value).toEqual("0");
        });

        it('Should assign an empty string as value if the model value is undefined', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            testNode.innerHTML = "<input data-bind='value:undefined' />";
            wx.applyBindings(null, testNode);
            expect(testNode.childNodes[0].value).toEqual("");
        });

        it('For observable values, should unwrap the value and update on change', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            var myobservable = wx.property(123);
            testNode.innerHTML = "<input data-bind='value: @someProp' />";
            wx.applyBindings({ someProp: myobservable }, testNode);
            expect(testNode.childNodes[0].value).toEqual("123");
            myobservable(456);
            expect(testNode.childNodes[0].value).toEqual("456");
        });

        it('For observable values, should update on change if new value is \'strictly\' different from previous value', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            var myobservable = wx.property<any>("+123");
            testNode.innerHTML = "<input data-bind='value: @someProp' />";
            wx.applyBindings({ someProp: myobservable }, testNode);
            expect(testNode.childNodes[0].value).toEqual("+123");
            myobservable(123);
            expect(testNode.childNodes[0].value).toEqual("123");
        });

        it('For writeable observable values, should catch the node\'s onchange and write values back to the observable', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            var myobservable = wx.property(123);
            testNode.innerHTML = "<input data-bind='value: @someProp' />";
            wx.applyBindings({ someProp: myobservable }, testNode);
            testNode.childNodes[0].value = "some user-entered value";
            testutils.triggerEvent(testNode.childNodes[0], "change");
            expect(myobservable()).toEqual("some user-entered value");
        });

        it('Should ignore node changes when bound to a read-only observable', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            var computedValue = Rx.Observable.return('zzz').toProperty();
            var vm = { prop: computedValue };

            testNode.innerHTML = "<input data-bind='value: @prop' />";
            wx.applyBindings(vm, testNode);
            expect(testNode.childNodes[0].value).toEqual("zzz");

            // Change the input value and trigger change event; verify that the view model wasn't changed
            testNode.childNodes[0].value = "yyy";
            testutils.triggerEvent(testNode.childNodes[0], "change");
            expect(vm.prop).toEqual(computedValue);
            expect(computedValue()).toEqual('zzz');
        });

        it('Should be able to write to observable subproperties of an observable, even after the parent observable has changed', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            // This spec represents https://github.com/SteveSanderson/knockout/issues#issue/13
            var originalSubproperty = wx.property("original value");
            var newSubproperty = wx.property<any>();
            var model = { myprop: wx.property<any>({ subproperty: originalSubproperty }) };

            // Set up a text box whose value is linked to the subproperty of the observable's current value
            testNode.innerHTML = "<input data-bind='value: myprop.@subproperty' />";
            wx.applyBindings(model, testNode);
            expect(testNode.childNodes[0].value).toEqual("original value");

            model.myprop({ subproperty: newSubproperty }); // Note that myprop (and hence its subproperty) is changed *after* the bindings are applied
            testNode.childNodes[0].value = "Some new value";
            testutils.triggerEvent(testNode.childNodes[0], "change");

            // Verify that the change was written to the *new* subproperty, not the one referenced when the bindings were first established
            expect(newSubproperty()).toEqual("Some new value");
            expect(originalSubproperty()).toEqual("original value");
        });

        it('Should only register one single onchange handler', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            var notifiedValues = [];
            var myobservable = wx.property(123);
            myobservable.changed.subscribe(value => { notifiedValues.push(value); });
            expect(notifiedValues.length).toEqual(0);

            testNode.innerHTML = "<input data-bind='value: @someProp' />";
            wx.applyBindings({ someProp: myobservable }, testNode);

            // Implicitly observe the number of handlers by seeing how many times "myobservable"
            // receives a new value for each onchange on the text box. If there's just one handler,
            // we'll see one new value per onchange event. More handlers cause more notifications.
            testNode.childNodes[0].value = "ABC";
            testutils.triggerEvent(testNode.childNodes[0], "change");
            expect(notifiedValues.length).toEqual(1);

            testNode.childNodes[0].value = "DEF";
            testutils.triggerEvent(testNode.childNodes[0], "change");
            expect(notifiedValues.length).toEqual(2);
        });
    });
});
