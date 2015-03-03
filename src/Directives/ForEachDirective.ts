///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Interfaces.ts" />
/// <reference path="../Core/Resources.ts" />

module wx {
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
            var exp = <ICompiledExpression> options;
            var obs = this.domService.expressionToObservable(exp, ctx);
            var cleanup: Rx.CompositeDisposable = null;

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

                self.applyValue(el, x, template, ctx, initialApply, cleanup);
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

        protected  clear(el: HTMLElement, indexes?: IWeakMap<Node, Rx.Observable<any>>) {
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
            template: Array<Node>, indexes: IWeakMap<Node, Rx.Observable<any>>, recalcIndextrigger: Rx.Observable<any>) {
            var length = list.length;

            for (var i = 0; i < length; i++) {
                this.appendRow(el, i, list.get(i), ctx, template, recalcIndextrigger, indexes);
            }
        }

        protected appendRow(el: HTMLElement, index: number, item: any, ctx: IDataContext, template: Array<Node>,
            recalcIndextrigger?: Rx.Observable<any>, indexes?: IWeakMap<Node, Rx.Observable<any>>): void {
            var _index: any = undefined;
            var created = false;
            var templateLength = template.length;
            var node: Node;            

            for (var i = 0; i < templateLength; i++) {
                node = template[i].cloneNode(true);
                el.appendChild(node);

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
        }

        protected insertRow(el: HTMLElement, index: number, item: any, ctx: IDataContext, template: Array<Node>,
            recalcIndextrigger?: Rx.Observable<any>, indexes?: IWeakMap<Node, Rx.Observable<any>>): void {
            var _index: any = undefined;
            var created = false;
            var templateLength = template.length;
            var node: Node;
            var refNode = <Node> el.children[templateLength * index];

            for (var i = 0; i < templateLength; i++) {
                node = template[i].cloneNode(true);
                el.insertBefore(node, refNode);

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
        }

        protected removeRow(el: HTMLElement, index: number, template: Array<Node>, indexes: IWeakMap<Node, Rx.Observable<any>>): void {
            var templateLength = template.length;
            var nodexIndex = index * templateLength;

            for (var i = 0; i < templateLength; i++) {
                var node = el.childNodes[nodexIndex];

                if (node.nodeType === 1) {
                    this.domService.cleanNode(node);
                    indexes.delete(node);
                }

                el.removeChild(node);
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
        
        protected monitorList(el: HTMLElement, ctx: IDataContext, template: Array<Node>, cleanup: Rx.CompositeDisposable, list: IObservableList<any>) {
            var i: number;
            var length: number;

            // setup index management
            var indexes = weakmap<Node, Rx.Observable<any>>();
            cleanup.add(Rx.Disposable.create(() => indexes = null));
            var recalcIndextrigger = new Rx.Subject<any>();
            cleanup.add(recalcIndextrigger);

            // initial insert
            this.appendAll(el, list, ctx, template, indexes, recalcIndextrigger);

            // track changes
            cleanup.add(list.itemsAdded.subscribe((e) => {
                length = e.items.length;

                if (e.from === list.length) {
                    for (i = 0; i < length; i++) {
                        this.appendRow(el, i + e.from, e.items[i], ctx, template, recalcIndextrigger, indexes);
                    }
                } else {
                    for (i = 0; i < e.items.length; i++) {
                        this.insertRow(el, i + e.from, e.items[i], ctx, template, recalcIndextrigger, indexes);
                    }
                }

                recalcIndextrigger.onNext(true);
            }));

            cleanup.add(list.itemsRemoved.subscribe((e) => {
                length = e.items.length;

                for (i = 0; i < length; i++) {
                    this.removeRow(el, i + e.from, template, indexes);
                }

                recalcIndextrigger.onNext(true);
            }));

            cleanup.add(list.itemsMoved.subscribe((e) => {
                this.removeRow(el, e.from, template, indexes);
                this.insertRow(el, e.to, e.items[0], ctx, template, recalcIndextrigger, indexes);

                recalcIndextrigger.onNext(true);
            }));

            cleanup.add(list.itemReplaced.subscribe((e) => {
                this.rebindRow(el, e.from, e.items[0], template);

                recalcIndextrigger.onNext(true);
            }));

            cleanup.add(list.shouldReset.subscribe((e) => {
                this.clear(el, indexes);
                this.appendAll(el, list, ctx, template, indexes, recalcIndextrigger);

                recalcIndextrigger.onNext(true);
            }));
        }

        protected applyValue(el: HTMLElement, value: any, template: Array<Node>,
            ctx: IDataContext, initialApply: boolean, cleanup: Rx.CompositeDisposable): void {
            var i, length;

            if (initialApply) {
                // clone to template
                length = el.childNodes.length;

                for (i = 0; i < length; i++) {
                    template.push(el.childNodes[i].cloneNode(true));
                }
            }

            this.clear(el);

            if (Array.isArray(value)) {
                var arr = <Array<any>> value;

                // iterate once and be done with it
                length = arr.length;

                for (i = 0; i < length; i++) {
                    this.appendRow(el, i, arr[i], ctx, template);
                }
            } else if(utils.isList(value)) {
                var list = <IObservableList<any>> value;

                this.monitorList(el, ctx, template, cleanup, list);
            } else {
                internal.throwError("forEach binding only operates on IObservableList or standard Javascript-Arrays");
            }
        }
    }

    export module internal {
        export var forEachDirectiveConstructor = <any> ForEachDirective;
    }
}