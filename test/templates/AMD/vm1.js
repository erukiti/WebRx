define({
    foo: 'bar',
    init: function () {
        // interface with test-cases via global object
        if (window["vm1Hook"]) {
            window["vm1Hook"]();
        }
    }
});