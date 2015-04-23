/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/ix.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />
/// <reference path="../TestUtils.ts" />
/// <reference path="../TestModels.ts" />

describe("Observable List", () => {
    it("implements IUnknown", () => {
        var o = wx.list<TestViewModel>();
        expect(wx.supportsQueryInterface(o)).toBeTruthy();
    });

    it("is correctly initialized from default value",() => {
        var obsList = wx.list<number>([3, 2, 1]);
        expect(obsList.toArray()).toEqual([3, 2, 1]);
    });

    it("length property is not ambiguous", () => {
        var obsList = wx.list<number>();
        expect(0).toEqual(obsList.length());
        var list = obsList.toArray();
        expect(0).toEqual(list.length);
    });

    it("shouldn't be read-only",() => {
        var obsList = wx.list<number>();
        expect(obsList.isReadOnly).toBeFalsy();
    });

    it("indexer is not ambiguous",() => {
        var obsList = wx.list<number>([ 0, 1 ]);
        expect(0).toEqual(obsList.get(0));
    });

    it("items added and removed test",() => {
        var fixture = wx.list<number>();
        var before_added = new Array<number>();
        var before_removed = new Array<number>();
        var added = new Array<number>();
        var removed = new Array<number>();

        fixture.beforeItemsAdded.subscribe(x=> before_added.push(x.items[0]));
        fixture.beforeItemsRemoved.subscribe(x=> before_removed.push(x.items[0]));
        fixture.itemsAdded.subscribe(x=> added.push(x.items[0]));
        fixture.itemsRemoved.subscribe(x=> removed.push(x.items[0]));

        fixture.add(10);
        fixture.add(20);
        fixture.add(30);
        fixture.removeAt(1);
        fixture.clear();

        var added_results = [10, 20, 30];
        expect(added_results.length).toEqual(added.length);
        expect(added_results).toEqual(added);

        var removed_results = [20];
        expect(removed_results.length).toEqual(removed.length);
        expect(removed_results).toEqual(removed);

        expect(before_added.length).toEqual(added.length);
        expect(added).toEqual(before_added);

        expect(before_removed.length).toEqual(removed.length);
        expect(removed).toEqual(before_removed);
    });

    it("length changed test",() => {
        var fixture = wx.list<number>();
        var before_output = new Array<number>();
        var output = new Array<number>();

        fixture.lengthChanging.subscribe(x=> before_output.push(x));
        fixture.lengthChanged.subscribe(x=> output.push(x));

        fixture.add(10);
        fixture.add(20);
        fixture.add(30);
        expect(fixture.length()).toEqual(3);

        fixture.removeAt(1);
        expect(fixture.length()).toEqual(2);

        fixture.clear();
        expect(fixture.length()).toEqual(0);

        var before_results = [0, 1, 2, 3, 2 ];
        expect(before_results.length).toEqual(before_output.length);
        expect(before_results).toEqual(before_output);

        var results = [1, 2, 3, 2, 0 ];
        expect(results.length).toEqual( output.length);
        expect(results).toEqual(output);
    });

    it("length changed test 2",() => {
        var list = wx.list();

        for (var i = 0; i < 100; i++) {
            list.add(i);
        }

        expect(list.length()).toEqual(100);

        list.clear();
        expect(list.length()).toEqual(0);
    });

    it("isEmpty test",() => {
        var fixture = wx.list<number>();
        expect(fixture.isEmpty()).toBeTruthy();
        fixture.add(1);
        expect(fixture.isEmpty()).toBeFalsy();
    });

    it("length changed fires when clearing",() => {
        var items = wx.list<Object>([new Object()]);
        var lengthChanged = false;
        items.lengthChanged.subscribe(_ => { lengthChanged = true; });

        items.clear();

        expect(lengthChanged).toBeTruthy();
    });

    it("when adding range of null error is thrown",() => {
        var fixture = wx.list<number>();

        expect(() => fixture.addRange(null)).toThrowError();
    });

    it("when removing all of null error is thrown",() => {
        var fixture = wx.list<number>();

        expect(() => fixture.removeAll(null)).toThrowError();
    });

    it("when inserting range of null error is thrown",() => {
        var fixture = wx.list<number>();

        expect(() => fixture.insertRange(1, null)).toThrowError();
    });

    it("when inserting range out of range error is thrown",() => {
        var fixture = wx.list<number>();

        expect(() => fixture.insertRange(1, [1])).toThrowError();
    });

    it("change-tracking should fire notifications",() => {
        var fixture = wx.list<TestFixture>();
        fixture.changeTrackingEnabled = true;
        var before_output = new Array<Tuple<TestFixture, string>>();
        var output = new Array<Tuple<TestFixture, string>>();
        var item1 = new TestFixture();
        item1.IsOnlyOneWord("Foo");
        var item2 = new TestFixture();
        item2.IsOnlyOneWord("Bar");

        fixture.itemChanging.subscribe(x => {
            before_output.push(new Tuple<TestFixture, string>(x.sender, x.propertyName));
        });

        fixture.itemChanged.subscribe(x => {
            output.push(new Tuple<TestFixture, string>(x.sender, x.propertyName));
        });

        fixture.add(item1);
        fixture.add(item2);

        item1.IsOnlyOneWord("Baz");
        expect(1).toEqual(output.length);
        item2.IsNotNullString("FooBar");
        expect(2).toEqual(output.length);

        fixture.remove(item2);
        item2.IsNotNullString("FooBarBaz");
        expect(2).toEqual(output.length);

        fixture.changeTrackingEnabled = false;
        item1.IsNotNullString("Bamf");
        expect(2).toEqual(output.length);

        expect([item1, item2]).toEqual(output.map(x => x.Item1));
        expect([item1, item2]).toEqual(before_output.map(x => x.Item1));
        expect(["IsOnlyOneWord", "IsNotNullString"]).toEqual(output.map(x => x.Item2));
    });

    it("change-tracking should work when adding the same thing more than once",() => {
        var fixture = wx.list<TestFixture>();
        fixture.changeTrackingEnabled = true;
        var output = new Array<Tuple<TestFixture, string>>();
        var item1 = new TestFixture();
        item1.IsOnlyOneWord("Foo");

        fixture.itemChanged.subscribe(x => {
            output.push(new Tuple<TestFixture, string>(x.sender, x.propertyName));
        });

        fixture.add(item1);
        fixture.add(item1);
        fixture.add(item1);

        item1.IsOnlyOneWord("Bar");
        expect(1).toEqual(output.length);

        fixture.removeAt(0);

        item1.IsOnlyOneWord("Baz");
        expect(2).toEqual(output.length);

        fixture.removeAt(0);
        fixture.removeAt(0);

        // We've completely removed item1, we shouldn't be seeing any 
        // notifications from it
        item1.IsOnlyOneWord("Bamf");
        expect(2).toEqual(output.length);

        fixture.changeTrackingEnabled = false;
        fixture.add(item1);
        fixture.add(item1);
        fixture.add(item1);
        fixture.changeTrackingEnabled = true;

        item1.IsOnlyOneWord("Bonk");
        expect(3).toEqual(output.length);
    });

    it("change-tracking should stop when an object is replaced and change-notification is suppressed",() => {
        var fixture = wx.list<TestFixture>();
        fixture.changeTrackingEnabled = true;

        var before_output = new Array<Tuple<TestFixture, string>>();
        var output = new Array<Tuple<TestFixture, string>>();
        var item1 = new TestFixture();
        item1.IsOnlyOneWord("Foo");
        var item2 = new TestFixture();
        item2.IsOnlyOneWord("Bar");

        fixture.itemChanging.subscribe(x => {
            before_output.push(new Tuple<TestFixture, string>(x.sender, x.propertyName));
        });

        fixture.itemChanged.subscribe(x => {
            output.push(new Tuple<TestFixture, string>(x.sender, x.propertyName));
        });

        fixture.add(item1);

        item1.IsOnlyOneWord("Baz");
        expect(1).toEqual(output.length);
        item2.IsNotNullString("FooBar");
        expect(1).toEqual(output.length);

        wx.using(fixture.suppressChangeNotifications(), () => {
            fixture.set(0, item2);
        });

        item1.IsOnlyOneWord("FooAgain");
        expect(1).toEqual(output.length);
        item2.IsNotNullString("FooBarBaz");
        expect(2).toEqual(output.length);

        expect([item1, item2]).toEqual(output.map(x => x.Item1));
        expect([item1, item2]).toEqual(before_output.map(x => x.Item1));
        expect(["IsOnlyOneWord", "IsNotNullString"]).toEqual(output.map(x => x.Item2));
    });

    it("change-tracking items should be tracked even when suppressed",() => {
        var input = new TestFixture();
        var fixture = wx.list<TestFixture>();
        fixture.changeTrackingEnabled = true;

        var changes = new Array<Tuple<TestFixture, string>>();
        fixture.itemChanged.subscribe(x => {
            changes.push(new Tuple<TestFixture, string>(x.sender, x.propertyName));
        });

        input.IsOnlyOneWord("foo");
        expect(0).toEqual(changes.length);

        wx.using(fixture.suppressChangeNotifications(),() => {
            fixture.add(input);

            input.IsOnlyOneWord("bar");
            expect(0).toEqual(changes.length);
        });

        // Even though we added it during a suppression, we should still
        // get notifications now that the suppression is over
        input.IsOnlyOneWord("baz");
        expect(1).toEqual(changes.length);

        fixture.removeAt(0);
        input.IsOnlyOneWord("bamf");
        expect(1).toEqual(changes.length);
    });

    it("change-tracking should apply on addRange'd items",() => {
        var fixture = wx.list<TestFixture>([ new TestFixture() ]);
        fixture.changeTrackingEnabled = true;

        var reset = [];
        fixture.shouldReset.subscribe(x => {
            reset.push(x);
        });

        var itemChanged = new Array<Tuple<TestFixture, string>>();
        fixture.itemChanged.subscribe(x => {
            itemChanged.push(new Tuple<TestFixture, string>(x.sender, x.propertyName));
        });

        fixture.get(0).IsNotNullString("Foo");
        expect(0).toEqual(reset.length);
        expect(1).toEqual(itemChanged.length);

        fixture.addRange(Ix.Enumerable.range(0, 15).select(x => {
            var tf = new TestFixture();
            tf.IsOnlyOneWord(x.toString());
            return tf;
        }).toArray());

        expect(1).toEqual(reset.length);
        expect(1).toEqual(itemChanged.length);

        fixture.get(0).IsNotNullString("Bar");
        expect(1).toEqual(reset.length);
        expect(2).toEqual(itemChanged.length);

        fixture.get(5).IsNotNullString("Baz");
        expect(1).toEqual(reset.length);
        expect(3).toEqual(itemChanged.length);
    });

    it("sort should actually sort",() => {
        var fixture = wx.list<number>([5, 1, 3, 2, 4]);
        fixture.sort((a, b) => a - b);

        expect([1, 2, 3, 4, 5]).toEqual(fixture.toArray());
    });

    it("collections shouldnt share subscriptions",() => {
        var fixture1 = wx.list<TestFixture>();
        fixture1.changeTrackingEnabled = true;
        var fixture2 = wx.list<TestFixture>();
        fixture2.changeTrackingEnabled = true;
        var item1 = new TestFixture();
        item1.IsOnlyOneWord("Foo");
        var output1 = new Array<Tuple<TestFixture, string>>();
        var output2 = new Array<Tuple<TestFixture, string>>();

        fixture1.itemChanged.subscribe(x => {
            output1.push(new Tuple<TestFixture, string>(x.sender, x.propertyName));
        });

        fixture2.itemChanged.subscribe(x => {
            output2.push(new Tuple<TestFixture, string>(x.sender, x.propertyName));
        });

        fixture1.add(item1);
        fixture1.add(item1);
        fixture2.add(item1);
        fixture2.add(item1);

        item1.IsOnlyOneWord("Bar");
        expect(1).toEqual(output1.length);
        expect(1).toEqual(output2.length);

        fixture2.removeAt(0);

        item1.IsOnlyOneWord("Baz");
        expect(2).toEqual(output1.length);
        expect(2).toEqual(output2.length);
    });

    it("get a reset when adding a lot of items",() => {
        var fixture = wx.list<number>([1]);

        var reset = [];
        fixture.shouldReset.subscribe(x => {
            reset.push(x);
        });

        expect(0).toEqual(reset.length);
        fixture.addRange([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
        expect(1).toEqual(reset.length);
    });

    it("get a range when adding an array of items",() => {
        var fixture = wx.list<number>([ 1, 2, 3, 4, 5 ]);

        var changed = new Array<boolean>();
        fixture.listChanged.subscribe(x => {
            changed.push(x);
        });

        expect(0).toEqual(changed.length);

        fixture.addRange([ 6, 7 ]);
        expect(1).toEqual(changed.length);
    });
});

describe("Derived Observable List", () => {
    var stringOrderer = (a, b) => {
        if (a.toString() < b.toString()) return -1;
        if (a.toString() > b.toString()) return 1;
        return 0;
    }

    var stringOrdererAsc = (a, b) => {
        if (a != null && b != null)
            return b.localeCompare(a);

        return 0;
    }

    var numberOrderer = (a, b) => {
        return a - b;
    }


    it("derived observable lists should follow base collection", () => {
        var input = ["Foo", "Bar", "Baz", "Bamf"];
        var fixture = wx.list<TestFixture>(input.map(x => {
            var tf = new TestFixture();
            tf.IsOnlyOneWord(x);
            return tf;
        }));

        var output = fixture.project(undefined, undefined, (x) => x.IsOnlyOneWord());

        expect(input).toEqual(output.toArray());

        var tf = new TestFixture();
        tf.IsOnlyOneWord("Hello");
        fixture.add(tf);
        expect(5).toEqual(output.length());
        expect("Hello").toEqual(output.get(4));

        fixture.removeAt(4);
        expect(4).toEqual(output.length());

        tf = new TestFixture();
        tf.IsOnlyOneWord("Goodbye");

        fixture.set(1, tf);
        expect(4).toEqual(output.length());
        expect("Goodbye").toEqual(output.get(1));

        fixture.clear();
        expect(0).toEqual(output.length());
    });


    it("derived observable lists should be filtered", () => {
        var input = ["Foo", "Bar", "Baz", "Bamf"];
        var fixture = wx.list<TestFixture>(input.map(x => {
            var tf = new TestFixture();
            tf.IsOnlyOneWord(x);
            return tf;
        }));
        var itemsAdded = new Array<TestFixture>();
        var itemsRemoved = new Array<TestFixture>();

        var output = fixture.project(x => x.IsOnlyOneWord()[0] === 'F', stringOrderer, x => x);
        output.itemsAdded.subscribe((x) => itemsAdded.push(x.items[0]));
        output.itemsRemoved.subscribe((x) => itemsRemoved.push(x.items[0]));

        expect(1).toEqual(output.length());
        expect(0).toEqual(itemsAdded.length);
        expect(0).toEqual(itemsRemoved.length);

        var tf = new TestFixture();
        tf.IsOnlyOneWord("Boof");
        fixture.add(tf);
        expect(1).toEqual(output.length());
        expect(0).toEqual(itemsAdded.length);
        expect(0).toEqual(itemsRemoved.length);

        tf = new TestFixture();
        tf.IsOnlyOneWord("Far");
        fixture.add(tf);
        expect(2).toEqual(output.length());
        expect(1).toEqual(itemsAdded.length);
        expect(0).toEqual(itemsRemoved.length);

        fixture.removeAt(1); // Remove "Bar"
        expect(2).toEqual(output.length());
        expect(1).toEqual(itemsAdded.length);
        expect(0).toEqual(itemsRemoved.length);

        fixture.removeAt(0); // Remove "Foo"
        expect(1).toEqual(output.length());
        expect(1).toEqual(itemsAdded.length);
        expect(1).toEqual(itemsRemoved.length);
    });

    it("derived observable lists should be sorted", () => {
        var input = ["Foo", "Bar", "Baz"];
        var fixture = wx.list<string>(input);

        var output = fixture.project(undefined, stringOrderer, x => x);

        expect(3).toEqual(output.length());
        expect(Ix.Enumerable.fromArray(["Bar", "Baz", "Foo"]).zip(Ix.Enumerable.fromArray(
            output.toArray()), (expected, actual) => expected === actual).all(x => x)).toBeTruthy();

        fixture.add("Bamf");
        expect(4).toEqual(output.length());
        expect(Ix.Enumerable.fromArray(["Bamf", "Bar", "Baz", "Foo"]).zip(Ix.Enumerable.fromArray(
            output.toArray()), (expected, actual) => expected === actual).all(x => x)).toBeTruthy();

        fixture.add("Eoo");
        expect(5).toEqual(output.length());
        expect(Ix.Enumerable.fromArray(["Bamf", "Bar", "Baz", "Eoo", "Foo"]).zip(Ix.Enumerable.fromArray(
            output.toArray()), (expected, actual) => expected === actual).all(x => x)).toBeTruthy();

        fixture.add("Roo");
        expect(6).toEqual(output.length());
        expect(Ix.Enumerable.fromArray(["Bamf", "Bar", "Baz", "Eoo", "Foo", "Roo"]).zip(Ix.Enumerable.fromArray(
            output.toArray()), (expected, actual) => expected === actual).all(x => x)).toBeTruthy();

        fixture.add("Bar");
        expect(7).toEqual(output.length());
        expect(Ix.Enumerable.fromArray(["Bamf", "Bar", "Bar", "Baz", "Eoo", "Foo", "Roo"]).zip(Ix.Enumerable.fromArray(
            output.toArray()), (expected, actual) => expected === actual).all(x => x)).toBeTruthy();
    });

    it("derived observable lists move notification smoke-test", () => {
        var initial = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        var source = wx.list<number>(initial);

        var derived = source.project(undefined, undefined, x => x);
        var nestedDerived = derived.project();
        var derivedSorted = source.project(undefined, numberOrderer);

        for (var i = 0; i < initial.length; i++) {
            for (var j = 0; j < initial.length; j++) {
                source.move(i, j);

                expect(derived.toArray()).toEqual(source.toArray());
                expect(nestedDerived.toArray()).toEqual(source.toArray());
                expect(derivedSorted.toArray()).toEqual(initial);
            }
        }
    });

    it("derived observable lists should understand nested move signals", () => {
        var source = wx.list(["a", "b", "c", "d", "e", "f"]);
        var derived = source.project(undefined, undefined, x => x);
        var nested = derived.project(x => x);

        var reverseNested = nested.project(undefined, stringOrdererAsc, x => x);
        var sortedNested = reverseNested.project(undefined, stringOrderer, x => x);

        source.move(1, 4);

        expect(source.toArray()).toEqual(derived.toArray());
        expect(source.toArray()).toEqual(nested.toArray());
        expect(Ix.Enumerable.fromArray(source.toArray()).orderByDescending(x => x).toArray()).toEqual(reverseNested.toArray());
        expect(Ix.Enumerable.fromArray(source.toArray()).orderBy(x => x).toArray()).toEqual(sortedNested.toArray());
    });
    
    it("derived observable lists should understand move even when sorted", () => {
        var sanity = ["a", "b", "c", "d", "e", "f"];
        var source = wx.list(["a", "b", "c", "d", "e", "f"]);

        var derived = source.project(x => x !== "c", stringOrderer, x => x);
        var sourceNotifications = [];

        source.listChanged.subscribe(x => sourceNotifications.push(x));

        var derivedNotifications = [];
        derived.listChanged.subscribe(x => derivedNotifications.push(x));

        expect(5).toEqual(derived.length());
        expect(derived.toArray()).toEqual(["a", "b", "d", "e", "f"]);

        for (var i = 0; i < 50; i++) {
            var from = Math.random() * source.length();
            var to;

            do {
                to = Math.random() * source.length();
            } while (to === from);

            source.move(from, to);

            var tmp = sanity[from];
            sanity.splice(from, 1);
            sanity.splice(to, 0, tmp);

            expect(source.toArray()).toEqual(sanity);
            expect(derived.toArray()).toEqual(["a", "b", "d", "e", "f"]);

            expect(1).toEqual(sourceNotifications.length);
            //expect(NotifyCollectionChangedAction.Move).toEqual(sourceNotifications.First().Action);

            expect(derivedNotifications.length).toEqual(0);

            sourceNotifications = [];
        }
    });
    
    it("derived observable lists should understand dummy move signal", () => {
        var sanity = ["a", "b", "c", "d", "e", "f"];
        var source = wx.list(["a", "b", "c", "d", "e", "f"]);

        var derived = source.project(undefined, undefined, x => x);

        var sourceNotifications = [];
        source.listChanged.subscribe(x => sourceNotifications.push(x));

        var derivedNotifications = [];
        derived.listChanged.subscribe(x => derivedNotifications.push(x));

        source.move(0, 0);

        expect(1).toEqual(sourceNotifications.length);
        //expect(NotifyCollectionChangedAction.Move).toEqual(sourceNotifications.First().Action);

        expect(0).toEqual(derivedNotifications.length);
    });

    it("derived observable lists should not signal redundant move signals", () => {
        var source = wx.list(["a", "b", "c", "d", "e", "f"]);

        var derived = source.project(x => x == "d" || x == "e");

        var derivedNotifications = [];
        derived.listChanged.subscribe(x => derivedNotifications.push(x));

        expect("d").toEqual(source.get(3));
        source.move(3, 0);

        expect(0).toEqual(derivedNotifications.length);
    });

    it("derived observable lists should handle moves when only containing one item", () => {
        // This test is here to verify a bug in where newPositionForItem would return an incorrect
        // index for lists only containing a single item (the item to find a new position for)

        var sanity = ["a", "b", "c", "d", "e", "f"];
        var source = wx.list(["a", "b", "c", "d", "e", "f"]);
        var derived = source.project(x => x === "d", undefined, x => x);

        expect("d").toEqual(derived.get(0));
        expect("d").toEqual(source.get(3));

        source.move(3, 0);

        expect("d").toEqual(source.get(0));
        expect("d").toEqual(derived.get(0));
    });

    /// <summary>
    /// This test is a bit contrived and only exists to verify that a particularly gnarly bug doesn't get 
    /// reintroduced because it's hard to reason about the removal logic in derived observable lists and it might
    /// be tempting to try and reorder the shiftIndices operation in there.
    /// </summary>

    it("derived observable lists removal regression-test", () => {
        var input = ['A', 'B', 'C', 'D'];
        var source = wx.list<string>(input);

        // A derived observable lists that filters away 'A' and 'B'
        var derived = source.project(x => x >= 'C', undefined, x => x);

        var changeNotifications = [];
        derived.listChanged.subscribe(x => changeNotifications.push(x));

        expect(0).toEqual(changeNotifications.length);
        expect(2).toEqual(derived.length());
        expect(derived.toArray()).toEqual(['C', 'D']);

        // The tricky part here is that 'B' isn't in the derived observable lists, only 'C' is and this test
        // will detect if the dervied collection gets tripped up and removes 'C' instead
        source.removeAll(['B', 'C']);

        expect(1).toEqual(changeNotifications.length);
        expect(1).toEqual(derived.length());
        expect(derived.toArray()).toEqual(['D']);
    });

    it("derived observable lists should handle items removed", () => {
        var input = ["Foo", "Bar", "Baz", "Bamf"];
        var disposed = new Array<TestFixture>();

        var fixture = wx.list<TestFixture>(input.map(x => {
            var tf = new TestFixture();
            tf.IsOnlyOneWord(x);
            return tf;
        }));

        fixture.itemsRemoved.subscribe(x => disposed.push(x.items[0]));

        var output = fixture.project();

        var tf = new TestFixture();
        tf.IsOnlyOneWord("Hello");
        fixture.add(tf);
        expect(5).toEqual(output.length());

        fixture.removeAt(3);
        expect(4).toEqual(output.length());
        expect(1).toEqual(disposed.length);
        expect("Bamf").toEqual(disposed[0].IsOnlyOneWord());

        tf = new TestFixture();
        tf.IsOnlyOneWord("Goodbye");
        fixture.set(1, tf);
        expect(4).toEqual(output.length());
        expect(1).toEqual(disposed.length);
    });

    it("addRange smoke-test", () => {
        var fixture = wx.list<string>();
        var output = fixture.project(undefined, undefined, x => "Prefix" + x);

        fixture.add("Bamf");
        expect(1).toEqual(fixture.length());
        expect(1).toEqual(output.length());
        expect("Bamf").toEqual(fixture.get(0));
        expect("PrefixBamf").toEqual(output.get(0));

        fixture.addRange(Ix.Enumerable.repeat("Bar", 4).toArray());
        expect(5).toEqual(fixture.length());
        expect(5).toEqual(output.length());
        expect("Bamf").toEqual(fixture.get(0));
        expect("PrefixBamf").toEqual(output.get(0));

        expect(Ix.Enumerable.fromArray(fixture.toArray()).skip(1).all(x => x === "Bar")).toBeTruthy();
        expect(Ix.Enumerable.fromArray(output.toArray()).skip(1).all(x => x === "PrefixBar")).toBeTruthy();

        // Trigger the Reset by.adding a ton of items
        fixture.addRange(Ix.Enumerable.repeat("Bar", 35).toArray());
        expect(40).toEqual(fixture.length());
        expect(40).toEqual(output.length());
        expect("Bamf").toEqual(fixture.get(0));
        expect("PrefixBamf").toEqual(output.get(0));
    });

    it("insertRange smoke-test", () => {
        var fixture = wx.list<string>();
        var output = fixture.project(undefined, undefined, x => "Prefix" + x);

        fixture.add("Bamf");
        expect(1).toEqual(fixture.length());
        expect(1).toEqual(output.length());
        expect("Bamf").toEqual(fixture.get(0));
        expect("PrefixBamf").toEqual(output.get(0));

        fixture.insertRange(0, Ix.Enumerable.repeat("Bar", 4).toArray());
        expect(5).toEqual(fixture.length());
        expect(5).toEqual(output.length());
        expect("Bamf").toEqual(fixture.get(4));
        expect("PrefixBamf").toEqual(output.get(4));

        expect(Ix.Enumerable.fromArray(fixture.toArray()).take(4).all(x => x === "Bar")).toBeTruthy();
        expect(Ix.Enumerable.fromArray(output.toArray()).take(4).all(x => x === "PrefixBar")).toBeTruthy();

        // Trigger the Reset by.adding a ton of items
        fixture.insertRange(0, Ix.Enumerable.repeat("Bar", 35).toArray());
        expect(40).toEqual(fixture.length());
        expect(40).toEqual(output.length());
        expect("Bamf").toEqual(fixture.get(39));
        expect("PrefixBamf").toEqual(output.get(39));
    });

    it("derived observable lists should order correctly", () => {
        var collection = wx.list<number>();
        var orderedCollection = collection.project(undefined, numberOrderer, x => x);

        collection.add(1);
        collection.add(2);

        expect(2).toEqual(orderedCollection.length());
        expect(1).toEqual(orderedCollection.get(0));
        expect(2).toEqual(orderedCollection.get(1));
    });

    it("derived observable lists should stop following after disposal", () => {
        var collection = wx.list<number>();
        var orderedCollection = collection.project(undefined, numberOrderer, x => x.toString());

        collection.add(1);
        collection.add(2);

        expect(2).toEqual(orderedCollection.length());

        (<Rx.IDisposable> <any> orderedCollection).dispose();

        collection.add(3);
        expect(2).toEqual(orderedCollection.length());
    });

    it("derived observable lists filter-test", () => {
        var models = wx.list<FakeCollectionModel>(Ix.Enumerable.fromArray([0, 1, 2, 3, 4]).select(x => {
            var fcm = new FakeCollectionModel();
            fcm.someNumber(x);
            return fcm;
        }).toArray());

        models.changeTrackingEnabled = true;

        var viewModels = models.project(x => !x.isHidden(), undefined, x => new FakeCollectionViewModel(x));
        expect(5).toEqual(viewModels.length());

        models.get(0).isHidden(true);
        expect(4).toEqual(viewModels.length());

        models.get(4).isHidden(true);
        expect(3).toEqual(viewModels.length());

        models.get(0).isHidden(false);
        expect(4).toEqual(viewModels.length());
    });
});
