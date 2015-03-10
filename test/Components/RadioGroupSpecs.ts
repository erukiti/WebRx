/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe('Components', () => {
    describe('RadioGroup', () => {
        it('items only',() => {
            loadFixtures('templates/Components/RadioGroup.html');

            var el = document.querySelector("#fixture1");
            var items = [3, 2, 1];
            var model = { items: items };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            el = <HTMLElement> el.childNodes[0];

            expect(el.childNodes.length).toEqual(items.length);
            expect($(el).children("input").map((x, y) => y.getAttribute("value"))).toEqual(items.map(x=> x.toString()));
        });

        it('items with label',() => {
            loadFixtures('templates/Components/RadioGroup.html');

            var el = document.querySelector("#fixture2");
            var items = [{ key: "foo", value: 1 }, { key: "bar", value: 2 }, { key: "baz", value: 3 }];
            var model = { items: items };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            el = <HTMLElement> el.childNodes[0];

            expect(el.childNodes.length / 2).toEqual(items.length);
            expect($(el).children("label").map((x, y) => y.textContent)).toEqual(items.map(x=> x.key));
        });

        it('items with label and css-class',() => {
            loadFixtures('templates/Components/RadioGroup.html');

            var el = document.querySelector("#fixture3");
            var items = [{ key: "foo", value: 1 }, { key: "bar", value: 2 }, { key: "baz", value: 3 }];
            var model = { items: items };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            el = <HTMLElement> el.childNodes[0];

            expect(el.childNodes.length / 2).toEqual(items.length);
            expect($(el).children("input").map((x, y) => y.getAttribute("class"))).toEqual(['radio-item', 'radio-item', 'radio-item']);
        });

        //it('items with label, css-class and selection',() => {
        //    loadFixtures('templates/Components/RadioGroup.html');

        //    var el = document.querySelector("#fixture4");
        //    var items = [{ key: "foo", value: 1 }, { key: "bar", value: 2 }, { key: "baz", value: 3 }];
        //    var model = { items: items, selection: wx.property(2) };

        //    expect(() => wx.applyBindings(model, el)).not.toThrowError();
        //    el = <HTMLElement> el.childNodes[0];

        //    expect(el.childNodes.length / 2).toEqual(items.length);
        //    expect((<HTMLInputElement> $(el).children("input")[1]).checked).toBeTruthy();
        //});
    });
});