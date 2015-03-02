///<reference path="../node_modules/rx/ts/rx.all.d.ts" />

module wx {
    export interface IInjector {
        register(key: string, singleton: boolean, isConstructor: boolean, factory: Array<any>): void;
        register(key: string, singleton: boolean, factory: () => any): void;
        register(key: string, instance:any): void;

        resolve<T>(key: string): T;
    }

    export interface IWeakMap<TKey extends Object, T> {
        set(key: TKey, value: T): void;
        get(key: TKey): T;
        has(key: TKey): boolean;
        delete(key: TKey): void;
        isEmulatedWeakMap: boolean;
    }

    /// <summary>
    /// Represents a collection of objects that can be individually accessed by index.
    /// </summary>
    export interface IReadOnlyList<T> {
        length: number;
        get(index: number): T;
    }

    /// <summary>
    /// Represents a collection of objects that can be individually accessed by index.
    /// </summary>
    export interface IList<T> extends IReadOnlyList<T> {
        set(index: number, item: T);
        isReadOnly: boolean;
        add(item: T): void;
        clear(): void;
        contains(item: T): boolean;
        remove(item: T): boolean;
        indexOf(item: T): number;
        insert(index: number, item: T): void;
        removeAt(index: number): void;
    }

    /// <summary>
    /// IObservableProperty combines a function signature for value setting and getting with
    /// observables for monitoring value changes
    /// </summary>
    export interface IObservableProperty<T> extends Rx.IDisposable {
        (newValue?: T): T;
        changing: Rx.Observable<T>;
        changed: Rx.Observable<T>;
        source?: Rx.Observable<T>;
    }

    export enum NotifyCollectionChangedAction {
        Add,
        Remove,
        Replace,
        Move,
        Reset,
    }

    export interface INotifyCollectionChangedEventArgs {
        action: NotifyCollectionChangedAction;
        newItems: Array<any>;
        newStartingIndex: number;
        oldItems: Array<any>;
        oldStartingIndex: number;
    }

    /// <summary>
    /// This interface is implemented by RxUI objects which are given
    /// IObservables as input - when the input IObservables OnError, instead of
    /// disabling the RxUI object, we catch the Rx.Observable and pipe it into
    /// this property.
    ///
    /// Normally this Rx.Observable is implemented with a ScheduledSubject whose
    /// default Observer is wx.App.DefaultExceptionHandler - this means, that if
    /// you aren't listening to ThrownExceptions and one appears, the exception
    /// will appear on the UI thread and crash the application.
    /// </summary>
    export interface IHandleObservableErrors {
        /// <summary>
        /// Fires whenever an exception would normally terminate ReactiveUI
        /// internal state.
        /// </summary>
        thrownExceptions: Rx.Observable<Error>; //  { get; }
    }

    export interface IMoveInfo<T> {
        movedItems: Array<T>; // { get; }
        from: number; // { get; }
        to: number; // { get; }
    }

    /// <summary>
    /// ICommand represents an ICommand which also notifies when it is
    /// executed (i.e. when Execute is called) via IObservable. Conceptually,
    /// this represents an Event, so as a result this IObservable should never
    /// OnComplete or OnError.
    /// </summary>
    export interface ICommand<T> extends
        Rx.IDisposable,
        IHandleObservableErrors {
        canExecute(parameter: any): boolean;
        execute(parameter: any): void;

        /// <summary>
        /// Gets a value indicating whether this instance can execute observable.
        /// </summary>
        /// <value><c>true</c> if this instance can execute observable; otherwise, <c>false</c>.</value>
        canExecuteObservable: Rx.Observable<boolean>; //  { get; }

        /// <summary>
        /// Gets a value indicating whether this instance is executing. This
        /// Observable is guaranteed to always return a value immediately (i.e.
        /// it is backed by a BehaviorSubject), meaning it is safe to determine
        /// the current state of the command via IsExecuting.First()
        /// </summary>
        /// <value><c>true</c> if this instance is executing; otherwise, <c>false</c>.</value>
        isExecuting: Rx.Observable<boolean>; //  { get; }

        /// <summary>
        /// Gets an observable that returns command invocation results
        /// </summary>
        results: Rx.Observable<T>;

        /// <summary>
        /// Executes a Command and returns the result asynchronously. This method
        /// makes it *much* easier to test Command, as well as create
        /// Commands who invoke inferior commands and wait on their results.
        ///
        /// Note that you **must** Subscribe to the Observable returned by
        /// ExecuteAsync or else nothing will happen (i.e. ExecuteAsync is lazy)
        ///
        /// Note also that the command will be executed, irrespective of the current value
        /// of the command's canExecute observable.
        /// </summary>
        /// <returns>An Observable representing a single invocation of the Command.</returns>
        /// <param name="parameter">Don't use this.</param>
        executeAsync(parameter?: any): Rx.Observable<T>;
    }

