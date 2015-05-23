///<reference path="../node_modules/rx/ts/rx.all.d.ts" />

module wx {
    "use strict";

   /**
    * Dependency Injector and service locator
    * @interface 
    **/
    export interface IInjector {
        register(key: string, factory: Array<any>, singleton?: boolean): IInjector;
        register(key: string, factory: () => any, singleton?: boolean): IInjector;
        register(key: string, instance: any): IInjector;

        get<T>(key: string, args?: any): T;
        resolve<T>(iaa: Array<any>, args?: any): T;
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
    * The Map object is a simple key/value map. Any value (both objects and primitive values) may be used as either a key or a value.
    * @interface 
    **/
    export interface IMap<TKey extends Object, T> {
        set(key: TKey, value: T): void;
        get(key: TKey): T;
        has(key: TKey): boolean;
        delete(key: TKey): void;
        clear(): void;
        forEach(callback: (value: any, key: any, map: IMap<any, any>) => void, thisArg?: any): void;
        size: number;
        isEmulated: boolean;
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
    * Provides information about a changed property value on an object
    * @interface 
    **/
    export interface IPropertyChangedEventArgs {
        sender: any; //  { get; private set; }
        propertyName: string;
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
    * INotifyListItemChanged provides notifications for collection item updates, ie when an object in
    * a list changes.
    * @interface 
    **/
    export interface INotifyListItemChanged {
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
    * INotifyListChanged of T provides notifications when the contents
    * of a list are changed (items are added/removed/moved).
    * @interface 
    **/
    export interface INotifyListChanged<T> {
        /**
        * This Observable fires before the list is changing, regardless of reason
        **/
        listChanging: Rx.Observable<boolean>;

        /**
        * This Observable fires after list has changed, regardless of reason
        **/
        listChanged: Rx.Observable<boolean>;

        /**
        * Fires when items are added to the list, once per item added.
        * Functions that add multiple items such addRange should fire this
        * multiple times. The object provided is the item that was added.
        **/
        itemsAdded: Rx.Observable<IListChangeInfo<T>>;

        /**
        * Fires before an item is going to be added to the list.
        **/
        beforeItemsAdded: Rx.Observable<IListChangeInfo<T>>;

        /**
        * Fires once an item has been removed from a list, providing the
        * item that was removed.
        **/
        itemsRemoved: Rx.Observable<IListChangeInfo<T>>;

        /**
        * Fires before an item will be removed from a list, providing
        * the item that will be removed.
        **/
        beforeItemsRemoved: Rx.Observable<IListChangeInfo<T>>;

        /**
        * Fires before an items moves from one position in the list to
        * another, providing the item(s) to be moved as well as source and destination
        * indices.
        **/
        beforeItemsMoved: Rx.Observable<IListChangeInfo<T>>;

        /**
        * Fires once one or more items moves from one position in the list to
        * another, providing the item(s) that was moved as well as source and destination
        * indices.
        **/
        itemsMoved: Rx.Observable<IListChangeInfo<T>>;

        /**
        * Fires before an item is replaced indices.
        **/
        beforeItemReplaced: Rx.Observable<IListChangeInfo<T>>;

        /**
        * Fires after an item is replaced
        **/
        itemReplaced: Rx.Observable<IListChangeInfo<T>>;

        /**
        * Fires when the list length changes, regardless of reason
        **/
        lengthChanging: Rx.Observable<number>;

        /**
        * Fires when the list length changes, regardless of reason
        **/
        lengthChanged: Rx.Observable<number>;

        /**
        * Fires when the empty state changes, regardless of reason
        **/
        isEmptyChanged: Rx.Observable<boolean>;

        /**
        * This Observable is fired when a shouldReset fires on the list. This
        * means that you should forget your previous knowledge of the state
        * of the collection and reread it.
        *
        * This does *not* mean Clear, and if you interpret it as such, you are
        * Doing It Wrong.
        **/
        shouldReset: Rx.Observable<any>;

        /**
        * Suppresses change notification from the list until the disposable returned by this method is disposed
        **/
        suppressChangeNotifications(): Rx.IDisposable;
    }

