/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/ix.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />
/// <reference path="../TestUtils.ts" />
/// <reference path="../TestModels.ts" />

describe("Projected Observable List", () => {

 /*   
        it("DerivedCollectionsShouldFollowBaseCollection", () => {
        var input =  ["Foo", "Bar", "Baz", "Bamf"];
var fixture = wx.list<TestFixture>(
    input.select(x => new TestFixture() { IsOnlyOneWord = x }));

var output = fixture.project(new Func<TestFixture, string>(x => x.IsOnlyOneWord));

expect(input).toEqual(output);

fixture.add(new TestFixture() { IsOnlyOneWord = "Hello" });
expect(5).toEqual(output.length);
expect("Hello").toEqual(output[4]);

fixture.RemoveAt(4);
expect(4).toEqual(output.length);

fixture[1] = new TestFixture() { IsOnlyOneWord = "Goodbye" };
expect(4).toEqual(output.length);
expect("Goodbye").toEqual(output[1]);

fixture.Clear();
expect(0).toEqual(output.length);
        });


        it("DerivedCollectionsShouldBeFiltered", () => {
    var input =  ["Foo", "Bar", "Baz", "Bamf" ];
    var fixture = wx.list<TestFixture>(
        input.select(x => new TestFixture() { IsOnlyOneWord = x }));
    var itemsAdded = new Array<TestFixture>();
    var itemsRemoved = new Array<TestFixture>();

    var output = fixture.project(x => x, x => x.IsOnlyOneWord[0] == 'F',(l, r) => l.IsOnlyOneWord.CompareTo(r.IsOnlyOneWord));
    output.itemsAdded.subscribe((x)=> itemsAdded.push(x.items[0]));
    output.itemsRemoved.subscribe((x) => itemsAdded.push(x.items[0]));

    expect(1).toEqual(output.length);
    expect(0).toEqual(itemsAdded.length);
    expect(0).toEqual(itemsRemoved.length);

    fixture.add(new TestFixture() {IsOnlyOneWord = "Boof" });
    expect(1).toEqual(output.length);
    expect(0).toEqual(itemsAdded.length);
    expect(0).toEqual(itemsRemoved.length);

    fixture.add(new TestFixture() {IsOnlyOneWord = "Far" });
    expect(2).toEqual(output.length);
    expect(1).toEqual(itemsAdded.length);
    expect(0).toEqual(itemsRemoved.length);

    fixture.removeAt(1); // Remove "Bar"
    expect(2).toEqual(output.length);
    expect(1).toEqual(itemsAdded.length);
    expect(0).toEqual(itemsRemoved.length);

    fixture.removeAt(0); // Remove "Foo"
    expect(1).toEqual(output.length);
    expect(1).toEqual(itemsAdded.length);
    expect(1).toEqual(itemsRemoved.length);
});

        it("DerivedCollectionShouldBeSorted", () => {
    var input =  [ "Foo", "Bar", "Baz" ];
    var fixture = wx.list<string>(input);

    var output = fixture.project(x => x, orderer: String.CompareOrdinal);

    expect(3).toEqual(output.length);
    expect( [ "Bar", "Baz", "Foo" ].zip(output,(expected, actual) => expected == actual).All(x => x)).toBeTruthy();

    fixture.add("Bamf");
    expect(4).toEqual(output.length);
    expect( [ "Bamf", "Bar", "Baz", "Foo" ].zip(output,(expected, actual) => expected == actual).All(x => x)).toBeTruthy();

    fixture.add("Eoo");
    expect(5).toEqual(output.length);
    expect( [ "Bamf", "Bar", "Baz", "Eoo", "Foo" ].zip(output,(expected, actual) => expected == actual).All(x => x)).toBeTruthy();

    fixture.add("Roo");
    expect(6).toEqual(output.length);
    expect( [ "Bamf", "Bar", "Baz", "Eoo", "Foo", "Roo" ].zip(output,(expected, actual) => expected == actual).All(x => x)).toBeTruthy();

    fixture.add("Bar");
    expect(7).toEqual(output.length);
    expect( [ "Bamf", "Bar", "Bar", "Baz", "Eoo", "Foo", "Roo" ].zip(output,(expected, actual) => expected == actual).All(x => x)).toBeTruthy();
});

        it("DerivedCollectionSignalledToResetShouldFireExactlyOnce", () => {
    var input = [ "Foo" ];
    var resetSubject = new Rx.Subject<any>();
    var derived = input.project(x => x, signalReset: resetSubject);

    var changeNotifications = new Array<NotifyCollectionChangedEventArgs>();
    derived.Changed.subscribe(changeNotifications.add);

    expect(0).toEqual(changeNotifications.length);
    expect(1).toEqual(derived.length);

    input.add("Bar");

    // Shouldn't have picked anything up since the input isn't reactive
    expect(0).toEqual(changeNotifications.length);
    expect(1).toEqual(derived.length);

    resetSubject.onNext(Unit.Default);

    expect(1).toEqual(changeNotifications.length);
    expect(2).toEqual(derived.length);
});

        it("DerivedCollectionMoveNotificationSmokeTest", () => {
    var initial =  [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];

    var source = wx.list<number>(initial);

    var derived = source.project(x => x);
    var nestedDerived = derived.project(x => x);
    var derivedSorted = source.project(x => x, (x, y) => x.CompareTo(y));

    for (var i = 0; i < initial.length; i++) {
        for (var j = 0; j < initial.length; j++) {
            source.move(i, j);

            expect(derived).toEqual(source);
            expect(nestedDerived).toEqual(source);
            expect(derivedSorted).toEqual(initial);
        }
    }
});

        it("DerivedCollectionShouldUnderstandNestedMoveSignals", () => {
    var source = new System.Collections.ObjectModel.ObservableCollection < string > {
        "a", "b", "c", "d", "e", "f" 
            };
    var derived = source.project(x => x);
    var nested = derived.project(x => x);

    var reverseNested = nested.project(
        x => x,
        orderer: OrderedComparer<string>.OrderByDescending(x => x).Compare
            );

    var sortedNested = reverseNested.project(
        x => x,
        orderer: OrderedComparer<string>.OrderBy(x => x).Compare
            );

    source.Move(1, 4);

    expect(source).toEqual(derived);
    expect(source).toEqual(nested);
    expect(source.OrderByDescending(x => x).SequenceEqual(reverseNested)).toBeTruthy(); 
    expect(source.OrderBy(x => x).SequenceEqual(sortedNested)).toBeTruthy();
});

        it("DerivedCollectionShouldUnderstandMoveEvenWhenSorted", () => {
    var sanity = [ "a", "b", "c", "d", "e", "f" ];
    var source = new System.Collections.ObjectModel.ObservableCollection < string > {
        "a", "b", "c", "d", "e", "f" 
            };

    var derived = source.project(
       .selector: x => x,
        filter: x => x != "c",
        orderer: (x, y) => x.CompareTo(y)
        );

    var sourceNotifications = new Array<NotifyCollectionChangedEventArgs>();

    Observable.FromEventPattern<NotifyCollectionChangedEventHandler, NotifyCollectionChangedEventArgs>(
        x => source.CollectionChanged += x,
        x => source.CollectionChanged -= x
        ).subscribe(x => sourceNotifications.add(x.EventArgs));

    var derivedNotifications = new Array<NotifyCollectionChangedEventArgs>();
    derived.Changed.subscribe(derivedNotifications.add);

    expect(5).toEqual(derived.length);
    expect(derived).toEqual( [ "a", "b" , "d", "e", "f" ]);

    var rnd = new Random();

    for (var i = 0; i < 50; i++) {
        var from =  rnd.Next(0, source.length);
        var to;

        do { to = rnd.Next(0, source.length); } while (to == from);

        source.Move(from, to);

        var tmp =  sanity[from];
        sanity.RemoveAt(from);
        sanity.Insert(to, tmp);

        expect(source).toEqual(sanity);
        expect(derived).toEqual( [ "a", "b" , "d", "e", "f" ]);

        expect(1).toEqual(sourceNotifications.length);
        expect(NotifyCollectionChangedAction.Move).toEqual(sourceNotifications.First().Action);

        Assert.Empty(derivedNotifications);

        sourceNotifications.Clear();
    }
});

        it("DerivedCollectionShouldUnderstandDummyMoveSignal", () => {
    var sanity = [ "a", "b", "c", "d", "e", "f" ];
    var source = new System.Collections.ObjectModel.ObservableCollection < string > {
        "a", "b", "c", "d", "e", "f" 
            };

    var derived = source.project(x => x);

    var sourceNotifications = new Array<NotifyCollectionChangedEventArgs>();

    Observable.FromEventPattern<NotifyCollectionChangedEventHandler, NotifyCollectionChangedEventArgs>(
        x => source.CollectionChanged += x,
        x => source.CollectionChanged -= x
        ).subscribe(x => sourceNotifications.add(x.EventArgs));

    var derivedNotification = new Array<NotifyCollectionChangedEventArgs>();
    derived.Changed.subscribe(derivedNotification.add);

    source.Move(0, 0);

    expect(1).toEqual(sourceNotifications.length);
    expect(NotifyCollectionChangedAction.Move).toEqual(sourceNotifications.First().Action);

    expect(0).toEqual(derivedNotification.length);
});

        it("DerivedCollectionShouldNotSignalRedundantMoveSignals", () => {
    var sanity = [ "a", "b", "c", "d", "e", "f" ];
    var source = new System.Collections.ObjectModel.ObservableCollection < string > {
        "a", "b", "c", "d", "e", "f"
            };

    var derived = source.project(x => x, x => x == "d" || x == "e");

    var derivedNotification = new Array<NotifyCollectionChangedEventArgs>();
    derived.Changed.subscribe(derivedNotification.add);

    expect("d").toEqual(source[3]);
    source.Move(3, 0);

    expect(0).toEqual(derivedNotification.length);
});

        it("DerivedCollectionShouldHandleMovesWhenOnlyContainingOneItem", () => {
    // This test is here to verify a bug in where newPositionForItem would return an incorrect
    // index for lists only containing a single item (the item to find a new position for)

    var sanity = [ "a", "b", "c", "d", "e", "f" ];
    var source = new System.Collections.ObjectModel.ObservableCollection < string > {
        "a", "b", "c", "d", "e", "f"
            };

    var derived = source.project(x => x, x => x == "d");

    expect("d").toEqual(derived.Single());
    expect("d").toEqual(source[3]);

    source.Move(3, 0);

    expect("d").toEqual(source[0]);
    expect("d").toEqual(derived.Single());
});

/// <summary>
/// This test is a bit contrived and only exists to verify that a particularly gnarly bug doesn't get 
/// reintroduced because it's hard to reason about the removal logic in derived collections and it might
/// be tempting to try and reorder the shiftIndices operation in there.
/// </summary>

        it("DerivedCollectionRemovalRegressionTest", () => {
    var input =  [ 'A', 'B', 'C', 'D' ];
    var source = wx.list<char>(input);

    // A derived collection that filters away 'A' and 'B'
    var derived = source.project(x => x, x=> x >= 'C');

    var changeNotifications = new Array<NotifyCollectionChangedEventArgs>();
    derived.Changed.subscribe(changeNotifications.add);

    expect(0).toEqual(changeNotifications.length);
    expect(2).toEqual(derived.length);
    expect(derived).toEqual( [ 'C', 'D' ]);

    // The tricky part here is that 'B' isn't in the derived collection, only 'C' is and this test
    // will detect if the dervied collection gets tripped up and removes 'C' instead
    source.RemoveAll( [ 'B', 'C' ]);

    expect(1).toEqual(changeNotifications.length);
    expect(1).toEqual(derived.length);
    expect(derived).toEqual( [ 'D' ]);
});

        it("DerviedCollectionShouldHandleItemsRemoved", () => {
    var input =  [ "Foo", "Bar", "Baz", "Bamf" ];
    var disposed = new Array<TestFixture>();
    var fixture = wx.list<TestFixture>(
        input.select(x => new TestFixture() { IsOnlyOneWord = x }));

    var output = fixture.project(x => Disposable.Create(() => disposed.add(x)), item => item.Dispose());

    fixture.add(new TestFixture() { IsOnlyOneWord = "Hello" });
    expect(5).toEqual(output.length);

    fixture.RemoveAt(3);
    expect(4).toEqual(output.length);
    expect(1).toEqual(disposed.length);
    expect("Bamf").toEqual(disposed[0].IsOnlyOneWord);

    fixture[1] = new TestFixture() { IsOnlyOneWord = "Goodbye" };
    expect(4).toEqual(output.length);
    expect(2).toEqual(disposed.length);
    expect("Bar").toEqual(disposed[1].IsOnlyOneWord);

    var.length = output.length;
    output.Dispose();
    expect(disposed.length).toEqual(2 +.length);
});
public class DerivedCollectionLogging {
            // We need a sentinel class to make sure no test has triggered the warnings before
            class NoOneHasEverSeenThisClassBefore {
});
class NoOneHasEverSeenThisClassBeforeEither {
});

            it("DerivedCollectionsShouldWarnWhenSourceIsNotINotifyCollectionChanged", () => {
    var resolver = new ModernDependencyResolver();
    var logger = new TestLogger();

    using(resolver.WithResolver()) {
        resolver.RegisterConstant(new FuncLogManager(t => new WrappingFullLogger(logger, t)), typeof (ILogManager));

        var incc = wx.list<NoOneHasEverSeenThisClassBefore>();
        expect(incc is INotifyCollectionChanged).toBeTruthy();
        var inccDerived = incc.project(x => x);

        expect(logger.Messages.Any(x => x.Item1.Contains("INotifyCollectionChanged"))).toBeFalsy();

        // Reset
        logger.Messages.Clear();

        var nonIncc = new Array<NoOneHasEverSeenThisClassBefore>();

        expect(nonIncc is INotifyCollectionChanged).toBeFalsy();
        var nonInccderived = nonIncc.project(x => x);

        expect(1).toEqual(logger.Messages.length);

        var m = logger.Messages.Last();
        var message = m.Item1;
        var level = m.Item2;

        Assert.Contains("INotifyCollectionChanged", message);
        expect(LogLevel.Warn).toEqual(level);
    }
});

            it("DerivedCollectionsShouldNotTriggerSupressNotificationWarning", () => {
    var resolver = new ModernDependencyResolver();
    var logger = new TestLogger();

    using(resolver.WithResolver()) {
        resolver.RegisterConstant(new FuncLogManager(t => new WrappingFullLogger(logger, t)), typeof (ILogManager));

        var incc = wx.list<NoOneHasEverSeenThisClassBeforeEither>();
        var inccDerived = incc.project(x => x);

        expect(logger.Messages.Any(x => x.Item1.Contains("SuppressChangeNotifications"))).toBeFalsy();

        // Derived collections should only suppress warnings for internal behavior.
        inccDerived.Item.added.subscribe();
        incc.Reset();
        expect(logger.Messages.Any(x => x.Item1.Contains("SuppressChangeNotifications"))).toBeTruthy();
    };
});        }



        it(.addRangeSmokeTest", () => {
    var fixture = wx.list<string>();
    var output = fixture.project(x => "Prefix" + x);

    fixture.add("Bamf");
    expect(1).toEqual(fixture.length);
    expect(1).toEqual(output.length);
    expect("Bamf").toEqual(fixture[0]);
    expect("PrefixBamf").toEqual(output[0]);

    fixture.addRange(Enumerable.Repeat("Bar", 4));
    expect(5).toEqual(fixture.length);
    expect(5).toEqual(output.length);
    expect("Bamf").toEqual(fixture[0]);
    expect("PrefixBamf").toEqual(output[0]);

    expect(fixture.Skip(1).All(x => x == "Bar")).toBeTruthy();
    expect(output.Skip(1).All(x => x == "PrefixBar")).toBeTruthy();

    // Trigger the Reset by.adding a ton of items
    fixture.addRange(Enumerable.Repeat("Bar", 35));
    expect(40).toEqual(fixture.length);
    expect(40).toEqual(output.length);
    expect("Bamf").toEqual(fixture[0]);
    expect("PrefixBamf").toEqual(output[0]);
});

        it("InsertRangeSmokeTest", () => {
    var fixture = wx.list<string>();
    var output = fixture.project(x => "Prefix" + x);

    fixture.add("Bamf");
    expect(1).toEqual(fixture.length);
    expect(1).toEqual(output.length);
    expect("Bamf").toEqual(fixture[0]);
    expect("PrefixBamf").toEqual(output[0]);

    fixture.InsertRange(0, Enumerable.Repeat("Bar", 4));
    expect(5).toEqual(fixture.length);
    expect(5).toEqual(output.length);
    expect("Bamf").toEqual(fixture[4]);
    expect("PrefixBamf").toEqual(output[4]);

    expect(fixture.Take(4).All(x => x == "Bar")).toBeTruthy();
    expect(output.Take(4).All(x => x == "PrefixBar")).toBeTruthy();

    // Trigger the Reset by.adding a ton of items
    fixture.InsertRange(0, Enumerable.Repeat("Bar", 35));
    expect(40).toEqual(fixture.length);
    expect(40).toEqual(output.length);
    expect("Bamf").toEqual(fixture[39]);
    expect("PrefixBamf").toEqual(output[39]);
});

        it("DerivedCollectionShouldOrderCorrectly", () => {
    var collection = wx.list<number>();
    var orderedCollection = collection.project(x => x, null,(x, y) => x.CompareTo(y));

    collection.add(1);
    collection.add(2);

    expect(2).toEqual(orderedCollection.length);
    expect(1).toEqual(orderedCollection[0]);
    expect(2).toEqual(orderedCollection[1]);
});

        it("DerivedCollectionShouldStopFollowingAfterDisposal", () => {
    var collection = wx.list<number>();

    var orderedCollection = collection.project(
        x => x.ToString(),
        null,
        (x, y) => x.CompareTo(y)
        );

    collection.add(1);
    collection.add(2);

    expect(2).toEqual(orderedCollection.length);

    orderedCollection.Dispose();

    collection.add(3);
    expect(2).toEqual(orderedCollection.length);
});

        it("DerivedCollectionFilterTest", () => {
    var models = wx.list<FakeCollectionModel>(
         [ 0, 1, 2, 3, 4, ].select(x => new FakeCollectionModel() { SomeNumber = x }));
    models.ChangeTrackingEnabled = true;

    var viewModels = models.project(x => new FakeCollectionViewModel(x), x => !x.IsHidden);
    expect(5).toEqual(viewModels.length);

    models[0].IsHidden = true;
    expect(4).toEqual(viewModels.length);

    models[4].IsHidden = true;
    expect(3).toEqual(viewModels.length);

    models[0].IsHidden = false;
    expect(4).toEqual(viewModels.length);
        });
*/
});


