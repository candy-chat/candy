'use strict';

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		env: {
			options: {
			},
			full_test: {
				TEST_ENVIRONMENTS: 'ALL'
			},
			quick_test: {
				TEST_ENVIRONMENTS: 'PHANTOM'
			}
		},
		jshint: {
			all: ['Gruntfile.js', './src/**/*.js', './tests/**/*.js'],
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
		uglify: {
			bundle: {
				files: {
					'candy.bundle.js': [
						'src/candy.js', 'src/core.js', 'src/view.js',
						'src/util.js', 'src/core/action.js',
						'src/core/chatRoom.js', 'src/core/chatRoster.js',
						'src/core/chatUser.js', 'src/core/event.js',
						'src/view/observer.js', 'src/view/pane.js',
						'src/view/template.js', 'src/view/translation.js'
					]
				},
				options: {
					sourceMap: true,
					mangle: false,
					compress: false,
					beautify: true,
					preserveComments: 'all'
				}
			},
			min: {
				files: {
					'candy.min.js': ['candy.bundle.js']
				},
				options: {
					sourceMap: true
				}
			},
			libs: {
				files: {
					'libs.bundle.js': [
						'bower_components/strophe/strophe.js',
						'bower_components/strophejs-plugins/muc/strophe.muc.js',
						'bower_components/strophejs-plugins/disco/strophe.disco.js',
						'bower_components/strophejs-plugins/caps/strophe.caps.jsonly.js',
						'bower_components/mustache/mustache.js',
						'bower_components/jquery-i18n/jquery.i18n.js',
						'vendor_libs/dateformat/dateFormat.js'
					]
				},
				options: {
					sourceMap: true,
					mangle: false,
					compress: false,
					beautify: true,
					preserveComments: 'all'
				}
			},
			'libs-min': {
				files: {
					'libs.min.js': ['libs.bundle.js']
				}
			}
		},
		watch: {
			clear: {
				files: ['src/*.js', 'src/**/*.js', 'tests/**/*.js'],
				tasks: ['clear']
			},
			grunt: {
				files: ['Gruntfile.js']
			},
			bundle: {
				files: ['src/**/*.js'],
				tasks: ['env:quick_test', 'jshint', 'uglify:bundle', 'uglify:min', 'notify:bundle', 'intern:unit']
			},
			libs: {
				files: ['bower_components/*/**/*.js', 'vendor_libs/*/**/*.js'],
				tasks: ['env:quick_test', 'uglify:libs', 'uglify:libs-min', 'notify:libs']
			},
			tests: {
				files: ['tests/**/*.js'],
				tasks: ['env:quick_test', 'jshint', 'intern:unit']
			},
			functional_tests: {
				files: ['tests/functional/**/*.js'],
				tasks: ['jshint', 'env:quick_test', 'intern:all']
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
			bundle: ['./candy.bundle.js', './candy.bundle.map', './candy.min.js'],
			libs: ['./libs.bundle.js', './libs.bundle.map', './libs.min.js'],
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
					config: 'tests/intern',
					suites: [
							'tests/candy/unit/candy'
						, 'tests/candy/unit/util'
						, 'tests/candy/unit/core/chatUser'
						, 'tests/candy/unit/core/chatRoster'
					],
					functionalSuites: []
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-natural-docs');
	grunt.loadNpmTasks('grunt-mkdir');
	grunt.loadNpmTasks('grunt-notify');
	grunt.loadNpmTasks('grunt-sync-pkg');
	grunt.loadNpmTasks('intern');
	grunt.loadNpmTasks('grunt-env');
	grunt.loadNpmTasks('grunt-clear');

	grunt.registerTask('test', ['env:full_test', 'intern:all']);
	grunt.registerTask('default', [
		'env:quick_test', 'jshint', 'uglify:libs', 'uglify:libs-min',
		'uglify:bundle', 'uglify:min', 'notify:default', 'intern:unit'
	]);
	grunt.registerTask('docs', ['mkdir:docs', 'natural_docs', 'notify:docs']);
};
