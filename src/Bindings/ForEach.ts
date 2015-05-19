/// <reference path="../Core/Utils.ts" />
/// <reference path="../Core/DomManager.ts" />
/// <reference path="../Core/VirtualChildNodes.ts" />
/// <reference path="../Core/RefCountDisposeWrapper.ts" />

module wx {
    "use strict";

    // Binding contributions to node-state
    interface IForEachNodeState extends INodeState {
        index?: any;
    }

    // Binding contributions to data-context
    interface IForEachDataContext extends IDataContext {
        $index: number;
    }

    export interface IForeachAnimationDescriptor {
        itemEnter?: string|IAnimation;
        itemLeave?: string|IAnimation;
    }

    export interface IForEachBindingOptions extends IForeachAnimationDescriptor {
        data: any;
        hooks?: IForEachBindingHooks|string;
    }

    export interface IForEachBindingHooks {
        /** 
        * Is invoked each time the foreach block is duplicated and inserted into the document, 
        * both when foreach first initializes, and when new entries are added to the associated 
        * array later
        **/
        afterRender?(nodes: Node[], data: any): void;

        /** 
        * Is like afterRender, except it is invoked only when new entries are added to your array 
        * (and not when foreach first iterates over your array’s initial contents).
        * A common use for afterAdd is to call a method such as jQuery’s $(domNode).fadeIn() 
        * so that you get animated transitions whenever items are added
        **/
        afterAdd? (nodes: Node[], data: any, index: number): void;

        /** 
        * Is invoked when an array item has been removed, but before the corresponding 
        * DOM nodes have been removed. If you specify a beforeRemove callback, then it 
        * becomes your responsibility to remove the DOM nodes. The obvious use case here 
        * is calling something like jQuery’s $(domNode).fadeOut() to animate the removal 
        * of the corresponding DOM nodes — in this case, WebRx cannot know how soon 
        * it is allowed to physically remove the DOM nodes (who knows how long your 
        * animation will take?)
        **/
        beforeRemove? (nodes: Node[], data: any, index: number): void;

        /** 
        * Is invoked when an array item has changed position in the array, but before 
        * the corresponding DOM nodes have been moved. You could use beforeMove 
        * to store the original screen coordinates of the affected elements so that you 
        * can animate their movements in the afterMove callback.
        **/
        beforeMove? (nodes: Node[], data: any, index: number): void;

        /** 
        * Is invoked after an array item has changed position in the array, and after 
        * foreach has updated the DOM to match.
        **/
        afterMove? (nodes: Node[], data: any, index: number): void;
    }

    class ForEachBinding implements IBindingHandler {
        constructor(domManager: IDomManager) {
            this.domManager = domManager;

            // hook into getDataContext() to map state['index'] to ctx['$index']
            domManager.registerDataContextExtension((node: Node, ctx: IForEachDataContext) => {
                var state = <IForEachNodeState> domManager.getNodeState(node);
                ctx.$index = state.index;
            });
        } 
 
        ////////////////////
        // IBinding