    export interface IPropertyChangedEventArgs {
            sender: any; //  { get; private set; }
            propertyName: string;
    }

    /// <summary>
    /// IReactiveNotifyCollectionItemChanged provides notifications for collection item updates, ie when an object in
    /// a collection changes.
    /// </summary>
    export interface INotifyCollectionItemChanged {
        /// <summary>
        /// Provides Item Changing notifications for any item in collection that
        /// implements IReactiveNotifyPropertyChanged. This is only enabled when
        /// ChangeTrackingEnabled is set to True.
        /// </summary>
        itemChanging: Rx.Observable<IPropertyChangedEventArgs>; // { get; }

        /// <summary>
        /// Provides Item Changed notifications for any item in collection that
        /// implements IReactiveNotifyPropertyChanged. This is only enabled when
        /// ChangeTrackingEnabled is set to True.
        /// </summary>
        itemChanged: Rx.Observable<IPropertyChangedEventArgs>; //  { get; }

        /// <summary>
        /// Enables the ItemChanging and ItemChanged properties; when this is
        /// enabled, whenever a property on any object implementing
        /// IReactiveNotifyPropertyChanged changes, the change will be
        /// rebroadcast through ItemChanging/ItemChanged.
        /// </summary>
        changeTrackingEnabled: boolean; //  { get; set; }
    }


    /// <summary>
    /// IReactiveNotifyCollectionChanged of T provides notifications when the contents
    /// of collection are changed (items are added/removed/moved).
    /// </summary>
    export interface INotifyCollectionChanged<T> {
        /// <summary>
        /// Fires when items are added to the collection, once per item added.
        /// Functions that add multiple items such AddRange should fire this
        /// multiple times. The object provided is the item that was added.
        /// </summary>
        itemsAdded: Rx.Observable<T>; //  { get; }

        /// <summary>
        /// Fires before an item is going to be added to the collection.
        /// </summary>
        beforeItemsAdded: Rx.Observable<T>; //  { get; }

        /// <summary>
        /// Fires once an item has been removed from a collection, providing the
        /// item that was removed.
        /// </summary>
        itemsRemoved: Rx.Observable<T>; //  { get; }

        /// <summary>
        /// Fires before an item will be removed from a collection, providing
        /// the item that will be removed.
        /// </summary>
        beforeItemsRemoved: Rx.Observable<T>; //  { get; }

        /// <summary>
        /// Fires before an items moves from one position in the collection to
        /// another, providing the item(s) to be moved as well as source and destination
        /// indices.
        /// </summary>
        beforeItemsMoved: Rx.Observable<IMoveInfo<T>>; //  { get; }

        /// <summary>
        /// Fires once one or more items moves from one position in the collection to
        /// another, providing the item(s) that was moved as well as source and destination
        /// indices.
        /// </summary>
        itemsMoved: Rx.Observable<IMoveInfo<T>>; //  { get; }

        /// <summary>
        /// This Observable is equivalent to the NotifyCollectionChanged event,
        /// but fires before the collection is changed
        /// </summary>
        collectionChanging: Rx.Observable<INotifyCollectionChangedEventArgs>; //  { get; }

        /// <summary>
        /// This Observable is equivalent to the NotifyCollectionChanged event,
        /// and fires after the collection is changed
        /// </summary>
        collectionChanged: Rx.Observable<INotifyCollectionChangedEventArgs>; //  { get; }

