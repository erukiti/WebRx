/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../TestUtils.ts" />
/// <reference path="../../build/web.rx.d.ts" />

/*
describe('Bindings', () => {
    describe('Value', () => {
        it('Should assign the value to the node', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            testNode.innerHTML = "<input data-bind='value:123' />";
            wx.applyBindings(null, testNode);
            expect(testNode.childNodes[0].value).toEqual("123");
        });

        it('Should treat null values as empty strings', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            testNode.innerHTML = "<input data-bind='value:myProp' />";
            wx.applyBindings({ myProp: wx.property(0) }, testNode);
            expect(testNode.childNodes[0].value).toEqual("0");
        });

        it('Should assign an empty string as value if the model value is null', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            testNode.innerHTML = "<input data-bind='value:(null)' />";
            wx.applyBindings(null, testNode);
            expect(testNode.childNodes[0].value).toEqual("");
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
            testNode.innerHTML = "<input data-bind='value:someProp' />";
            wx.applyBindings({ someProp: myobservable }, testNode);
            expect(testNode.childNodes[0].value).toEqual("123");
            myobservable(456);
            expect(testNode.childNodes[0].value).toEqual("456");
        });

        it('For observable values, should update on change if new value is \'strictly\' different from previous value', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            var myobservable = wx.property<any>("+123");
            testNode.innerHTML = "<input data-bind='value:someProp' />";
            wx.applyBindings({ someProp: myobservable }, testNode);
            expect(testNode.childNodes[0].value).toEqual("+123");
            myobservable(123);
            expect(testNode.childNodes[0].value).toEqual("123");
        });

        it('For writeable observable values, should catch the node\'s onchange and write values back to the observable', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            var myobservable = wx.property(123);
            testNode.innerHTML = "<input data-bind='value:someProp' />";
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

            testNode.innerHTML = "<input data-bind='value: prop' />";
            wx.applyBindings(vm, testNode);
            expect(testNode.childNodes[0].value).toEqual("zzz");

            // Change the input value and trigger change event; verify that the view model wasn't changed
            testNode.childNodes[0].value = "yyy";
            testutils.triggerEvent(testNode.childNodes[0], "change");
            expect(vm.prop).toEqual(computedValue);
            expect(computedValue()).toEqual('zzz');
        });

        it('For non-observable property values, should catch the node\'s onchange and write values back to the property', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            var model = { modelProperty123: 456 };
            testNode.innerHTML = "<input data-bind='value: modelProperty123' />";
            wx.applyBindings(model, testNode);
            expect(testNode.childNodes[0].value).toEqual("456");

            testNode.childNodes[0].value = 789;
            testutils.triggerEvent(testNode.childNodes[0], "change");
            expect(model.modelProperty123).toEqual("789");
        });

        it('Should be able to read and write to a property of an object returned by a function', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            var mySetter = { set: 666 };
            var model = {
                getSetter: ()=> {
                    return mySetter;
                }
            };
            testNode.innerHTML =
            "<input data-bind='value: getSetter().set' />" +
            "<input data-bind='value: getSetter()[\"set\"]' />" +
            "<input data-bind=\"value: getSetter()['set']\" />";
            wx.applyBindings(model, testNode);
            expect(testNode.childNodes[0].value).toEqual('666');
            expect(testNode.childNodes[1].value).toEqual('666');
            expect(testNode.childNodes[2].value).toEqual('666');

            // .property
            testNode.childNodes[0].value = 667;
            testutils.triggerEvent(testNode.childNodes[0], "change");
            expect(mySetter.set).toEqual('667');

            // ["property"]
            testNode.childNodes[1].value = 668;
            testutils.triggerEvent(testNode.childNodes[1], "change");
            expect(mySetter.set).toEqual('668');

            // ['property']
            testNode.childNodes[0].value = 669;
            testutils.triggerEvent(testNode.childNodes[0], "change");
            expect(mySetter.set).toEqual('669');
        });

        it('Should be able to write to observable subproperties of an observable, even after the parent observable has changed', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            // This spec represents https://github.com/SteveSanderson/knockout/issues#issue/13
            var originalSubproperty = wx.property("original value");
            var newSubproperty = wx.property<any>();
            var model = { myprop: wx.property<any>({ subproperty: originalSubproperty }) };

            // Set up a text box whose value is linked to the subproperty of the observable's current value
            testNode.innerHTML = "<input data-bind='value: myprop().subproperty' />";
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

            testNode.innerHTML = "<input data-bind='value:someProp' />";
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

        it('Should be able to catch updates after specific events (e.g., keyup) instead of onchange', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            var myobservable = wx.property(123);
            testNode.innerHTML = "<input data-bind='value:someProp, valueUpdate: \"keyup\"' />";
            wx.applyBindings({ someProp: myobservable }, testNode);
            testNode.childNodes[0].value = "some user-entered value";
            testutils.triggerEvent(testNode.childNodes[0], "keyup");
            expect(myobservable()).toEqual("some user-entered value");
        });

        it('Should catch updates on change as well as the nominated valueUpdate event', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            // Represents issue #102 (https://github.com/SteveSanderson/knockout/issues/102)
            var myobservable = wx.property(123);
            testNode.innerHTML = "<input data-bind='value:someProp, valueUpdate: \"keyup\"' />";
            wx.applyBindings({ someProp: myobservable }, testNode);
            testNode.childNodes[0].value = "some user-entered value";
            testutils.triggerEvent(testNode.childNodes[0], "change");
            expect(myobservable()).toEqual("some user-entered value");
        });

        describe('For select boxes', ()=> {
            loadFixtures('templates/Generic.html');
            var testNode = <any> document.querySelector("#fixture");

            it('Should update selectedIndex when the model changes (options specified before value)', ()=> {
                var observable = wx.property('B');
                testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], value:myObservable'></select>";
                wx.applyBindings({ myObservable: observable }, testNode);
                expect(testNode.childNodes[0].selectedIndex).toEqual(1);
                expect(observable()).toEqual('B');

                observable('A');
                expect(testNode.childNodes[0].selectedIndex).toEqual(0);
                expect(observable()).toEqual('A');
            });

            it('Should update selectedIndex when the model changes (value specified before options)', ()=> {
                loadFixtures('templates/Generic.html');
                var testNode = <any> document.querySelector("#fixture");

                var observable = wx.property('B');
                testNode.innerHTML = "<select data-bind='value:myObservable, options:[\"A\", \"B\"]'></select>";
                wx.applyBindings({ myObservable: observable }, testNode);
                expect(testNode.childNodes[0].selectedIndex).toEqual(1);
                expect(observable()).toEqual('B');

                observable('A');
                expect(testNode.childNodes[0].selectedIndex).toEqual(0);
                expect(observable()).toEqual('A');
            });

            it('Should display the caption when the model value changes to undefined, null, or \"\" when using \'options\' binding', ()=> {
                loadFixtures('templates/Generic.html');
                var testNode = <any> document.querySelector("#fixture");

                var observable = wx.property('B');
                testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], optionsCaption:\"Select...\", value:myObservable'></select>";
                wx.applyBindings({ myObservable: observable }, testNode);

                // Caption is selected when observable changed to undefined
                expect(testNode.childNodes[0].selectedIndex).toEqual(2);
                observable(undefined);
                expect(testNode.childNodes[0].selectedIndex).toEqual(0);

                // Caption is selected when observable changed to null
                observable("B");
                expect(testNode.childNodes[0].selectedIndex).toEqual(2);
                observable(null);
                expect(testNode.childNodes[0].selectedIndex).toEqual(0);

                // Caption is selected when observable changed to ""
                observable("B");
                expect(testNode.childNodes[0].selectedIndex).toEqual(2);
                observable("");
                expect(testNode.childNodes[0].selectedIndex).toEqual(0);

            });

            it('Should display the caption when the model value changes to undefined, null, or \"\" when options specified directly', ()=> {
                loadFixtures('templates/Generic.html');
                var testNode = <any> document.querySelector("#fixture");

                var observable = wx.property('B');
                testNode.innerHTML = "<select data-bind='value:myObservable'><option value=''>Select...</option><option>A</option><option>B</option></select>";
                wx.applyBindings({ myObservable: observable }, testNode);

                // Caption is selected when observable changed to undefined
                expect(testNode.childNodes[0].selectedIndex).toEqual(2);
                observable(undefined);
                expect(testNode.childNodes[0].selectedIndex).toEqual(0);

                // Caption is selected when observable changed to null
                observable("B");
                expect(testNode.childNodes[0].selectedIndex).toEqual(2);
                observable(null);
                expect(testNode.childNodes[0].selectedIndex).toEqual(0);

                // Caption is selected when observable changed to ""
                observable("B");
                expect(testNode.childNodes[0].selectedIndex).toEqual(2);
                observable("");
                expect(testNode.childNodes[0].selectedIndex).toEqual(0);
            });

            it('When size > 1, should unselect all options when value is undefined, null, or \"\"', ()=> {
                loadFixtures('templates/Generic.html');
                var testNode = <any> document.querySelector("#fixture");

                var observable = wx.property('B');
                testNode.innerHTML = "<select size='2' data-bind='options:[\"A\", \"B\"], value:myObservable'></select>";
                wx.applyBindings({ myObservable: observable }, testNode);

                // Nothing is selected when observable changed to undefined
                expect(testNode.childNodes[0].selectedIndex).toEqual(1);
                observable(undefined);
                expect(testNode.childNodes[0].selectedIndex).toEqual(-1);

                // Nothing is selected when observable changed to null
                observable("B");
                expect(testNode.childNodes[0].selectedIndex).toEqual(1);
                observable(null);
                expect(testNode.childNodes[0].selectedIndex).toEqual(-1);

                // Nothing is selected when observable changed to ""
                observable("B");
                expect(testNode.childNodes[0].selectedIndex).toEqual(1);
                observable("");
                expect(testNode.childNodes[0].selectedIndex).toEqual(-1);
            });

            it('Should update the model value when the UI is changed (setting it to undefined when the caption is selected)', ()=> {
                loadFixtures('templates/Generic.html');
                var testNode = <any> document.querySelector("#fixture");

                var observable = wx.property('B');
                testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], optionsCaption:\"Select...\", value:myObservable'></select>";
                wx.applyBindings({ myObservable: observable }, testNode);
                var dropdown = testNode.childNodes[0];

                dropdown.selectedIndex = 1;
                testutils.triggerEvent(dropdown, "change");
                expect(observable()).toEqual("A");

                dropdown.selectedIndex = 0;
                testutils.triggerEvent(dropdown, "change");
                expect(observable()).toEqual(undefined);
            });

            it('Should be able to associate option values with arbitrary objects (not just strings)', ()=> {
                loadFixtures('templates/Generic.html');
                var testNode = <any> document.querySelector("#fixture");

                var x = {}, y = {};
                var selectedValue = wx.property(y);
                testNode.innerHTML = "<select data-bind='options: myOptions, value: selectedValue'></select>";
                var dropdown = testNode.childNodes[0];
                wx.applyBindings({ myOptions: [x, y], selectedValue: selectedValue }, testNode);

                // Check the UI displays the entry corresponding to the chosen value
                expect(dropdown.selectedIndex).toEqual(1);

                // Check that when we change the model value, the UI is updated
                selectedValue(x);
                expect(dropdown.selectedIndex).toEqual(0);

                // Check that when we change the UI, this changes the model value
                dropdown.selectedIndex = 1;
                testutils.triggerEvent(dropdown, "change");
                expect(selectedValue()).toEqual(y);
            });

            it('Should automatically initialize the model property to match the first option value if no option value matches the current model property value', ()=> {
                loadFixtures('templates/Generic.html');
                var testNode = <any> document.querySelector("#fixture");

                // The rationale here is that we always want the model value to match the option that appears to be selected in the UI
                //  * If there is *any* option value that equals the model value, we'd initalise the select box such that *that* option is the selected one
                //  * If there is *no* option value that equals the model value (often because the model value is undefined), we should set the model
                //    value to match an arbitrary option value to avoid inconsistency between the visible UI and the model
                var observable = wx.property(); // Undefined by default

                // Should work with options specified before value
                testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], value:myObservable'></select>";
                wx.applyBindings({ myObservable: observable }, testNode);
                expect(observable()).toEqual("A");

                // ... and with value specified before options
                this.domService.clearElementState(testNode);
                testNode.innerHTML = "<select data-bind='value:myObservable, options:[\"A\", \"B\"]'></select>";
                observable(undefined);
                expect(observable()).toEqual(undefined);
                wx.applyBindings({ myObservable: observable }, testNode);
                expect(observable()).toEqual("A");
            });

            it('When non-empty, should reject model values that don\'t match any option value, resetting the model value to whatever is visibly selected in the UI', ()=> {
                loadFixtures('templates/Generic.html');
                var testNode = <any> document.querySelector("#fixture");

                var observable = wx.property('B');
                testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\", \"C\"], value:myObservable'></select>";
                wx.applyBindings({ myObservable: observable }, testNode);
                expect(testNode.childNodes[0].selectedIndex).toEqual(1);

                observable('D'); // This change should be rejected, as there's no corresponding option in the UI
                expect(observable()).toEqual('B');

                observable(null); // This change should also be rejected
                expect(observable()).toEqual('B');
            });

            it('Should support numerical option values, which are not implicitly converted to strings', ()=> {
                loadFixtures('templates/Generic.html');
                var testNode = <any> document.querySelector("#fixture");

                var observable = wx.property(30);
                testNode.innerHTML = "<select data-bind='options:[10,20,30,40], value:myObservable'></select>";
                wx.applyBindings({ myObservable: observable }, testNode);

                // First check that numerical model values will match a dropdown option
                expect(testNode.childNodes[0].selectedIndex).toEqual(2); // 3rd element, zero-indexed

                // Then check that dropdown options map back to numerical model values
                testNode.childNodes[0].selectedIndex = 1;
                testutils.triggerEvent(testNode.childNodes[0], "change");
                expect(typeof observable()).toEqual("number");
                expect(observable()).toEqual(20);
            });

            it('Should always use value (and not text) when options have value attributes', ()=> {
                loadFixtures('templates/Generic.html');
                var testNode = <any> document.querySelector("#fixture");

                var observable = wx.property('A');
                testNode.innerHTML = "<select data-bind='value:myObservable'><option value=''>A</option><option value='A'>B</option></select>";
                wx.applyBindings({ myObservable: observable }, testNode);
                var dropdown = testNode.childNodes[0];
                expect(dropdown.selectedIndex).toEqual(1);

                dropdown.selectedIndex = 0;
                testutils.triggerEvent(dropdown, "change");
                expect(observable()).toEqual("");
            });

            it('Should use text value when options have text values but no value attribute', ()=> {
                loadFixtures('templates/Generic.html');
                var testNode = <any> document.querySelector("#fixture");

                var observable = wx.property('B');
                testNode.innerHTML = "<select data-bind='value:myObservable'><option>A</option><option>B</option><option>C</option></select>";
                wx.applyBindings({ myObservable: observable }, testNode);
                var dropdown = testNode.childNodes[0];
                expect(dropdown.selectedIndex).toEqual(1);

                dropdown.selectedIndex = 0;
                testutils.triggerEvent(dropdown, "change");
                expect(observable()).toEqual("A");

                observable('C');
                expect(dropdown.selectedIndex).toEqual(2);
            });

            describe('Using valueAllowUnset option', ()=> {
                it('Should display the caption when the model value changes to undefined, null, or \"\" when using \'options\' binding', ()=> {
                    loadFixtures('templates/Generic.html');
                    var testNode = <any> document.querySelector("#fixture");

                    var observable = wx.property('B');
                    testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], optionsCaption:\"Select...\", value:myObservable, valueAllowUnset:true'></select>";
                    wx.applyBindings({ myObservable: observable }, testNode);
                    var select = testNode.childNodes[0];

                    select.selectedIndex = 2;
                    observable(undefined);
                    expect(select.selectedIndex).toEqual(0);

                    select.selectedIndex = 2;
                    observable(null);
                    expect(select.selectedIndex).toEqual(0);

                    select.selectedIndex = 2;
                    observable("");
                    expect(select.selectedIndex).toEqual(0);
                });

                it('Should display the caption when the model value changes to undefined, null, or \"\" when options specified directly', ()=> {
                    loadFixtures('templates/Generic.html');
                    var testNode = <any> document.querySelector("#fixture");

                    var observable = wx.property('B');
                    testNode.innerHTML = "<select data-bind='value:myObservable, valueAllowUnset:true'><option value=''>Select...</option><option>A</option><option>B</option></select>";
                    wx.applyBindings({ myObservable: observable }, testNode);
                    var select = testNode.childNodes[0];

                    select.selectedIndex = 2;
                    observable(undefined);
                    expect(select.selectedIndex).toEqual(0);

                    select.selectedIndex = 2;
                    observable(null);
                    expect(select.selectedIndex).toEqual(0);

                    select.selectedIndex = 2;
                    observable("");
                    expect(select.selectedIndex).toEqual(0);
                });

                it('Should select no option value if no option value matches the current model property value', ()=> {
                    loadFixtures('templates/Generic.html');
                    var testNode = <any> document.querySelector("#fixture");

                    var observable = wx.property();
                    testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\"], value:myObservable, valueAllowUnset:true'></select>";
                    wx.applyBindings({ myObservable: observable }, testNode);

                    expect(testNode.childNodes[0].selectedIndex).toEqual(-1);
                    expect(observable()).toEqual(undefined);
                });

                it('Should select no option value if model value does\'t match any option value', ()=> {
                    loadFixtures('templates/Generic.html');
                    var testNode = <any> document.querySelector("#fixture");

                    var observable = wx.property('B');
                    testNode.innerHTML = "<select data-bind='options:[\"A\", \"B\", \"C\"], value:myObservable, valueAllowUnset:true'></select>";
                    wx.applyBindings({ myObservable: observable }, testNode);
                    expect(testNode.childNodes[0].selectedIndex).toEqual(1);

                    observable('D');
                    expect(testNode.childNodes[0].selectedIndex).toEqual(-1);
                });

                it('Should maintain model value and update selection when options change', ()=> {
                    loadFixtures('templates/Generic.html');
                    var testNode = <any> document.querySelector("#fixture");

                    var observable = wx.property("D");
                    var options = wx.list(["A", "B"]);
                    testNode.innerHTML = "<select data-bind='options:myOptions, value:myObservable, valueAllowUnset:true'></select>";
                    wx.applyBindings({ myObservable: observable, myOptions: options }, testNode);

                    // Initially nothing is selected because the value isn't in the options list
                    expect(testNode.childNodes[0].selectedIndex).toEqual(-1);
                    expect(observable()).toEqual("D");

                    // Replace with new options that still don't contain the value
                    options.addRange(["B", "C"]);
                    expect(testNode.childNodes[0].selectedIndex).toEqual(-1);
                    expect(observable()).toEqual("D");

                    // Now update with options that do contain the value
                    options.addRange(["C", "D"]);
                    expect(testNode.childNodes[0].selectedIndex).toEqual(1);
                    expect(observable()).toEqual("D");

                    // Update back to options that don't contain the value
                    options.addRange(["E", "F"]);
                    expect(testNode.childNodes[0].selectedIndex).toEqual(-1);
                    expect(observable()).toEqual("D");
                });
            });
        });

        describe('Acts like \'checkedValue\' on a checkbox or radio', ()=> {
            it('Should update value, but not respond to events when on a checkbox', ()=> {
                loadFixtures('templates/Generic.html');
                var testNode = <any> document.querySelector("#fixture");

                var observable = wx.property('B');
                testNode.innerHTML = "<input type='checkbox' data-bind='value: myObservable' />";
                wx.applyBindings({ myObservable: observable }, testNode);

                var checkbox = testNode.childNodes[0];
                expect(checkbox.value).toEqual('B');

                observable('C');
                expect(checkbox.value).toEqual('C');

                checkbox.value = 'D';
                testutils.triggerEvent(checkbox, "change");

                // observable does not update, as we are not handling events when on a checkbox/radio
                expect(observable()).toEqual('C');
            });

            it('Should update value, but not respond to events when on a radio', ()=> {
                loadFixtures('templates/Generic.html');
                var testNode = <any> document.querySelector("#fixture");

                var observable = wx.property('B');
                testNode.innerHTML = "<input type='radio' data-bind='value: myObservable' />";
                wx.applyBindings({ myObservable: observable }, testNode);

                var radio = testNode.childNodes[0];
                expect(radio.value).toEqual('B');

                observable('C');
                expect(radio.value).toEqual('C');

                radio.value = 'D';
                testutils.triggerEvent(radio, "change");

                // observable does not update, as we are not handling events when on a checkbox/radio
                expect(observable()).toEqual('C');
            });
        });
    });
});
*/