    /**
    * Represents a collection of objects that can be individually accessed by index.
    * @interface 
    **/
    export interface IObservableReadOnlyList<T> extends INotifyListChanged<T>, INotifyListItemChanged {
        length: IObservableProperty<number>;
        get(index: number): T;
        isReadOnly: boolean;
        toArray(): Array<T>;

        /**
        * Creates a live-projection of itself that can be filtered, re-ordered and mapped. 
        * @param filter {(item: T) => boolean} A filter to determine whether to exclude items in the derived collection
        * @param orderer {(a: TNew, b: TNew) => number} A comparator method to determine the ordering of the resulting collection
        * @param selector {(T) => TNew} A function that will be run on each item to project it to a different type
        * @param refreshTrigger {Rx.Observable<TDontCare>} When this Observable is signalled, the derived collection will be manually reordered/refiltered.
        */
        project<TNew, TDontCare>(filter?: (item: T) => boolean, orderer?: (a: TNew, b: TNew) => number,
            selector?: (T) => TNew, refreshTrigger?: Rx.Observable<TDontCare>, scheduler?: Rx.IScheduler): IObservableReadOnlyList<TNew>;

        /**
        * Creates a live-projection of itself that can be filtered, re-ordered and mapped. 
        * @param filter {(item: T) => boolean} A filter to determine whether to exclude items in the derived collection
        * @param orderer {(a: TNew, b: TNew) => number} A comparator method to determine the ordering of the resulting collection
        * @param refreshTrigger {Rx.Observable<TDontCare>} When this Observable is signalled, the derived collection will be manually reordered/refiltered.
        */
        project<TDontCare>(filter?: (item: T) => boolean, orderer?: (a: T, b: T) => number,
            refreshTrigger?: Rx.Observable<TDontCare>, scheduler?: Rx.IScheduler): IObservableReadOnlyList<T>;

        /**
        * Creates a live-projection of itself that can be filtered, re-ordered and mapped. 
        * @param filter {(item: T) => boolean} A filter to determine whether to exclude items in the derived collection
        * @param refreshTrigger {Rx.Observable<TDontCare>} When this Observable is signalled, the derived collection will be manually reordered/refiltered.
        */
        project<TDontCare>(filter?: (item: T) => boolean, refreshTrigger?: Rx.Observable<TDontCare>,
            scheduler?: Rx.IScheduler): IObservableReadOnlyList<T>;

        /**
        * Creates a live-projection of itself that can be filtered, re-ordered and mapped. 
        * @param refreshTrigger {Rx.Observable<TDontCare>} When this Observable is signalled, the derived collection will be manually reordered/refiltered.
        */
        project<TDontCare>(refreshTrigger?: Rx.Observable<TDontCare>, scheduler?: Rx.IScheduler): IObservableReadOnlyList<T>;
    }

    /**
    * IObservableList of T represents a list that can notify when its
    * contents are changed (either items are added/removed, or the object
    * itself changes).
    * @interface 
    **/
    export interface IObservableList<T> extends IObservableReadOnlyList<T> {
        isEmpty: IObservableProperty<boolean>;
        set(index: number, item: T);

        add(item: T): void;
        push(item: T): void;
        clear(): void;
        contains(item: T): boolean;
        remove(item: T): boolean;
        indexOf(item: T): number;
        insert(index: number, item: T): void;
        removeAt(index: number): void;
        addRange(collection: Array<T>): void;
        insertRange(index: number, collection: Array<T>): void;
        move(oldIndex, newIndex): void;
        removeAll(items: Array<T>): void;
        removeRange(index: number, count: number): void;
        reset(): void;

        sort(comparison: (a: T, b: T) => number): void;
        forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void;
        map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[];
        filter(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): T[];
        every(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): boolean;
        some(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): boolean;
    }

    /**
    * This interface is implemented by RxUI objects which are given
    * IObservables as input - when the input IObservables OnError, instead of
    * disabling the RxUI object, we catch the Rx.Observable and pipe it into
    * this property.
    *
    * Normally this Rx.Observable is implemented with a ScheduledSubject whose
    * default Observer is wx.app.defaultExceptionHandler - this means, that if
    * you aren't listening to thrownExceptions and one appears, the exception
    * will appear on the UI thread and crash the application.
    * @interface 
    **/
    export interface IHandleObservableErrors {
        /**
        * Fires whenever an exception would normally terminate the app
        * internal state.
        **/
        thrownExceptions: Rx.Observable<Error>; //  { get; }
    }

