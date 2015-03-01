/// <reference path="Core/Injector.ts" />
/// <reference path="Core/Resources.ts" />
/// <reference path="Services/ExpressionCompiler.ts" />
/// <reference path="Services/DomService.ts" />
/// <reference path="Directives/Command.ts" />
/// <reference path="Directives/If.ts" />
/// <reference path="Directives/MultiOneWay.ts" />
/// <reference path="Directives/SimpleOneWay.ts" />

module xi {
    injector.register(res.expressionCompiler, internals.expressionCompilerConstructor);

    injector.register(res.domService, true, true, [res.expressionCompiler, internals.domServiceConstructor]);

    injector.register("xi.directives.command", true, true, [res.domService, internals.commandDirectiveConstructor]);
    injector.register("xi.directives.if", true, true, [res.domService, internals.ifDirectiveConstructor]);
    injector.register("xi.directives.notif", true, true, [res.domService, internals.notifDirectiveConstructor]);
    injector.register("xi.directives.css", true, true, [res.domService, internals.cssDirectiveConstructor]);
    injector.register("xi.directives.attr", true, true, [res.domService, internals.attrDirectiveConstructor]);
    injector.register("xi.directives.style", true, true, [res.domService, internals.styleDirectiveConstructor]);
    injector.register("xi.directives.text", true, true, [res.domService, internals.textDirectiveConstructor]);
    injector.register("xi.directives.html", true, true, [res.domService, internals.htmlDirectiveConstructor]);
    injector.register("xi.directives.visible", true, true, [res.domService, internals.visibleDirectiveConstructor]);
    injector.register("xi.directives.hidden", true, true, [res.domService, internals.hiddenDirectiveConstructor]);
    injector.register("xi.directives.enabled", true, true, [res.domService, internals.enableDirectiveConstructor]);
    injector.register("xi.directives.disabled", true, true, [res.domService, internals.disableDirectiveConstructor]);

    var domService = injector.resolve<IDomService>(res.domService);

    domService.registerDirective("css", "xi.directives.css");
    domService.registerDirective("attr", "xi.directives.attr");
    domService.registerDirective("style", "xi.directives.style");
    domService.registerDirective("command", "xi.directives.command");
    domService.registerDirective("if", "xi.directives.if");
    domService.registerDirective("ifnot", "xi.directives.notif");
    domService.registerDirective("text", "xi.directives.text");
    domService.registerDirective("html", "xi.directives.html");
    domService.registerDirective("visible", "xi.directives.visible");
    domService.registerDirective("hidden", "xi.directives.hidden");
    domService.registerDirective("disabled", "xi.directives.disabled");
    domService.registerDirective("enabled", "xi.directives.enabled");
}
