///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Collections/WeakMap.ts" />
/// <reference path="../Core/Resources.ts" />
/// <reference path="../Core/Injector.ts" />
/// <reference path="../Core/Globals.ts" />
/// <reference path="../Collections/Set.ts" />
/// <reference path="../Core/Environment.ts" />
/// <reference path="../Core/Module.ts" />

module wx {
    class Router implements IRouter {
        constructor(domService: IDomService) {
        }
    }

    export module internal {
        export var routerConstructor = <any> Router;
    }
}