    /**
    * ICommand represents an ICommand which also notifies when it is
    * executed (i.e. when Execute is called) via IObservable. Conceptually,
    * this represents an Event, so as a result this IObservable should never
    * onComplete or onError.
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

    export interface IExpressionFilter {
        (...args: Array<any>): any;
    }

    export interface IExpressionCompilerOptions {
        disallowFunctionCalls?: boolean;
        filters?: { [filterName: string]: IExpressionFilter };
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

    export interface IAnimation {
        prepare(element: Node|Array<Node>|HTMLElement|Array<HTMLElement>|NodeList, params?: any): void;
        run(element: Node|Array<Node>|HTMLElement|Array<HTMLElement>|NodeList, params?: any): Rx.Observable<any>;
        complete(element: Node|Array<Node>|HTMLElement|Array<HTMLElement>|NodeList, params?: any): void;
    }

    /**
    * The Dom Manager coordinates everything involving browser DOM-Manipulation
    * @interface 
    **/
    export interface IDomManager {
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
        * Computes the actual data context starting at the specified node
        * @param {Node} node The node to be bound
        * @return {IDataContext} The data context to evaluate the expression against
        */
        getDataContext(node: Node): IDataContext;

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
        * Returns true if the node is currently bound by one or more binding-handlers
        * @param {Node} node The node to check
        */
        isNodeBound(node: Node): boolean;

        /**
        * Removes any binding-related state from the specified node. Use with care! In most cases you would want to use cleanNode!
        * @param {Node} node The node to clear
        */
        clearNodeState(node: Node);

        /**
        * Compiles a simple string expression or multiple expressions within an object-literal recursively into an expression tree
        * @param {string} value The expression(s) to compile
        */
        compileBindingOptions(value: string, module: IModule): any;

        /**
        * Tokenizes an object-literal into an array of key-value pairs
        * @param {string} value The object literal tokenize
        */
        getObjectLiteralTokens(value: string): Array<IObjectLiteralToken>;

        /**
        * Returns data-binding expressions for a DOM-Node
        * @param {Node} node The node
        */
        getBindingDefinitions(node: Node): Array<{ key: string; value: string }>;

        /**
        * Registers hook that gets invoked whenever a new data-context gets assembled
        * @param {Node} node The node for which the data-context gets assembled
        * @param {IDataContext} ctx The current data-context
        */
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
        * @param {IModule} module The module bound to the current binding scope
        */
        applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void;

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
        binding(name: string, handler: IBindingHandler): IBindingRegistry;
        binding(name: string, handler: string): IBindingRegistry;
        binding(names: string[], handler: IBindingHandler): IBindingRegistry;
        binding(names: string[], handler: string): IBindingRegistry;
        binding(name: string): IBindingHandler;
    }

    export interface IComponentTemplateDescriptor {
        require?: string;       // Async AMD
        promise?: Rx.IPromise<Node[]>;  // Async Promise
        resolve?: string;       // DI
        element?: string|Node;  // Selector or Node instance
    }

    export interface IComponentViewModelDescriptor {
        require?: string;       // Async AMD loading
        promise?: Rx.IPromise<string>;  // Async Promise
        resolve?: string;       // DI
        instance?: any;         // pre-constructed instance
    }

    export interface IComponentDescriptor {
        require?: string;       // Async AMD loading
        resolve?: string;       // DI

        // template & viewModel are mutually exclusive with require and resolve
        template?: string|Node[]|IComponentTemplateDescriptor|((params?: any)=> string|Node[]);
        viewModel?: Array<any>|IComponentViewModelDescriptor|((params: any)=> any);

        preBindingInit?: string;   // name of method on view-model to invoke before bindings get applied
        postBindingInit?: string;  // name of method on view-model to invoke after binding have been applied
    }

    export interface IComponent {
        template: Node[];
        viewModel?: any;

        preBindingInit?: string;   // name of method on view-model to invoke before bindings get applied
        postBindingInit?: string;  // name of method on view-model to invoke after binding have been applied
    }

    export interface IComponentRegistry {
        component(name: string, descriptor: IComponentDescriptor): IComponentRegistry;
        hasComponent(name: string): boolean;
        loadComponent(name: string, params?: Object): Rx.Observable<IComponent>;
    }

