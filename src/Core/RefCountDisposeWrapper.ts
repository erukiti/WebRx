///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />

module wx {
    "use strict";

    export class RefCountDisposeWrapper {
        constructor(inner: Rx.IDisposable) {
            this.inner = inner;
        }

        private inner: Rx.IDisposable;
        private refCount = 1;

        public addRef(): void {
            this.refCount++;
        }

        public release():number {
            if (--this.refCount === 0) {
                this.inner.dispose();
                this.inner = null;
            }

            return this.refCount;
        }
    }
}