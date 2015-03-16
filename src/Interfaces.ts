///<reference path="../node_modules/rx/ts/rx.all.d.ts" />

module wx {
   /**
    * Dependency Injector and service locator
    * @interface 
    **/
    export interface IInjector {
        register(key: string, singleton: boolean, isConstructor: boolean, factory: Array<any>): void;
        register(key: string, singleton: boolean, factory: () => any): void;
        register(key: string, instance:any): void;

        resolve<T>(key: string, args?: any): T;
    }

   /**
    * The WeakMap object is a collection of key/value pairs in which the keys are objects and the values can be arbitrary values. The keys are held using weak references.
    * @interface 
    **/
    export interface IWeakMap<TKey extends Object, T> {
        set(key: TKey, value: T): void;
        get(key: TKey): T;
        has(key: TKey): boolean;
        delete(key: TKey): void;
        isEmulated: boolean;
    }

   /**
    * The Set object lets you store unique values of any type, whether primitive values or object references.
    * @interface 
    **/
    export interface ISet<T> {
        add(value: T): ISet<T>;
        has(key: T): boolean;
        delete(key: T): boolean;
        clear(): void;
        forEach(callback: (T) => void, thisArg?): void;
        size: number;
        isEmulated: boolean;
    }

    /**
    * Represents an engine responsible for converting arbitrary text fragements into a collection of Dom Nodes
    * @interface 
    **/
    export interface ITemplateEngine {
        parse(templateSource: string): Node[];
    }

    /**
    * Represents a collection of objects that can be individually accessed by index.
    * @interface 
    **/
    export interface IReadOnlyList<T> {
        length: number;
        get(index: number): T;
    }

    /**
    * Represents a collection of objects that can be individually accessed by index.
    * @interface 
    **/
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

    /**
    * IObservableProperty combines a function signature for value setting and getting with
    * observables for monitoring value changes
    * @interface 
    **/
    export interface IObservableProperty<T> extends Rx.IDisposable {
        (newValue: T): void;
        (): T;
        changing: Rx.Observable<T>;
        changed: Rx.Observable<T>;
        source?: Rx.Observable<T>;
    }

    /**
    * This interface is implemented by RxUI objects which are given
    * IObservables as input - when the input IObservables OnError, instead of
    * disabling the RxUI object, we catch the Rx.Observable and pipe it into
    * this property.
    *
    * Normally this Rx.Observable is implemented with a ScheduledSubject whose
    * default Observer is wx.App.DefaultExceptionHandler - this means, that if
    * you aren't listening to ThrownExceptions and one appears, the exception
    * will appear on the UI thread and crash the application.
    * @interface 
    **/
    export interface IHandleObservableErrors {
        /**
        * Fires whenever an exception would normally terminate ReactiveUI
        * internal state.
        **/
        thrownExceptions: Rx.Observable<Error>; //  { get; }
    }

    /**
    * Encapsulates change notifications published by various IObservableList members
    * @interface 
    **/
   export interface IListChangeInfo<T> {
        items: T[]; // { get; }
        from: number; // { get; }
        to?: number; // { get; }
    }

    /**
    * ICommand represents an ICommand which also notifies when it is
    * executed (i.e. when Execute is called) via IObservable. Conceptually,
    * this represents an Event, so as a result this IObservable should never
    * OnComplete or OnError.
    * @interface 
    **/
    export interface ICommand<T> extends
        Rx.IDisposable,
        IHandleObservableErrors {
        canExecute(parameter: any): boolean;
        execute(parameter: any): void;

        /**
        * Gets a value indicating whether this instance can execute observable.
        **/
        canExecuteObservable: Rx.Observable<boolean>; //  { get; }

        /**
        * Gets a value indicating whether this instance is executing. This
        * Observable is guaranteed to always return a value immediately (i.e.
        * it is backed by a BehaviorSubject), meaning it is safe to determine
        * the current state of the command via IsExecuting.First()
        **/
        isExecuting: Rx.Observable<boolean>; //  { get; }

        /**
        * Gets an observable that returns command invocation results
        **/
        results: Rx.Observable<T>;

        /**
        * Executes a Command and returns the result asynchronously. This method
        * makes it *much* easier to test Command, as well as create
        * Commands who invoke inferior commands and wait on their results.
        *
        * Note that you **must** Subscribe to the Observable returned by
        * ExecuteAsync or else nothing will happen (i.e. ExecuteAsync is lazy)
        *
        * Note also that the command will be executed, irrespective of the current value
        * of the command's canExecute observable.
        * @return An Observable representing a single invocation of the Command.
        * @param parameter Don't use this.
        **/
        executeAsync(parameter?: any): Rx.Observable<T>;
    }