    export interface IExpressionFilterRegistry {
        filter(name: string, filter: IExpressionFilter): IExpressionFilterRegistry;
        filter(name: string): IExpressionFilter;
        filters(): { [filterName: string]: IExpressionFilter };
    }

    export interface IAnimationRegistry {
        animation(name: string, filter: IAnimation): IAnimationRegistry;
        animation(name: string): IAnimation;
    }

    export interface IModuleDescriptor {
        (module: IModule): void; // Configuration function
        require?: string;       // Async AMD loaded configuration function
        promise?: Rx.IPromise<string>;  // Async Promise configuration function
        resolve?: string;       // DI resolved configuration function
        instance?: any;         // pre-constructed instance
    }

    export interface IModule extends IComponentRegistry, IBindingRegistry, IExpressionFilterRegistry, IAnimationRegistry {
        name: string;
        merge(other: IModule): IModule;
    }

    /**
    * Represents an engine responsible for converting arbitrary text fragements into a collection of Dom Nodes
    * @interface 
    **/
    export interface ITemplateEngine {
        parse(templateSource: string): Node[];
    }

    export interface IWebRxApp extends IModule {
        defaultExceptionHandler: Rx.Observer<Error>;
        mainThreadScheduler: Rx.IScheduler;
        templateEngine: ITemplateEngine;
        history: IHistory;
        title: IObservableProperty<string>;
    }

    export interface IRoute {
        parse(url): Object;
        stringify(params?: Object): string;
        concat(route: IRoute): IRoute;
        isAbsolute: boolean;
        params: Array<string>;
    }

    export interface IViewAnimationDescriptor {
        enter?: string|IAnimation;
        leave?: string|IAnimation;
    }

    export interface IRouterStateConfig {
        name: string;
        url?: string|IRoute;   // relative or absolute
        views?: { [view: string]: string|{ component: string; params?: any; animations?: IViewAnimationDescriptor } };
        params?: any;
        onEnter?: (config: IRouterStateConfig, params?: any)=> void;
        onLeave?: (config: IRouterStateConfig, params?: any) => void;
        //reloadOnSearch?: boolean;
    }

    export interface IRouterState {
        name: string;
        url: string;
        params: any;
        views: { [view: string]: string|{ component: string; params?: any; animations?: IViewAnimationDescriptor } };
        onEnter?: (config: IRouterStateConfig, params?: any) => void;
        onLeave?: (config: IRouterStateConfig, params?: any) => void;
    }

    export interface IViewConfig {
        component: string;
        params?: any;
        animations?: IViewAnimationDescriptor;
    }

    export const enum RouterLocationChangeMode {
        add = 1,
        replace = 2
    }

    export interface IStateChangeOptions {
        /**
        * If true will update the url in the location bar, if false will not.
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
        * Transitions to the state inferred from the browser's current location
        * This method should be invoked once after registering application states.
        * @param {string} url If specified the router state will be synced to this value, otherwise to window.location.path 
        **/
        sync(url?:string): void;

        /**
        * Registers a state configuration under a given state name.
        * @param {IRouterStateConfig} config State configuration to register
        **/
        state(config: IRouterStateConfig): IRouter;

        /**
        * Represents the configuration object for the router's 
        **/
        current: IObservableProperty<IRouterState>;

        /**
        * Invoke this method to programatically alter or extend IRouter.current.params. 
        * Failure to modify params through this method will result in those modifications getting lost after state transitions. 
        **/
        updateCurrentStateParams(withParamsAction: (params: any)=> void): void;

        /**
        * Method for transitioning to a new state.
        * @param {string} to Absolute or relative destination state path. 'contact.detail' - will go to the 
        * contact.detail state. '^'  will go to a parent state. '^.sibling' - will go to a sibling state and
        * '.child.grandchild' will go to grandchild state
        * @param {Object} params A map of the parameters that will be sent to the state. 
        * Any parameters that are not specified will be inherited from currently defined parameters. 
        * @param {IStateChangeOptions} options Options controlling how the state transition will be performed
        **/
        go(to: string, params?: Object, options?: IStateChangeOptions): void;    // Rx.Observable<any>

