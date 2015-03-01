module xi {
    /**
    * Mimics .Net's HashSet<T> 
    * Note: this class intended to be used with Objects not with primitives
    * @class
    */
    export class HashSet<T extends Object> {
        public add(value: T) {
            var key = utils.getOid(value);

            if (!this.keys[key]) {
                this.values.push(value);
                this.keys[key] = true;
            }
        }

        public remove(value: T): void {
            var key = utils.getOid(value);

            if (this.keys[key]) {
                var index = this.values.indexOf(value);
                this.values.splice(index, 1);

                delete this.keys[key];
            }
        }

        public contains(value: T): boolean {
            var key = utils.getOid(value);
            return this.keys.hasOwnProperty(key);
        }

        public clear(): void {
            this.keys = {};
            this.values.length = 0;
        }

        public get length(): number {
            return this.values.length;
        }

        public values: Array<T> = [];
        private keys: { [key: string]: boolean } = {};
    }
}