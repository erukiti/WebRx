module wx {
    "use strict";

    /// <summary>
    /// Interface registry to be used with IUnknown.queryInterface
    /// </summary>
    export class IID {
        static IUnknown = "IUnknown";
        static IDisposable = "IDisposable";
        static IObservableProperty = "IObservableProperty";
        static IReactiveNotifyPropertyChanged = "IReactiveNotifyPropertyChanged";
        static IHandleObservableErrors = "IHandleObservableErrors";
        static IObservableList = "IObservableList";
        static IList = "IList";
        static IReactiveNotifyCollectionChanged = "IReactiveNotifyCollectionChanged";
        static IReactiveNotifyCollectionItemChanged = "IReactiveNotifyCollectionItemChanged";
        static IReactiveDerivedList = "IReactiveDerivedList";
        static IMoveInfo = "IMoveInfo";
        static IObservedChange = "IObservedChange";
        static ICommand = "ICommand";
        static IReadOnlyList = "IReadOnlyList";
    }
}