        public applyBinding(node: Node, options: string, ctx: IDataContext, state: INodeState, module: IModule): void {
            if (node.nodeType !== 1)
                internal.throwError("forEach binding only operates on elements!");

            if (options == null)
                internal.throwError("** invalid binding options!");

            var compiled = this.domManager.compileBindingOptions(options, module);

            var el = <HTMLElement> node;
            var self = this;
            var initialApply = true;
            var cleanup: Rx.CompositeDisposable = null;
            var hooks: IForEachBindingHooks|string;
            var exp: ICompiledExpression;
            var setProxyFunc: (VirtualChildNodes) => void;
            var animations: IForeachAnimationDescriptor = <IForeachAnimationDescriptor> {};

            if (typeof compiled === "object" && compiled.hasOwnProperty("data")) {
                var opt = <IForEachBindingOptions> compiled;
                exp = opt.data;

                // extract animations
                if (opt.itemEnter) {
                    animations.itemEnter = this.domManager.evaluateExpression(<ICompiledExpression> <any> opt.itemEnter, ctx);

                    if (typeof animations.itemEnter === "string") {
                        animations.itemEnter = module.animation(<string> animations.itemEnter);
                    }
                }

                if (opt.itemLeave) {
                    animations.itemLeave = this.domManager.evaluateExpression(<ICompiledExpression> <any> opt.itemLeave, ctx);

                    if (typeof animations.itemLeave === "string") {
                        animations.itemLeave = module.animation(<string> animations.itemLeave);
                    }
                }

                if (opt.hooks) {
                    // extract hooks
                    hooks = this.domManager.evaluateExpression(<ICompiledExpression> opt.hooks, ctx);
                }

                // optionally resolve hooks if passed as string identifier
                if (typeof hooks === "string")
                    hooks = injector.get<IForEachBindingHooks>(<string> hooks);

                if (opt['debug']) {
                    if (opt['debug']['setProxyFunc']) {
                        setProxyFunc = this.domManager.evaluateExpression(<ICompiledExpression> opt['debug']['setProxyFunc'], ctx);
                    }
                }
            } else {
                exp = compiled;
            }

            var obs = this.domManager.expressionToObservable(exp, ctx);

            // add own disposables
            state.cleanup.add(Rx.Disposable.create(() => {
                if (cleanup) {
                    cleanup.dispose();
                    cleanup = null;
                }
            }));

            // backup inner HTML
            var template = new Array<Node>();

            // subscribe
            state.cleanup.add(obs.subscribe(x => {
                try {
                    if (cleanup) {
                        cleanup.dispose();
                    }

                    cleanup = new Rx.CompositeDisposable();

                    self.applyValue(el, x, hooks, animations, template, ctx, initialApply, cleanup, setProxyFunc);
                    initialApply = false;
                } catch (e) {
                    wx.app.defaultExceptionHandler.onNext(e);
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
                obs = null;
                el = null;
                self = null;

                // nullify locals
                template = null;
                hooks = null;
            }));
        }

        public configure(options): void {
            // intentionally left blank
        }

        public priority = 40;
        public controlsDescendants = true;

        ////////////////////
        // implementation

        protected domManager: IDomManager;

        protected createIndexPropertyForNode(proxy: internal.VirtualChildNodes, child: Node, startIndex: number,
            trigger: Rx.Observable<any>, templateLength: number): IObservableProperty<number> {
                return Rx.Observable.defer(()=> {
                    return Rx.Observable.create<number>(obs => {
                        return trigger.subscribe(_ => {
                        // recalculate index from node position within parent
                        var index = proxy.childNodes.indexOf(child);
                        index /= templateLength;

                        obs.onNext(index);
                    });
                });
            })
            .toProperty(startIndex);
        }

        protected appendAllRows(proxy: internal.VirtualChildNodes, list: IObservableList<any>, ctx: IDataContext,
            template: Array<Node>, hooks: IForEachBindingHooks, animations: IForeachAnimationDescriptor,
            indexTrigger: Rx.Subject<any>, isInitial: boolean) {
            var length = list.length();

            for (var i = 0; i < length; i++) {
                this.appendRow(proxy, i, list.get(i), ctx, template, hooks, animations, indexTrigger, isInitial);
            }
        }

        protected appendRow(proxy: internal.VirtualChildNodes, index: number, item: any, ctx: IDataContext, template: Array<Node>,
            hooks: IForEachBindingHooks, animations: IForeachAnimationDescriptor, indexTrigger?: Rx.Subject<any>, isInitial?: boolean): void {
            var nodes = cloneNodeArray(template);
            var _index: any = index;
            var enterAnimation: IAnimation = <IAnimation> animations.itemEnter;

            var cbData = <any> {
                item: item
            }
            
            if (indexTrigger) {
                _index = this.createIndexPropertyForNode(proxy, nodes[0], index, indexTrigger, template.length);
                cbData.indexDisp = new RefCountDisposeWrapper(_index, 0);
            }

            cbData.index = _index;

            if (enterAnimation != null) 
                enterAnimation.prepare(nodes);

            proxy.appendChilds(nodes, cbData);

            if (hooks) {
                if (hooks.afterRender)
                    hooks.afterRender(nodes, item);

                if (!isInitial && hooks.afterAdd)
                    hooks.afterAdd(nodes, item, index);
            }

            if (enterAnimation) {
                var disp = enterAnimation.run(nodes)
                    .continueWith(() => enterAnimation.complete(nodes))
                    .subscribe(x => {
                        if (disp != null)
                            disp.dispose();
                    });
            }
        }

        protected insertRow(proxy: internal.VirtualChildNodes, index: number, item: any, ctx: IDataContext,
            template: Array<Node>, hooks: IForEachBindingHooks, animations: IForeachAnimationDescriptor,
            indexTrigger: Rx.Subject<any>): void {
            var templateLength = template.length;
            var enterAnimation: IAnimation = <IAnimation> animations.itemEnter;

            var nodes = cloneNodeArray(template);
            var _index = this.createIndexPropertyForNode(proxy, nodes[0], index, indexTrigger, template.length);

            if (enterAnimation != null)
                enterAnimation.prepare(nodes);

            proxy.insertChilds(index * templateLength, nodes, {
                index: _index,
                item: item,
                indexDisp: new RefCountDisposeWrapper(_index, 0)
            });

            if (hooks) {
                if(hooks.afterRender)
                    hooks.afterRender(nodes, item);

                if (hooks.afterAdd)
                    hooks.afterAdd(nodes, item, index);
            }

            if (enterAnimation) {
                var disp = enterAnimation.run(nodes)
                    .continueWith(() => enterAnimation.complete(nodes))
                    .subscribe(x => {
                    if (disp != null)
                        disp.dispose();
                });
            }
        }

        protected removeRow(proxy: internal.VirtualChildNodes, index: number, item: any, template: Array<Node>,
            hooks: IForEachBindingHooks, animations: IForeachAnimationDescriptor): void {
            var templateLength = template.length;
            var el = <Element> proxy.targetNode;
            var nodes = proxy.removeChilds(index * templateLength, templateLength, true);
            var leaveAnimation: IAnimation = <IAnimation> animations.itemLeave;

            function removeNodes() {
                for (var i = 0; i < templateLength; i++) {
                    el.removeChild(nodes[i]);
                }
            }

            if (hooks && hooks.beforeRemove) {
                hooks.beforeRemove(nodes, item, index);
            } else {
                if (leaveAnimation != null) {
                    leaveAnimation.prepare(nodes);

                    var disp = leaveAnimation.run(nodes)
                        .continueWith(() => leaveAnimation.complete(nodes))
                        .continueWith(removeNodes)
                        .subscribe(x => {
                            if (disp != null)
                                disp.dispose();
                        });

                } else {
                    removeNodes();
                }
            }
        }

        protected moveRow(proxy: internal.VirtualChildNodes, from: number, to: number, item: any, template: Array<Node>,
            hooks: IForEachBindingHooks, animations: IForeachAnimationDescriptor, indexTrigger: Rx.Subject<any>): void {
            var templateLength = template.length;
            var el = <Element> proxy.targetNode;
            var nodes = proxy.removeChilds(from * templateLength, templateLength, true);
            var leaveAnimation: IAnimation = <IAnimation> animations.itemLeave;
            var enterAnimation: IAnimation = <IAnimation> animations.itemEnter;
            var combined: Array<Rx.Observable<any>> = [];
            var obs: Rx.Observable<any>;
            var self = this;

            if (hooks && hooks.beforeMove) {
                hooks.beforeMove(nodes, item, from);
            }

            function removeNodes() {
                for (var i = 0; i < templateLength; i++) {
                    el.removeChild(nodes[i]);
                }
            }

            function createRow() {
                // create new row
                nodes = cloneNodeArray(template);
                var _index = self.createIndexPropertyForNode(proxy, nodes[0], from, indexTrigger, template.length);

                if (enterAnimation != null)
                    enterAnimation.prepare(nodes);

                proxy.insertChilds(templateLength * to, nodes, {
                    index: _index,
                    item: item,
                    indexDisp: new RefCountDisposeWrapper(_index, 0)
                });

                if (hooks && hooks.afterMove) {
                    hooks.afterMove(nodes, item, from);
                }
            }

            // construct leave-observable
            if (leaveAnimation) {
                leaveAnimation.prepare(nodes);

                obs = leaveAnimation.run(nodes)
                    .continueWith(() => leaveAnimation.complete(nodes))
                    .continueWith(removeNodes);
            } else {
                obs = Rx.Observable.startDeferred<any>(removeNodes);
            }

            combined.push(obs);

            // construct enter-observable
            obs = Rx.Observable.startDeferred<any>(createRow);

            if (enterAnimation) {
                obs = obs.continueWith(enterAnimation.run(nodes))
                    .continueWith(() => enterAnimation.complete(nodes));
            }

            combined.push(obs);

            // optimize return
            if (combined.length > 1)
                obs = Rx.Observable.combineLatest(combined, <any> noop).take(1);
            else if (combined.length === 1)
                obs = combined[0].take(1);

            var disp = obs.subscribe(x => {
                if (disp != null)
                    disp.dispose();
            });
        }

        protected rebindRow(proxy: internal.VirtualChildNodes, index: number, item: any, template: Array<Node>,
            indexTrigger: Rx.Subject<any>): void {
            var templateLength = template.length;
            var _index = this.createIndexPropertyForNode(proxy, proxy.childNodes[(index * templateLength)], index, indexTrigger, template.length);
            var indexDisp = new RefCountDisposeWrapper(_index, 0);

            for (var i = 0; i < template.length; i++) {
                var node = proxy.childNodes[(index * templateLength) + i];

                if (node.nodeType === 1) {
                    this.domManager.cleanNode(node);

                    var state = <IForEachNodeState> this.domManager.createNodeState(item);
                    state.index = _index;
                    indexDisp.addRef();
                    state.cleanup.add(indexDisp);
                    this.domManager.setNodeState(node, state);

                    this.domManager.applyBindings(item, node);
                }
            }
        }
        
        protected observeList(proxy: internal.VirtualChildNodes, ctx: IDataContext, template: Array<Node>,
            cleanup: Rx.CompositeDisposable, list: IObservableList<any>, hooks: IForEachBindingHooks,
            animations: IForeachAnimationDescriptor, indexTrigger: Rx.Subject<any>) {
            var i: number;
            var length: number;

            cleanup.add(indexTrigger);

            // initial insert
            this.appendAllRows(proxy, list, ctx, template, hooks, animations, indexTrigger, true);

            // track changes
            cleanup.add(list.itemsAdded.subscribe((e) => {
                length = e.items.length;

                if (e.from === list.length()) {
                    for (i = 0; i < length; i++) {
                        this.appendRow(proxy, i + e.from, e.items[i], ctx, template, hooks, animations, indexTrigger, false);
                    }
                } else {
                    for (i = 0; i < e.items.length; i++) {
                        this.insertRow(proxy, i + e.from, e.items[i], ctx, template, hooks, animations, indexTrigger);
                    }
                }

                indexTrigger.onNext(true);
            }));

            cleanup.add(list.itemsRemoved.subscribe((e) => {
                length = e.items.length;

                for (i = 0; i < length; i++) {
                    this.removeRow(proxy, i + e.from, e.items[i], template, hooks, animations);
                }

                indexTrigger.onNext(true);
            }));

            cleanup.add(list.itemsMoved.subscribe((e) => {
                this.moveRow(proxy, e.from, e.to, e.items[0], template, hooks, animations, indexTrigger);
 
                indexTrigger.onNext(true);
            }));

            cleanup.add(list.itemReplaced.subscribe((e) => {
                this.rebindRow(proxy, e.from, e.items[0], template, indexTrigger);

                indexTrigger.onNext(true);
            }));

            cleanup.add(list.shouldReset.subscribe((e) => {
                proxy.clear();
                this.appendAllRows(proxy, list, ctx, template, hooks, animations, indexTrigger, false);

                indexTrigger.onNext(true);
            }));
        }

        protected applyValue(el: HTMLElement, value: any, hooks: IForEachBindingHooks, animations: IForeachAnimationDescriptor,
            template: Array<Node>, ctx: IDataContext, initialApply: boolean, cleanup: Rx.CompositeDisposable,
            setProxyFunc: (VirtualChildNodes) => void): void {
            var i, length;
    
            if (initialApply) {
                // clone to template
                length = el.childNodes.length;

                for (i = 0; i < length; i++) {
                    template.push(el.childNodes[i].cloneNode(true));
                }
            }

            // perform initial clear
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }

            if (template.length === 0)
                return; // nothing to do

            var proxy: internal.VirtualChildNodes;
            var self = this;
            var recalcIndextrigger: Rx.Subject<any>;

            function nodeInsertCB(node: Node, callbackData?: any): void {
                var item: any = callbackData.item;
                var index: Rx.Observable<any> = callbackData.index;
                var indexDisp: RefCountDisposeWrapper = callbackData.indexDisp;

                if (node.nodeType === 1) {
                    // propagate index to state
                    var state = <IForEachNodeState> (self.domManager.getNodeState(node) || self.domManager.createNodeState());
                    state.model = item;
                    state.index = index;
                    self.domManager.setNodeState(node, state);

                    if (recalcIndextrigger != null && indexDisp != null) {
                        indexDisp.addRef();
                        state.cleanup.add(indexDisp);
                    }

                    self.domManager.applyBindings(item, node);
                }
            }

            function nodeRemoveCB(node: Node): void {
                if (node.nodeType === 1) {
                    self.domManager.cleanNode(node);
                }
            }

            proxy = new internal.VirtualChildNodes(el, false, nodeInsertCB, nodeRemoveCB);

            if (setProxyFunc)
                setProxyFunc(proxy);

            cleanup.add(Rx.Disposable.create(() => {
                proxy = null;
            }));

            if (Array.isArray(value)) {
                var arr = <Array<any>> value;

                // iterate once and be done with it
                length = arr.length;

                for (i = 0; i < length; i++) {
                    this.appendRow(proxy, i, arr[i], ctx, template, hooks, animations, undefined, true);
                }
            } else if(isList(value)) {
                var list = <IObservableList<any>> value;
                recalcIndextrigger = new Rx.Subject<any>();

                this.observeList(proxy, ctx, template, cleanup, list, hooks, animations, recalcIndextrigger);
            }
        }
    }

    export module internal {
        export var forEachBindingConstructor = <any> ForEachBinding;
    }
}