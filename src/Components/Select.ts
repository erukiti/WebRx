///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../Services/DomService.ts" />
/// <reference path="../Core/List.ts" />

module wx {
    export interface ISelectComponentParams {
        items: any;
        itemText?: string;
        itemValue?: string;
        itemClass?: string;
        selectedValue?: any;
        afterRender?(nodes: Node[], data: any): void;
        noCache?: boolean;
    }

    var groupId = 0;
    var templateCache: { [key: string]: any } = {};

    class SelectComponent implements IComponent {
        public template = (params: any): string => {
            return this.buildTemplate(params);
        }

        public viewModel = (params: any): any => {
            var opt = <ISelectComponentParams> params;

            return {
                items: params.items,
                selectedValue: params.selectedValue,
                hooks: { afterRender: opt.afterRender }
            };
        }

        ////////////////////
        // Implementation

        protected buildTemplate(params: ISelectComponentParams): string {
            var result: string;
            var key: string = undefined;

            // check cache
            if (!params.noCache) {
                key = (params.itemText != null ? params.itemText : "") + "-" +
                    (params.itemValue != null ? params.itemValue : "") + "-" +
                    (params.itemClass != null ? params.itemClass : "") + "-" +
                    (params.selectedValue != null ? "true" : "false");

                result = templateCache[key];
 
                if (result != null) {
                    //console.log("cache hit", key, result);
                    return result;
                }
            }

            // base-template
            if(params.selectedValue)
                result = '<select class="wx-select" data-bind="foreach: { data: items, hooks: hooks }, selectedValue: @selectedValue"><option data-bind="{0}"></option></select>';
            else
                result = '<select class="wx-select" data-bind="foreach: { data: items, hooks: hooks }"><option data-bind="{0}"></option></select>';

            // construct item bindings
            var bindings: Array<{ key: string; value: string }> = [];
            var attrs: Array<{ key: string; value: string }> = [];

            // value
            bindings.push({ key: "value", value: params.itemValue || "$data" });

            // label
            bindings.push({ key: 'text', value: params.itemText || "$data" });

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
            result = utils.formatString(result, bindingString);
            console.log(result);

            // store
            if (!params.noCache) {
                templateCache[key] = result;
            }

            return result;
        }
    }

    export module internal {
        export var selectComponentConstructor = <any> SelectComponent;
    }
}