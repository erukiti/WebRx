///<reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../Collections/WeakMap.ts" />
/// <reference path="../Core/Resources.ts" />
/// <reference path="../Core/Injector.ts" />
/// <reference path="../Core/Globals.ts" />
/// <reference path="../Collections/Set.ts" />
/// <reference path="../Core/Environment.ts" />
/// <reference path="../Core/Module.ts" />

module wx {
    class ParamSet {
        constructor(params?) {
            utils.extend(params || {}, this);
        }

        $$new() {
            return utils.inherit(this, utils.extend({ $$parent: this }, new ParamSet()));
        }

        $$keys() {
            var keys = [], chain = [], parent = this,
                ignore = Object.keys(ParamSet.prototype);
            while (parent) { chain.push(parent); parent = parent.$$parent; }
            chain.reverse();
            chain.forEach(paramset => {
                Object.keys(paramset).forEach(key => {
                    if (indexOf(keys, key) === -1 && indexOf(ignore, key) === -1) keys.push(key);
                });
            });
            return keys;
        }

        $$values(paramValues) {
            var values = {}, self = this;
            self.$$keys().forEach(key => {
                values[key] = this[key].value(paramValues && paramValues[key]);
            });
            return values;
        }

        $$equals(paramValues1, paramValues2) {
            var equal = true, self = this;
            self.$$keys().forEach(key => {
                var left = paramValues1 && paramValues1[key], right = paramValues2 && paramValues2[key];
                if (!this[key].type.equals(left, right)) equal = false;
            });
            return equal;
        }

        $$validates(paramValues) {
            var keys = this.$$keys(), i, param, rawVal, normalized, encoded;
            for (i = 0; i < keys.length; i++) {
                param = this[keys[i]];
                rawVal = paramValues[keys[i]];
                if ((rawVal === undefined || rawVal === null) && param.isOptional)
                    break; // There was no parameter value, but the param is optional
                normalized = param.type.$normalize(rawVal);
                if (!param.type.is(normalized))
                    return false; // The value was not of the correct Type, and could not be decoded to the correct Type
                encoded = param.type.encode(normalized);
                if (typeof encoded === "string" && !param.type.pattern.exec(encoded))
                    return false; // The value was of the correct type, but when encoded, did not match the Type's regexp
            }
            return true;
        }

        $$parent = undefined;
    }

