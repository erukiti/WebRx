///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Core/NodeChildsProxy.ts" />

module wx {
    export interface IForEachDirectiveOptions {
        data: any;
        hooks?: IForEachDirectiveHooks|string;
    }

    export interface IForEachDirectiveHooks {
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

    class ForEachDirective implements IDirective {
        constructor(domService: IDomService) {
            this.domService = domService;
        } 
 
        ////////////////////
        // IDirective

        public apply(node: Node, options: any, ctx: IDataContext, state: INodeState): void {
            if (node.nodeType !== 1)
                internal.throwError("forEach binding only operates on elements!");

            if (utils.isNull(options))
                internal.throwError("** invalid binding options!");

            var el = <HTMLElement> node;
            var self = this;
            var initialApply = true;
            var cleanup: Rx.CompositeDisposable = null;
            var hooks: IForEachDirectiveHooks|string;
            var exp: ICompiledExpression;
            var setProxyFunc: (NodeChildsProxy) => void;

            if (typeof options === "object" && options.hasOwnProperty("data")) {
                var opt = <IForEachDirectiveOptions> options;
                exp = opt.data;

                if (opt.hooks) {
                    // extract hooks
                    using(this.domService.expressionToObservable(<ICompiledExpression> opt.hooks, ctx).toProperty(), (prop) => {
                        hooks = prop();
                    });
                }

                if (opt['debug']) {
                    if (opt['debug']['setProxyFunc']) {
                        using(this.domService.expressionToObservable(<ICompiledExpression> opt['debug']['setProxyFunc'], ctx).toProperty(),(prop) => {
                            setProxyFunc = prop();
                        });
                    }
                }

                // optionally resolve hooks if passed as string identifier
                if (typeof hooks === "string")
                    hooks = injector.resolve<IForEachDirectiveHooks>(<string> hooks);
            } else {
                exp = options;
            }

            var obs = this.domService.expressionToObservable(exp, ctx);

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
                if (cleanup) {
                    cleanup.dispose();
                }

                cleanup = new Rx.CompositeDisposable();

                self.applyValue(el, x, hooks, template, ctx, initialApply, cleanup, setProxyFunc);
                initialApply = false;
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
        public descendants = true;

        ////////////////////
        // implementation

        protected domService: IDomService;

        protected createIndexObservableForNode(proxy: NodeChildsProxy, child: Node, startIndex: number,
            trigger: Rx.Observable<any>, indexes: IWeakMap<Node, Rx.Observable<any>>, templateLength: number): Rx.Observable<number> {
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
            .startWith(startIndex)
            .publish()
            .refCount();
        }

        protected appendAllRows(proxy: NodeChildsProxy, list: IObservableList<any>, ctx: IDataContext,
            template: Array<Node>, hooks: IForEachDirectiveHooks, indexes: IWeakMap<Node, Rx.Observable<any>>,
            indexTrigger: Rx.Subject<any>, isInitial: boolean) {
            var length = list.length;

            for (var i = 0; i < length; i++) {
                this.appendRow(proxy, i, list.get(i), ctx, template, hooks, indexes, indexTrigger, isInitial);
            }
        }

        protected appendRow(proxy: NodeChildsProxy, index: number, item: any, ctx: IDataContext, template: Array<Node>,
            hooks: IForEachDirectiveHooks, indexes: IWeakMap<Node, Rx.Observable<any>>,
            indexTrigger?: Rx.Subject<any>, isInitial?: boolean): void {

            var nodes = template.map(x => x.cloneNode(true));
            var _index = indexTrigger ? <any> this.createIndexObservableForNode(proxy, nodes[0], index, indexTrigger, indexes, template.length) : index;
            proxy.appendChilds(nodes, { index: _index, item: item });

            if (hooks) {
                if (hooks.afterRender)
                    hooks.afterRender(nodes, item);

                if (!isInitial && hooks.afterAdd)
                    hooks.afterAdd(nodes, item, index);
            }
        }

        protected insertRow(proxy: NodeChildsProxy, index: number, item: any, ctx: IDataContext,
            template: Array<Node>, hooks: IForEachDirectiveHooks, indexes: IWeakMap<Node, Rx.Observable<any>>,
            indexTrigger: Rx.Subject<any>): void {
            var templateLength = template.length;

            var nodes = template.map(x => x.cloneNode(true));
            var _index = this.createIndexObservableForNode(proxy, nodes[0], index, indexTrigger, indexes, template.length);
            proxy.insertChilds(index * templateLength, nodes, { index: _index, item: item });

            if (hooks) {
                if(hooks.afterRender)
                    hooks.afterRender(nodes, item);

                if (hooks.afterAdd)
                    hooks.afterAdd(nodes, item, index);
            }
        }

        protected removeRow(proxy: NodeChildsProxy, index: number, item: any,
            template: Array<Node>, hooks: IForEachDirectiveHooks): void {
            var templateLength = template.length;
            var el = <Element> proxy.targetNode;
            var nodes = proxy.removeChilds(index * templateLength, templateLength, true);

            if (hooks && hooks.beforeRemove) {
                hooks.beforeRemove(nodes, item, index);
            } else {
                for (var i = 0; i < templateLength; i++) {
                    el.removeChild(nodes[i]);
                }
            }
        }

        protected moveRow(proxy: NodeChildsProxy, from: number, to: number, item: any,
            template: Array<Node>, hooks: IForEachDirectiveHooks, indexes: IWeakMap<Node, Rx.Observable<any>>,
            indexTrigger: Rx.Subject<any>): void {
            var templateLength = template.length;
            var el = <Element> proxy.targetNode;
            var nodes = proxy.removeChilds(from * templateLength, templateLength, true);

            if (hooks && hooks.beforeMove) {
                hooks.beforeMove(nodes, item, from);
            }

            for (var i = 0; i < templateLength; i++) {
                el.removeChild(nodes[i]);
            }

            // create new row
            nodes = template.map(x => x.cloneNode(true));
            var _index = this.createIndexObservableForNode(proxy, nodes[0], from, indexTrigger, indexes, template.length);
            proxy.insertChilds(templateLength * to, nodes, { index: _index, item: item });
            
            if (hooks && hooks.afterMove) {
                hooks.afterMove(nodes, item, from);
            }
        }

        protected rebindRow(proxy: NodeChildsProxy, index: number, item: any, template: Array<Node>,
            indexes: IWeakMap<Node, Rx.Observable<any>>): void {
            var templateLength = template.length;
            var savedIndex;

            for (var i = 0; i < template.length; i++) {
                var node = proxy.childNodes[(index * templateLength) + i];

                if (node.nodeType === 1) {
                    // save the index before cleaning
                    var state = this.domService.getNodeState(node);
                    savedIndex = state ? state.properties.index : undefined;

                    this.domService.cleanNode(node);

                    // restore index before binding
                    state = this.domService.createNodeState(item);
                    state.properties.index = savedIndex;
                    this.domService.setNodeState(node, state);

                    this.domService.applyDirectives(item, node);
                }
            }
        }
        
        protected observeList(proxy: NodeChildsProxy, ctx: IDataContext, template: Array<Node>, cleanup: Rx.CompositeDisposable,
            list: IObservableList<any>, hooks: IForEachDirectiveHooks, indexes: IWeakMap<Node, Rx.Observable<any>>,
            indexTrigger: Rx.Subject<any>) {
            var i: number;
            var length: number;

            cleanup.add(indexTrigger);

            // initial insert
            this.appendAllRows(proxy, list, ctx, template, hooks, indexes, indexTrigger, true);

            // track changes
            cleanup.add(list.itemsAdded.subscribe((e) => {
                length = e.items.length;

                if (e.from === list.length) {
                    for (i = 0; i < length; i++) {
                        this.appendRow(proxy, i + e.from, e.items[i], ctx, template, hooks, indexes, indexTrigger, false);
                    }
                } else {
                    for (i = 0; i < e.items.length; i++) {
                        this.insertRow(proxy, i + e.from, e.items[i], ctx, template, hooks, indexes, indexTrigger);
                    }
                }

                indexTrigger.onNext(true);
            }));

            cleanup.add(list.itemsRemoved.subscribe((e) => {
                length = e.items.length;

                for (i = 0; i < length; i++) {
                    this.removeRow(proxy, i + e.from, e.items[i], template, hooks);
                }

                indexTrigger.onNext(true);
            }));

            cleanup.add(list.itemsMoved.subscribe((e) => {
                this.moveRow(proxy, e.from, e.to, e.items[0], template, hooks, indexes, indexTrigger);
 
                indexTrigger.onNext(true);
            }));

            cleanup.add(list.itemReplaced.subscribe((e) => {
                this.rebindRow(proxy, e.from, e.items[0], template, indexes);

                indexTrigger.onNext(true);
            }));

            cleanup.add(list.shouldReset.subscribe((e) => {
                proxy.clear();
                this.appendAllRows(proxy, list, ctx, template, hooks, indexes, indexTrigger, false);

                indexTrigger.onNext(true);
            }));
        }

        protected applyValue(el: HTMLElement, value: any, hooks: IForEachDirectiveHooks, template: Array<Node>,
            ctx: IDataContext, initialApply: boolean, cleanup: Rx.CompositeDisposable, setProxyFunc: (NodeChildsProxy) => void): void {
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

            var proxy: NodeChildsProxy;
            var indexes: IWeakMap<Node, Rx.Observable<any>>;
            var self = this;
            var recalcIndextrigger: Rx.Subject<any>;

            function nodeInsertCB(node: Node, callbackData?: any): void {
                var item: any = callbackData.item;
                var index: Rx.Observable<any> = callbackData.index;

                if (node.nodeType === 1) {
                    if (recalcIndextrigger) {
                        indexes.set(node, index);
                    }

                    // propagate index to state
                    var state = self.domService.createNodeState(item);
                    state.properties.index = index;
                    self.domService.setNodeState(node, state);

                    // done
                    self.domService.applyDirectives(item, node);
                }
            }

            function nodeRemoveCB(node: Node): void {
                if (node.nodeType === 1) {
                    self.domService.cleanNode(node);
                    indexes.delete(node);
                }
            }

            proxy = new NodeChildsProxy(el, false, nodeInsertCB, nodeRemoveCB);

            if (setProxyFunc)
                setProxyFunc(proxy);

            cleanup.add(Rx.Disposable.create(() => {
                indexes = null;
                proxy = null;
            }));

            if (Array.isArray(value)) {
                var arr = <Array<any>> value;

                // iterate once and be done with it
                length = arr.length;

                for (i = 0; i < length; i++) {
                    this.appendRow(proxy, i, arr[i], ctx, template, hooks, undefined, undefined, true);
                }
            } else if(utils.isList(value)) {
                var list = <IObservableList<any>> value;
                indexes = createWeakMap<Node, Rx.Observable<any>>();
                recalcIndextrigger = new Rx.Subject<any>();

                this.observeList(proxy, ctx, template, cleanup, list, hooks, indexes, recalcIndextrigger);
            } else {
                internal.throwError("forEach binding only operates on IObservableList or standard Javascript-Arrays");
            }
        }
    }

    export module internal {
        export var forEachDirectiveConstructor = <any> ForEachDirective;
    }
}