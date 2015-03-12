/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../TestUtils.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe('Bindings', () => {
    describe('SelectedValue', () => {
        describe('Radio (single-selection)',() => {
            it("Should be able to control a radio's checked state",() => {
                loadFixtures('templates/Bindings/SelectedValue.html');
                var container = <any> document.querySelector("#fixture1");

                // none of the radios should be checked initially
                expect(testutils.nodeListToArray(container.children).map((element) =>
                    (<HTMLInputElement> element).checked)).toEqual([false, false, false]);

                var selected = wx.property('1');
                var model = { selected: selected };
                wx.applyBindings(model, container);

                // only middle element should be checked
                expect(testutils.nodeListToArray(container.children).map((element) =>
                    (<HTMLInputElement> element).checked)).toEqual([false, true, false]);

                selected('2');

                // only last element should be checked
                expect(testutils.nodeListToArray(container.children).map((element) =>
                    (<HTMLInputElement> element).checked)).toEqual([false, false, true]);

                selected('0');

                // first element should be checked
                expect(testutils.nodeListToArray(container.children).map((element) =>
                    (<HTMLInputElement> element).checked)).toEqual([true, false, false]);
            });

            it("Clicking a radio should reflect back to model",() => {
                loadFixtures('templates/Bindings/SelectedValue.html');
                var container = <any> document.querySelector("#fixture1");

                // none of the radios should be checked initially
                expect(testutils.nodeListToArray(container.children).map((element) =>
                    (<HTMLInputElement> element).checked)).toEqual([false, false, false]);

                var selected = wx.property();
                var model = { selected: selected };
                wx.applyBindings(model, container);

                var notificationCount = 0;
                model.selected.changed.subscribe(x => notificationCount++);

                testutils.triggerEvent(container.children[1], "click");
                expect(model.selected()).toEqual('1');

                testutils.triggerEvent(container.children[0], "click");
                testutils.triggerEvent(container.children[0], "click");
                testutils.triggerEvent(container.children[0], "click");
                testutils.triggerEvent(container.children[0], "change");
                expect(model.selected()).toEqual('0');

                expect(notificationCount).toEqual(2);
            });

            it("If initial model value is undefined none of the radios should be checked",() => {
                loadFixtures('templates/Bindings/SelectedValue.html');
                var container = <any> document.querySelector("#fixture1");

                var selected = wx.property(undefined);
                var model = { selected: selected };
                wx.applyBindings(model, container);

                // none of the radios should be checked initially
                expect(testutils.nodeListToArray(container.children).map((element) =>
                    (<HTMLInputElement> element).checked)).toEqual([false, false, false]);
            });
        });

        describe('Select (single-selection)',() => {
            it("Should be able to control a Select's selectedIndex",() => {
                loadFixtures('templates/Bindings/SelectedValue.html');
                var container = <HTMLSelectElement> <any> document.querySelector("#fixture2");

                // first option should be selected by default
                expect(container.selectedIndex).toEqual(0);

                var selected = wx.property('1');
                var model = { selected: selected };
                wx.applyBindings(model, container);

                // only middle element should be selected
                expect(container.selectedIndex).toEqual(1);

                selected('2');

                // only last element should be selected
                expect(container.selectedIndex).toEqual(2);

                selected('0');

                // first element should be selected
                expect(container.selectedIndex).toEqual(0);
            });

            it("Selecting an option should reflect selection back to model",() => {
                loadFixtures('templates/Bindings/SelectedValue.html');
                var container = <HTMLSelectElement> <any> document.querySelector("#fixture2");

                // first option should be selected by default
                expect(container.selectedIndex).toEqual(0);

                var selected = wx.property();
                var model = { selected: selected };
                wx.applyBindings(model, container);

                var notificationCount = 0;
                model.selected.changed.subscribe(x => notificationCount++);

                container.selectedIndex = 1;
                testutils.triggerEvent(container, "change");
                expect(model.selected()).toEqual('1');

                container.selectedIndex = 0;
                testutils.triggerEvent(container, "change");
                testutils.triggerEvent(container, "change");
                testutils.triggerEvent(container, "change");
                expect(model.selected()).toEqual('0');

                expect(notificationCount).toEqual(2);
            });

            it("If initial model value is undefined, selectedIndex should be undefined as well",() => {
                loadFixtures('templates/Bindings/SelectedValue.html');
                var container = <any> document.querySelector("#fixture1");

                var selected = wx.property(undefined);
                var model = { selected: selected };
                wx.applyBindings(model, container);

                // none of the radios should be checked initially
                expect(container.selectedIndex).not.toBeDefined();
            });
        });
    });
});