        /**
        * An URL generation method that returns the URL for the given state populated with the given params.
        * @param {string} state Absolute or relative destination state path. 'contact.detail' - will go to the 
        * contact.detail state. '^'  will go to a parent state. '^.sibling' - will go to a sibling state and
        * '.child.grandchild' will go to grandchild state
        * @param {Object} params An object of parameter values to fill the state's required parameters.
        **/
        url(state: string, params?: {}): string;

        /**
        * A method that force reloads the current state. All resolves are re-resolved, events are not re-fired, 
        * and components reinstantiated.
        **/
        reload(): void;

        /**
        * Returns the state configuration object for any specific state.
        * @param {string} state Absolute state path.
        **/
        get(state: string): IRouterStateConfig;

        /**
        * Similar to IRouter.includes, but only checks for the full state name. If params is supplied then it will 
        * be tested for strict equality against the current active params object, so all params must match with none 
        * missing and no extras.
        * @param {string} state Absolute state path.
        **/
        is(state: string, params?: any, options?: any);

        /**
        * A method to determine if the current active state is equal to or is the child of the state stateName. 
        * If any params are passed then they will be tested for a match as well. Not all the parameters need 
        * to be passed, just the ones you'd like to test for equality.
        * @param {string} state Absolute state path.
        **/
        includes(state: string, params?: any, options?: any);

        /**
        * Resets internal state configuration to defaults (for unit-testing)
        **/
        reset(): void;

        /**
        * Returns the view-configuration for the specified view at the current state
        **/
        getViewComponent(viewName: string): IViewConfig;
    }


    /**
    * IMessageBus represents an object that can act as a "Message Bus", a
    * simple way for ViewModels and other objects to communicate with each
    * other in a loosely coupled way.
    * 
    * Specifying which messages go where is done via the contract parameter
    **/
    export interface IMessageBus {
        /**
        * Registers a scheduler for the type, which may be specified at
        * runtime, and the contract.
        * 
        * If a scheduler is already registered for the specified
        * runtime and contract, this will overrwrite the existing
        * registration.
        * 
        * @param {string} contract A unique string to distinguish messages with
        * identical types (i.e. "MyCoolViewModel")
        **/
        registerScheduler(scheduler: Rx.IScheduler, contract: string): void;

        /**
        * Listen provides an Observable that will fire whenever a Message is
        * provided for this object via RegisterMessageSource or SendMessage.
        * 
        * @param {string} contract A unique string to distinguish messages with
        * identical types (i.e. "MyCoolViewModel")
        **/
        listen<T>(contract: string): Rx.IObservable<T>;

        /**
        * Determines if a particular message Type is registered.
        * @param {string} The type of the message.
        * 
        * @param {string} contract A unique string to distinguish messages with
        * identical types (i.e. "MyCoolViewModel")
        * @return True if messages have been posted for this message Type.
        **/
        isRegistered(contract: string): boolean;

        /**
        * Registers an Observable representing the stream of messages to send.
        * Another part of the code can then call Listen to retrieve this
        * Observable.
        * 
        * @param {string} contract A unique string to distinguish messages with
        * identical types (i.e. "MyCoolViewModel")
        **/
        registerMessageSource<T>(source: Rx.Observable<T>, contract: string): Rx.IDisposable;

        /**
        * Sends a single message using the specified Type and contract.
        * Consider using RegisterMessageSource instead if you will be sending
        * messages in response to other changes such as property changes
        * or events.
        * 
        * @param {T} message The actual message to send
        * @param {string} contract A unique string to distinguish messages with
        * identical types (i.e. "MyCoolViewModel")
        **/
        sendMessage<T>(message: T, contract: string): void;
    }
}

// RxJS extensions

declare module Rx {
    export interface Observable<T> extends IObservable<T> {
        toProperty(initialValue?: T): wx.IObservableProperty<T>;

        continueWith(action: () => void): Observable<any>;
        continueWith<TResult>(action: (T) => TResult): Observable<TResult>;
        continueWith<TOther>(obs: Rx.Observable<TOther>): Observable<TOther>;
    }

    export interface ObservableStatic {
        startDeferred<T>(action:()=> T): Rx.Observable<T>;
    }

    // TODO: as of RxJs 2.5.2 this is missing in rx.all.d.ts
    export interface SchedulerStatic {
        isScheduler(o: any): boolean;
    }
}
