define({
    foo: 'bar',
    init: function () {
        // interface with test-cases via global object
        if (window["vmHook"]) {
            window["vmHook"]();
        }
    }
});