import * as res from "./Core/Resources"
import * as ExpressionCompiler from "./Core/ExpressionCompiler"
import {DomManager } from "./Core/DomManager"
import HtmlTemplateEngine from "./Core/HtmlTemplateEngine"
import CommandBinding from "./Bindings/Command"
import ModuleBinding from "./Bindings/Module"
import { IfBinding, NotIfBinding } from "./Bindings/If"
import { AttrBinding, CssBinding, StyleBinding } from "./Bindings/MultiOneWay"
import { DisableBinding, EnableBinding, HiddenBinding, VisibleBinding, HtmlBinding, TextBinding, } from "./Bindings/SimpleOneWay"
import ForEachBinding from "./Bindings/ForEach"
import EventBinding from "./Bindings/Event"
import ValueBinding from "./Bindings/Value"
import HasFocusBinding from "./Bindings/HasFocus"
import WithBinding from "./Bindings/With"
import CheckedBinding from "./Bindings/Checked"
import KeyPressBinding from "./Bindings/KeyPress"
import TextInputBinding from "./Bindings/TextInput"
import SelectedValueBinding from "./Bindings/SelectedValue"
import ComponentBinding from "./Bindings/Component"
import StateActiveBinding from "./Routing/Bindings/StateActive"
import ViewBinding from "./Routing/Bindings/View"
import StateRefBinding from "./Routing/Bindings/StateRef"
import SelectComponent from "./Components/Select"
import RadioGroupComponent from "./Components/RadioGroup"
import { Router } from "./Routing/Router"
import MessageBus from "./Core/MessageBus"
import { injector } from "./Core/Injector"

"use strict";

injector.register(res.expressionCompiler, ExpressionCompiler)
    .register(res.htmlTemplateEngine, [HtmlTemplateEngine], true)
    .register(res.domManager, [res.expressionCompiler, DomManager], true)
    .register(res.router, [res.domManager, Router], true)
    .register(res.messageBus, [MessageBus], true);

injector.register("wx.bindings.module", [res.domManager, ModuleBinding], true)
    .register("wx.bindings.command", [res.domManager, CommandBinding], true)
    .register("wx.bindings.if", [res.domManager, IfBinding], true)
    .register("wx.bindings.with", [res.domManager, WithBinding], true)
    .register("wx.bindings.notif", [res.domManager, NotIfBinding], true)
    .register("wx.bindings.css", [res.domManager, CssBinding], true)
    .register("wx.bindings.attr", [res.domManager, AttrBinding], true)
    .register("wx.bindings.style", [res.domManager, StyleBinding], true)
    .register("wx.bindings.text", [res.domManager, TextBinding], true)
    .register("wx.bindings.html", [res.domManager, HtmlBinding], true)
    .register("wx.bindings.visible", [res.domManager, VisibleBinding], true)
    .register("wx.bindings.hidden", [res.domManager, HiddenBinding], true)
    .register("wx.bindings.enabled", [res.domManager, EnableBinding], true)
    .register("wx.bindings.disabled", [res.domManager, DisableBinding], true)
    .register("wx.bindings.foreach", [res.domManager, ForEachBinding], true)
    .register("wx.bindings.event", [res.domManager, EventBinding], true)
    .register("wx.bindings.keyPress", [res.domManager, KeyPressBinding], true)
    .register("wx.bindings.textInput", [res.domManager, TextInputBinding], true)
    .register("wx.bindings.checked", [res.domManager, CheckedBinding], true)
    .register("wx.bindings.selectedValue", [res.domManager, SelectedValueBinding], true)
    .register("wx.bindings.component", [res.domManager, ComponentBinding], true)
    .register("wx.bindings.value", [res.domManager, ValueBinding], true)
    .register("wx.bindings.hasFocus", [res.domManager, HasFocusBinding], true)
    .register("wx.bindings.view", [res.domManager, res.router, ViewBinding], true)
    .register("wx.bindings.sref", [res.domManager, res.router, StateRefBinding], true)
    .register("wx.bindings.sactive", [res.domManager, res.router, StateActiveBinding], true);

injector.register("wx.components.radiogroup", [res.htmlTemplateEngine, RadioGroupComponent])
    .register("wx.components.select", [res.htmlTemplateEngine, SelectComponent]);

// initialize app module
wx.app.binding("module", "wx.bindings.module")
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
    .binding(["keyPress", "keypress"], "wx.bindings.keyPress")
    .binding(["textInput", "textinput"], "wx.bindings.textInput")
    .binding("checked", "wx.bindings.checked")
    .binding("selectedValue", "wx.bindings.selectedValue")
    .binding("component", "wx.bindings.component")
    .binding("value", "wx.bindings.value")
    .binding(["hasFocus", "hasfocus"], "wx.bindings.hasFocus")
    .binding("view", "wx.bindings.view")
    .binding(["sref", "stateRef", "stateref"], "wx.bindings.sref")
    .binding(["sactive", "stateActive", "stateactive"], "wx.bindings.sactive");

wx.app.component("wx-radiogroup", { resolve: "wx.components.radiogroup" })
    .component("wx-select", { resolve: "wx.components.select" });
