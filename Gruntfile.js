module.exports = function (grunt) {
    "use strict";

    var conf = {
        shell: {
            tsc_src_es5: {
                command: 'node node_modules/typescript/bin/tsc -t es5 -m commonjs --rootDir src -p src --outDir build/src/es5',
            },

            tsc_src_es6: {
                command: 'node node_modules/typescript/bin/tsc -t es6 --rootDir src -p src --outDir build/src/es6',
            },

            tsc_specs: {
                command: 'node node_modules/typescript/bin/tsc -p test',
            },

            gitadd: {
                command: 'git add .'
            }
        },

        madge: {
            options: {
                format: 'cjs'
            },
            src: ['build/src/App.js']
        },

        webpack: {
            webrx: {
                entry: "./build/src/es5/WebRx.js",

                output: {
                    path: "./build/",
                    filename: "web.rx.js",
                    libraryTarget: "umd",
                    library: "wx"
                },

                stats: {
                    colors: true,
                    modules: true,
                    reasons: true
                },

                devtool: 'source-map',
                storeStatsTo: false, // writes the status to a variable named xyz
                progress: true, // Don't show progress
                failOnError: true, // don't report error to grunt if webpack find errors
                watch: false, // use webpacks watcher
                keepalive: false, // don't finish the grunt task
            }
        },

        jasmine: {
            default: {
                options: {
                    specs: 'build/test/**/*.js',
                    vendor: [
                        "node_modules/rx/dist/rx.all.js",
                        "node_modules/rx/dist/rx.testing.js",
                        "node_modules/browser-jquery/jquery.js",
                        "node_modules/jasmine-ajax/lib/mock-ajax.js",
                        "node_modules/jasmine-jquery/lib/jasmine-jquery.js",
                        "node_modules/URIjs/src/URI.js",
                        "build/test/TestUtils.js",
                        "node_modules/rsvp/dist/rsvp.min.js",
                        "node_modules/ix/l2o.js",
                        "node_modules/ix/ix.js",
                        'build/web.rx.js',  // must include this _before_ require.js or all hell breaks lose
                        "node_modules/requirejs/require.js",
                        "test/jasmine-jsreporter.js",
                        "test/test-setup.js",
                        "build/test/TestModels.js"
                    ]
                }
            }
        },

        watch: {
            src: {
                files: ["src/**/*.ts"],
                tasks: ['shell:tsc_src_es5', "madge:src", "webpack:webrx"]
            },
            specs: {
                files: ["test/**/*.ts", "!test/typings/*.ts"],
                tasks: ['shell:tsc_specs']
            }
        },

        connect: {
            server: {
                options: {
                    port: 8000,
                }
            }
        },

        'saucelabs-jasmine': {
            all: {
                options: {
                    urls: ["http://localhost:8000/_SpecRunner.html"],
                    tunnelTimeout: 5,
                    concurrency: 3,
                    build: process.env.CI_BUILD_NUMBER,
                    browsers: [
                        { browserName: "firefox", platform: "WIN7" },
                        { browserName: "firefox", version: "5", platform: "WIN7" },

                        { browserName: "chrome", platform: "WIN7" },
                        { browserName: "chrome", platform: "OS X 10.10" },

                        { browserName: "safari", version: "5", platform: "OS X 10.6" },
                        { browserName: "safari", version: "6", platform: "OS X 10.8" },
                        { browserName: "safari", version: "7", platform: "OS X 10.9" },
                        { browserName: "safari", version: "8", platform: "OS X 10.10" },

                        { browserName: "iphone", version: "5", platform: "OS X 10.7" },
                        { browserName: "iphone", version: "6", platform: "OS X 10.8" },
                        { browserName: "iphone", version: "7", platform: "OS X 10.8" },
                        { browserName: "iphone", version: "8", platform: "OS X 10.10" },

                        //{ browserName: "android", version: "5.0", platform: "linux" },

                        { browserName: "internet explorer", version: "9", platform: "WIN7" },
                        { browserName: "internet explorer", version: "10", platform: "WIN7" },
                        { browserName: "internet explorer", version: "11", platform: "WIN7" }
                    ],
                    testname: "WebRx Tests",
                    tags: ["master"]
                }
            }
        },

        copy: {
            dist: {
                files: [
                    { expand: true, cwd: 'build/', src: ['web.rx.js*'], dest: 'dist/' },
                    { expand: true, cwd: 'build/src/es6', src: ['**'], dest: 'dist/es6_modules' },
                    { expand: true, cwd: 'src/', src: ['web.rx.d.ts'], dest: 'dist/' },
                ],
            },
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
                    { expand: true, cwd: "dist/", src: ['web.rx.js', 'web.rx.js.map', 'web.rx.min.js', 'web.rx.min.js.map', 'web.rx.d.ts', "es6_modules/**"] }
                ]
            }
        },
        uglify: {
            dist: {
                files: {
                    'dist/web.rx.min.js': ['dist/web.rx.js']
                },
                
                options: {
                    sourceMap: true,
                    sourceMapIncludeSources: true,
                    sourceMapIn: "dist/web.rx.js.map"
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

        release: {
            options: {
                bump: false
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

    //var webpack = require("webpack");
    var _ = require("lodash");

    conf.jasmine["dist"] = _.cloneDeep(conf.jasmine.default);
    conf.jasmine.dist.options.vendor[9] = 'dist/web.rx.min.js';

    grunt.initConfig(conf);

    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-nuget');
    grunt.loadNpmTasks('grunt-typedoc');
    grunt.loadNpmTasks('grunt-saucelabs');
    grunt.loadNpmTasks('grunt-release');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-madge');
    grunt.loadNpmTasks('grunt-webpack');

    grunt.registerTask('gen-ver', 'Creates src/Version.ts', function () {
        var template = "export const version = '<%= pkg.version %>';\n";

        grunt.file.write('src/Version.ts', grunt.template.process(template));
    });

    grunt.registerTask("default", ["clean:build", "gen-ver", "ts:default"]);
    grunt.registerTask("test", ["gen-ver", "shell:tsc_src_es5", "madge:src", "webpack:webrx", "shell:tsc_specs", "jasmine:default"]);
    grunt.registerTask("debug", ["gen-ver", "shell:tsc_src_es5", "madge:src", "webpack:webrx", "shell:tsc_specs", "jasmine:default:build", "connect", "watch"]);
    grunt.registerTask("dist", ["gen-ver", "clean:build", "shell:tsc_src_es5", "shell:tsc_src_es6", "madge:src", "webpack:webrx", "shell:tsc_specs", "clean:dist", "copy:dist", "uglify:dist", "jasmine:dist", "compress:dist"]);
    grunt.registerTask("xtest", ["gen-ver", "shell:tsc_src_es5", "shell:tsc_specs", "jasmine:default:build", "connect", "saucelabs-jasmine"]);

    grunt.registerTask('publish:patch', ['dist', 'bump:patch', "shell:gitadd", "release", 'nugetpack', 'nugetpush']);
    grunt.registerTask('publish:minor', ['dist', 'bump:minor', "shell:gitadd", "release", 'nugetpack', 'nugetpush']);
    grunt.registerTask('publish:major', ['dist', 'bump:major', "shell:gitadd", "release", 'nugetpack', 'nugetpush']);
    grunt.registerTask('publish', ['publish:patch']);
};