/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../TestUtils.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe('Directives', () => {
    describe('Selection', () => {
        describe('Radio (single-selection)',() => {
            it("Should be able to control a radio's checked state",() => {
                loadFixtures('templates/Directives/Selection.html');
                var container = <any> document.querySelector("#fixture1");

                // none of the radios should be checked initially
                expect(testutils.nodeListToArray(container.children).map((element) =>
                    (<HTMLInputElement> element).checked)).toEqual([false, false, false]);

                var selected = wx.property('1');
                var model = { selected: selected };
                wx.applyDirectives(model, container);

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
                loadFixtures('templates/Directives/Selection.html');
                var container = <any> document.querySelector("#fixture1");

                // none of the radios should be checked initially
                expect(testutils.nodeListToArray(container.children).map((element) =>
                    (<HTMLInputElement> element).checked)).toEqual([false, false, false]);

                var selected = wx.property();
                var model = { selected: selected };
                wx.applyDirectives(model, container);

                var notificationCount = 0;
                model.selected.changed.subscribe(x => notificationCount++);

                container.children[1].click();
                expect(model.selected()).toEqual('1');

                container.children[0].click();
                container.children[0].click();
                container.children[0].click();
                testutils.triggerEvent(container.children[0], "changed");
                expect(model.selected()).toEqual('0');

                expect(notificationCount).toEqual(2);
            });

            it("If initial model value is undefined none of the radios should be checked",() => {
                loadFixtures('templates/Directives/Selection.html');
                var container = <any> document.querySelector("#fixture1");

                var selected = wx.property(undefined);
                var model = { selected: selected };
                wx.applyDirectives(model, container);

                // none of the radios should be checked initially
                expect(testutils.nodeListToArray(container.children).map((element) =>
                    (<HTMLInputElement> element).checked)).toEqual([false, false, false]);
            });
        });
    });
});
