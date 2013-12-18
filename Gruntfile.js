"use strict";

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		jshint: {
			all: ['Gruntfile.js', './src/**/*.js'],
			options: {
				jshintrc: "./.jshintrc",
				reporter: require('jshint-stylish')
			}
		},
		sync: {
			options: {
				include: [
					'name', 'version', 'main',
					'homepage', 'description',
					'keywords', 'license',
					'repository'
				]
			}
		},
		concat: {
			bundle: {
				src: [
					'src/candy.js', 'src/core.js', 'src/view.js',
					'src/util.js', 'src/core/action.js',
					'src/core/chatRoom.js', 'src/core/chatRoster.js',
					'src/core/chatUser.js', 'src/core/event.js',
					'src/view/event.js', 'src/view/observer.js',
					'src/view/pane.js', 'src/view/template.js',
					'src/view/translation.js'
				],
				dest: 'candy.bundle.js'
			},
			libs: {
				src: [
					'libs/strophejs/strophe.js',
					'libs/strophejs-plugins/muc/strophe.muc.js',
					'libs/strophejs-plugins/disco/strophe.disco.js',
					'libs/strophejs-plugins/caps/strophe.caps.jsonly.js',
					'libs/mustache.js/mustache.js',
					'libs/jquery-i18n/jquery.i18n.js',
					'libs/dateformat/dateFormat.js'
				],
				dest: 'libs/libs.bundle.js'
			}
		},
		uglify: {
			bundle: {
				files: {
					'candy.min.js': ['candy.bundle.js']
				}
			},
			libs: {
				files: {
					'libs/libs.min.js': ['libs/libs.bundle.js']
				}
			}
		},
		watch: {
			bundle: {
				files: ['src/*.js', 'src/**/*.js'],
				tasks: ['concat:bundle', 'uglify:bundle', 'notify:bundle']
			},
			libs: {
				files: ['libs/*/**/*.js'],
				tasks: ['concat:libs', 'uglify:libs', 'notify:libs']
			}
		},
		natural_docs: {
			all: {
				bin: process.env.NATURALDOCS_DIR + '/NaturalDocs',
				flags: ['-r'],
				inputs: ['./src'],
				output: './docs',
				project: './.ndproj'
			}
		},
		clean: {
			bundle: ['./candy.bundle.js', './candy.min.js'],
			libs: ['./libs/libs.bundle.js', './libs/libs.min.js'],
			docs: ['./docs']
		},
		mkdir: {
			docs: {
				options: {
					create: ['./docs']
				}
			}
		},
		notify: {
			bundle: {
				options: {
					message: 'Bundle & Min updated'
				}
			},
			libs: {
				options: {
					message: 'Libs updated'
				}
			},
			docs: {
				options: {
					message: 'Docs done'
				}
			},
			'default': {
				options: {
					message: 'JsHint & bundling done'
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-natural-docs');
	grunt.loadNpmTasks('grunt-mkdir');
	grunt.loadNpmTasks('grunt-notify');
	grunt.loadNpmTasks('grunt-sync-pkg');

	grunt.registerTask('default', [
		'jshint', 'concat:libs', 'uglify:libs',
		'concat:bundle', 'uglify:bundle', 'notify:default'
	]);
	grunt.registerTask('docs', ['mkdir:docs', 'natural_docs', 'notify:docs']);
};