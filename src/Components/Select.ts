///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Core/Utils.ts" />
/// <reference path="../Core/DomManager.ts" />
/// <reference path="../Core/List.ts" />

module wx {
    export interface ISelectComponentParams {
        name?: string;
        items: any;
        itemText?: string;
        itemValue?: string;
        itemClass?: string;
        multiple?: boolean;
        required?: boolean;
        autofocus?: boolean;
        size?: number;
        selectedValue?: any;
        afterRender?(nodes: Node[], data: any): void;
        noCache?: boolean;
    }

    var templateCache: { [key: string]: any } = {};

    class SelectComponent implements IComponent {
        constructor(htmlTemplateEngine: ITemplateEngine) {
            this.htmlTemplateEngine = htmlTemplateEngine;
        }

        public template = (params: any): Node[]=> {
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

        htmlTemplateEngine: ITemplateEngine;

        protected buildTemplate(params: ISelectComponentParams): Node[] {
            var result: string;
            var key: string = undefined;
            var nodes: Node[];

            // check cache
            if (!params.noCache) {
                key = (params.name != null ? params.name : "") + "-" +
                    (params.itemText != null ? params.itemText : "") + "-" +
                    (params.itemValue != null ? params.itemValue : "") + "-" +
                    (params.itemClass != null ? params.itemClass : "") + "-" +
                    (params.selectedValue != null ? "true" : "false") + "-" +
                    (params.multiple ? "true" : "false") + "-" +
                    (params.required ? "true" : "false") + "-" +
                    (params.autofocus ? "true" : "false") + "-" +
                    (params.size ? params.size.toString() : "0");

                nodes = templateCache[key];
 
                if (nodes != null) {
                    //console.log("cache hit", key, result);
                    return nodes;
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

            // name
            if (params.multiple) {
                attrs.push({ key: 'name', value: params.name });
            }

            // multi-select
            if (params.multiple) {
                attrs.push({ key: 'multiple', value: "true" });
            }

            // size
            if (params.multiple !== undefined) {
                attrs.push({ key: 'size', value: params.size.toString() });
            }

            // required
            if (params.required) {
                attrs.push({ key: 'required', value: "true" });
            }

            // required
            if (params.autofocus) {
                attrs.push({ key: 'autofocus', value: "true" });
            }

            // assemble attr-binding
            if (attrs.length)
                bindings.push({ key: "attr", value: "{ " + attrs.map(x => x.key + ": " + x.value).join(", ") + " }" });

            // assemble all bindings
            var bindingString = bindings.map(x => x.key + ": " + x.value).join(", ");

            // assemble template
            result = formatString(result, bindingString);
            //console.log(result);

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
        export var selectComponentConstructor = <any> SelectComponent;
    }
}