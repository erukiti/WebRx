/// <reference path="../Interfaces.ts" />

module wx {
    export class PropertyChangedEventArgs implements
        IPropertyChangedEventArgs {
        /// <summary>
        /// Initializes a new instance of the <see cref="ObservablePropertyChangedEventArgs{TSender}"/> class.
        /// </summary>
        /// <param name="sender">The sender.</param>
        /// <param name="propertyName">Name of the property.</param>
        constructor(sender: any, propertyName: string) {
            this.propertyName = propertyName;
            this.sender = sender;
        }

        sender: any; //  { get; private set; }
        propertyName: string;
    }

    export class NotifyCollectionChangedEventArgs implements
        INotifyCollectionChangedEventArgs {

        public action: NotifyCollectionChangedAction;
        public newItems: Array<any>;
        public newStartingIndex: number;
        public oldItems: Array<any>;
        public oldStartingIndex: number;

        // factory method overloads
        static create(action: NotifyCollectionChangedAction, changedItems: Array<any>, startingIndex: number): NotifyCollectionChangedEventArgs;
        static create(action: NotifyCollectionChangedAction, changedItem: any, index: number): NotifyCollectionChangedEventArgs;
        static create(action: NotifyCollectionChangedAction, changedItems: Array<any>, index: number, oldIndex: number): NotifyCollectionChangedEventArgs;
        static create(action: NotifyCollectionChangedAction, newItem: any, oldItem: any, index: number): NotifyCollectionChangedEventArgs;
        static create(action: NotifyCollectionChangedAction): NotifyCollectionChangedEventArgs;

        // factory method implementation
        static create(): NotifyCollectionChangedEventArgs {
            var result = new NotifyCollectionChangedEventArgs();

            var action: NotifyCollectionChangedAction = arguments[0];
            var changedItems: Array<any>;
            var startingIndex: number;
            var index: number;
            var oldIndex: number;
            var newItem: any;
            var oldItem: any;
            var changedItem: any;

            result.action = action;

            if (arguments.length > 1) {
                if (Array.isArray(arguments[1])) {
                    if (arguments.length === 3) {
                        // create(action: NotifyCollectionChangedAction, changedItems: Array<any>, startingIndex: number): NotifyCollectionChangedEventArgs;

                        changedItems = arguments[1];
                        startingIndex = arguments[2];

                        if (action === NotifyCollectionChangedAction.Add || action === NotifyCollectionChangedAction.Remove) {
                            if (changedItems == null)
                                internal.throwError("changedItems");

                            if (startingIndex < -1)
                                internal.throwError("the value of startingIndex must be -1 or greater.");

                            if (action === NotifyCollectionChangedAction.Add)
                                result.initializeAdd(changedItems, startingIndex);
                            else
                                result.initializeRemove(changedItems, startingIndex);
                        } else if (action === NotifyCollectionChangedAction.Reset) {
                            if (changedItems != null)
                                internal.throwError("this constructor can only be used with the Reset action if changedItems is null");

                            if (startingIndex !== -1)
                                internal.throwError("this constructor can only be used with the Reset action if startingIndex is -1");
                        } else {
                            internal.throwError("this constructor can only be used with the Reset, Add, or Remove actions.");
                        }

                    } else if (arguments.length === 4) {
                        // create(action: NotifyCollectionChangedAction, changedItems: Array<any>, index: number, oldIndex: number): NotifyCollectionChangedEventArgs;

                        changedItems = arguments[1];
                        index = arguments[2];
                        oldIndex = arguments[3];

                        if (action !== NotifyCollectionChangedAction.Move)
                            internal.throwError("this constructor can only be used with the Move action.");

                        if (index < -1)
                            internal.throwError("the value of index must be -1 or greater.");

                        result.initializeMove(changedItems, index, oldIndex);
                    } else {
                        internal.throwError("unrecognized overload");
                    }
                } else {
                    if (arguments.length === 4) {
                        // create(action: NotifyCollectionChangedAction, newItem: any, oldItem: any, index: number): NotifyCollectionChangedEventArgs;

                        newItem = arguments[1];
                        oldItem = arguments[2];
                        index = arguments[3];

                        if (action !== NotifyCollectionChangedAction.Replace)
                            internal.throwError("this constructor can only be used with the Replace action.");

                        result.initializeReplace([newItem], [oldItem], index);
                    } else {
                        // create(action: NotifyCollectionChangedAction, changedItem: any, index: number): NotifyCollectionChangedEventArgs;

                        changedItem = arguments[1];
                        index = arguments[2];

                        changedItems = [changedItem];

                        if (action === NotifyCollectionChangedAction.Add)
                            result.initializeAdd(changedItems, index);
                        else if (action === NotifyCollectionChangedAction.Remove)
                            result.initializeRemove(changedItems, index);
                        else if (action === NotifyCollectionChangedAction.Reset) {
                            if (changedItem != null)
                                internal.throwError("This constructor can only be used with the Reset action if changedItem is null");

                            if (index !== -1)
                                internal.throwError("This constructor can only be used with the Reset action if index is -1");
                        } else {
                            internal.throwError("This constructor can only be used with the Reset, Add, or Remove actions.");
                        }
                    }
                }
            }

            return result;
        }

        private initializeAdd(items: Array<any>, index: number): void {
            this.newItems = items;
            this.newStartingIndex = index;
        }

        private initializeRemove(items: Array<any>, index: number): void {
            this.oldItems = items;
            this.oldStartingIndex = index;
        }

        private initializeMove(changedItems: Array<any>, newItemIndex: number, oldItemIndex: number): void {
            this.initializeAdd(changedItems, newItemIndex);
            this.initializeRemove(changedItems, oldItemIndex);
        }

        private initializeReplace(addedItems: Array<any>, removedItems: Array<any>, index): void {
            this.initializeAdd(addedItems, index);
            this.initializeRemove(removedItems, index);
        }

        public toString(): string {
            var result = NotifyCollectionChangedAction[this.action];
            if (this.newStartingIndex)
                result += " NewStart=" + this.newStartingIndex;
            if (this.oldStartingIndex)
                result += " OldStart=" + this.oldStartingIndex;
            if (this.newItems)
                result += " NewItemsCount=" + this.newItems.length;
            if (this.oldItems)
                result += " OldItemsCount=" + this.oldItems.length;
            return result;
        }
    }
}