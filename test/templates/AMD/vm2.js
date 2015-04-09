// AMD module 'some/module.js' encapsulating the configuration for a component
define([], function () {
    function ViewModel(params) {
        // define a binding-property
        this.foo = 'bar';

        // invoke test-case callback
        if (window["vmHook"]) {
            window["vmHook"](params);
        }

        // install postBindingInit that invokes second test-case callback
        this.init = function () {
            // interface with test-cases via global object
            if (window["vmHook"]) {
                window["vmHook"]();
            }
        }
    }

    return ViewModel;
});