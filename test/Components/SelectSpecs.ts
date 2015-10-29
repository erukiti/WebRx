/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../src/web.rx.d.ts" />

describe('Components', () => {
    var domManager = wx.injector.get<wx.IDomManager>(wx.res.domManager);

    describe('Select',() => {
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
                .map(x => wx.getNodeValue(x, domManager))).toEqual(items);
        });

        it('custom css class for select element',() => {
            loadFixtures('templates/Components/Select.html');

            var el = <HTMLElement> document.querySelector("#fixture6");
            var items = [3, 2, 1];
            var model = { items: items };

            expect(() => wx.applyBindings(model, el)).not.toThrowError();

            expect(el.childNodes[0]).toHaveClass('wx-select');
            expect(el.childNodes[0]).toHaveClass('foo');
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

        it('live example 1',() => {
            loadFixtures('templates/Components/Select.html');

            var el = document.querySelector("#fixture5");

            var SimpleListModel = function (items) {
                this.items = wx.list(items);
                this.itemToAdd = wx.property("");
                this.selectedItem = wx.property(null);

                this.addItemCmd = wx.command(function () {
                    if (this.itemToAdd() != "") {
                        // add the item
                        this.items.add(this.itemToAdd());

                        // clear the textbox
                        this.itemToAdd("");
                    }
                }, wx.whenAny(this.itemToAdd, function (itemToAdd) {
                    return itemToAdd.length > 0;
                }), this);

                this.removeItemCmd = wx.command(function () {
                    // remove the item
                    this.items.remove(this.selectedItem());

                    // clear selection
                    this.selectedItem(null);
                }, wx.whenAny(this.selectedItem, function (selectedItem) {
                        return selectedItem != null;
                    }), this);
            };

            var templateLength = 5;
            var initialContents = ["Alpha", "Beta", "Gamma"];
            var model = new SimpleListModel(initialContents);

            wx.applyBindings(model, el);

            // select element should be filled
            expect(model.items.length()).toEqual(3);
            expect(el.childNodes.length / templateLength).toEqual(model.items.length());

            // delete the first item
            model.selectedItem(model.items.get(0));
            testutils.triggerEvent(<any> el.querySelector(".btn-danger"), "click");
            expect(model.items.length()).toEqual(2);
        });
    });
});