    class UrlMatcher {
        constructor(pattern, config, parentMatcher) {
            config = utils.extend(typeof config === "object" ? config : {}, { params: {} });

            // Find all placeholders and create a compiled pattern, using either classic or curly syntax:
            //   '*' name
            //   ':' name
            //   '{' name '}'
            //   '{' name ':' regexp '}'
            // The regular expression is somewhat complicated due to the need to allow curly braces
            // inside the regular expression. The placeholder regexp breaks down as follows:
            //    ([:*])([\w\[\]]+)              - classic placeholder ($1 / $2) (search version has - for snake-case)
            //    \{([\w\[\]]+)(?:\:( ... ))?\}  - curly brace placeholder ($3) with optional regexp/type ... ($4) (search version has - for snake-case
            //    (?: ... | ... | ... )+         - the regexp consists of any number of atoms, an atom being either
            //    [^{}\\]+                       - anything other than curly braces or backslash
            //    \\.                            - a backslash escape
            //    \{(?:[^{}\\]+|\\.)*\}          - a matched set of curly braces containing other atoms
            var placeholder = /([:*])([\w\[\]]+)|\{([\w\[\]]+)(?:\:((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,
                searchPlaceholder = /([:]?)([\w\[\]-]+)|\{([\w\[\]-]+)(?:\:((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,
                compiled = '^',
                last = 0,
                m,
                segments = this.segments = [],
                parentParams = parentMatcher ? parentMatcher.params : {},
                params = this.params = parentMatcher ? parentMatcher.params.$$new() : new ParamSet(),
                paramNames = [];

            function addParameter(id, type, config, location) {
                paramNames.push(id);
                if (parentParams[id]) return parentParams[id];
                if (!/^\w+(-+\w+)*(?:\[\])?$/.test(id)) throw new Error("Invalid parameter name '" + id + "' in pattern '" + pattern + "'");
                if (params[id]) throw new Error("Duplicate parameter name '" + id + "' in pattern '" + pattern + "'");
                params[id] = new $$UMFP.Param(id, type, config, location);
                return params[id];
            }

            function quoteRegExp(string, pattern?, squash?, optional?) {
                var surroundPattern = ['', ''], result = string.replace(/[\\\[\]\^$*+?.()|{}]/g, "\\$&");
                if (!pattern) return result;
                switch (squash) {
                case false:
                    surroundPattern = ['(', ')' + (optional ? "?" : "")];
                    break;
                case true:
                    surroundPattern = ['?(', ')?'];
                    break;
                default:
                    surroundPattern = ['(' + squash + "|", ')?'];
                    break;
                }
                return result + surroundPattern[0] + pattern + surroundPattern[1];
            }

            this.source = pattern;

            // Split into static segments separated by path parameter placeholders.
            // The number of segments is always 1 more than the number of parameters.
            function matchDetails(m, isSearch) {
                var arrayMode;
                var id = m[2] || m[3]; // IE[78] returns '' for unmatched groups instead of null
                var cfg = config.params[id];
                var segment = pattern.substring(last, m.index);
                var regexp = isSearch ? m[4] : m[4] || (m[1] == '*' ? '.*' : null);
                var type = $$UMFP.type(regexp || "string") || utils.inherit($$UMFP.type("string"), { pattern: new RegExp(regexp) });
                return {
                    id: id,
                    regexp: regexp,
                    segment: segment,
                    type: type,
                    cfg: cfg
                };
            }

            var p, param, segment;
            while ((m = placeholder.exec(pattern))) {
                p = matchDetails(m, false);
                if (p.segment.indexOf('?') >= 0) break; // we're into the search part

                param = addParameter(p.id, p.type, p.cfg, "path");
                compiled += quoteRegExp(p.segment, param.type.pattern.source, param.squash, param.isOptional);
                segments.push(p.segment);
                last = placeholder.lastIndex;
            }
            segment = pattern.substring(last);

            // Find any search parameter names and remove them from the last segment
            var i = segment.indexOf('?');

            if (i >= 0) {
                var search = this.sourceSearch = segment.substring(i);
                segment = segment.substring(0, i);
                this.sourcePath = pattern.substring(0, last + i);

                if (search.length > 0) {
                    last = 0;
                    while ((m = searchPlaceholder.exec(search))) {
                        p = matchDetails(m, true);
                        param = addParameter(p.id, p.type, p.cfg, "search");
                        last = placeholder.lastIndex;
                        // check if ?&
                    }
                }
            } else {
                this.sourcePath = pattern;
                this.sourceSearch = '';
            }

            compiled += quoteRegExp(segment) + (config.strict === false ? '\/?' : '') + '$';
            segments.push(segment);

            this.regexp = new RegExp(compiled, config.caseInsensitive ? 'i' : undefined);
            this.prefix = segments[0];
            this.$$paramNames = paramNames;
        }

        private regexp: RegExp;
        private prefix: any;
        private sourcePath: any;
        private sourceSearch: any;
        private $$paramNames: any;
        private source: any;
        private segments: any;
        private params: any;
        private pattern = /.*/;
        private name: string;

        public concat(pattern, config) {
            // Because order of search parameters is irrelevant, we can add our own search
            // parameters to the end of the new pattern. Parse the new pattern by itself
            // and then join the bits together, but it's much easier to do this on a string level.
            var defaultConfig = {
                caseInsensitive: false, //$$UMFP.caseInsensitive(),
                strict: false,  // $$UMFP.strictMode(),
                squash: false,  // $$UMFP.defaultSquashPolicy()
            };
            return new UrlMatcher(this.sourcePath + pattern + this.sourceSearch, utils.extend(defaultConfig, config), this);
        }

        public exec(path, searchParams) {
            var m = this.regexp.exec(path);
            if (!m) return null;
            searchParams = searchParams || {};

            var paramNames = this.parameters(),
                nTotal = paramNames.length,
                nPath = this.segments.length - 1,
                values = {},
                i,
                j,
                cfg,
                paramName;

            if (nPath !== m.length - 1) throw new Error("Unbalanced capture group in route '" + this.source + "'");

            function decodePathArray(string) {
                function reverseString(str) { return str.split("").reverse().join(""); }

                function unquoteDashes(str) { return str.replace(/\\-/g, "-"); }

                var split = reverseString(string).split(/-(?!\\)/);
                var allReversed = split.map(x=> reverseString(x));
                return allReversed.map(x=> unquoteDashes(x)).reverse();
            }

            for (i = 0; i < nPath; i++) {
                paramName = paramNames[i];
                var param = this.params[paramName];
                var paramVal = m[i + 1];
                // if the param value matches a pre-replace pair, replace the value before decoding.
                for (j = 0; j < param.replace; j++) {
                    if (param.replace[j].from === paramVal) paramVal = param.replace[j].to;
                }
                if (paramVal && param.array === true) paramVal = decodePathArray(paramVal);
                values[paramName] = param.value(paramVal);
            }
            for ( /**/; i < nTotal; i++) {
                paramName = paramNames[i];
                values[paramName] = this.params[paramName].value(searchParams[paramName]);
            }

            return values;
        }

        public parameters(param?) {
            if (param === undefined)
                return this.$$paramNames;
            return this.params[param] || null;
        }

        public validates(params) {
            return this.params.$$validates(params);
        }

        public format(values) {
            values = values || {};
            var segments = this.segments, params = this.parameters(), paramset = this.params;
            if (!this.validates(values)) return null;

            var i, search = false, nPath = segments.length - 1, nTotal = params.length, result = segments[0];

            function encodeDashes(str) { // Replace dashes with encoded "\-"
                return encodeURIComponent(str).replace(/-/g, c => ('%5C%' + c.charCodeAt(0).toString(16).toUpperCase()));
            }

            for (i = 0; i < nTotal; i++) {
                var isPathParam = i < nPath;
                var name = params[i], param = paramset[name], value = param.value(values[name]);
                var isDefaultValue = param.isOptional && param.type.equals(param.value(), value);
                var squash = isDefaultValue ? param.squash : false;
                var encoded = param.type.encode(value);

                if (isPathParam) {
                    var nextSegment = segments[i + 1];
                    if (squash === false) {
                        if (encoded != null) {
                            if (Array.isArray(encoded)) {
                                result += encoded.map(x=> encodeDashes(x)).join("-");
                            } else {
                                result += encodeURIComponent(encoded);
                            }
                        }
                        result += nextSegment;
                    } else if (squash === true) {
                        var capture = result.match(/\/$/) ? /\/?(.*)/ : /(.*)/;
                        result += nextSegment.match(capture)[1];
                    } else if (typeof squash === "string") {
                        result += squash + nextSegment;
                    }
                } else {
                    if (encoded == null || (isDefaultValue && squash !== false)) continue;
                    if (!Array.isArray(encoded)) encoded = [encoded];
                    encoded = encoded.map(x=> encodeURIComponent(x)).join('&' + name + '=');
                    result += (search ? '&' : '?') + (name + '=' + encoded);
                    search = true;
                }
            }

            return result;
        }

        public Type(config) {
            utils.extend(config, this);
        }

        public is(val, key?) {
            return true;
        }

        public encode(val, key) {
            return val;
        }

        public decode(val, key?) {
            return val;
        }

        public equals(a, b) {
            return a == b;
        }

        public $subPattern() {
            var sub = this.pattern.toString();
            return sub.substr(1, sub.length - 2);
        }

        public toString() {
            return "{Type:" + this.name + "}";
        }

        public $normalize(val) {
            return this.is(val) ? val : this.decode(val);
        }

        public $asArray(mode, isSearch) {
            if (!mode) return this;
            if (mode === "auto" && !isSearch) throw new Error("'auto' array mode is for query parameters only");

            function ArrayType(type, mode) {
                function bindTo(type, callbackName) {
                    return () => type[callbackName].apply(type, arguments);
                }

                // Wrap non-array value as array
                function arrayWrap(val) { return Array.isArray(val) ? val : (val !== undefined ? [val] : []); }

                // Unwrap array value for "auto" mode. Return undefined for empty array.
                function arrayUnwrap(val) {
                    switch (val.length) {
                    case 0:
                        return undefined;
                    case 1:
                        return mode === "auto" ? val[0] : val;
                    default:
                        return val;
                    }
                }

                function falsey(val) { return !val; }

                // Wraps type (.is/.encode/.decode) functions to operate on each value of an array
                function arrayHandler(callback, allTruthyMode?) {
                    return val => {
                        val = arrayWrap(val);
                        var result = val.map(x=> callback);
                        if (allTruthyMode === true)
                            return result.filter(x=> falsey(x)).length === 0;
                        return arrayUnwrap(result);
                    };
                }

                // Wraps type (.equals) functions to operate on each value of an array
                function arrayEqualsHandler(callback) {
                    return (val1, val2) => {
                        var left = arrayWrap(val1), right = arrayWrap(val2);
                        if (left.length !== right.length) return false;
                        for (var i = 0; i < left.length; i++) {
                            if (!callback(left[i], right[i])) return false;
                        }
                        return true;
                    };
                }

                this.encode = arrayHandler(bindTo(type, 'encode'));
                this.decode = arrayHandler(bindTo(type, 'decode'));
                this.is = arrayHandler(bindTo(type, 'is'), true);
                this.equals = arrayEqualsHandler(bindTo(type, 'equals'));
                this.pattern = type.pattern;
                this.$normalize = arrayHandler(bindTo(type, '$normalize'));
                this.name = type.name;
                this.$arrayMode = mode;
            }

            return new ArrayType(this, mode);
        }
    }
}
