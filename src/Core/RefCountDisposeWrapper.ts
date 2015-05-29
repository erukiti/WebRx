/// <reference path="../Interfaces.ts" />

"use strict";

export default class RefCountDisposeWrapper implements Rx.IDisposable {
    constructor(inner: Rx.IDisposable, initialRefCount: number = 1) {
        this.inner = inner;
        this.refCount = initialRefCount;
    }

    private inner: Rx.IDisposable;
    private refCount: number;

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

    public dispose() {
        this.release();
    }
}
