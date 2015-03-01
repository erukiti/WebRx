module xi {
    /**
    * .Net's Lazy<T>
    * @class
    */
    export class Lazy<T> {
        constructor(createValue: () => T) {
            this.createValue = createValue;
        }

        public get value(): T {
            if (!this.isValueCreated) {
                this.createdValue = this.createValue();
                this.isValueCreated = true;
            }

            return this.createdValue;
        }

        isValueCreated: boolean;
        private createValue: () => T;
        private createdValue: T;
    }
}