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
            var opt = <IRadioGroupComponentParams> params;

            var groupName = opt.groupName != null ?
                opt.groupName :
                utils.formatString("wx-radiogroup-{0}", groupId++);

            return {
                items: params.items,
                selectedValue: params.selectedValue,
                groupName: groupName
            };
        }

        ////////////////////
        // Implementation

        protected buildTemplate(params: IRadioGroupComponentParams): string {
            var template = '<div class="wx-radiogroup" data-bind="foreach: items"><input type="radio" data-bind="{0}">{1}</div>';
            var perItemExtraMarkup = "";

            // construct item bindings
            var bindings: Array<{ key: string; value: string }> = [];
            var attrs: Array<{ key: string; value: string }> = [];

            // value
            bindings.push({ key: "value", value: params.itemValue || "$data" });

            // name
            attrs.push({ key: 'name', value: "$parent.groupName" });

            // selection (two-way)
            if (params.selectedValue) {
                bindings.push({ key: "selectedValue", value: "@$parent.selectedValue" });
            }

            // label
            if (params.itemText) {
                perItemExtraMarkup += utils.formatString('<label data-bind="text: {0}, attr: { for: {1} }"></label>',
                    params.itemText, "groupName + '-' + $index");

                attrs.push({ key: 'id', value: "groupName + '-' + $index" });
            }

            // per-item css class
            if (params.itemClass) {
                attrs.push({ key: 'class', value: "'" + params.itemClass + "'" });
            }

            // assemble attr-binding
            if (attrs.length)
                bindings.push({ key: "attr", value: "{ " + attrs.map(x => x.key + ": " + x.value).join(", ") + " }" });

            // assemble all bindings
            var bindingString = bindings.map(x => x.key + ": " + x.value).join(", ");

            // assemble template
            template = utils.formatString(template, bindingString, perItemExtraMarkup);
            return template;
        }
    }

    export module internal {
        export var radioGroupComponentConstructor = <any> RadioGroupComponent;
    }
}