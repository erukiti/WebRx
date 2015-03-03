///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Interfaces.ts" />
/// <reference path="../Core/Resources.ts" />

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

            if (typeof options === "object" && options.hasOwnProperty("data")) {
                var opt = <IForEachDirectiveOptions> options;

                exp = opt.data;

                using(this.domService.expressionToObservable(<ICompiledExpression> opt.hooks, ctx).toProperty(),(prop) => {
                    hooks = prop();
                });

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

                self.applyValue(el, x, hooks, template, ctx, initialApply, cleanup);
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
        public terminal = true;

        ////////////////////
        // implementation

        protected domService: IDomService;

        protected createIndexObservableForNode(parent: HTMLElement, child: Node, startIndex: number, trigger: Rx.Observable<any>, templateLength: number): Rx.Observable<number> {
            return Rx.Observable.create<number>(obs => {
                return trigger.subscribe(x => {
                    // recalculate index from node position within parent
                    var index = Array.prototype.indexOf.call(parent.childNodes, child);
                    index /= templateLength;

                    obs.onNext(index);
                });
            }).startWith(startIndex);
        }

        protected clear(el: HTMLElement, hooks: IForEachDirectiveHooks, indexes?: IWeakMap<Node, Rx.Observable<any>>) {
            var node: Node;

            while (el.firstChild) {
                node = el.firstChild;

                if (node.nodeType === 1) {
                    this.domService.cleanNode(node);

                    if (indexes)
                        indexes.delete(node);
                }

                el.removeChild(node);
            }            
        }

        protected appendAll(el: HTMLElement, list: IObservableList<any>, ctx: IDataContext,
            template: Array<Node>, hooks: IForEachDirectiveHooks, isInitial: boolean,
            indexes: IWeakMap<Node, Rx.Observable<any>>, recalcIndextrigger: Rx.Subject<any>) {
            var length = list.length;

            for (var i = 0; i < length; i++) {
                this.appendRow(el, i, list.get(i), ctx, template, hooks, isInitial, recalcIndextrigger, indexes);
            }
        }

        protected appendRow(el: HTMLElement, index: number, item: any, ctx: IDataContext, template: Array<Node>,
            hooks: IForEachDirectiveHooks, isInitial?: boolean, recalcIndextrigger?: Rx.Subject<any>,
            indexes?: IWeakMap<Node, Rx.Observable<any>>): void {
            var _index: any = undefined;
            var created = false;
            var templateLength = template.length;
            var node: Node;
            var added = [];            

            for (var i = 0; i < templateLength; i++) {
                node = template[i].cloneNode(true);

                el.appendChild(node);

                if (hooks)
                    added.push(node);

                if (node.nodeType === 1) {
                    if (recalcIndextrigger && !created) {
                        // create index observable
                        _index = indexes.get(node);

                        if (!_index) {
                            _index = this.createIndexObservableForNode(el, node, index, recalcIndextrigger, templateLength);
                            indexes.set(node, _index);
                            created = true;
                        }
                    }

                    // propagate index to state
                    var state = this.domService.createNodeState(item);
                    state.properties.index = _index || index;
                    this.domService.setNodeState(node, state);

                    // done
                    this.domService.applyDirectives(item, node);
                }
            }

            if (hooks) {
                if (hooks.afterRender)
                    hooks.afterRender(added, item);

                if (!isInitial && hooks.afterAdd)
                    hooks.afterAdd(added, item, index);
            }
        }

        protected insertRow(el: HTMLElement, index: number, item: any, ctx: IDataContext, template: Array<Node>,
            hooks: IForEachDirectiveHooks, recalcIndextrigger?: Rx.Subject<any>, indexes?: IWeakMap<Node, Rx.Observable<any>>): void {
            var _index: any = undefined;
            var created = false;
            var templateLength = template.length;
            var node: Node;
            var refNode = <Node> el.children[templateLength * index];
            var added = [];

            for (var i = 0; i < templateLength; i++) {
                node = template[i].cloneNode(true);

                el.insertBefore(node, refNode);

                if (hooks)
                    added.push(node);

                if (node.nodeType === 1) {
                    if (recalcIndextrigger && !created) {
                        // create index observable
                        _index = indexes.get(node);

                        if (!_index) {
                            _index = this.createIndexObservableForNode(el, node, index, recalcIndextrigger, templateLength);
                            indexes.set(node, _index);
                            created = true;
                        }
                    }

                    // propagate index to state
                    var state = this.domService.createNodeState(item);
                    state.properties.index = _index || index;
                    this.domService.setNodeState(node, state);

                    // done
                    this.domService.applyDirectives(item, node);
                }
            }

            if (hooks) {
                if(hooks.afterRender)
                    hooks.afterRender(added, item);

                if (hooks.afterAdd)
                    hooks.afterAdd(added, item, index);
            }
        }

        protected removeRow(el: HTMLElement, index: number, item: any, template: Array<Node>, hooks: IForEachDirectiveHooks,
            recalcIndextrigger: Rx.Subject<any>, indexes: IWeakMap<Node, Rx.Observable<any>>): void {
            var templateLength = template.length;
            var nodexIndex = index * templateLength;
            var toBeRemoved = [];

            for (var i = 0; i < templateLength; i++) {
                var node = el.childNodes[nodexIndex + i];

                if (node.nodeType === 1) {
                    this.domService.cleanNode(node);
                    indexes.delete(node);
                }

                toBeRemoved.push(node);
            }

            if (hooks && hooks.beforeRemove) {
                hooks.beforeRemove(toBeRemoved, item, index);
            } else {
                for (i = 0; i < toBeRemoved.length; i++) {
                    el.removeChild(toBeRemoved[i]);
                }
            }
        }

        protected moveRow(el: HTMLElement, from: number, to: number, item: any, template: Array<Node>, hooks: IForEachDirectiveHooks,
            recalcIndextrigger: Rx.Subject<any>, indexes: IWeakMap<Node, Rx.Observable<any>>): void {
            var templateLength = template.length;
            var nodexIndex = from * templateLength;
            var nodes = [];

            for (var i = 0; i < templateLength; i++) {
                var node = el.childNodes[nodexIndex + i];

                if (node.nodeType === 1) {
                    this.domService.cleanNode(node);
                    indexes.delete(node);
                }

                nodes.push(node);
            }

            if (hooks && hooks.beforeMove) {
                hooks.beforeMove(nodes, item, from);
            }

            for (i = 0; i < nodes.length; i++) {
                el.removeChild(nodes[i]);
            }

            var refNode = <Node> el.children[templateLength * to];
            var _index: any = undefined;
            var created = false;

            for (i = 0; i < templateLength; i++) {
                node = template[i].cloneNode(true);

                el.insertBefore(node, refNode);

                if (hooks)
                    nodes.push(node);

                if (node.nodeType === 1) {
                    if (recalcIndextrigger && !created) {
                        // create index observable
                        _index = indexes.get(node);

                        if (!_index) {
                            _index = this.createIndexObservableForNode(el, node, to, recalcIndextrigger, templateLength);
                            indexes.set(node, _index);
                            created = true;
                        }
                    }

                    // propagate index to state
                    var state = this.domService.createNodeState(item);
                    state.properties.index = _index || to;
                    this.domService.setNodeState(node, state);

                    // done
                    this.domService.applyDirectives(item, node);
                }
            }

            if (hooks && hooks.afterMove) {
                hooks.afterMove(nodes, item, from);
            }
        }

        protected rebindRow(el: HTMLElement, index: number, item: any, template: Array<Node>): void {
            var templateLength = template.length;
            var savedIndex;

            for (var i = 0; i < template.length; i++) {
                var node = el.childNodes[(index * templateLength) + i];

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
        
        protected monitorList(el: HTMLElement, ctx: IDataContext, template: Array<Node>, cleanup: Rx.CompositeDisposable,
            list: IObservableList<any>, hooks: IForEachDirectiveHooks) {
            var i: number;
            var length: number;

            // setup index management
            var indexes = weakmap<Node, Rx.Observable<any>>();
            cleanup.add(Rx.Disposable.create(() => indexes = null));
            var indexTrigger = new Rx.Subject<any>();
            cleanup.add(indexTrigger);

            // initial insert
            this.appendAll(el, list, ctx, template, hooks, true, indexes, indexTrigger);

            // track changes
            cleanup.add(list.itemsAdded.subscribe((e) => {
                length = e.items.length;

                if (e.from === list.length) {
                    for (i = 0; i < length; i++) {
                        this.appendRow(el, i + e.from, e.items[i], ctx, template, hooks, false, indexTrigger, indexes);
                    }
                } else {
                    for (i = 0; i < e.items.length; i++) {
                        this.insertRow(el, i + e.from, e.items[i], ctx, template, hooks, indexTrigger, indexes);
                    }
                }

                indexTrigger.onNext(true);
            }));

            cleanup.add(list.itemsRemoved.subscribe((e) => {
                length = e.items.length;

                for (i = 0; i < length; i++) {
                    this.removeRow(el, i + e.from, e.items[i], template, hooks, indexTrigger, indexes);
                }

                indexTrigger.onNext(true);
            }));

            cleanup.add(list.itemsMoved.subscribe((e) => {
                this.moveRow(el, e.from, e.to, e.items[0], template, hooks, indexTrigger, indexes);
 
                indexTrigger.onNext(true);
            }));

            cleanup.add(list.itemReplaced.subscribe((e) => {
                this.rebindRow(el, e.from, e.items[0], template);

                indexTrigger.onNext(true);
            }));

            cleanup.add(list.shouldReset.subscribe((e) => {
                this.clear(el, hooks, indexes);
                this.appendAll(el, list, ctx, template, hooks, false, indexes, indexTrigger);

                indexTrigger.onNext(true);
            }));
        }

        protected applyValue(el: HTMLElement, value: any, hooks: IForEachDirectiveHooks, template: Array<Node>,
            ctx: IDataContext, initialApply: boolean, cleanup: Rx.CompositeDisposable): void {
            var i, length;

            if (initialApply) {
                // clone to template
                length = el.childNodes.length;

                for (i = 0; i < length; i++) {
                    template.push(el.childNodes[i].cloneNode(true));
                }
            }

            this.clear(el, hooks);

            if (Array.isArray(value)) {
                var arr = <Array<any>> value;

                // iterate once and be done with it
                length = arr.length;

                for (i = 0; i < length; i++) {
                    this.appendRow(el, i, arr[i], ctx, template, hooks);
                }
            } else if(utils.isList(value)) {
                var list = <IObservableList<any>> value;

                this.monitorList(el, ctx, template, cleanup, list, hooks);
            } else {
                internal.throwError("forEach binding only operates on IObservableList or standard Javascript-Arrays");
            }
        }
    }

    export module internal {
        export var forEachDirectiveConstructor = <any> ForEachDirective;
    }
}