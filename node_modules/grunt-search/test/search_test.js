'use strict';

var grunt = require('grunt');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.search = {
	setUp: function(done) {
		done();
	},

	// pretty sodding basic
	simpleCompare: function(test) {
		test.expect(3);

		var actual   = JSON.parse(grunt.file.read('test/tmp/results.json'));
		var expected = JSON.parse(grunt.file.read('test/expected/results.json'));

		test.equal(actual.numResults, expected.numResults, 'should describe what the default behavior is.');
		test.equal(actual.results["test/test_source.html"].line,
				   expected.results["test/test_source.html"].line,
				   'should check that the line number of the found string.');
		test.equal(actual.results["test/test_source.html"].match,
			expected.results["test/test_source.html"].match,
			'should compare the match.');

		test.done();
	},

    junitReport: function(test) {
        test.equal(grunt.file.read('test/tmp/junit-nocommit.xml'),
            grunt.file.read('test/expected/junit-nocommit.xml'),
            'should match desired output');

        test.done();
    }
};
