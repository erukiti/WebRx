/// <reference path="Core/Injector.ts" />
/// <reference path="Services/ExpressionCompiler.ts" />
/// <reference path="Services/DomService.ts" />
/// <reference path="Directives/CommandDirective.ts" />
/// <reference path="Directives/IfDirective.ts" />
/// <reference path="Directives/MultiOneWayDirectives.ts" />
/// <reference path="Directives/SimpleOneWayDirectives.ts" />
/// <reference path="Core/Module.ts" />
/// <reference path="Directives/ForEachDirective.ts" />
/// <reference path="Services/HtmlTemplateEngine.ts" />

module wx {
    injector.register(res.expressionCompiler, internal.expressionCompilerConstructor);
    injector.register(res.htmlTemplateEngine, true, true, [internal.htmlTemplateEngineConstructor]);
    injector.register(res.domService, true, true, [res.expressionCompiler, internal.domServiceConstructor]);

    injector.register("wx.directives.module", true, true, [res.domService, internal.moduleDirectiveConstructor]);
    injector.register("wx.directives.command", true, true, [res.domService, internal.commandDirectiveConstructor]);
    injector.register("wx.directives.if", true, true, [res.domService, internal.ifDirectiveConstructor]);
    injector.register("wx.directives.notif", true, true, [res.domService, internal.notifDirectiveConstructor]);
    injector.register("wx.directives.css", true, true, [res.domService, internal.cssDirectiveConstructor]);
    injector.register("wx.directives.attr", true, true, [res.domService, internal.attrDirectiveConstructor]);
    injector.register("wx.directives.style", true, true, [res.domService, internal.styleDirectiveConstructor]);
    injector.register("wx.directives.text", true, true, [res.domService, internal.textDirectiveConstructor]);
    injector.register("wx.directives.html", true, true, [res.domService, internal.htmlDirectiveConstructor]);
    injector.register("wx.directives.visible", true, true, [res.domService, internal.visibleDirectiveConstructor]);
    injector.register("wx.directives.hidden", true, true, [res.domService, internal.hiddenDirectiveConstructor]);
    injector.register("wx.directives.enabled", true, true, [res.domService, internal.enableDirectiveConstructor]);
    injector.register("wx.directives.disabled", true, true, [res.domService, internal.disableDirectiveConstructor]);
    injector.register("wx.directives.foreach", true, true, [res.domService, internal.forEachDirectiveConstructor]);

    app.registerDirective("module", "wx.directives.module");
    app.registerDirective("css", "wx.directives.css");
    app.registerDirective("attr", "wx.directives.attr");
    app.registerDirective("style", "wx.directives.style");
    app.registerDirective("command", "wx.directives.command");
    app.registerDirective("if", "wx.directives.if");
    app.registerDirective("ifnot", "wx.directives.notif");
    app.registerDirective("text", "wx.directives.text");
    app.registerDirective("html", "wx.directives.html");
    app.registerDirective("visible", "wx.directives.visible");
    app.registerDirective("hidden", "wx.directives.hidden");
    app.registerDirective("disabled", "wx.directives.disabled");
    app.registerDirective("enabled", "wx.directives.enabled");
    app.registerDirective("foreach", "wx.directives.foreach");
}
