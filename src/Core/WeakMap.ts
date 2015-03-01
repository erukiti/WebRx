
module wx {
    /**
    * This class emulates the semantics of a WeakMap.
    * Even though this implementation is indeed "weak", it has the drawback of
    * requiring manual housekeeping of entries otherwise they are kept forever.
    * @class
    */
    class WeakMapEmulated<TKey extends Object, T> implements IWeakMap<TKey, T> {
        ////////////////////
        /// IWeakMap

        public set(key: TKey, value: T) {
            var oid = utils.getOid(key);
            this.inner[oid] = value;
        }

        public get(key: TKey): T {
            var oid = utils.getOid(key);
            return this.inner[oid];
        }

        public has(key: TKey): boolean {
            var oid = utils.getOid(key);
            return this.inner.hasOwnProperty(oid);
        }

        public delete(key: TKey): boolean {
            var oid = utils.getOid(key);
            return delete this.inner[oid];
        }

        public get isEmulatedWeakMap(): boolean {
            return true;
        }

        ////////////////////
        /// Implementation

        private inner: { [key: string]: T } = {};
    }

    /**
    * Creates a new WeakMap instance
    * @param {boolean} disableNativeSupport Force creation of an emulated implementation, regardless of browser native support.
    * @return {WeakMap<TKey, T>} A new WeakMap instance
    */
    export function weakmap<TKey, T>(disableNativeSupport?: boolean): IWeakMap<TKey, T> {
        // test for native support
        if (disableNativeSupport || typeof WeakMap !== "function") {
            return new WeakMapEmulated<TKey, T>();
        }

        return <IWeakMap<TKey, T>> <any> new WeakMap();
    }
}
