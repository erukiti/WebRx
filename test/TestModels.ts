/// <reference path="typings/jasmine.d.ts" />
/// <reference path="../build/xircular.d.ts" />

class TestViewModel {
    foo = xi.property<number>();
    bar = xi.property<string>();
}

class FakeCollectionModel {
    isHidden = xi.property<boolean>();
    someNumber = xi.property<number>();
}

class FakeCollectionViewModel {
    constructor(model: FakeCollectionModel) {
        this.model(model);

        this.numberAsString = xi.whenAny(model.someNumber, x => x.toString()).toProperty();
    }

    numberAsString: xi.IObservableProperty<string>;
    
    public get NumberAsString(): string {
        return this.numberAsString();
    }

    model = xi.property<FakeCollectionModel>();
}

class NestedTextModel {
    text = xi.property<string>();
    hasData = xi.property<boolean>();
}

class TextModel {
    constructor() {
         var _vm = new NestedTextModel();
        _vm.text("text");
        _vm.hasData(true);
        this.value(_vm);
    }

    value = xi.property<NestedTextModel>();
    hasData = xi.property<boolean>();
}

class TestFixture {
    constructor() {
        var list = xi.list<number>();
        list.changeTrackingEnabled = true;
        this.TestCollection(list);
    }

    IsNotNullString = xi.property<string>();
    IsOnlyOneWord = xi.property<string>();
    StackOverflowTrigger = xi.property<Array<string>>();
    UsesExprRaiseSet = xi.property<string>();
    PocoProperty = xi.property<string>();
    TestCollection = xi.property<xi.IObservableList<number>>();
}

class Tuple<T1, T2> {
    constructor(item1: T1, item2: T2) {
        this.Item1 = item1;
        this.Item2 = item2;
    }

    Item1: T1;
    Item2: T2;
}