    /**
    * Provides information about a changed property value on an object
    * @interface 
    **/
   export interface IPropertyChangedEventArgs {
        sender: any; //  { get; private set; }
        propertyName: string;
    }

    /**
    * IReactiveNotifyCollectionItemChanged provides notifications for collection item updates, ie when an object in
    * a collection changes.
    * @interface 
    **/
    export interface INotifyCollectionItemChanged {
        /**
        * Provides Item Changing notifications for any item in collection that
        * implements IReactiveNotifyPropertyChanged. This is only enabled when
        * ChangeTrackingEnabled is set to True.
        **/
        itemChanging: Rx.Observable<IPropertyChangedEventArgs>; // { get; }

        /**
        * Provides Item Changed notifications for any item in collection that
        * implements IReactiveNotifyPropertyChanged. This is only enabled when
        * ChangeTrackingEnabled is set to True.
        **/
        itemChanged: Rx.Observable<IPropertyChangedEventArgs>; //  { get; }

        /**
        * Enables the ItemChanging and ItemChanged properties; when this is
        * enabled, whenever a property on any object implementing
        * IReactiveNotifyPropertyChanged changes, the change will be
        * rebroadcast through ItemChanging/ItemChanged.
        **/
        changeTrackingEnabled: boolean; //  { get; set; }
    }


    /**
    * IReactiveNotifyCollectionChanged of T provides notifications when the contents
    * of collection are changed (items are added/removed/moved).
    * @interface 
    **/
    export interface INotifyListChanged<T> {
        /**
        * This Observable fires before the list is changing, regardless of reason
        **/
        listChanging: Rx.Observable<boolean>; //  { get; }

        /**
        * This Observable fires after list has changed, regardless of reason
        **/
        listChanged: Rx.Observable<boolean>; //  { get; }

        /**
        * Fires when items are added to the list, once per item added.
        * Functions that add multiple items such addRange should fire this
        * multiple times. The object provided is the item that was added.
        **/
        itemsAdded: Rx.Observable<IListChangeInfo<T>>; //  { get; }

        /**
        * Fires before an item is going to be added to the list.
        **/
        beforeItemsAdded: Rx.Observable<IListChangeInfo<T>>; //  { get; }

        /**
        * Fires once an item has been removed from a list, providing the
        * item that was removed.
        **/
        itemsRemoved: Rx.Observable<IListChangeInfo<T>>; //  { get; }

        /**
        * Fires before an item will be removed from a list, providing
        * the item that will be removed.
        **/
        beforeItemsRemoved: Rx.Observable<IListChangeInfo<T>>; //  { get; }

        /**
        * Fires before an items moves from one position in the list to
        * another, providing the item(s) to be moved as well as source and destination
        * indices.
        **/
        beforeItemsMoved: Rx.Observable<IListChangeInfo<T>>; //  { get; }

        /**
        * Fires once one or more items moves from one position in the list to
        * another, providing the item(s) that was moved as well as source and destination
        * indices.
        **/
        itemsMoved: Rx.Observable<IListChangeInfo<T>>; //  { get; }

        /**
        * Fires before an item is replaced
        * indices.
        **/
        beforeItemReplaced: Rx.Observable<IListChangeInfo<T>>; //  { get; }

        /**
        * Fires after an item is replaced
        **/
        itemReplaced: Rx.Observable<IListChangeInfo<T>>; //  { get; }

        /**
        * Fires when the list count changes, regardless of reason
        **/
        countChanging: Rx.Observable<number>; //  { get; }

        /**
        * Fires when the collection count changes, regardless of reason
        **/
        countChanged: Rx.Observable<number>; //  { get; }

        /**
        * Fires when the empty state changes, regardless of reason
        **/
        isEmptyChanged: Rx.Observable<boolean>; //  { get; }

        /**
        * This Observable is fired when a ShouldReset fires on the list. This
        * means that you should forget your previous knowledge of the state
        * of the collection and reread it.
        *
        * This does *not* mean Clear, and if you interpret it as such, you are
        * Doing It Wrong.
        **/
        shouldReset: Rx.Observable<any>; //  { get; }

        /**
        * Suppresses change notification from the list until the disposable returned by this method is disposed
        **/
        suppressChangeNotifications(): Rx.IDisposable;
    }

