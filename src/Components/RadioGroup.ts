///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Core/List.ts" />

module wx {
    export interface IRadioGroupComponentParams {
        items: any;
        groupName?: string;
        itemText?: string;
        itemValue?: string;
        itemClass?: string;
        selectedValue?: any;
    }

    var groupId = 0;

    class RadioGroupComponent implements IComponent {
        ////////////////////
        // IComponent

        public template = (params: any): string => {
            return this.buildTemplate(params);
        }

        public viewModel = (params: any): any => {
            return { items: params.items, selectedValue: params.selectedValue };
        }

        ////////////////////
        // Implementation

        protected buildTemplate(params: IRadioGroupComponentParams): string {
            var template = '<div data-bind="foreach: items"><input type="radio" data-bind="{0}">{1}</div>';
            var groupName = params.groupName || utils.formatString("wx-radiogroup-{0}", groupId++);
            var perItemExtraMarkup = "";

            // construct item bindings
            var bindings: Array<{ key: string; value: string }> = [];

            bindings.push({ key: "value", value: params.itemValue || "$data" });
            bindings.push({ key: "attr", value: "{ name: '" + groupName + "' }" });

            if (params.selectedValue) {
                bindings.push({ key: "selectedValue", value: "@$parent.selectedValue" });
            }

            if (params.itemText) {
                perItemExtraMarkup += utils.formatString('<label data-bind="text: {0}, attr: { for: {1} }"></label>',
                    params.itemText, "'" + groupName + "' + '-' + $index");

                bindings.push({ key: "attr", value: "{ id: '" + groupName + "' + '-' + $index }" });
            }

            if (params.itemClass) {
                bindings.push({ key: "attr", value: "{ class: '" + params.itemClass + "'}" });
            }

            var bindingString = bindings.map(x => x.key + ": " + x.value).join(", ");

            // create final template
            template = utils.formatString(template, bindingString, perItemExtraMarkup);
            //console.log(template);

            return template;
        }
    }

    export module internal {
        export var radioGroupComponentConstructor = <any> RadioGroupComponent;
    }
}