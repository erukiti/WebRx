/// <reference path="core/Utils.ts" />
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
/// <reference path="Routing/Bindings/StateActive.ts" />
/// <reference path="Routing/Bindings/StateRef.ts" />
/// <reference path="Routing/Bindings/View.ts" />
/// <reference path="Routing/Router.ts" />
/// <reference path="Core/MessageBus.ts" />

module wx {
    injector.register(res.expressionCompiler, internal.expressionCompilerConstructor)
        .register(res.htmlTemplateEngine, [internal.htmlTemplateEngineConstructor], true)
        .register(res.domManager, [res.expressionCompiler, internal.domManagerConstructor], true)
        .register(res.router, [res.domManager, internal.routerConstructor], true)
        .register(res.messageBus, [internal.messageBusConstructor], true);

    injector.register("wx.bindings.module", [res.domManager, internal.moduleBindingConstructor], true)
        .register("wx.bindings.command", [res.domManager, internal.commandBindingConstructor], true)
        .register("wx.bindings.if", [res.domManager, internal.ifBindingConstructor], true)
        .register("wx.bindings.with", [res.domManager, internal.withBindingConstructor], true)
        .register("wx.bindings.notif", [res.domManager, internal.notifBindingConstructor], true)
        .register("wx.bindings.css", [res.domManager, internal.cssBindingConstructor], true)
        .register("wx.bindings.attr", [res.domManager, internal.attrBindingConstructor], true)
        .register("wx.bindings.style", [res.domManager, internal.styleBindingConstructor], true)
        .register("wx.bindings.text", [res.domManager, internal.textBindingConstructor], true)
        .register("wx.bindings.html", [res.domManager, internal.htmlBindingConstructor], true)
        .register("wx.bindings.visible", [res.domManager, internal.visibleBindingConstructor], true)
        .register("wx.bindings.hidden", [res.domManager, internal.hiddenBindingConstructor], true)
        .register("wx.bindings.enabled", [res.domManager, internal.enableBindingConstructor], true)
        .register("wx.bindings.disabled", [res.domManager, internal.disableBindingConstructor], true)
        .register("wx.bindings.foreach", [res.domManager, internal.forEachBindingConstructor], true)
        .register("wx.bindings.event", [res.domManager, internal.eventBindingConstructor], true)
        .register("wx.bindings.textInput", [res.domManager, internal.textInputBindingConstructor], true)
        .register("wx.bindings.checked", [res.domManager, internal.checkedBindingConstructor], true)
        .register("wx.bindings.selectedValue", [res.domManager, internal.selectedValueBindingConstructor], true)
        .register("wx.bindings.component", [res.domManager, internal.componentBindingConstructor], true)
        .register("wx.bindings.value", [res.domManager, internal.valueBindingConstructor], true)
        .register("wx.bindings.hasFocus", [res.domManager, internal.hasFocusBindingConstructor], true)
        .register("wx.bindings.view", [res.domManager, res.router, internal.viewBindingConstructor], true)
        .register("wx.bindings.sref", [res.domManager, res.router, internal.stateRefBindingConstructor], true)
        .register("wx.bindings.sactive", [res.domManager, res.router, internal.stateActiveBindingConstructor], true);

    injector.register("wx.components.radiogroup", [res.htmlTemplateEngine, internal.radioGroupComponentConstructor])
        .register("wx.components.select", [res.htmlTemplateEngine, internal.selectComponentConstructor]);

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
        .binding("sref", "wx.bindings.sref")
        .binding(["sactive", "state-active"], "wx.bindings.sactive");

    app.component("wx-radiogroup", "wx.components.radiogroup")
        .component("wx-select", "wx.components.select");
}