    /**
    * IObservableList of T represents a list that can notify when its
    * contents are changed (either items are added/removed, or the object
    * itself changes).
    *
    * It is important to implement the Changing/Changed from
    * IReactiveNotifyPropertyChanged semantically as "Fire when *anything* in
    * the collection or any of its items have changed, in any way".
    * @interface 
    **/
    export interface IObservableList<T> extends IList<T>, INotifyListChanged<T>, INotifyCollectionItemChanged {
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

    /**
    * Data context used in binding operations
    * @interface 
    **/
    export interface IDataContext {
        $data: any;
        $root: any;
        $parent: any;
        $parents: any[];
    }

    /**
    * Extensible Node state
    * @interface 
    **/
    export interface INodeState {
        cleanup: Rx.CompositeDisposable;
        isBound: boolean;   // true of this node has been touched by applyBindings
        model?: any;        // scope model 
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
        readFieldHook?: (o: any, field: any, keepObservable?: boolean) => any;
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

    /**
    * The Dom services provides functionality for manipulating the browser Dom
    * @interface 
    **/
    export interface IDomService {
        /**
        * Applies bindings to the specified node and all of its children using the specified data context 
        * @param {IDataContext} ctx The data context
        * @param {Node} rootNode The node to be bound
        */
        applyBindings(model: any, rootNode: Node): void;

        /**
        * Applies bindings to all the children of the specified node but not the node itself using the specified data context.
        * You generally want to use this method if you are authoring a new binding handler that handles children.
        * @param {IDataContext} ctx The data context
        * @param {Node} rootNode The node to be bound
        */
        applyBindingsToDescendants(ctx: IDataContext, rootNode: Node): void;

        /**
        * Removes and cleans up any binding-related state from the specified node and its descendants.
        * @param {Node} rootNode The node to be cleaned
        */
        cleanNode(rootNode: Node): void;

        /**
        * Removes and cleans up any binding-related state from all the children of the specified node but not the node itself.
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
        compileBindingOptions(value: string): any;
        getObjectLiteralTokens(value: string): Array<IObjectLiteralToken>;
        extractBindingsFromDataAttribute(node: Node): Array<{ key: string; value: string }>;

        registerDataContextExtension(extension:(node: Node, ctx:IDataContext)=> void);

        /**
        * Evaluates an expression against a data-context and returns the result
        * @param {IExpressionFunc} exp The source expression 
        * @param {IExpressionFunc} evalObs Allows monitoring of expression evaluation passes (for unit testing)
        * @param {IDataContext} The data context to evaluate the expression against
        * @return {any} A value representing the result of the expression-evaluation
        */
        evaluateExpression(exp: ICompiledExpression, ctx: IDataContext): any;

        /**
        * Creates an observable that produces values representing the result of the expression.
        * If any observable input of the expression changes, the expression gets re-evaluated
        * and the observable produces a new value.
        * @param {IExpressionFunc} exp The source expression 
        * @param {IExpressionFunc} evalObs Allows monitoring of expression evaluation passes (for unit testing)
        * @param {IDataContext} The data context to evaluate the expression against
        * @return {Rx.Observable<any>} A sequence of values representing the result of the last evaluation of the expression
        */
        expressionToObservable(exp: ICompiledExpression, ctx: IDataContext, evalObs?: Rx.Observer<any>): Rx.Observable<any>;
    }

    /**
    * Bindings are markers on a DOM element (such as an attribute or comment) that tell 
    * WebRx's DOM compiler to attach a specified behavior to that DOM element or even 
    * transform the element and its children.
    * @interface 
    **/
    export interface IBindingHandler {
        /**
        * Applies the binding to the specified element
        * @param {Node} node The target node
        * @param {any} options The options for the handler
        * @param {IDataContext} ctx The curent data context
        * @param {IDomElementState} state State of the target element
        */
        applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState): void;

        /**
        * Configures the handler using a handler-specific options object
        * @param {any} options The handler-specific options 
        */
        configure(options: any): void;

        /**
        * When there are multiple bindings defined on a single DOM element, 
        * sometimes it is necessary to specify the order in which the bindings are applied. 
        */
        priority: number;

        /**
        * If set to true then bindings won't be applied to children
        * of the element such binding is encountered on. Instead
        * the handler will be responsible for that.
        */
        controlsDescendants?: boolean;
    }