        /// <summary>
        /// Fires when the collection count changes, regardless of reason
        /// </summary>
        countChanging: Rx.Observable<number>; //  { get; }

        /// <summary>
        /// Fires when the collection count changes, regardless of reason
        /// </summary>
        countChanged: Rx.Observable<number>; //  { get; }

        isEmptyChanged: Rx.Observable<boolean>; //  { get; }

        /// <summary>
        /// This Observable is fired when a ShouldReset fires on the collection. This
        /// means that you should forget your previous knowledge of the state
        /// of the collection and reread it.
        ///
        /// This does *not* mean Clear, and if you interpret it as such, you are
        /// Doing It Wrong.
        /// </summary>
        shouldReset: Rx.Observable<any>; //  { get; }

        suppressChangeNotifications(): Rx.IDisposable;
    }

    /// <summary>
    /// IObservableList of T represents a list that can notify when its
    /// contents are changed (either items are added/removed, or the object
    /// itself changes).
    ///
    /// It is important to implement the Changing/Changed from
    /// IReactiveNotifyPropertyChanged semantically as "Fire when *anything* in
    /// the collection or any of its items have changed, in any way".
    /// </summary>
    export interface IObservableList<T> extends IList<T>, INotifyCollectionChanged<T>, INotifyCollectionItemChanged {
        isEmpty: boolean; //  { get; }
        addRange(collection: Array<T>): void;
        insertRange(index: number, collection: Array<T>): void;
        move(oldIndex, newIndex): void;
        removeAll(items: Array<T>): void;
        removeRange(index: number, count: number): void;
        sort(comparison: (a: T, b: T) => number): void;
        forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void;
        map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[];
        filter(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): T[];
        every(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): boolean;
        some(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): boolean;
        reset(): void;
        toArray(): Array<T>;
    }

    export interface IInjectorService {
        annotate(fn: Function): string[];
        annotate(inlineAnnotatedFunction: any[]): string[];
        get(name: string): any;
        has(name: string): boolean;
        instantiate(typeConstructor: Function, locals?: any): any;
        invoke(inlineAnnotatedFunction: any[]): any;
        invoke(func: Function, context?: any, locals?: any): any;
    }

    export interface IDataContext {
        $data: any;
        $root: any;
        $parent: any;
        $parents: any[];
        $index: number;
    }

    export interface INodeStateProperties {
        module?: any;
        model?: any;
        index?: any;
    }

    export interface INodeState {
        isBound: boolean;   // true of this node has been touched by applyDirectives
        cleanup: Rx.CompositeDisposable;
        properties: INodeStateProperties;
    }

    export interface IObjectLiteralToken {
        key?: string;
        unknown?: string;
        value?: string;
    }

    export interface IExpressionCompilerOptions {
        disallowFunctionCalls?: boolean;
        filters?: { [filterName: string]: (...args: Array<any>) => any };
    }

    export interface ICompiledExpression {
        (scope?: any, locals?: any): any;

        literal?: boolean;
        constant?: boolean;
        assign?: (self, value, locals) => any;
    }

    export interface ICompiledExpressionRuntimeHooks {
        readFieldHook?: (o: any, field: any) => any;
        writeFieldHook?: (o: any, field: any, newValue: any) => any;
        readIndexHook?: (o: any, field: any) => any;
        writeIndexHook?: (o: any, field: any, newValue: any) => any;
    }

    export interface IExpressionCompiler {
        compileExpression(src: string, options?: IExpressionCompilerOptions, cache?: { [exp: string]: ICompiledExpression }): ICompiledExpression;
        getRuntimeHooks(locals: any): ICompiledExpressionRuntimeHooks;
        setRuntimeHooks(locals: any, hooks: ICompiledExpressionRuntimeHooks): void;
        parseObjectLiteral(objectLiteralString): Array<IObjectLiteralToken>;
    }

