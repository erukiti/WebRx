module.exports = function (grunt) {
    "use strict";

    var conf = {
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
                        "node_modules/URIjs/src/URI.js",
                        "node_modules/requirejs/require.js",
                        "test/test-setup.js",
                        "build/test/TestUtils.js",
                        "build/test/TestModels.js"
                    ]
                }
            },
            dist: {
                src: 'dist/web.rx.min.js'
            }
        },

        watch: {
            src: {
                files: [ "src/**/*.ts"],
                tasks: ['ts:src']
            },
            specs: {
                files: [ "test/**/*.ts", "!test/typings/*.ts"],
                tasks: ['ts:specs']
            }
        },

        connect: {
            server: {
                options: {
                    port: 8000,
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
        },

        typedoc: {
            build: {
                options: {
                    module: 'amd',
                    target: 'es5',
                    out: '../WebRx-Site/.build/api/',
                    name: 'WebRx',
                    mode: 'modules',
                    gaID: "UA-60860613-1",
                    readme: "none"
                },
                src: ['src/Interfaces.ts']
            }
        },

        bump: {  
            options: {
                updateConfigs: ['pkg'],
                files: ['package.json', 'bower.json'],
                commit: false,
                createTag: true,
                push: false
            }
        },

        pkg: grunt.file.readJSON('package.json'),

        nugetpack: {
            dist: {
                src: 'nuget/webrx.nuspec',
                dest: 'dist/',
                options: {
                    version: '<%= pkg.version %>'
                }
            }
        },

        nugetpush: {
            dist: {
                src: 'dist/*.nupkg'
            }
        }
    };
    
    conf.jasmine.dist.options = conf.jasmine.default.options;

    grunt.initConfig(conf);

    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-bump');  
    grunt.loadNpmTasks('grunt-nuget');  
    grunt.loadNpmTasks('grunt-typedoc');

    grunt.registerTask('gen-ver', 'Creates src/Version.ts', function() {
        var template = "module wx {\n\texport var version = '<%= pkg.version %>';\n}";

        grunt.file.write('src/Version.ts', grunt.template.process(template));
    });

    grunt.registerTask("default", ["clean:build", "gen-ver", "ts:default"]);
    grunt.registerTask("tests", ["gen-ver", "ts:src", "ts:specs", "jasmine:default"]);
    grunt.registerTask("debug", ["gen-ver", "ts:src", "ts:specs", "jasmine:default:build", "connect", "watch"]);
    grunt.registerTask("dist", ["gen-ver", "clean:build", "ts:src", "ts:specs", "clean:dist", "ts:dist", "uglify:dist", "jasmine:dist", "compress:dist"]);

    grunt.registerTask('publish:patch', ['bump:patch', 'dist', 'nugetpack', 'nugetpush']);  
    grunt.registerTask('publish:minor', ['bump:minor', 'dist', 'nugetpack', 'nugetpush']);  
    grunt.registerTask('publish:major', ['bump:major', 'dist', 'nugetpack', 'nugetpush']);  
    grunt.registerTask('publish', ['publish:patch']);  
};