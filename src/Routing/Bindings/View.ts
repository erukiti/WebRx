/// <reference path="../../../node_modules/rx/ts/rx.all.d.ts" />

import { IObservableProperty, IBindingHandler, IDataContext, INodeState, IModule, IAnimation, IViewAnimationDescriptor, 
    IWebRxApp, IRouter, IViewConfig, IDomManager, ICompiledExpression  } from "../../Interfaces"
import { extend, isInUnitTest, args2Array, isFunction, isCommand, isRxObservable, isDisposable, 
    throwError, formatString, unwrapProperty, isProperty, cloneNodeArray, isList, isEqual, noop, nodeChildrenToArray } from "../../Core/Utils"
import * as log from "../../Core/Log"
import { animation } from "../../Core/Animation"

"use strict";

// Binding contributions to data-context
interface IViewDataContext extends IDataContext {
    $componentParams?: Object;
}

export default class ViewBinding implements IBindingHandler {
    constructor(domManager: IDomManager, router: IRouter, app: IWebRxApp) {
        this.domManager = domManager;
        this.router = router;
        this.app = app;
    } 

    ////////////////////
    // IBinding

    public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void {
        if (node.nodeType !== 1)
            throwError("view-binding only operates on elements!");

        if (options == null)
            throwError("invalid binding-options!");

        let el = <HTMLElement> node;
        let compiled = this.domManager.compileBindingOptions(options, module);
        let viewName = this.domManager.evaluateExpression(compiled, ctx);
        let currentConfig: IViewConfig;
        let cleanup: Rx.CompositeDisposable;

        function doCleanup() {
            if (cleanup) {
                cleanup.dispose();
                cleanup = null;
            }
        }

        if (viewName == null || typeof viewName !== "string")
            throwError("views must be named!");

        // subscribe to router-state changes
        state.cleanup.add(this.router.current.changed.startWith(this.router.current()).subscribe(newState => {
            try {
                doCleanup();
                cleanup = new Rx.CompositeDisposable();

                let config = this.router.getViewComponent(viewName);

                if (config != null) {
                    if (!isEqual(currentConfig, config)) {
                        cleanup.add(this.applyTemplate(config.component, config.params, config.animations, el, ctx, module));

                        currentConfig = config;
                    }
                } else {
                    cleanup.add(this.applyTemplate(null, null, currentConfig ? currentConfig.animations: {}, el, ctx, module));

                    currentConfig = <any> {};
                }
            } catch (e) {
                this.app.defaultExceptionHandler.onNext(e);
            } 
        }));

        // release closure references to GC 
        state.cleanup.add(Rx.Disposable.create(() => {
            // nullify args
            node = null;
            options = null;
            ctx = null;
            state = null;

            // nullify common locals
        }));
    }

    public configure(options): void {
        // intentionally left blank
    }

    public priority = 1000;
    public controlsDescendants = true;

    ////////////////////
    // Implementation

    protected domManager: IDomManager;
    protected app: IWebRxApp;
    protected router: IRouter;

    protected applyTemplate(componentName: string, componentParams: Object,
        animations: IViewAnimationDescriptor, el: HTMLElement, ctx: IDataContext, module: IModule): Rx.IDisposable {
        let self = this;
        let oldElements = nodeChildrenToArray<Node>(el);
        let combined: Array<Rx.Observable<any>> = [];
        let obs: Rx.Observable<any>;

        function removeOldElements() {
            oldElements.forEach(x => {
                self.domManager.cleanNode(x);
                el.removeChild(x);
            });
        }

        function instantiateComponent(animation: IAnimation) {
            // extend the data-context
            (<IViewDataContext> ctx).$componentParams = componentParams;

            // create component container element
            let container = <HTMLElement> document.createElement("div");
            let binding = formatString("component: { name: '{0}', params: $componentParams }", componentName);
            container.setAttribute("data-bind", binding);

            // prepare container for animation
            if (animation != null)
                animation.prepare(container);

            // now insert it
            el.appendChild(container);

            // and apply bindings
            self.domManager.applyBindings(ctx, container);
        }

        // construct leave-observable
        if (oldElements.length > 0) {
            let leaveAnimation: IAnimation;

            if (animations && animations.leave) {
                if (typeof animations.leave === "string") {
                    leaveAnimation = module.animation(<string> animations.leave);
                } else {
                    leaveAnimation = <IAnimation> animations.leave;
                }
            }

            if (leaveAnimation) {
                leaveAnimation.prepare(oldElements);

                obs = leaveAnimation.run(oldElements)
                    .continueWith(() => leaveAnimation.complete(oldElements))
                    .continueWith(removeOldElements);
            } else {
                obs = Rx.Observable.startDeferred<any>(removeOldElements);
            }

            combined.push(obs);
        }

        // construct enter-observable
        if (componentName != null) {
            let enterAnimation: IAnimation;

            if (animations && animations.enter) {
                if (typeof animations.enter === "string") {
                    enterAnimation = module.animation(<string> animations.enter);
                } else {
                    enterAnimation = <IAnimation> animations.enter;
                }
            }

            obs = Rx.Observable.startDeferred<any>(() => instantiateComponent(enterAnimation));

            if (enterAnimation) {
                obs = obs.continueWith(enterAnimation.run(el.childNodes))
                    .continueWith(() => enterAnimation.complete(el.childNodes));
            }

            combined.push(obs);
        }

        // optimize return
        if (combined.length > 1)
            obs = Rx.Observable.combineLatest(combined, <any> noop).take(1);
        else if (combined.length === 1)
            obs = combined[0].take(1);
        else
            obs = null;

        // no-op return
        return obs ? (obs.subscribe() || Rx.Disposable.empty) : Rx.Disposable.empty;
    }
}
