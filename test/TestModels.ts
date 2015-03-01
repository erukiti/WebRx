/// <reference path="typings/jasmine.d.ts" />
/// <reference path="../build/web.rx.d.ts" />

class TestViewModel {
    foo = wx.property<number>();
    bar = wx.property<string>();
}

class FakeCollectionModel {
    isHidden = wx.property<boolean>();
    someNumber = wx.property<number>();
}

class FakeCollectionViewModel {
    constructor(model: FakeCollectionModel) {
        this.model(model);

        this.numberAsString = wx.whenAny(model.someNumber, x => x.toString()).toProperty();
    }

    numberAsString: wx.IObservableProperty<string>;
    
    public get NumberAsString(): string {
        return this.numberAsString();
    }

    model = wx.property<FakeCollectionModel>();
}

class NestedTextModel {
    text = wx.property<string>();
    hasData = wx.property<boolean>();
}

class TextModel {
    constructor() {
         var _vm = new NestedTextModel();
        _vm.text("text");
        _vm.hasData(true);
        this.value(_vm);
    }

    value = wx.property<NestedTextModel>();
    hasData = wx.property<boolean>();
}

class TestFixture {
    constructor() {
        var list = wx.list<number>();
        list.changeTrackingEnabled = true;
        this.TestCollection(list);
    }

    IsNotNullString = wx.property<string>();
    IsOnlyOneWord = wx.property<string>();
    StackOverflowTrigger = wx.property<Array<string>>();
    UsesExprRaiseSet = wx.property<string>();
    PocoProperty = wx.property<string>();
    TestCollection = wx.property<wx.IObservableList<number>>();
}

class Tuple<T1, T2> {
    constructor(item1: T1, item2: T2) {
        this.Item1 = item1;
        this.Item2 = item2;
    }

    Item1: T1;
    Item2: T2;
}