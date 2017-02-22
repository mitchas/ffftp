## grunt-search

This is a Grunt plugin that searches a list of files for particular search strings and logs the results in JSON, XML,
text or JUnit format - or just output to the console. It also provides an option to fail the build process, should you
need it.

### Use-case

There are a bunch of search-and-replace Grunt plugins out there, but we needed something simpler for logging purposes
only. We wanted to run various tests on our codebase to look for certain things: inline styles, inline event handlers,
old, unwanted HTML tags. None of these weren't significant enough to warrant failing the build, but they do give a
clue as the health of the codebase.

So basically, we run this function along with `jshint` in our dev environments to warn us about the accumulation of crap.

### Installation

This plugin requires Grunt v0.4.1+.

In your project folder, run the following command:

```js
npm install grunt-search --save-dev
```

Once the plugin has been installed, you need to add this line of JS to your gruntfile:

```js
grunt.loadNpmTasks('grunt-search');
```

That will reference this module and allow you to use it.


### Usage examples

If you're familiar with Grunt, it's pretty straightforward to use. Here's a few example searches so you can get the idea
of how it operates.

```js
grunt.initConfig({
    search: {

        // Example 1: search for inline style tags
        inlineStyles: {
            files: {
                src: ["*.html", "**/*.hbs"]
            },
            options: {
                searchString: /style\s?=\s?["']*/g,
                logFile: "tmp/results.json"
            }
        },

        // Example 2: look for any developers leaving obscenities in the codebase
        obscenities: {
            files: {
                src: ["*"]
            },
            options: {
                searchString: /(poop|fart|Barbara\sStreisand)/g,
                logFile: "tmp/results.xml",
                logFormat: "xml",
                failOnMatch: true,
                onMatch: function(match) {
                    // called when a match is made. The parameter is an object of the
                    // following structure: { file: "", line: X, match: "" }
                },
                onComplete: function(matches) {
                    // called when all files have been parsed for the target. The
                    // matches parameter is an object of the format:
                    // `{ numMatches: N, matches: {} }`. The matches /property is
                    // an object of filename => array of matches
                },
            }
        },

        // Example 3: search a PHP codebase for short-tags and just output the findings to
        // the console (short tags can be disabled, so this helps prevent them sneaking in!)
		short_tags: {
			files: {
				src: ["**/*.php"]
			},
			options: {
				searchString: /(<\?[^p])|(<\?$)/,
				logFormat: "console"
			}
		},

		// Example 4: custom logging function. This example shows how you can access the raw results to
		// do whatever you want with it.
		chicken_sounds: {
			files: {
				src: ["*"],
			},
			options: {
				searchString: /cluck|cluckity|bwaaaaaah!|/,
				logFormat: "custom",
				customLogFormatCallback: function(params) {
					/*
					// here, params is an object containing the following
					{
						filePaths: [], // an array of file paths
						results: [], // the results
						numResults: X // the number of results
					}
					*/
				}
			}
		}
    }
});
```

### File matching

The `files` property should be an object with a single `src` property containing an array of files, or file patterns.
This plugin uses Grunt's file globbing patterns, documented here:
http://gruntjs.com/configuring-tasks


### Options

The `options` property can contain any of the following:

#### required setting
- *searchString*: a string or regexp, or array of strings/regexps. This is the string or strings you're looking for.

#### optional settings
- *logFormat*: (optional, defaults to `json`) the format of the log file: `json`, `xml`, `junit`, `text`, `custom`,
or `console`. The json, XML, text and console options are self explanatory; the junit option logs the information in
an XML format understood by JUnit; and the custom option lets you pass off the logging to your own function, defined
(or at least accessible) to your gruntfile. For that, you need to
- *customLogFormatCallback* (optional, unless you choose `custom` for the logFormat setting). If you want, you can define
your own logging function to access the raw info. Take a look at the chicken_sounds example above to see how to configure
this, and the data structure you get passed to your callback function.
- *logFile*: (required, unless logFormat is set to `console`) the location of the file to be created. Like all things with
Grunt, this is relative to the Grunt root.
- *failOnMatch*: (optional, defaults to `false`). This option lets you choose to fail the build process if any matches
are found.
- *outputExaminedFiles*: (optional) a boolean - default to `false`). Sometimes it's not totally clear what files are
being matched by the file globbing. When this option is set to `true`, the generated output file contains a list of the
files that had been examined.
- *scopeMatchToFile*: (optional) a boolean - default to `false`. Determines if the match should be scoped to the line or file.
For example, when set to `true`, all matches would be handled for files and parameters for *onMatch*
and *logCondition* would be passed as `{ file: "", line: [X, X], match: ["", ""] }` per one for each file where one
or multiple matches occurred.
- *onComplete*: (optional) a function. This is called when all file searching is complete. It's passed a single parameter.
An object of the following format: `{ numMatches: N, matches: {} }`. The matches property is an object of
filename => array of matches. Note: this function doesn't get called in the event of a fatal error (i.e. a required
options parameter wasn't properly included).
- *onMatch*: (optional) a function. This is called after each match is made. It's passed a single parameter - an object
with the following structure: `{ file: "", line: X, match: "" }`
- *logCondition*: (optional) a function. This can be called to check if this match should be included in output. It's
passed a single parameter - an object with the following structure: `{ file: "", line: X, match: "" }`. If this function
returns `true` the match would be included, if `false` it is not.
- *JUnitTestsuiteName*: (optional) a function. If *logFormat* property set to `true` this function would be evaluated to determine if should this item be marked in JUnit report or not. It's passed two parameters, file dir object
with the following structure: `{ line: X, match: "" }` ( or `{ line: [X,..], match: ["",..] }`, if scopeMatchToFile set to `true` ). If this function returns `true` JUnit will mark this match as failed, if `false` JUnit will mark this match as passed.
- *JUnitTestsuiteName*: (optional) a string - name for test suite in JUnit report.
- *JUnitFailureMessage*: (optional) a string - message for failed test suites in JUnit report.

Note: if either of the required parameters are omitted, the build will fail.

### Changelog

- *0.1.8* - Feb 21, 2016 - Grunt 1.0 compatibility update.
- *0.1.7* - May 12th, 2015 - searchString now allows arrays; generated output of XML, JSON and text now include search query details.
- *0.1.6* - May 17th, 2014 - custom log option added. jshint added and additional JUnit options added by [Sergei Z.](https://github.com/sagens42)
- *0.1.5* - May 13th, 2014 - logCondition and scopeMatchToFile, courtesy of [Sergei Z.](https://github.com/sagens42)
- *0.1.4* - Mar 5th, 2014. `junit` logFile option value added for generating JUnit XML reports. Courtesy of Sergii Iavorsky.
- *0.1.3* - Dec 18th, 2013. `console` logFile option value added for simply outputting results to console. Now the number of
matches is always output to the console regardless of logFile type, as well as being logged in the generated file.
- *0.1.2* - Dec 15th, 2013. Tests added, minor tweaks.
- *0.1.1* - Dec 14th, 2013. Bug fix for JSON report files.
- *0.1.0* - Dec 13th, 2013. Initial release.

### Things To Improve

- Each file being examined is loaded entirely into memory right now. From a memory perspective it would be better to
stream them in.
- Multi-line matches won't work.
- Having some sort of omit list for the file search would be pretty nice. I find that often it finds dud matches in specific files, but I still want the general blobbing map to be searched...
- Better tests!

### License

MIT, baby.
