/// <reference path="Core/Injector.ts" />
/// <reference path="Services/ExpressionCompiler.ts" />
/// <reference path="Services/DomService.ts" />
/// <reference path="Services/HtmlTemplateEngine.ts" />
/// <reference path="Bindings/Command.ts" />
/// <reference path="Bindings/If.ts" />
/// <reference path="Bindings/MultiOneWay.ts" />
/// <reference path="Bindings/SimpleOneWay.ts" />
/// <reference path="Bindings/ForEach.ts" />
/// <reference path="Bindings/Event.ts" />
/// <reference path="Bindings/TextInput.ts" />
/// <reference path="Bindings/SelectedValue.ts" />
/// <reference path="Bindings/Component.ts" />

module wx {
    injector.register(res.expressionCompiler, internal.expressionCompilerConstructor);
    injector.register(res.htmlTemplateEngine, true, true, [internal.htmlTemplateEngineConstructor]);
    injector.register(res.domService, true, true, [res.expressionCompiler, internal.domServiceConstructor]);

    injector.register("wx.bindings.module", true, true, [res.domService, internal.moduleBindingConstructor]);
    injector.register("wx.bindings.command", true, true, [res.domService, internal.commandBindingConstructor]);
    injector.register("wx.bindings.if", true, true, [res.domService, internal.ifBindingConstructor]);
    injector.register("wx.bindings.with", true, true, [res.domService, internal.withBindingConstructor]);
    injector.register("wx.bindings.notif", true, true, [res.domService, internal.notifBindingConstructor]);
    injector.register("wx.bindings.css", true, true, [res.domService, internal.cssBindingConstructor]);
    injector.register("wx.bindings.attr", true, true, [res.domService, internal.attrBindingConstructor]);
    injector.register("wx.bindings.style", true, true, [res.domService, internal.styleBindingConstructor]);
    injector.register("wx.bindings.text", true, true, [res.domService, internal.textBindingConstructor]);
    injector.register("wx.bindings.html", true, true, [res.domService, internal.htmlBindingConstructor]);
    injector.register("wx.bindings.visible", true, true, [res.domService, internal.visibleBindingConstructor]);
    injector.register("wx.bindings.hidden", true, true, [res.domService, internal.hiddenBindingConstructor]);
    injector.register("wx.bindings.enabled", true, true, [res.domService, internal.enableBindingConstructor]);
    injector.register("wx.bindings.disabled", true, true, [res.domService, internal.disableBindingConstructor]);
    injector.register("wx.bindings.foreach", true, true, [res.domService, internal.forEachBindingConstructor]);
    injector.register("wx.bindings.event", true, true, [res.domService, internal.eventBindingConstructor]);
    injector.register("wx.bindings.textInput", true, true, [res.domService, internal.textInputBindingConstructor]);
    injector.register("wx.bindings.checked", true, true, [res.domService, internal.checkedBindingConstructor]);
    injector.register("wx.bindings.selectedValue", true, true, [res.domService, internal.selectedValueBindingConstructor]);
    injector.register("wx.bindings.component", true, true, [res.domService, internal.componentBindingConstructor]);
    injector.register("wx.bindings.value", true, true, [res.domService, internal.valueBindingConstructor]);
    injector.register("wx.bindings.hasFocus", true, true, [res.domService, internal.hasFocusBindingConstructor]);

    injector.register("wx.components.radiogroup", false, true, [res.domService, internal.radioGroupComponentConstructor]);
    injector.register("wx.components.select", false, true, [res.domService, internal.selectComponentConstructor]);

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

    app.registerComponent("wx-radiogroup", "wx.components.radiogroup");
    app.registerComponent("wx-select", "wx.components.select");
}
