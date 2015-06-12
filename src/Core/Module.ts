/// <reference path="../Interfaces.ts" />

import IID from "../IID"
import { injector } from "./Injector"
import { extend, observableRequire, isInUnitTest, args2Array, isFunction, throwError, using, isRxObservable, isPromise } from "../Core/Utils"
import * as res from "./Resources"
import * as log from "./Log"
import { property } from "./Property"

"use strict";

// extend descriptor
interface IComponentDescriptorEx extends wx.IComponentDescriptor {
    instance: any;
}

export class Module implements wx.IModule {
    constructor(name: string) {
        this.name = name;
    }

    //////////////////////////////////
    // wx.IModule

    public merge(other: wx.IModule): wx.IModule {
        let _other = <Module> other;

        extend(_other.components, this.components);
        extend(_other.bindings, this.bindings);
        extend(_other.expressionFilters, this.expressionFilters);
        extend(_other.animations, this.animations);

        return this;
    }

    public component(name: string, component: wx.IComponentDescriptor): wx.IComponentRegistry {
        this.components[name] = <IComponentDescriptorEx> component;
        return this;
    }

    public hasComponent(name: string): boolean {
        return this.components[name] != null;
    }

    public loadComponent(name: string, params?: Object): Rx.Observable<wx.IComponent> {
        return this.initializeComponent(this.instantiateComponent(name), params);
    }

    public binding(name: string, handler: wx.IBindingHandler): wx.IBindingRegistry;
    public binding(name: string, handler: string): wx.IBindingRegistry;
    public binding(names: string[], handler: wx.IBindingHandler): wx.IBindingRegistry;
    public binding(names: string[], handler: string): wx.IBindingRegistry;
    public binding(name: string): wx.IBindingHandler;
    public binding() {
        let args = args2Array(arguments);
        let name = args.shift();
        let handler: wx.IBindingHandler;

        // lookup?
        if (args.length === 0) {
            // if the handler has been registered as resource, resolve it now and update registry
            handler = this.bindings[name];

            if (typeof handler === "string") {
                handler = injector.get<wx.IBindingHandler>(<any> handler);
                this.bindings[name] = handler;
            }

            return handler;
        }

        // registration
        handler = args.shift();

        if (Array.isArray(name)) {
            name.forEach(x => this.bindings[x] = handler);
        } else {
            this.bindings[name] = handler;
        }

        return <any> this;
    }

    public filter(name: string, filter: wx.IExpressionFilter): wx.IExpressionFilterRegistry;
    public filter(name: string): wx.IExpressionFilter;
    public filter() {
        let args = args2Array(arguments);
        let name = args.shift();
        let filter: wx.IExpressionFilter;

        // lookup?
        if (args.length === 0) {
            // if the filter has been registered as resource, resolve it now and update registry
            filter = this.expressionFilters[name];

            if (typeof filter === "string") {
                filter = injector.get<wx.IExpressionFilter>(<any> filter);
                this.bindings[name] = filter;
            }

            return filter;
        }

        // registration
        filter = args.shift();
        this.expressionFilters[name] = filter;

        return <any> this;
    }

    public filters(): { [index: string]: wx.IExpressionFilter; } {
        return this.expressionFilters;
    }

    public animation(name: string, animation: wx.IAnimation): wx.IAnimationRegistry;
    public animation(name: string): wx.IAnimation;
    public animation() {
        let args = args2Array(arguments);
        let name = args.shift();
        let animation: wx.IAnimation;

        // lookup?
        if (args.length === 0) {
            // if the animation has been registered as resource, resolve it now and update registry
            animation = this.animations[name];

            if (typeof animation === "string") {
                animation = injector.get<wx.IAnimation>(<any> animation);
                this.bindings[name] = animation;
            }

            return animation;
        }

        // registration
        animation = args.shift();
        this.animations[name] = animation;

        return <any> this;
    }

    public name: string;
    private get app(): wx.IWebRxApp {
        return injector.get<wx.IWebRxApp>(res.app);
    }

    //////////////////////////////////
    // Implementation

    private bindings: { [name: string]: any } = {};
    private components: { [name: string]: IComponentDescriptorEx|Rx.Observable<wx.IComponentDescriptor>|Rx.IPromise<wx.IComponentDescriptor> } = {};
    private expressionFilters: { [index: string]: wx.IExpressionFilter; } = {};
    private animations: { [index: string]: wx.IAnimation; } = {};

    private instantiateComponent(name: string): Rx.Observable<wx.IComponentDescriptor> {
        let _cd = this.components[name];
        let result: Rx.Observable<wx.IComponentDescriptor> = undefined;

        if (_cd != null) {
            if(isRxObservable(_cd))
                result = <Rx.Observable<IComponentDescriptorEx>> <any> _cd;
            else if(isPromise(_cd))
                return Rx.Observable.fromPromise(<Rx.IPromise<any>> <any> _cd);
            else {
                // if the component has been registered as resource, resolve it now and update registry
                let cd = <IComponentDescriptorEx> _cd;
    
                if (cd.instance) {
                    result = Rx.Observable.return<wx.IComponentDescriptor>(cd.instance);
                } else if (cd.template) {
                    result = Rx.Observable.return<wx.IComponentDescriptor>(cd);
                } else if (cd.resolve) {
                    let resolved = injector.get<wx.IComponentDescriptor>(cd.resolve);
                    result = Rx.Observable.return<wx.IComponentDescriptor>(resolved);
                } else if (cd.require) {
                    result = observableRequire<wx.IComponentDescriptor>(cd.require);
                }
            }
        } else {
            result = Rx.Observable.return<wx.IComponentDescriptor>(undefined);
        }

        return result.do(x => this.components[name] = { instance: x }); // cache descriptor
    }

