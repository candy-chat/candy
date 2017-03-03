'use strict';

var localInternConfig = process.env.CANDY_VAGRANT === 'false' ? 'tests/intern.local' : 'tests/intern.vagrant';

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			all: ['Gruntfile.js', '**/*.js', '!node_modules/**', '!bower_components/**'],
			options: {
				jshintrc: "./.jshintrc",
				reporter: require('jshint-stylish')
			}
		},
		watch: {
			grunt: {
				files: ['Gruntfile.js']
			},
			clear: {
				files: ['**/*.js'],
				tasks: ['clear', 'todo', 'jshint', 'intern:unit']
			}
		},
		intern: {
			all: {
				options: {
					runType: 'runner',
					config: 'tests/intern'
				}
			},
			unit: {
				options: {
					runType: 'runner',
					config: localInternConfig,
					functionalSuites: []
				}
			}
		},
		coveralls: {
			options: {
				force: true // prevent from failing CI build if coveralls is down etc.
			},
			all: {
				src: 'lcov.info',
			}
		},
		todo: {
			options: {},
			all: ['**/*.js', '!node_modules/**', '!bower_components/**']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('intern');
	grunt.loadNpmTasks('grunt-clear');
	grunt.loadNpmTasks('grunt-coveralls');
	grunt.loadNpmTasks('grunt-todo');

	grunt.registerTask('test', ['intern:unit']);
	grunt.registerTask('ci', ['todo', 'jshint', 'intern:all', 'coveralls:all']);
	grunt.registerTask('default', ['jshint', 'intern:unit']);
};
