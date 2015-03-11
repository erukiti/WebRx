module.exports = function (grunt) {
    "use strict";

    grunt.initConfig({
        ts: {
            default: {
                src: [ "src/**/*.ts"],
                outDir: "build"
            },
            src: {
                src: ["src/**/*.ts"],
                out: "build/web.rx.js",
                options: {
                    declaration: true,
                    fast: "never"
                }
            },
            specs: {
                src: [ "test/**/*.ts", "!test/typings/*.ts"],
                outDir: "build/test"
            },
            dist: {
                src: ["src/**/*.ts"],
                out: "dist/web.rx.js",
                options: {
                    declaration: true,
                    fast: "never"
                }
            },
            // use to override the default options, See: http://gruntjs.com/configuring-tasks#options
            // these are the default options to the typescript compiler for grunt-ts:
            // see `tsc --help` for a list of supported options.
            options: {
                compile: true,                 // perform compilation. [true (default) | false]
                comments: false,               // same as !removeComments. [true | false (default)]
                target: "es5",                 // target javascript language. [es3 | es5 (grunt-ts default) | es6]
                module: "amd",                 // target javascript module style. [amd (default) | commonjs]
                sourceMap: true,               // generate a source map for every output js file. [true (default) | false]
                sourceRoot: "",                // where to locate TypeScript files. [(default) '' == source ts location]
                mapRoot: "",                   // where to locate .map.js files. [(default) '' == generated js location.]
                declaration: false,            // generate a declaration .d.ts file for every output js file. [true | false (default)]
                noImplicitAny: false,          // set to true to pass --noImplicitAny to the compiler. [true | false (default)]
                fast: "watch"                  // see https://github.com/TypeStrong/grunt-ts/blob/master/docs/fast.md ["watch" (default) | "always" | "never"]
            },
        },
        
        jasmine: {
            default: {
                src: 'build/web.rx.js',
                options: {
                    specs: 'build/test/**/*.js',
                    vendor: [
                        "node_modules/rx/dist/rx.lite.js",
                        "node_modules/rx/dist/rx.lite.extras.js",
                        "node_modules/rx/dist/rx.virtualtime.js",
                        "node_modules/rx/dist/rx.testing.js",
                        "node_modules/browser-jquery/jquery.js",
                        "node_modules/jasmine-jquery/lib/jasmine-jquery.js",
                        "node_modules/ix/l2o.js",
                        "node_modules/ix/ix.js",
                        "node_modules/requirejs/require.js",
                        "test/test-setup.js",
                        "build/test/TestUtils.js",
                        "build/test/TestModels.js"
                    ]
                }
            }
        },

        connect: {
            server: {
                options: {
                    port: 8000,
                    keepalive: true,
                    open: {
                        target: 'http://localhost:8000/_SpecRunner.html' // target url to open
                    }
                }
            }
        },

        clean: {
            build: ["build"],
            dist: ["dist"]
        },

        compress: {
            dist: {
                options: {
                    archive: 'dist/web.rx.zip'
                },
                files: [
                    { expand: true, cwd : "dist/", src: ['web.rx.js', 'web.rx.min.js', 'web.rx.js.map', 'web.rx.d.ts'] }
                ]
            }
        },
        uglify: {
            dist: {
                files: {
                    'dist/web.rx.min.js': ['dist/web.rx.js']
                }
            }
        }
    });
    
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask("default", ["clean:build", "ts:default"]);
    grunt.registerTask("tests", ["ts:src", "ts:specs", "jasmine"]);
    grunt.registerTask("debug", ["ts:src", "ts:specs", "jasmine:default:build", "connect"]);
    grunt.registerTask("dist", ["clean:build", "ts:src", "ts:specs", "jasmine", "clean:dist", "ts:dist", "uglify:dist", "compress:dist"]);
};