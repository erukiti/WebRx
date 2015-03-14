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
        afterRender?(nodes: Node[], data: any): void;
        noCache?: boolean;
    }

    var groupId = 0;
    var templateCache: { [key: string]: any } = {};

    class RadioGroupComponent implements IComponent {
        constructor(htmlTemplateEngine: ITemplateEngine) {
            this.htmlTemplateEngine = htmlTemplateEngine;
        }

        public template = (params: any): Node[] => {
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
                groupName: groupName,
                hooks: { afterRender: params.afterRender }
            };
        }

        ////////////////////
        // Implementation

        htmlTemplateEngine: ITemplateEngine;

        protected buildTemplate(params: IRadioGroupComponentParams): Node[] {
            var result: string;
            var key: string = undefined;
            var nodes: Node[];

            // check cache
            if (!params.noCache) {
                key = (params.itemText != null ? params.itemText : "") + "-" +
                    (params.itemValue != null ? params.itemValue : "") + "-" +
                    (params.itemClass != null ? params.itemClass : "") + "-" +
                    (params.selectedValue != null ? "true" : "false");

                nodes = templateCache[key];
 
                if (nodes != null) {
                    //console.log("cache hit", key, result);
                    return nodes;
                }
            }

            // base-template
            result = '<div class="wx-radiogroup" data-bind="foreach: { data: items, hooks: hooks }"><input type="radio" data-bind="{0}">{1}</div>';
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
                    params.itemText, "$parent.groupName + '-' + $index");

                attrs.push({ key: 'id', value: "$parent.groupName + '-' + $index" });
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
            result = utils.formatString(result, bindingString, perItemExtraMarkup);

            // store
            if (!params.noCache) {
                templateCache[key] = result;
            }

            // app.templateEngine can be altered by developer therefore we make sure to parse using HtmlTemplateEngine
            nodes = this.htmlTemplateEngine.parse(result);

            return nodes;
        }
    }

    export module internal {
        export var radioGroupComponentConstructor = <any> RadioGroupComponent;
    }
}