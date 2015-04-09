// AMD module 'some/module.js' encapsulating the configuration for a component
define([], function () {
    function MyComponentViewModel(params) {
        this.personName = ko.observable(params.name);
    }

    return {
        viewModel: MyComponentViewModel,
        template: 'The name is <strong data-bind="text: personName"></strong>'
    };
});