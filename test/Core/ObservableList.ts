/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/ix.d.ts" />
/// <reference path="../../build/xircular.d.ts" />
/// <reference path="../TestUtils.ts" />
/// <reference path="../TestModels.ts" />

describe("ObservableList", () => {
    it("implements IUnknown", () => {
        var o = wx.list<TestViewModel>();
        expect(wx.utils.supportsQueryInterface(o)).toBeTruthy();
    });

    it("count property is not ambiguous", () => {
        var ObservableList = wx.list<number>();
        expect(0).toEqual(ObservableList.count);
        var list = ObservableList;
        expect(0).toEqual(list.count);
    });

    it("shouldn't be read-only",() => {
        var ObservableList = wx.list<number>();
        expect(ObservableList.isReadOnly).toBeFalsy();
    });

    it("indexer is not ambiguous",() => {
        var ObservableList = wx.list<number>([ 0, 1 ]);
        expect(0).toEqual(ObservableList.get(0));
    });

    it("items added and removed test",() => {
        var fixture = wx.list<number>();
        var before_added = new Array<number>();
        var before_removed = new Array<number>();
        var added = new Array<number>();
        var removed = new Array<number>();

        fixture.beforeItemsAdded.subscribe(x=> before_added.push(x));
        fixture.beforeItemsRemoved.subscribe(x=> before_removed.push(x));
        fixture.itemsAdded.subscribe(x=> added.push(x));
        fixture.itemsRemoved.subscribe(x=> removed.push(x));

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

    it("collection count changed test",() => {
        var fixture = wx.list<number>();
        var before_output = new Array<number>();
        var output = new Array<number>();

        fixture.countChanging.subscribe(x=> before_output.push(x));
        fixture.countChanged.subscribe(x=> output.push(x));

        fixture.add(10);
        fixture.add(20);
        fixture.add(30);
        fixture.removeAt(1);
        fixture.clear();

        var before_results = [0, 1, 2, 3, 2 ];
        expect(before_results.length).toEqual(before_output.length);
        expect(before_results).toEqual(before_output);

        var results = [1, 2, 3, 2, 0 ];
        expect(results.length).toEqual( output.length);
        expect(results).toEqual(output);
    });

    it("collection count changed fires when clearing",() => {
        var items = wx.list<Object>([new Object()]);
        var countChanged = false;
        items.countChanged.subscribe(_ => { countChanged = true; });

        items.clear();

        expect(countChanged).toBeTruthy();
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

        var changed = new Array<wx.INotifyCollectionChangedEventArgs>();
        fixture.collectionChanged.subscribe(x => {
            changed.push(x);
        });

        expect(0).toEqual(changed.length);

        fixture.addRange([ 6, 7 ]);
        expect(1).toEqual(changed.length);
        expect(wx.NotifyCollectionChangedAction.Add).toEqual(changed[0].action);
    });
});


