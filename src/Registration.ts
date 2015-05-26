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
import { app } from "./Core/Module"

"use strict";

injector.register(res.expressionCompiler, ExpressionCompiler)
    .register(res.htmlTemplateEngine, [HtmlTemplateEngine], true)
    .register(res.domManager, [res.expressionCompiler, DomManager], true)
    .register(res.router, [res.domManager, Router], true)
    .register(res.messageBus, [MessageBus], true);

injector.register("bindings.module", [res.domManager, ModuleBinding], true)
    .register("bindings.command", [res.domManager, CommandBinding], true)
    .register("bindings.if", [res.domManager, IfBinding], true)
    .register("bindings.with", [res.domManager, WithBinding], true)
    .register("bindings.notif", [res.domManager, NotIfBinding], true)
    .register("bindings.css", [res.domManager, CssBinding], true)
    .register("bindings.attr", [res.domManager, AttrBinding], true)
    .register("bindings.style", [res.domManager, StyleBinding], true)
    .register("bindings.text", [res.domManager, TextBinding], true)
    .register("bindings.html", [res.domManager, HtmlBinding], true)
    .register("bindings.visible", [res.domManager, VisibleBinding], true)
    .register("bindings.hidden", [res.domManager, HiddenBinding], true)
    .register("bindings.enabled", [res.domManager, EnableBinding], true)
    .register("bindings.disabled", [res.domManager, DisableBinding], true)
    .register("bindings.foreach", [res.domManager, ForEachBinding], true)
    .register("bindings.event", [res.domManager, EventBinding], true)
    .register("bindings.keyPress", [res.domManager, KeyPressBinding], true)
    .register("bindings.textInput", [res.domManager, TextInputBinding], true)
    .register("bindings.checked", [res.domManager, CheckedBinding], true)
    .register("bindings.selectedValue", [res.domManager, SelectedValueBinding], true)
    .register("bindings.component", [res.domManager, ComponentBinding], true)
    .register("bindings.value", [res.domManager, ValueBinding], true)
    .register("bindings.hasFocus", [res.domManager, HasFocusBinding], true)
    .register("bindings.view", [res.domManager, res.router, ViewBinding], true)
    .register("bindings.sref", [res.domManager, res.router, StateRefBinding], true)
    .register("bindings.sactive", [res.domManager, res.router, StateActiveBinding], true);

injector.register("components.radiogroup", [res.htmlTemplateEngine, RadioGroupComponent])
    .register("components.select", [res.htmlTemplateEngine, SelectComponent]);

// initialize app module
app.binding("module", "bindings.module")
    .binding("css", "bindings.css")
    .binding("attr", "bindings.attr")
    .binding("style", "bindings.style")
    .binding("command", "bindings.command")
    .binding("if", "bindings.if")
    .binding("with", "bindings.with")
    .binding("ifnot", "bindings.notif")
    .binding("text", "bindings.text")
    .binding("html", "bindings.html")
    .binding("visible", "bindings.visible")
    .binding("hidden", "bindings.hidden")
    .binding("disabled", "bindings.disabled")
    .binding("enabled", "bindings.enabled")
    .binding("foreach", "bindings.foreach")
    .binding("event", "bindings.event")
    .binding(["keyPress", "keypress"], "bindings.keyPress")
    .binding(["textInput", "textinput"], "bindings.textInput")
    .binding("checked", "bindings.checked")
    .binding("selectedValue", "bindings.selectedValue")
    .binding("component", "bindings.component")
    .binding("value", "bindings.value")
    .binding(["hasFocus", "hasfocus"], "bindings.hasFocus")
    .binding("view", "bindings.view")
    .binding(["sref", "stateRef", "stateref"], "bindings.sref")
    .binding(["sactive", "stateActive", "stateactive"], "bindings.sactive");

app.component("wx-radiogroup", { resolve: "components.radiogroup" })
    .component("wx-select", { resolve: "components.select" });
