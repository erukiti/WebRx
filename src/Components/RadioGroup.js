define(["require", "exports"], function (require, exports) {
    var wx;
    (function (wx) {
        var RadioGroupComponent = (function () {
            function RadioGroupComponent(options) {
                this.template = "<div data-bind='foreach: $data><input type='radio' data-bind='{0}'></div>";
                this.viewModel = options.items;
                var bindings = [];
                if (options.selectedValue) {
                    bindings.push({ key: "selectedValue", value: options.selectedValue });
                }
                bindings.push({ key: "text", value: options.itemText || "$data" });
                bindings.push({ key: "value", value: options.itemValue || "$data" });
                var bindingString = bindings.map(function (x) { return utils.formatString("{0}: {1}", x.key, x.value); }).join(", ");
                console.log(bindingString);
                this.template = utils.formatString(this.template, bindingString);
                console.log(this.template);
            }
            return RadioGroupComponent;
        })();
        var internal;
        (function (internal) {
            internal.radioGroupComponentConstructor = RadioGroupComponent;
        })(internal = wx.internal || (wx.internal = {}));
    })(wx || (wx = {}));
});
//# sourceMappingURL=RadioGroup.js.map