    export interface IDomService {
        /**
        * Applies directives to the specified node and all of its children using the specified data context 
        * @param {IDataContext} ctx The data context
        * @param {Node} rootNode The node to be bound
        */
        applyDirectives(model: any, rootNode: Node): void;

        /**
        * Applies directives to all the children of the specified node but not the node itself using the specified data context.
        * You generally want to use this method if you are authoring a new binding handler that handles children.
        * @param {IDataContext} ctx The data context
        * @param {Node} rootNode The node to be bound
        */
        applyDirectivesToDescendants(ctx: IDataContext, rootNode: Node): void;

        /**
        * Removes and cleans up any directive-related state from the specified node and its descendants.
        * @param {Node} rootNode The node to be cleaned
        */
        cleanNode(rootNode: Node): void;

        /**
        * Removes and cleans up any directive-related state from all the children of the specified node but not the node itself.
        * @param {Node} rootNode The node to be cleaned
        */
        cleanDescendants(rootNode: Node): void;

        /**
        * Stores updated state for the specified node
        * @param {Node} node The target node
        * @param {IBindingState} state The updated node state
        */
        setNodeState(node: Node, state: INodeState): void;

        /**
        * Retrieves the current node state for the specified node
        * @param {Node} node The target node
        */
        getNodeState(node: Node): INodeState;

        /**
        * Initializes a new node state
        * @param {any} model The model 
        */
        createNodeState(model?: any): INodeState;

        /**
        * Computes the actual data context starting at the specified node
        * @param {Node} node The node to be bound
        * @return {IDataContext} The data context to evaluate the expression against
        */
        getDataContext(node: Node): IDataContext;

        isNodeBound(node: Node): boolean;
        clearElementState(node: Node);
        getDirectives(node: Node): Array<IObjectLiteralToken>;
        compileDirectiveOptions(value: string): any;

        /**
        * Creates an observable that produces values representing the result of the expression.
        * If any observable input of the expression changes, the expression gets re-evaluated
        * and the observable produces a new value.
        * @param {IExpressionFunc} exp The source expression 
        * @param {IExpressionFunc} evalObs Allows monitoring of expression evaluation passes (for unit testing)
        * @return {IDataContext} The data context to evaluate the expression against
        */
        expressionToObservable(exp: ICompiledExpression, ctx: IDataContext, evalObs?: Rx.Observer<any>): Rx.Observable<any>;
    }

    export interface IDirective {
        /**
        * Applies the directive to the specified element
        * @param {Node} node The target node
        * @param {any} options The options for the handler
        * @param {IDataContext} ctx The curent data context
        * @param {IDomElementState} state State of the target element
        */
        apply(node: Node, options: any, ctx: IDataContext, state: INodeState): void;

        /**
        * Configures the handler using a handler-specific options object
        * @param {any} options The handler-specific options 
        */
        configure(options: any): void;

        /**
        * When there are multiple directives defined on a single DOM element, 
        * sometimes it is necessary to specify the order in which the directives are applied. 
        */
        priority: number;

        /**
        * If set to true then the current priority will be the last set of directives which will 
        * execute (any directives at the current priority will still execute as the order of 
        * execution on same priority is undefined).
        */
        terminal?: boolean;
    }

    export interface IDirectiveRegistry {
        registerDirective(name: string, handler: IDirective): void;
        registerDirective(name: string, handler: string): void;
        unregisterDirective(name: string): void;
        getDirective(name: string): IDirective;
    }

    export interface IComponent {
    }

    export interface IComponentRegistry {
        registerComponent(name: string, handler: IComponent): void;
        registerComponent(name: string, handler: string): void;
        unregisterComponent(name: string): void;
        getComponent(name: string): IComponent;
    }

    export interface IModule extends
        IComponentRegistry,
        IDirectiveRegistry {
        name: string;
    }

    export interface IWebRxApp extends IModule {
        defaultExceptionHandler: Rx.Observer<Error>;
        mainThreadScheduler: Rx.IScheduler;
    }
}

// RxJS extensions

declare module Rx {
    export interface Observable<T> extends IObservable<T> {
        toProperty(initialValue?: T): wx.IObservableProperty<T>;
    }
}
