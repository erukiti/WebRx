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
/// <reference path="Routing/Bindings/StateRef.ts" />
/// <reference path="Routing/Bindings/View.ts" />
/// <reference path="Routing/Router.ts" />

module wx {
    injector.register(res.expressionCompiler, internal.expressionCompilerConstructor)
        .register(res.htmlTemplateEngine, true, true, [internal.htmlTemplateEngineConstructor])
        .register(res.domManager, true, true, [res.expressionCompiler, internal.domManagerConstructor])
        .register(res.router, true, true, [res.domManager, internal.routerConstructor]);

    injector.register("wx.bindings.module", true, true, [res.domManager, internal.moduleBindingConstructor])
        .register("wx.bindings.command", true, true, [res.domManager, internal.commandBindingConstructor])
        .register("wx.bindings.if", true, true, [res.domManager, internal.ifBindingConstructor])
        .register("wx.bindings.with", true, true, [res.domManager, internal.withBindingConstructor])
        .register("wx.bindings.notif", true, true, [res.domManager, internal.notifBindingConstructor])
        .register("wx.bindings.css", true, true, [res.domManager, internal.cssBindingConstructor])
        .register("wx.bindings.attr", true, true, [res.domManager, internal.attrBindingConstructor])
        .register("wx.bindings.style", true, true, [res.domManager, internal.styleBindingConstructor])
        .register("wx.bindings.text", true, true, [res.domManager, internal.textBindingConstructor])
        .register("wx.bindings.html", true, true, [res.domManager, internal.htmlBindingConstructor])
        .register("wx.bindings.visible", true, true, [res.domManager, internal.visibleBindingConstructor])
        .register("wx.bindings.hidden", true, true, [res.domManager, internal.hiddenBindingConstructor])
        .register("wx.bindings.enabled", true, true, [res.domManager, internal.enableBindingConstructor])
        .register("wx.bindings.disabled", true, true, [res.domManager, internal.disableBindingConstructor])
        .register("wx.bindings.foreach", true, true, [res.domManager, internal.forEachBindingConstructor])
        .register("wx.bindings.event", true, true, [res.domManager, internal.eventBindingConstructor])
        .register("wx.bindings.textInput", true, true, [res.domManager, internal.textInputBindingConstructor])
        .register("wx.bindings.checked", true, true, [res.domManager, internal.checkedBindingConstructor])
        .register("wx.bindings.selectedValue", true, true, [res.domManager, internal.selectedValueBindingConstructor])
        .register("wx.bindings.component", true, true, [res.domManager, internal.componentBindingConstructor])
        .register("wx.bindings.value", true, true, [res.domManager, internal.valueBindingConstructor])
        .register("wx.bindings.hasFocus", true, true, [res.domManager, internal.hasFocusBindingConstructor])
        .register("wx.bindings.view", true, true, [res.domManager, res.router, internal.viewBindingConstructor])
        .register("wx.bindings.sref", true, true, [res.domManager, res.router, internal.stateRefBindingConstructor]);

    injector.register("wx.components.radiogroup", false, true, [res.htmlTemplateEngine, internal.radioGroupComponentConstructor])
        .register("wx.components.select", false, true, [res.htmlTemplateEngine, internal.selectComponentConstructor]);

    app.binding("module", "wx.bindings.module")
        .binding("css", "wx.bindings.css")
        .binding("attr", "wx.bindings.attr")
        .binding("style", "wx.bindings.style")
        .binding("command", "wx.bindings.command")
        .binding("if", "wx.bindings.if")
        .binding("with", "wx.bindings.with")
        .binding("ifnot", "wx.bindings.notif")
        .binding("text", "wx.bindings.text")
        .binding("html", "wx.bindings.html")
        .binding("visible", "wx.bindings.visible")
        .binding("hidden", "wx.bindings.hidden")
        .binding("disabled", "wx.bindings.disabled")
        .binding("enabled", "wx.bindings.enabled")
        .binding("foreach", "wx.bindings.foreach")
        .binding("event", "wx.bindings.event")
        .binding(["textInput", "textinput"], "wx.bindings.textInput")
        .binding("checked", "wx.bindings.checked")
        .binding("selectedValue", "wx.bindings.selectedValue")
        .binding("component", "wx.bindings.component")
        .binding("value", "wx.bindings.value")
        .binding(["hasFocus", "hasfocus"], "wx.bindings.hasFocus")
        .binding("view", "wx.bindings.view")
        .binding("sref", "wx.bindings.sref");

    app.component("wx-radiogroup", "wx.components.radiogroup")
        .component("wx-select", "wx.components.select");
}
