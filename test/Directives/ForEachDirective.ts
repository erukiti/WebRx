/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../typings/jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />
/// <reference path="../TestModels.ts" />

describe('Directives',() => {
    function createTestList() {
        var item1 = new TestViewModel(1, "foo");
        var item2 = new TestViewModel(5, "bar");
        var item3 = new TestViewModel(7, "baz");

        return wx.list([item1, item2, item3]);
    }

    describe('ForEach', () => {
        it('binding to a standard array', () => {
            loadFixtures('templates/Directives/ForEach.html');

            var el = <HTMLElement> document.querySelector("#foreach-array");
            var templateLength = el.children.length;
            var list = [1, 5, 7];
            expect(() => wx.applyDirectives({ src: list }, el)).not.toThrowError();

            expect(el.children.length).toEqual(list.length * templateLength);
            expect($(el).children().map((index, node) => parseInt(node.textContent)).get()).toEqual(list);
        });

        it('binding to a standard array and template accessing index',() => {
            loadFixtures('templates/Directives/ForEach.html');

            var el = <HTMLElement> document.querySelector("#foreach-array-with-index");
            var templateLength = el.children.length;
            var list = [1, 5, 7];
            expect(() => wx.applyDirectives({ src: list }, el)).not.toThrowError();

            expect(el.children.length).toEqual(list.length * templateLength);
            expect($(el).children().map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length).toArray());
        });

        it('binding to a standard array - inline',() => {
            loadFixtures('templates/Directives/ForEach.html');

            var el = <HTMLElement> document.querySelector("#foreach-array-inline");
            var templateLength = el.children.length;
            expect(() => wx.applyDirectives({ }, el)).not.toThrowError();

            expect(el.children.length).toEqual(3 * templateLength);
            expect($(el).children().map((index, node) => parseInt(node.textContent)).get()).toEqual([1, 5, 7]);
        });

        it('binding to a observable list containing numbers',() => {
            loadFixtures('templates/Directives/ForEach.html');

            var el = <HTMLElement> document.querySelector("#foreach-list-scalar");
            var templateLength = el.children.length;
            var list = wx.list([1, 5, 7]);
            expect(() => wx.applyDirectives({ src: list }, el)).not.toThrowError();

            expect(el.children.length).toEqual(list.length * templateLength);
            expect($(el).children().map((index, node) => parseInt(node.textContent)).get()).toEqual(list.toArray());
        });

        it('binding to a observable list containing model',() => {
            loadFixtures('templates/Directives/ForEach.html');

            var el = <HTMLElement> document.querySelector("#foreach-list-model");
            var templateLength = el.children.length;
            var list = createTestList();
            expect(() => wx.applyDirectives({ src: list }, el)).not.toThrowError();

            expect(el.children.length).toEqual(list.length * templateLength);
            expect($(el).children(".part1").map((index, node) => parseInt(node.textContent)).get()).toEqual(list.toArray().map(x=> x.foo()));
            expect($(el).children(".part2").map((index, node) => node.textContent).get()).toEqual(list.toArray().map(x=> x.bar()));
            expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual([5, 5, 5]);
        });

        it('binding to a observable list containing model and template accessing index',() => {
            loadFixtures('templates/Directives/ForEach.html');

            var el = <HTMLElement> document.querySelector("#foreach-list-model-with-index");
            var templateLength = el.children.length;
            var list = createTestList();
            expect(() => wx.applyDirectives({ src: list }, el)).not.toThrowError();

            expect(el.children.length).toEqual(list.length * templateLength);
            expect($(el).children(".part1").map((index, node) => parseInt(node.textContent)).get()).toEqual(list.toArray().map(x=> x.foo()));
            expect($(el).children(".part2").map((index, node) => node.textContent).get()).toEqual(list.toArray().map(x=> x.bar()));
            expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length).toArray());
        });

        it('observable list manipulation smoke-test',() => {
            loadFixtures('templates/Directives/ForEach.html');

            var el = <HTMLElement> document.querySelector("#foreach-list-model-with-index");
            var templateLength = el.children.length;
            var list = createTestList();
            expect(() => wx.applyDirectives({ src: list }, el)).not.toThrowError();

            expect(el.children.length).toEqual(list.length * templateLength);
            expect(parseInt(el.children[0 * templateLength].textContent)).toEqual(list.get(0).foo());

            list.add(new TestViewModel(3, "edfsd"));
            expect(el.children.length).toEqual(list.length * templateLength);

            list.set(2, new TestViewModel(42, "magic"));
            expect(parseInt(el.children[2 * templateLength].textContent)).toEqual(list.get(2).foo());

            // check indexes
            expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length).toArray());

            list.move(2, 0);
            expect(parseInt(el.children[0 * templateLength].textContent)).toEqual(list.get(0).foo());

            // check indexes
            expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length).toArray());

            list.removeAt(1);

            // check indexes
            expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length).toArray());

            expect(parseInt(el.children[0 * templateLength].textContent)).toEqual(list.get(0).foo());
            expect(parseInt(el.children[1 * templateLength].textContent)).toEqual(list.get(1).foo());
            expect(parseInt(el.children[2 * templateLength].textContent)).toEqual(list.get(2).foo());

            list.move(0, 2);
            expect(parseInt(el.children[2 * templateLength].textContent)).toEqual(list.get(2).foo());

            // check indexes
            expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length).toArray());

            list.clear();
            expect(el.children.length).toEqual(0);

            list.add(new TestViewModel(42, "magic"));
            expect(parseInt(el.children[0 * templateLength].textContent)).toEqual(list.get(0).foo());
            expect(el.children[0 * templateLength + 1].textContent).toEqual(list.get(0).bar());

            // check indexes
            expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length).toArray());

            list.addRange(createTestList().toArray());
            expect(el.children.length).toEqual(list.length * templateLength);

            // check indexes
            expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length).toArray());
        });

        it('$index calculation when bound to observable list smoke-test',() => {
            loadFixtures('templates/Directives/ForEach.html');

            var el = <HTMLElement> document.querySelector("#foreach-list-model-with-index");
            var templateLength = el.children.length;
            var list = createTestList();
            expect(() => wx.applyDirectives({ src: list }, el)).not.toThrowError();

            // check indexes
            expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length).toArray());

            list.add(new TestViewModel(3, "edfsd"));
            // check indexes
            expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length).toArray());

            list.removeAt(0);
            // check indexes
            expect($(el).children(".part3").map((index, node) => parseInt(node.textContent)).get()).toEqual(Ix.Enumerable.range(0, list.length).toArray());
        });

        it('observable list item property-changes propagate to DOM',() => {
            loadFixtures('templates/Directives/ForEach.html');

            var el = <HTMLElement> document.querySelector("#foreach-list-model-with-index");
            var templateLength = el.children.length;
            var list = createTestList();
            expect(() => wx.applyDirectives({ src: list }, el)).not.toThrowError();

            list.forEach((x) => x.foo(33));
            expect($(el).children(".part1").map((index, node) => parseInt(node.textContent)).get()).toEqual(list.map(x=> x.foo()));
        });
    });
});