    private initializeComponent(obs: Rx.Observable<wx.IComponentDescriptor>, params?: Object): Rx.Observable<wx.IComponent> {
        return obs.take(1).selectMany(component => {
                if (component == null) {
                    return Rx.Observable.return<wx.IComponent>(undefined);
                }

                return Rx.Observable.combineLatest(
                    this.loadComponentTemplate(component.template, params),
                    component.viewModel ? this.loadComponentViewModel(component.viewModel, params) : Rx.Observable.return<any>(undefined),
                    (t, vm) => {
                        // if view-model factory yields a function, use it as constructor
                        if (isFunction(vm)) {
                            vm = new vm(params);
                        }

                        return <wx.IComponent> {
                            template: t,
                            viewModel: vm,
                            preBindingInit: component.preBindingInit,
                            postBindingInit: component.postBindingInit
                        }
                    });
            })
            .take(1);
    }

    protected loadComponentTemplate(template: any, params: Object): Rx.Observable<Node[]> {
        let syncResult: Node[];
        let el: Element;

        if (isFunction(template)) {
            syncResult = template(params);
            
            if(isRxObservable(template))
                return template;

            if (typeof syncResult === "string") {
                syncResult = this.app.templateEngine.parse(<string> template(params));
            }

            return Rx.Observable.return(syncResult);
        } else if (typeof template === "string") {
            syncResult = this.app.templateEngine.parse(<string> template);
            return Rx.Observable.return(syncResult);
        } else if (Array.isArray(template)) {
            return Rx.Observable.return(<Node[]> template);
        } else if (typeof template === "object") {
            let options = <wx.IComponentTemplateDescriptor> template;

            if (options.resolve) {
                syncResult = injector.get<Node[]>(options.resolve);
                return Rx.Observable.return(syncResult);
            } else if (options.promise) {
                let promise = <Rx.IPromise<Node[]>> <any> options.promise;
                return Rx.Observable.fromPromise(promise);
            } else if (options.observable) {
                return options.observable;
            } else if (options.require) {
                return observableRequire<string>(options.require).select(x => this.app.templateEngine.parse(x));
            } else if (options.select) {
                // try both getElementById & querySelector
                el = document.getElementById(<string> options.select) ||
                    document.querySelector(<string> options.select);

                if (el != null) {
                    // only the nodes inside the specified element will be cloned for use as the component’s template
                    syncResult = this.app.templateEngine.parse((<HTMLElement> el).innerHTML);
                } else {
                    syncResult = [];
                }

                return Rx.Observable.return(syncResult);
            }
        }

        throwError("invalid template descriptor");
    }

    protected loadComponentViewModel(vm: any, componentParams: Object): Rx.Observable<any> {
        let syncResult: any;

        if (isFunction(vm)) {
            return Rx.Observable.return(vm);
        } else if (Array.isArray(vm)) {
            // assumed to be inline-annotated-array
            syncResult = injector.resolve<any>(vm, componentParams);
            return Rx.Observable.return(syncResult);
        } else if (typeof vm === "object") {
            let options = <wx.IComponentViewModelDescriptor> vm;

            if (options.resolve) {
                syncResult = injector.get<any>(options.resolve, componentParams);
                return Rx.Observable.return(syncResult);
            } else if (options.observable) {
                return options.observable;
            } else if (options.promise) {
                let promise = <Rx.IPromise<any>> <any> options.promise;
                return Rx.Observable.fromPromise(promise);
            } else if (options.require) {
                return observableRequire(options.require);
            } else if (options.instance) {
                return Rx.Observable.return(options.instance);
            }
        }

        throwError("invalid view-model descriptor");
    }
}

export var modules: { [name: string]: Array<any>|wx.IModuleDescriptor } = { };

/**
* Defines a module.
* @param {string} name The module name
* @return {wx.IModule} The module handle
*/
export function module(name: string, descriptor: Array<any>|wx.IModuleDescriptor) {
    modules[name] = <wx.IModuleDescriptor> descriptor;
    return this;
}

/**
* Instantiate a new module instance and configure it using the user supplied configuration
* @param {string} name The module name
* @return {wx.IModule} The module handle
*/
export function loadModule(name: string): Rx.Observable<wx.IModule> {
    let md: Array<any>|wx.IModuleDescriptor = modules[name];
    let result: Rx.Observable<wx.IModule> = undefined;
    let module: wx.IModule;

    if (md != null) {
        if (Array.isArray(md)) {
            // assumed to be inline-annotated-array
            // resolve the configuration function via DI and invoke it with the module instance as argument
            module = new Module(name);
            injector.resolve<wx.IModule>(<Array<any>> md, module);
            result = Rx.Observable.return(module);
        } else if (isFunction(md)) {
            // configuration function
            module = new Module(name);
            (<any> md)(module);
            result = Rx.Observable.return(module);
        } else {
            let mdd = <wx.IModuleDescriptor> md;

            if (mdd.instance) {
                result = Rx.Observable.return<wx.IModule>(mdd.instance);
            } else {
                module = new Module(name);

                if (mdd.resolve) {
                    // resolve the configuration function via DI and invoke it with the module instance as argument
                    injector.get<wx.IModule>(mdd.resolve, module);
                    result = Rx.Observable.return<wx.IModule>(module);
                } else if (mdd.require) {
                    // load the configuration function from external module and invoke it with the module instance as argument
                    result = observableRequire<{ (any): any }>(mdd.require)
                        .do(x => x(module)) // configure the module
                        .select(x => module);
                }
            }
        }
    } else {
        result = Rx.Observable.return<wx.IModule>(undefined);
    }

    return result.take(1).do(x => modules[name] = <wx.IModuleDescriptor> <any> { instance: x }); // cache instantiated module
}
