///<reference path="../node_modules/rx/ts/rx.all.d.ts" />

/**
* This interface is implemented by WebRx objects which are given
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
* Represents an engine responsible for converting arbitrary text fragements into a collection of Dom Nodes
* @interface 
**/
export interface ITemplateEngine {
    parse(templateSource: string): Node[];
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
    module?: IModule;
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

export interface IViewAnimationDescriptor {
    enter?: string|IAnimation;
    leave?: string|IAnimation;
}

export interface IComponent {
    template: Node[];
    viewModel?: any;

    preBindingInit?: string;   // name of method on view-model to invoke before bindings get applied
    postBindingInit?: string;  // name of method on view-model to invoke after binding have been applied
}

export interface IExpressionFilter {
    (...args: Array<any>): any;
}

export interface IAnimation {
    prepare(element: Node|Array<Node>|HTMLElement|Array<HTMLElement>|NodeList, params?: any): void;
    run(element: Node|Array<Node>|HTMLElement|Array<HTMLElement>|NodeList, params?: any): Rx.Observable<any>;
    complete(element: Node|Array<Node>|HTMLElement|Array<HTMLElement>|NodeList, params?: any): void;
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
