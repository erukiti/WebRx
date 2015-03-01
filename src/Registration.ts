/// <reference path="Core/Injector.ts" />
/// <reference path="Core/Resources.ts" />
/// <reference path="Services/ExpressionCompiler.ts" />
/// <reference path="Services/DomService.ts" />
/// <reference path="Directives/Command.ts" />
/// <reference path="Directives/If.ts" />
/// <reference path="Directives/MultiOneWay.ts" />
/// <reference path="Directives/SimpleOneWay.ts" />

module wx {
    injector.register(res.expressionCompiler, internals.expressionCompilerConstructor);

    injector.register(res.domService, true, true, [res.expressionCompiler, internals.domServiceConstructor]);

    injector.register("wx.directives.command", true, true, [res.domService, internals.commandDirectiveConstructor]);
    injector.register("wx.directives.if", true, true, [res.domService, internals.ifDirectiveConstructor]);
    injector.register("wx.directives.notif", true, true, [res.domService, internals.notifDirectiveConstructor]);
    injector.register("wx.directives.css", true, true, [res.domService, internals.cssDirectiveConstructor]);
    injector.register("wx.directives.attr", true, true, [res.domService, internals.attrDirectiveConstructor]);
    injector.register("wx.directives.style", true, true, [res.domService, internals.styleDirectiveConstructor]);
    injector.register("wx.directives.text", true, true, [res.domService, internals.textDirectiveConstructor]);
    injector.register("wx.directives.html", true, true, [res.domService, internals.htmlDirectiveConstructor]);
    injector.register("wx.directives.visible", true, true, [res.domService, internals.visibleDirectiveConstructor]);
    injector.register("wx.directives.hidden", true, true, [res.domService, internals.hiddenDirectiveConstructor]);
    injector.register("wx.directives.enabled", true, true, [res.domService, internals.enableDirectiveConstructor]);
    injector.register("wx.directives.disabled", true, true, [res.domService, internals.disableDirectiveConstructor]);

    var domService = injector.resolve<IDomService>(res.domService);

    domService.registerDirective("css", "wx.directives.css");
    domService.registerDirective("attr", "wx.directives.attr");
    domService.registerDirective("style", "wx.directives.style");
    domService.registerDirective("command", "wx.directives.command");
    domService.registerDirective("if", "wx.directives.if");
    domService.registerDirective("ifnot", "wx.directives.notif");
    domService.registerDirective("text", "wx.directives.text");
    domService.registerDirective("html", "wx.directives.html");
    domService.registerDirective("visible", "wx.directives.visible");
    domService.registerDirective("hidden", "wx.directives.hidden");
    domService.registerDirective("disabled", "wx.directives.disabled");
    domService.registerDirective("enabled", "wx.directives.enabled");
}
