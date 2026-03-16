module.exports = function(grunt) {

  // ----------
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks("gruntify-eslint");
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-git-describe');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-githooks');

  // ----------
  var distribution = 'build/mirador/mirador.js',
  minified = 'build/mirador/mirador.min.js',
  releaseRoot = '../site-build/built-mirador/',

  // libraries/plugins
  vendors = [
    'js/lib/jquery.min.js',
    'js/lib/jquery-ui.min.js',
    'js/lib/modal.js',
    'js/lib/bootbox.js',
    'js/lib/jquery.scrollTo.min.js',
    'js/lib/jquery.qtip.min.js',
    'js/lib/state-machine.min.js',
    'js/lib/tinymce.min.js',
    'js/lib/handlebars.js',
    'js/lib/openseadragon.js',
    'js/lib/d3.v3.min.js',
    'js/lib/pubsub.min.js',
    'js/lib/URI.min.js',
    'js/lib/mousetrap.min.js',
    'js/lib/isfahan.js',
    'js/lib/paper-full.min.js',
    'js/lib/spectrum.js',
    'js/lib/i18next.min.js',
    'js/lib/modernizr.custom.js'
  ],

  // libraries/plugins for running tests
  specJs = [
    'bower_components/jasmine-jquery/lib/jasmine-jquery.js',
    'bower_components/sinon-server/index.js'
  ],

  // source files
  sources = [
    'js/src/mirador.js',
    'js/src/utils/handlebars.js',
    'js/src/*.js',
    'js/src/viewer/*.js',
    'js/src/manifests/*.js',
    'js/src/annotations/*.js',
    'js/src/workspaces/*.js',
    'js/src/widgets/*.js',
    'js/src/utils/*.js'
  ];

  // ----------
  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: {
      build: ['build'],
      release: {
        src: [releaseRoot],
        options: {
          force: true
        }
      }
    },

    concat: {
      js: {
        options: {
          banner: '//! <%= pkg.name %> <%= pkg.version %>\n' + '//! Built on <%= grunt.template.today("yyyy-mm-dd") %>\n',
          process: true
        },
        src:  [ "<banner>" ].concat(vendors, sources),
        dest: distribution
      },
      css: {
        src: [
          'css/bootstrap.modals.css',
          'css/normalize.css',
          'css/font-awesome.min.css',
          'css/jquery-ui.min.css',
          'css/layout-default-latest.css',
          'css/jquery.qtip.min.css',
          'css/spectrum.css',
          'css/mirador.css',
          'css/material-icons.css'
        ],
        dest: 'build/mirador/css/mirador-combined.css'
      }
    },

    less: {
      compile: {
        files: {
          'css/mirador.css': 'css/less/main.less'
        }
      }
    },

    cssmin: {
      minify: {
        src: 'build/mirador/css/mirador-combined.css',
        dest: 'build/mirador/css/mirador-combined.min.css'
      }
    },

    uglify: {
      options: {
        preserveComments: 'some',
        mangle: false,
        sourceMap: true
      },
      mirador: {
        src: [vendors, sources],
        dest: minified
      }
    },

    copy: {
      main: {
        files: [{
          expand: true,
          src: 'css/images/**',
          dest: 'build/mirador/'
        }, {
          expand: true,
          cwd: 'node_modules/tinymce',
          src: 'themes/**',
          dest: 'build/mirador'
        }, {
          expand: true,
          cwd: 'node_modules/tinymce',
          src: 'skins/**',
          dest: 'build/mirador'
        }, {
          expand: true,
          cwd: 'node_modules/tinymce',
          src: 'plugins/**',
          dest: 'build/mirador'
        }, {
          expand: true,
          src: 'images/**',
          dest: 'build/mirador'
        }, {
          expand: true,
          cwd: 'node_modules/font-awesome',
          src: 'fonts/*',
          dest: 'build/mirador'
        }, {
          expand: true,
          cwd: 'node_modules/material-design-icons/iconfont',
          src: 'MaterialIcons*',
          dest: 'build/mirador/fonts'
        }, {
          src: 'js/lib/parse.min.js',
          dest: 'build/mirador/parse.min.js'
        }, {
          src: 'js/lib/ZeroClipboard.swf',
          dest: 'build/mirador/ZeroClipboard.swf'
        }, {
	  expand: true,
          src: 'locales/**',
          dest: 'build/mirador'
        }]
      }
    },

    connect: {
      server: {
        options: {
          port: 8000,
          base: '.'
        }
      }
    },

    watch: {
      all: {
        options: {
          livereload: true
        },
        files: [
          'Gruntfile.js',
          'js/src/*.js',
          'js/src/*/*.js',
          'locales/*/*.json',
          'images/*',
          'css/*.css',
          'css/less/**/*.less',
          'index.html'
        ],
        tasks: 'dev_build'
      }
    },

    eslint: {
      options: {
        silent: true
      },
      src: sources
    },

    jshint: {
      options: {
        browser: true,
        eqeqeq: false,
        loopfunc: false,
        indent: false,
        jshintrc: '.jshintrc',
        globals: {
          Mirador: true
        }
      },
      beforeconcat: sources
    },

    'git-describe': {
      build: {
        options: {
          prop: 'gitInfo'
        }
      }
    },

    githooks: {
      all: {
        'pre-commit': 'jshint cover'
        // 'post-checkout':
      }
    },

    coveralls: {
      options: {
        src: 'reports/coverage/PhantomJS*/lcov.info',
        force: 'true'
      },
      ci: {
        src: 'reports/coverage/PhantomJS*/lcov.info'
      }
    },

    karma : {
      options: {
        configFile: 'karma.conf.js',
        proxies: {
          '/spec': 'http://localhost:9876/base/spec'
        },
        coverageReporter: {
          reporters: [
            {type: 'lcov'},
            {type: 'html'},
            {type: 'text-summary'}
          ],
          dir: 'reports/coverage'
        },
        sauceLabs: {
        },
        customLaunchers: {
          'sl_win7_chrome': {
            base: 'SauceLabs',
            browserName: 'chrome',
            platform: 'Windows 7',
            version: '39'
          },
          'sl_win7_firefox': {
            base: 'SauceLabs',
            browserName: 'firefox',
            platform: 'Windows 7',
            version: '35.0'
          },
          'sl_win7_ie09': {
            base: 'SauceLabs',
            browserName: 'internet explorer',
            platform: 'Windows 7',
            version: '9'
          },
          'sl_win7_ie10': {
            base: 'SauceLabs',
            browserName: 'internet explorer',
            platform: 'Windows 7',
            version: '10'
          },
          'sl_win7_ie11': {
            base: 'SauceLabs',
            browserName: 'internet explorer',
            platform: 'Windows 7',
            version: '11'
          }
        }
      },
      test: {
        reporters: ['spec'],
        browsers: ['PhantomJS'],
        singleRun: true
      },
      cover: {
        preprocessors: {
          'js/src/**/*.js': ['coverage']
        },
        reporters: ['progress', 'coverage'],
        browsers: ['PhantomJS'],
        singleRun: true
      },
      server: {
        reporters: ['progress'],
        browsers: ['Firefox'],
        background: true
      },
      chrome: {
        reporters: ['progress'],
        browsers: ['Chrome'],
        singleRun: true
      },
      firefox: {
        reporters: ['progress'],
        browsers: ['Firefox'],
        singleRun: true
      },
      browsers: {
        reporters: ['spec', 'saucelabs'],
        browsers: [
          'sl_win7_chrome',
          'sl_win7_firefox',
          // 'sl_win7_ie9',
          // 'sl_win7_ie10',
          'sl_win7_ie11'
        ],
        singleRun: true
      }
    }
  });

  // ----------
  // Copy:release task.
  // Copies the contents of the build folder into the release folder.
  grunt.registerTask('copy:release', function() {
    grunt.file.recurse('build', function(abspath, rootdir, subdir, filename) {
      var dest = releaseRoot +
        (subdir ? subdir + '/' : '/') +
        filename;

      grunt.file.copy(abspath, dest);
    });
  });
  // ----------
  // Lint task
  grunt.registerTask('lint', ['jshint', 'eslint']);

  // ----------
  // Build task.
  // Cleans out the build folder and builds the code and images into it, checking lint.
  grunt.registerTask('build', [ 'clean:build', 'git-describe', 'lint', 'less', 'concat', 'uglify', 'cssmin', 'copy']);

  // ----------
  // Dev Build task.
  // Build, but skip the time-consuming and obscurantist minification and uglification.
  grunt.registerTask('dev_build', [ 'clean:build', 'git-describe', 'lint', 'less', 'concat', 'copy']);

  // ----------
  // Default task.
  // Does a normal build.
  grunt.registerTask('default', ['build']);

  // ----------
  // Connect task.
  // Runs server at specified port
  grunt.registerTask('serve', ['dev_build', 'connect:server', 'watch']);

  // ----------
  // Test task.
  // Runs Jasmine tests
  grunt.registerTask('test', 'karma:test');

  // ----------
  // Coverage task.
  // Runs instanbul coverage
  grunt.registerTask('cover', 'karma:cover');

  // ----------
  // Runs this on travis.
  grunt.registerTask('ci', [
                     'lint'
  ]);
};
