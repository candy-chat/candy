'use strict';

var localInternConfig = process.env.CANDY_VAGRANT === 'false' ? 'tests/intern.local' : 'tests/intern.vagrant';

module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
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
						'src/core/chatUser.js', 'src/core/contact.js',
						'src/core/event.js', 'src/view/observer.js',
						'src/view/pane/chat.js', 'src/view/pane/message.js',
						'src/view/pane/privateRoom.js', 'src/view/pane/room.js',
						'src/view/pane/roster.js', 'src/view/pane/window.js',
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
						'bower_components/strophejs-plugins/roster/strophe.roster.js',
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
		concat: {
			css: {
				src: [
					'bower_components/bootstrap/dist/css/bootstrap.css'
				],
				dest: 'libs.bundle.css'
			}
		},
		cssmin: {
			css: {
				src: 'libs.bundle.css',
				dest: 'libs.min.css'
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
				tasks: ['todo:src', 'jshint', 'uglify:bundle', 'uglify:min', 'notify:bundle', 'intern:unit']
			},
			libs: {
				files: ['bower_components/*/**/*.js', 'vendor_libs/*/**/*.js'],
				tasks: ['uglify:libs', 'uglify:libs-min', 'notify:libs']
			},
			tests: {
				files: ['tests/candy/unit/**/*.js'],
				tasks: ['todo:tests', 'jshint', 'intern:unit']
			},
			functional_tests: {
				files: ['tests/candy/functional/**/*.js'],
				tasks: ['todo:tests', 'jshint', 'intern:functional']
			}
		},
		natural_docs: {
			all: {
				bin: process.env.NATURALDOCS_DIR ? process.env.NATURALDOCS_DIR + '/NaturalDocs' : 'naturaldocs',
				flags: ['-r'],
				inputs: ['./src'],
				output: './docs',
				project: './.ndproj'
			}
		},
		clean: {
			bundle: ['./candy.bundle.js', './candy.bundle.map', './candy.min.js'],
			libs: ['./libs.bundle.css', './libs.bundle.js', './libs.bundle.map', './libs.min.js'],
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
					config: localInternConfig,
					functionalSuites: []
				}
			},
			functional: {
				options: {
					runType: 'runner',
					config: localInternConfig,
					suites: []
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
			src: ['src/**/*.js'],
			tests: ['tests/**/*.js']
		},
		prompt: {
			target: {
				options: {
					questions: [
						{
							config: 'github-release.options.release.body',
							type: 'input',
							message: 'GitHub release body:'
						}
					]
				}
			}
		},
		compress: {
			zip: {
				options: {
					archive: 'candy.zip'
				},
				files: [
					{
						src: [
							'example/**',
							'res/**',
							'bower.json',
							'candy.bundle.js',
							'candy.bundle.map',
							'candy.min.js',
							'candy.min.map',
							'CONTRIBUTING.md',
							'CREDITS.md',
							'libs.bundle.css',
							'libs.bundle.js',
							'libs.bundle.map',
							'libs.min.css',
							'libs.min.js',
							'LICENSE',
							'package.json',
							'README.md',
							'res/**',
						],
						dest: './'
					},
				]
			},
			tar: {
				options: {
					archive: 'candy.tar.gz'
				},
				files: [
					{
						src: [
							'example/**',
							'res/**',
							'bower.json',
							'candy.bundle.js',
							'candy.bundle.map',
							'candy.min.js',
							'candy.min.map',
							'CONTRIBUTING.md',
							'CREDITS.md',
							'libs.bundle.css',
							'libs.bundle.js',
							'libs.bundle.map',
							'libs.min.css',
							'libs.min.js',
							'LICENSE',
							'package.json',
							'README.md',
							'res/**',
						],
						dest: './candy'
					},
				]
			}
		},
		'github-release': {
			options: {
				repository: 'candy-chat/candy',
				auth: grunt.file.exists('github-credentials.json') ? grunt.file.readJSON('github-credentials.json') : {},
				release: {
					tag_name: 'v' + grunt.file.readJSON('package.json').version,
					name: 'v' + grunt.file.readJSON('package.json').version
				}
			},
			files: {
				src: ['candy.zip', 'candy.tar.gz']
			}
		},
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-github-releaser');
	grunt.loadNpmTasks('grunt-prompt');
	grunt.loadNpmTasks('grunt-natural-docs');
	grunt.loadNpmTasks('grunt-mkdir');
	grunt.loadNpmTasks('grunt-notify');
	grunt.loadNpmTasks('grunt-sync-pkg');
	grunt.loadNpmTasks('intern');
	grunt.loadNpmTasks('grunt-clear');
	grunt.loadNpmTasks('grunt-coveralls');
	grunt.loadNpmTasks('grunt-todo');

	grunt.registerTask('test', ['intern:all']);
	grunt.registerTask('ci', ['todo', 'jshint', 'build', 'intern:all', 'coveralls:all', 'docs']);
	grunt.registerTask('build', ['uglify:libs', 'uglify:libs-min', 'uglify:bundle', 'uglify:min', 'concat:css', 'cssmin:css']);
	grunt.registerTask('default', [
		'jshint', 'build', 'notify:default', 'intern:unit'
	]);
	grunt.registerTask('docs', ['mkdir:docs', 'natural_docs', 'notify:docs']);
	grunt.registerTask('release', [
		'default',
		'prompt',
		'compress',
		'github-release'
	]);
};
