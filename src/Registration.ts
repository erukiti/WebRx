/// <reference path="Core/Injector.ts" />
/// <reference path="Core/ExpressionCompiler.ts" />
/// <reference path="Core/DomManager.ts" />
/// <reference path="Core/HtmlTemplateEngine.ts" />
/// <reference path="Bindings/Command.ts" />
/// <reference path="Bindings/If.ts" />
/// <reference path="Bindings/MultiOneWay.ts" />
/// <reference path="Bindings/SimpleOneWay.ts" />
/// <reference path="Bindings/ForEach.ts" />
/// <reference path="Bindings/Event.ts" />
/// <reference path="Bindings/TextInput.ts" />
/// <reference path="Bindings/SelectedValue.ts" />
/// <reference path="Bindings/Component.ts" />
/// <reference path="Bindings/Routing/StateRef.ts" />
/// <reference path="Bindings/Routing/View.ts" />
/// <reference path="Routing/Router.ts" />

module wx {
    injector.register(res.expressionCompiler, internal.expressionCompilerConstructor);
    injector.register(res.htmlTemplateEngine, true, true, [internal.htmlTemplateEngineConstructor]);
    injector.register(res.domManager, true, true, [res.expressionCompiler, internal.domManagerConstructor]);
    injector.register(res.router, true, true, [res.domManager, internal.routerConstructor]);

    injector.register("wx.bindings.module", true, true, [res.domManager, internal.moduleBindingConstructor]);
    injector.register("wx.bindings.command", true, true, [res.domManager, internal.commandBindingConstructor]);
    injector.register("wx.bindings.if", true, true, [res.domManager, internal.ifBindingConstructor]);
    injector.register("wx.bindings.with", true, true, [res.domManager, internal.withBindingConstructor]);
    injector.register("wx.bindings.notif", true, true, [res.domManager, internal.notifBindingConstructor]);
    injector.register("wx.bindings.css", true, true, [res.domManager, internal.cssBindingConstructor]);
    injector.register("wx.bindings.attr", true, true, [res.domManager, internal.attrBindingConstructor]);
    injector.register("wx.bindings.style", true, true, [res.domManager, internal.styleBindingConstructor]);
    injector.register("wx.bindings.text", true, true, [res.domManager, internal.textBindingConstructor]);
    injector.register("wx.bindings.html", true, true, [res.domManager, internal.htmlBindingConstructor]);
    injector.register("wx.bindings.visible", true, true, [res.domManager, internal.visibleBindingConstructor]);
    injector.register("wx.bindings.hidden", true, true, [res.domManager, internal.hiddenBindingConstructor]);
    injector.register("wx.bindings.enabled", true, true, [res.domManager, internal.enableBindingConstructor]);
    injector.register("wx.bindings.disabled", true, true, [res.domManager, internal.disableBindingConstructor]);
    injector.register("wx.bindings.foreach", true, true, [res.domManager, internal.forEachBindingConstructor]);
    injector.register("wx.bindings.event", true, true, [res.domManager, internal.eventBindingConstructor]);
    injector.register("wx.bindings.textInput", true, true, [res.domManager, internal.textInputBindingConstructor]);
    injector.register("wx.bindings.checked", true, true, [res.domManager, internal.checkedBindingConstructor]);
    injector.register("wx.bindings.selectedValue", true, true, [res.domManager, internal.selectedValueBindingConstructor]);
    injector.register("wx.bindings.component", true, true, [res.domManager, internal.componentBindingConstructor]);
    injector.register("wx.bindings.value", true, true, [res.domManager, internal.valueBindingConstructor]);
    injector.register("wx.bindings.hasFocus", true, true, [res.domManager, internal.hasFocusBindingConstructor]);
    injector.register("wx.bindings.view", true, true, [res.domManager, res.router, internal.viewBindingConstructor]);
    injector.register("wx.bindings.sref", true, true, [res.domManager, res.router, internal.stateRefBindingConstructor]);

    injector.register("wx.components.radiogroup", false, true, [res.htmlTemplateEngine, internal.radioGroupComponentConstructor]);
    injector.register("wx.components.select", false, true, [res.htmlTemplateEngine, internal.selectComponentConstructor]);

    app.registerBinding("module", "wx.bindings.module");
    app.registerBinding("css", "wx.bindings.css");
    app.registerBinding("attr", "wx.bindings.attr");
    app.registerBinding("style", "wx.bindings.style");
    app.registerBinding("command", "wx.bindings.command");
    app.registerBinding("if", "wx.bindings.if");
    app.registerBinding("with", "wx.bindings.with");
    app.registerBinding("ifnot", "wx.bindings.notif");
    app.registerBinding("text", "wx.bindings.text");
    app.registerBinding("html", "wx.bindings.html");
    app.registerBinding("visible", "wx.bindings.visible");
    app.registerBinding("hidden", "wx.bindings.hidden");
    app.registerBinding("disabled", "wx.bindings.disabled");
    app.registerBinding("enabled", "wx.bindings.enabled");
    app.registerBinding("foreach", "wx.bindings.foreach");
    app.registerBinding("event", "wx.bindings.event");
    app.registerBinding(["textInput", "textinput"], "wx.bindings.textInput");
    app.registerBinding("checked", "wx.bindings.checked");
    app.registerBinding("selectedValue", "wx.bindings.selectedValue");
    app.registerBinding("component", "wx.bindings.component");
    app.registerBinding("value", "wx.bindings.value");
    app.registerBinding(["hasFocus", "hasfocus"], "wx.bindings.hasFocus");
    app.registerBinding("view", "wx.bindings.view");
    app.registerBinding("sref", "wx.bindings.sref");

    app.registerComponent("wx-radiogroup", "wx.components.radiogroup");
    app.registerComponent("wx-select", "wx.components.select");
}
