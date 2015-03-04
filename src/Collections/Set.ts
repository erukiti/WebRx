module wx {
    /**
    * ES6 Set Shim
    * @class
    */
    class SetEmulated<T> implements ISet<T> {
        ////////////////////
        /// ISet

        public add(value: T): ISet<T> {
            var key = utils.getOid(value);

            if (!this.keys[key]) {
                this.values.push(value);
                this.keys[key] = true;
            }

            return this;
        }

        public delete(value: T): boolean {
            var key = utils.getOid(value);

            if (this.keys[key]) {
                var index = this.values.indexOf(value);
                this.values.splice(index, 1);

                delete this.keys[key];
                return true;
            }

            return false;
        }

        public has(value: T): boolean {
            var key = utils.getOid(value);
            return this.keys.hasOwnProperty(key);
        }

        public clear(): void {
            this.keys = {};
            this.values.length = 0;
        }

        public forEach(callback: (T) => void, thisArg?): void {
            this.values.forEach(callback, thisArg);
        }

        public get size(): number {
            return this.values.length;
        }

        public get isEmulated(): boolean {
            return true;
        }

        ////////////////////
        /// Implementation

        public values: Array<T> = [];
        private keys: { [key: string]: boolean } = {};
    }

    var hasNativeSupport = typeof Set === "function" && Set.prototype.hasOwnProperty("forEach")
        && Set.prototype.hasOwnProperty("add") && Set.prototype.hasOwnProperty("clear")
        && Set.prototype.hasOwnProperty("delete") && Set.prototype.hasOwnProperty("has");

    /**
    * Creates a new Set instance
    * @param {boolean} disableNativeSupport Force creation of an emulated implementation, regardless of browser native support.
    * @return {ISet<T>} A new instance of a suitable ISet implementation
    */
    export function createSet<T>(disableNativeSupport?: boolean): ISet<T> {
        if (disableNativeSupport || !hasNativeSupport) {
            return new SetEmulated<T>();
        }

        return <ISet<T>> <any> new Set();
    }
}