    export interface IBindingRegistry {
        registerBinding(name: string, handler: IBindingHandler): void;
        registerBinding(name: string, handler: string): void;
        registerBinding(names: string[], handler: IBindingHandler): void;
        registerBinding(names: string[], handler: string): void;
        isBindingRegistered(name: string): boolean;
        getBinding(name: string): IBindingHandler;
    }

    export interface IComponentTemplateDescriptor {
        (params: any): string|Node[];  // Factory 
        require?: string;       // Async AMD
        promise?: Rx.IPromise<Node[]>;  // Async Promise
        resolve?: string;       // DI
        element?: string|Node;  // Selector or Node instance
    }

    export interface IComponentViewModelDescriptor {
        (params: any): any;     // Factory 
        require?: string;       // Async AMD loading
        promise?: Rx.IPromise<string>;  // Async Promise
        resolve?: string;       // DI
        instance?: any;         // pre-constructed instance
    }

    export interface IComponent {
        template: string|Node[]|IComponentTemplateDescriptor;
        viewModel?: IComponentViewModelDescriptor;

        preBindingInit?: string;   // name of method on view-model to invoke before bindings get applied
        postBindingInit?: string;  // name of method on view-model to invoke after binding have been applied
    }

    export interface IComponentRegistry {
        registerComponent(name: string, handler: IComponent): void;
        registerComponent(name: string, handler: string): void;
        isComponentRegistered(name: string): boolean;
        getComponent(name: string): IComponent;
    }

    export interface IModule extends IComponentRegistry, IBindingRegistry {
        name: string;
    }

    export interface IWebRxApp extends IModule {
        defaultExceptionHandler: Rx.Observer<Error>;
        mainThreadScheduler: Rx.IScheduler;
        templateEngine: ITemplateEngine;
        history: IHistory;
    }

    export interface IRoute {
        parse(url): Object;
        stringify(params?: Object): string;
        concat(route: IRoute): IRoute;
        isAbsolute: boolean;
    }

    export interface IRouterStateConfig {
        name: string;
        route?: string|IRoute;   // relative or absolute
        views?: { [view: string]: string|{ component: string; params?: any } };
        params?: any;
        //reloadOnSearch?: boolean;
    }

    export interface IRouterState {
        name: string;
        uri: string;
        params: any;
        views: { [view: string]: string|{ component: string; params?: any } };
    }

    export const enum RouterLocationChangeMode {
        add = 1,
        replace = 2
    }

    export interface IStateChangeOptions {
        /**
        * If true will update the url in the location bar, if false will not. If string, must be "replace", 
        * which will update url and also replace last history record.
        **/
        location?: boolean|RouterLocationChangeMode; 

        /**
        * If true will force transition even if the state or params have not changed, aka a reload of the same state. 
        **/
        force?: boolean;
    }

    export interface IHistory {
        onPopState: Rx.Observable<PopStateEvent>;        

        location: Location;
        length: number;
        state: any;
        back(): void;
        forward(): void;
        replaceState(statedata: any, title: string, url?: string): void;
        pushState(statedata: any, title: string, url?: string): void;
    }

    export interface IRouter {
        /**
        * Registers a state configuration under a given state name.
        **/
        state(config: IRouterStateConfig): IRouter;

        /**
        * Convenience method for transitioning to a new state. IRouter.go calls IRouter.transitionTo internally 
        * but automatically sets options to { location: true, inherit: true, relative: IRouter.current, notify: true }. 
        * This allows you to easily use an absolute or relative to path and specify only the parameters you'd like 
        * to update (while letting unspecified parameters inherit from the currently active ancestor states).
        **/
        go(to: string, params?: Object, options?: IStateChangeOptions): void;    // Rx.Observable<any>

         /**
        * An uri generation method that returns the uri for the given state populated with the given params.
        **/
        uri(state: string, params?: {}): string;

        /**
        * A method that force reloads the current state. All resolves are re-resolved, events are not re-fired, 
        * and components reinstantiated.
        **/
        reload(): void;

        /**
        * Returns the state configuration object for any specific state or all states.
        **/
        get(state: string): IRouterStateConfig;

        /**
        * Resets internal state configuration to defaults
        **/
        reset(): void;

        /**
        * A reference to the current state's config object. However you passed it in. Useful for accessing custom data.
        **/
        current: IObservableProperty<IRouterState>;
    }
}

// RxJS extensions

declare module Rx {
    export interface Observable<T> extends IObservable<T> {
        toProperty(initialValue?: T): wx.IObservableProperty<T>;
    }
}
