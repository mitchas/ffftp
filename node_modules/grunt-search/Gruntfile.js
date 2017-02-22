/*
 * grunt-search
 * https://github.com/benkeen/grunt-search
 *
 * Copyright (c) 2015 Ben Keen
 * Licensed under the MIT license.
 */

"use strict";

module.exports = function(grunt) {

	grunt.initConfig({

		// before generating any new files, remove any previously-created files
		clean: {
			tests: ['test/tmp']
		},

		jshint: {
			all: ['Gruntfile.js', 'tasks/search.js'],
			options: {
				force: true,
				curly: false,
				eqeqeq: false,
				immed: false,
				latedef: true,
				newcap: false,
				noarg: true,
				sub: true,
				undef: true,
				boss: true,
				eqnull: true,
				node: true,
				smarttabs: true,
				multistr: true,
				browser: true,
				onecase: true,
				asi: true,
				strict: false,
				trailing: false,
				nonstandard: true,
				noempty: false,
				shadow: true,
				globals: {
					module: true
				}
			}
		},

		// configuration to be run (and then tested)
		search: {
			default: {
				files: {
					src: ["test/test_source.html"]
				},
				options: {
					searchString: "style",
					logFile: "test/tmp/results.json",
					logFormat: "json",
					outputExaminedFiles: true
				}
			},

			junit: {
				files: {
					src: ["test/fixtures/file*", "!test/fixtures/file3*"]
				},
				options: {
					searchString: "@nocommit",
					logFile: "test/tmp/junit-nocommit.xml",
					logFormat: "junit"
				}
			},

			customLogSearch: {
				files: {
					src: ["test/test_source.html"]
				},
				options: {
					logFormat: "custom",
					searchString: [".net", "mon"],
					customLogFormatCallback: function(params) {

            // here you'd do whatever you want with the data. The console.log() just outputs [Object] for the really
            // interesting parts - but you can access it here
						console.log(params);
					}
				}
			}
		},

		// unit tests
		nodeunit: {
			tests: ['test/*_test.js']
		}
	});

	grunt.loadTasks('tasks');

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	// whenever the "test" task is run, first clean the "tmp" dir, then run this plugin's task(s), then test the result
	grunt.registerTask('test', ['jshint', 'clean', 'search', 'nodeunit']);

	// by default, lint and run all tests
	grunt.registerTask('default', ['search', 'test']);
};
