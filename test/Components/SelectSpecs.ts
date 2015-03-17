/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe('Components', () => {
    describe('Select', () => {
        it('items only',() => {
            loadFixtures('templates/Components/Select.html');

            var el = <HTMLElement> document.querySelector("#fixture1");
            var items = [3, 2, 1];
            var model = { items: items };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            //console.log(el.innerHTML);
            el = <HTMLElement> el.childNodes[0];

            expect(el.childNodes.length).toEqual(items.length);
            expect(testutils.nodeChildrenToArray<HTMLElement>(el).filter(x=> x instanceof HTMLOptionElement)
                .map(x => x.getAttribute("value"))).toEqual(items.map(x=> x.toString()));
        });

        it('items with label',() => {
            loadFixtures('templates/Components/Select.html');

            var el = document.querySelector("#fixture2");
            var items = [{ key: "foo", value: "1" }, { key: "bar", value: "2" }, { key: "baz", value: "3" }];
            var model = { items: items };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            el = <HTMLElement> el.childNodes[0];
            
            expect(el.childNodes.length).toEqual(items.length);
            expect(testutils.nodeChildrenToArray<HTMLElement>(el).filter(x=> x instanceof HTMLOptionElement)
                .map(x => x.textContent)).toEqual(items.map(x=> x.key));
        });

        it('items with label and css-class',() => {
            loadFixtures('templates/Components/Select.html');

            var el = document.querySelector("#fixture3");
            var items = [{ key: "foo", value: "1" }, { key: "bar", value: "2" }, { key: "baz", value: "3" }];
            var model = { items: items };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            el = <HTMLElement> el.childNodes[0];

            expect(el.childNodes.length).toEqual(items.length);
            expect($(el).children("option").map((x, y) => y.getAttribute("class"))).toEqual(['select-item', 'select-item', 'select-item']);
        });

        it('items with label, css-class and selection',() => {
            loadFixtures('templates/Components/Select.html');

            var el = document.querySelector("#fixture4");
            var items = [{ key: "foo", value: "1" }, { key: "bar", value: "2" }, { key: "baz", value: "3" }];
            var model = { items: items, selection: wx.property("2") };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            el = <HTMLSelectElement> el.childNodes[0];
            var select = <HTMLSelectElement> el;

            expect(el.childNodes.length).toEqual(items.length);
            expect(model.selection()).toEqual("2");

            // selection should propagate to model
            select.selectedIndex = 2;
            testutils.triggerEvent(select, "change");
            expect(model.selection()).toEqual("3");

            //console.log((<any> document.querySelector("#fixture4")).innerHTML);
            wx.cleanNode(document.querySelector("#fixture4"));

            // selection should no longer propagate to model
            select.selectedIndex = 0;
            testutils.triggerEvent(select, "change");
            expect(model.selection()).toEqual("3");
        });
    });
});