/// <reference path="../typings/jasmine.d.ts" />
/// <reference path="../typings/jasmine-jquery.d.ts" />
/// <reference path="../../build/web.rx.d.ts" />

describe("ExpressionCompiler", function () {
    function testImpl(compiler: wx.IExpressionCompiler, withHooks: boolean) {

        var readHookInvocationCount;
        var writeHookInvocationCount;
        var readIndexHookInvocationCount;
        var writeIndexHookInvocationCount;

        function getHooks() {
            readHookInvocationCount = 0;
            writeHookInvocationCount = 0;
            readIndexHookInvocationCount = 0;
            writeIndexHookInvocationCount = 0;

            return {
                readFieldHook: (o: any, field: any): any => {
                    readHookInvocationCount++;
                    return o[field];
                },
                writeFieldHook: (o: any, field: any, newValue: any): any => {
                    writeHookInvocationCount++;
                    o[field] = newValue;
                    return newValue;
                },
                readIndexHook: (o: any, field: any): any => {
                    readIndexHookInvocationCount++;
                    return o[field];
                },
                writeIndexFieldHook: (o: any, field: any, newValue: any): any => {
                    writeIndexHookInvocationCount++;
                    o[field] = newValue;
                }
            };
        }

        function getLocals() {
            var locals = {};

            if (withHooks)
                compiler.setRuntimeHooks(locals, getHooks());

            return locals;
        }

        describe("compile(src)" + (withHooks ? "- with pass-through hooks" : ""), function() {
            var scope;
            var evaluate: (scope?: any, locals?: any) => any;

            beforeEach(function() {
                scope = {
                    ship: {
                        pirate: {
                            name: "Jenny"
                        }
                    }
                };
            });

            it("should return a function", function() {
                expect(typeof compiler.compileExpression("") === "function").toBeTruthy();
            });

            it("should throw an error if the given value is not a string", function() {
                expect(function() {
                    compiler.compileExpression(undefined);
                }).toThrowError(/src must be a string/);
            });

            describe("when evaluating literals", function() {

                it("should return null", function() {
                    evaluate = compiler.compileExpression("null");
                    expect(evaluate(scope, getLocals())).toEqual(null);
                });

                it("should return true", function() {
                    evaluate = compiler.compileExpression("true");
                    expect(evaluate(scope, getLocals())).toEqual(true);
                });

                it("should return false", function() {
                    evaluate = compiler.compileExpression("false");
                    expect(evaluate(scope, getLocals())).toEqual(false);
                });

                it("should return 2.34e5", function() {
                    evaluate = compiler.compileExpression("2.34e5");
                    expect(evaluate(scope, getLocals())).toEqual(2.34e5);
                });

                it("should return 'string'", function() {
                    evaluate = compiler.compileExpression("'string'");
                    expect(evaluate(scope, getLocals())).toEqual("string");
                });

                it("should return [ship, 1, 2, []]", function() {
                    evaluate = compiler.compileExpression("[ship, 1, 2, []]");
                    expect(evaluate(scope, getLocals())).toEqual([scope.ship, 1, 2, []]);
                });

                it("should return { test: 'value', 'new-object': {} }", function() {
                    evaluate = compiler.compileExpression("{ test: 'value', 'new-object': {} }");
                    expect(evaluate(scope, getLocals())).toEqual({ test: "value", "new-object": {} });
                });

            });

            describe("when evaluating simple key look-ups", function() {

                it("should return the value if its defined on scope", function() {
                    evaluate = compiler.compileExpression("ship");
                    expect(evaluate(scope, getLocals())).toEqual(scope.ship);

                    if (withHooks) {
                        expect(readHookInvocationCount).toEqual(1);
                        expect(writeHookInvocationCount).toEqual(0);
                    }
                });

                it("should return undefined instead of throwing a ReferenceError if it's not defined on scope", function() {
                    evaluate = compiler.compileExpression("notDefined");
                    expect(evaluate(scope, getLocals())).toEqual(undefined);
                });

                it("should return undefined even when the 'this' keyword is used", function() {
                    evaluate = compiler.compileExpression("this");
                    expect(evaluate(scope, getLocals())).toEqual(undefined);
                });

            });

            describe("when evaluating simple assignments", function() {

                it("should set the new value on scope", function() {
                    evaluate = compiler.compileExpression("newValue = 'new'");
                    evaluate(scope, getLocals());
                    expect(scope.newValue).toEqual("new");

                    if (withHooks) {
                        expect(writeHookInvocationCount).toEqual(1);
                    }
                });

                it("should change the value if its defined on scope", function() {
                    evaluate = compiler.compileExpression("ship = 'ship'");
                    evaluate(scope, getLocals());
                    expect(scope.ship).toEqual("ship");

                    if (withHooks) {
                        expect(writeHookInvocationCount).toEqual(1);
                    }
                });

            });

            describe("when evaluating dot-notated loop-ups", function() {

                it("should return the value if its defined on scope", function() {
                    evaluate = compiler.compileExpression("ship.pirate.name");
                    expect(evaluate(scope, getLocals())).toEqual("Jenny");

                    if (withHooks) {
                        expect(readHookInvocationCount).toEqual(3);
                        expect(writeHookInvocationCount).toEqual(0);
                    }
                });

                it("should return undefined instead of throwing a ReferenceError if it's not defined on scope", function() {
                    evaluate = compiler.compileExpression("island.pirate.name");
                    expect(evaluate(scope, getLocals())).toEqual(undefined);
                });

            });

            describe("when evaluating dot-notated assignments", function() {

                it("should set the new value on scope", function() {
                    evaluate = compiler.compileExpression("island.pirate.name = 'Störtebeker'");
                    evaluate(scope, getLocals());
                    expect(scope.island.pirate.name).toEqual("Störtebeker");

                    if (withHooks) {
                        expect(readHookInvocationCount).toEqual(2);
                        expect(writeHookInvocationCount).toEqual(3);    // 3 because the ".pirate.name" part will result in two objects to prevent null-references
                    }
                });

                it("should change the value if its defined on scope", function() {
                    evaluate = compiler.compileExpression("ship.pirate.name = 'Störtebeker'");
                    evaluate(scope, getLocals());
                    expect(scope.ship.pirate.name).toEqual("Störtebeker");

                    if (withHooks) {
                        expect(readHookInvocationCount).toEqual(2); // ship.pirate
                        expect(writeHookInvocationCount).toEqual(1); // .name = 'Störtebeker'
                    }
                });

            });

            describe("when evaluating array look-ups", function() {

                beforeEach(function() {
                    scope.ships = [
                        { pirate: "Jenny" },
                        { pirate: "Störtebeker" }
                    ];
                });

                it("should return the value if its defined on scope", function() {
                    evaluate = compiler.compileExpression("ships[1].pirate");
                    expect(evaluate(scope, getLocals())).toEqual("Störtebeker");

                    if (withHooks) {
                        expect(readIndexHookInvocationCount).toEqual(1);
                        expect(writeIndexHookInvocationCount).toEqual(0);
                    }
                });

                it("should return undefined instead of throwing a ReferenceError if it's not defined on scope", function() {
                    evaluate = compiler.compileExpression("ships[2].pirate");
                    expect(evaluate(scope, getLocals())).toEqual(undefined);

                    if (withHooks) {
                        expect(readIndexHookInvocationCount).toEqual(1);
                        expect(writeIndexHookInvocationCount).toEqual(0);
                    }
                });

            });

            describe("when evaluating array assignments", function() {

                it("should change the value if its defined on scope", function() {
                    scope.ships = [
                        { pirate: "Jenny" }
                    ];
                    evaluate = compiler.compileExpression("ships[0].pirate = 'Störtebeker'");
                    evaluate(scope, getLocals());
                    expect(scope.ships[0].pirate).toEqual("Störtebeker");

                    if (withHooks) {
                        expect(readIndexHookInvocationCount).toEqual(1);
                        expect(writeIndexHookInvocationCount).toEqual(0);
                    }
                });

                it("should throw an error if the array doesn't exist", function() {
                    var obj,
                        err;

                    try {
                        // first we're creating the same type of error because the error messages differ
                        // between javascript implementations
                        obj.pirate;
                    } catch (e) {
                        err = e;
                    }

                    evaluate = compiler.compileExpression("ships[0].pirate.name = 'Jenny'");
                    expect(function() {
                        evaluate(scope, getLocals());
                    }).toThrowError();
                });

            });

            describe("when evaluating function calls", function() {

                describe("using no arguments", function() {

                    it("should return the function's return value", function() {
                        scope.findPirate = function() {
                            return scope.ship.pirate;
                        };

                        evaluate = compiler.compileExpression("findPirate()");
                        expect(evaluate(scope, getLocals())).toEqual(scope.ship.pirate);
                    });

                    it("should call the function on the scope", function() {
                        scope.returnThis = function() {
                            return this;
                        };
                        evaluate = compiler.compileExpression("returnThis()");
                        expect(evaluate(scope, getLocals())).toEqual(scope);
                    });

                    it("should call the function on the object where it is defined", function() {
                        scope.ship.returnThis = function() {
                            return this;
                        };
                        evaluate = compiler.compileExpression("ship.returnThis()");
                        expect(evaluate(scope, getLocals())).toEqual(scope.ship);
                    });

                });

                describe("using arguments", function() {

                    it("should parse the arguments accordingly", function() {
                        scope.findPirate = function(pirate) {
                            return Array.prototype.slice.call(arguments);
                        };
                        evaluate = compiler.compileExpression("findPirate(ship.pirate, 1, [2, 3])");
                        expect(evaluate(scope, getLocals())).toEqual([scope.ship.pirate, 1, [2, 3]]);
                    });

                });

            });

            describe("when evaluating operators", function() {

                it("should return the expected result when using +", function() {
                    evaluate = compiler.compileExpression("1 + 1");
                    expect(evaluate()).toEqual(2);
                });

                it("should return the expected result when using -", function() {
                    evaluate = compiler.compileExpression("1 - 1");
                    expect(evaluate()).toEqual(0);
                });

                it("should return the expected result when using *", function() {
                    evaluate = compiler.compileExpression("2 * 2");
                    expect(evaluate()).toEqual(4);
                });

                it("should return the expected result when using /", function() {
                    evaluate = compiler.compileExpression("4 / 2");
                    expect(evaluate()).toEqual(2);
                });

                it("should return the expected result when using %", function() {
                    evaluate = compiler.compileExpression("3 % 2");
                    expect(evaluate()).toEqual(1);
                });

                it("should return the expected result when using &&", function() {
                    evaluate = compiler.compileExpression("true && true");
                    expect(evaluate()).toEqual(true);
                    evaluate = compiler.compileExpression("true && false");
                    expect(evaluate()).toEqual(false);
                    evaluate = compiler.compileExpression("false && false");
                    expect(evaluate()).toEqual(false);
                });

                it("should return the expected result when using ||", function() {
                    evaluate = compiler.compileExpression("true || true");
                    expect(evaluate()).toEqual(true);
                    evaluate = compiler.compileExpression("true || false");
                    expect(evaluate()).toEqual(true);
                    evaluate = compiler.compileExpression("false || false");
                    expect(evaluate()).toEqual(false);
                });

                it("should return the expected result when using !", function() {
                    evaluate = compiler.compileExpression("!true");
                    expect(evaluate()).toEqual(false);
                    evaluate = compiler.compileExpression("!false");
                    expect(evaluate()).toEqual(true);
                });

                /* Ooops, angular doesn't support ++. Maybe someday?
            it("should return the expected result when using ++", function () {
                scope.value = 2;
                evaluate = compiler.compile("value++");
                expect(evaluate()).toEqual(3);
                expect(scope.value).toEqual(3);
            });*/

                /* Ooops, angular doesn't support --. Maybe someday?
            it("should return the expected result when using --", function () {
                scope.value = 2;
                evaluate = compiler.compile("value--");
                expect(evaluate()).toEqual(1);
                expect(scope.value).toEqual(1);
            });*/

                it("should return the expected result when using ?", function() {
                    evaluate = compiler.compileExpression("true? 'it works' : false");
                    expect(evaluate()).toEqual("it works");
                    evaluate = compiler.compileExpression("false? false : 'it works'");
                    expect(evaluate()).toEqual("it works");
                });

            });

            describe("using complex expressions", function() {

                beforeEach(function() {
                    scope.ships = [
                        { pirate: function(str) { return str; } },
                        { pirate: function(str) { return str; } }
                    ];
                    scope.index = 0;
                    scope.pi = "pi";
                    scope.Jenny = "Jenny";
                });

                it("should still be parseable and executable", function() {
                    evaluate = compiler.compileExpression("ships[index][pi + 'rate'](Jenny)");
                    expect(evaluate(scope, getLocals())).toEqual("Jenny");
                });

            });

            describe("when evaluating syntactical errors", function() {

                it("should give a readable error message", function() {
                    expect(function() {
                        compiler.compileExpression("'unterminated string");
                    }).toThrowError(/Lexer Error: Unterminated quote/);
                });

                it("should give a readable error message", function() {
                    expect(function() {
                        compiler.compileExpression("3 = 4");
                    }).toThrowError(/Token '=' implies assignment/);
                });

            });

            describe("when using filters", function() {

                it("should apply the given filter", function () {
                    var options: wx.IExpressionCompilerOptions = {
                        filters: {
                            currency: function(input, currency, digits) {
                                input = input.toFixed(digits);

                                if (currency === "EUR") {
                                    return input + "€";
                                } else {
                                    return input + "$";
                                }
                            }

                        }
                    };

                    evaluate = compiler.compileExpression("1.2345 | currency:selectedCurrency:2", options);
                    expect(evaluate({
                        selectedCurrency: "EUR"
                    }, getLocals())).toEqual("1.23€");
                });

            });

            describe("when evaluating the same expression multiple times", function() {

                it("should cache the generated function", function() {
                    var cache: any = {};
                    expect(compiler.compileExpression("a", {}, cache)).toEqual(compiler.compileExpression("a", {}, cache));
                });

            });

            describe(".cache", function() {
                it("should cache the generated function by the expression", function() {
                    var cache: any = {};
                    var fn = compiler.compileExpression("a", {}, cache);

                    expect(cache.a).toEqual(fn);
                });
            });

        });
    }

    var compiler = wx.injector.resolve<wx.IExpressionCompiler>(wx.res.expressionCompiler);
    testImpl(compiler, false);
    testImpl(compiler, true);

    it("parse literal containing comma in string value",() => {
        var input = "foo: ',', bar: true";
        var result = compiler.parseObjectLiteral(input);

        expect(result.length).toEqual(2);
        expect(result[0].value).toEqual("','");
        expect(result[1].value).toEqual('true');
    });

    it("parse literal containing curly brace in string value",() => {
        var input = "foo: '{', bar: true";
        var result = compiler.parseObjectLiteral(input);

        expect(result.length).toEqual(2);
        expect(result[0].value).toEqual("'{'");
        expect(result[1].value).toEqual('true');
    });

    it("parse invalid literal",() => {
        var input = ", bar: true";
        var result = compiler.parseObjectLiteral(input);

        expect(result.length).toEqual(1);
        expect(result[0].value).toEqual('true');
    });

    it("parse literal containing complex angular expressions",() => {
        var exp1 = "a=1;b=2;{ 'c': a + b }['c']";
        var input = wx.utils.formatString("foo: {0}, bar: true", exp1);
        var result = compiler.parseObjectLiteral(input);

        expect(result.length).toEqual(2);
        expect(result[0].key).toEqual('foo');
        expect(result[0].value.replace(/ +?/g, '')).toEqual(exp1.replace(/ +?/g, '')); // should equal minus whitespaces

        // ultimate test, compile expression and validate result
        var scope = {};
        expect(compiler.compileExpression(result[0].value)(scope, scope)).toEqual(3); // should equal minus whitespaces

        expect(result[1].key).toEqual('bar');
        expect(result[1].value).toEqual('true');
    });

    it("parse literal containing multiple complex angular expressions",() => {
        var exp1 = "a=1;b=2;{ 'c': a + b }['c']";
        var exp2 = "a=1;b=2;[a, ['three',b]]";
        var input = wx.utils.formatString("foo: {0}, bar: true, baz: {1}", exp1, exp2);
        var result = compiler.parseObjectLiteral(input);

        expect(result.length).toEqual(3);
        expect(result[0].key).toEqual('foo');
        expect(result[0].value.replace(/ +?/g, '')).toEqual(exp1.replace(/ +?/g, '')); // should equal minus whitespaces

        // ultimate test, compile expression and validate result
        var scope = {};
        expect(compiler.compileExpression(result[0].value)(scope, scope)).toEqual(3); // should equal minus whitespaces

        expect(result[1].key).toEqual('bar');
        expect(result[1].value).toEqual('true');

        expect(result[2].key).toEqual('baz');
        expect(result[2].value.replace(/ +?/g, '')).toEqual(exp2.replace(/ +?/g, '')); // should equal minus whitespaces

        // ultimate test, compile expression and validate result
        scope = {};
        expect(compiler.compileExpression(result[2].value)(scope, scope)).toEqual([1, ['three', 2]]); // should equal minus whitespaces
    });
});
