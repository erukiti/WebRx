/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe('Components', () => {
    var domManager = wx.injector.resolve<wx.IDomManager>(wx.res.domManager);

    describe('RadioGroup',() => {
        it('items only',() => {
            loadFixtures('templates/Components/RadioGroup.html');

            var el = document.querySelector("#fixture1");
            var items = [3, 2, 1];
            var model = { items: items };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            el = <HTMLElement> el.childNodes[0];

            expect(el.childNodes.length).toEqual(items.length);
            expect(testutils.nodeChildrenToArray<HTMLElement>(el).filter(x=> x instanceof HTMLInputElement)
                .map(x => wx.internal.getNodeValue(x, domManager))).toEqual(items);

            // should automatically assign groupname
            expect(testutils.nodeChildrenToArray<HTMLElement>(el).filter(x => x instanceof HTMLInputElement)
                .map(x => x.getAttribute("name")).every(x => x.indexOf("wx-radiogroup") === 0)).toBeTruthy();

            // all items share the same groupname
            var groupName = (<HTMLElement> el.childNodes[0]).getAttribute("name");
            expect(testutils.nodeChildrenToArray<HTMLElement>(el).filter(x => x instanceof HTMLInputElement)
                .map(x => x.getAttribute("name")).every(x => x === groupName)).toBeTruthy();
        });

        it('items with custom groupName',() => {
            loadFixtures('templates/Components/RadioGroup.html');

            var el = document.querySelector("#fixture5");
            var items = [3, 2, 1];
            var model = { items: items };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            el = <HTMLElement> el.childNodes[0];

            expect(el.childNodes.length).toEqual(items.length);
            expect(testutils.nodeChildrenToArray<HTMLElement>(el).filter(x=> x instanceof HTMLInputElement)
                .map(x => wx.internal.getNodeValue(x, domManager))).toEqual(items);

            expect(testutils.nodeChildrenToArray<HTMLElement>(el).filter(x=> x instanceof HTMLInputElement)
                .map(x => x.getAttribute("name"))).toEqual(["foo", "foo", "foo"]);
        });

        it('items with label',() => {
            loadFixtures('templates/Components/RadioGroup.html');

            var el = document.querySelector("#fixture2");
            var items = [{ key: "foo", value: "1" }, { key: "bar", value: "2" }, { key: "baz", value: "3" }];
            var model = { items: items };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            el = <HTMLElement> el.childNodes[0];
            
            expect(el.childNodes.length / 2).toEqual(items.length);
            expect(testutils.nodeChildrenToArray<HTMLElement>(el).filter(x=> x instanceof HTMLLabelElement)
                .map(x => x.textContent)).toEqual(items.map(x=> x.key));
        });

        it('items with label and css-class',() => {
            loadFixtures('templates/Components/RadioGroup.html');

            var el = document.querySelector("#fixture3");
            var items = [{ key: "foo", value: "1" }, { key: "bar", value: "2" }, { key: "baz", value: "3" }];
            var model = { items: items };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            el = <HTMLElement> el.childNodes[0];

            expect(el.childNodes.length / 2).toEqual(items.length);
            expect($(el).children("input").map((x, y) => y.getAttribute("class"))).toEqual(['radio-item', 'radio-item', 'radio-item']);
        });

        it('items with label, css-class and selection',() => {
            loadFixtures('templates/Components/RadioGroup.html');

            var el = document.querySelector("#fixture4");
            var items = [{ key: "foo", value: "1" }, { key: "bar", value: "2" }, { key: "baz", value: "3" }];
            var model = { items: items, selection: wx.property("2") };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();
            el = <HTMLElement> el.childNodes[0];

            expect(el.childNodes.length / 2).toEqual(items.length);

            // selection should propagate from model
            expect((<HTMLInputElement> $(el).children("input")[1]).checked).toBeTruthy();

            // selection should propagate to model
            testutils.triggerEvent($(el).children("input")[2], "click");
            expect(model.selection()).toEqual("3");

            //console.log((<any> document.querySelector("#fixture4")).innerHTML);
            wx.cleanNode(document.querySelector("#fixture4"));

            // selection should no longer propagate to model
            testutils.triggerEvent($(el).children("input")[0], "click");
            expect(model.selection()).toEqual("3");
        });
    });
});