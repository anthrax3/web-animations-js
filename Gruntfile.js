module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-gjslint');

  var targetConfig = require('./target-config.js');

  uglifyTargets = {};
  gendevTargets = {};
  gentestTargets = {};
  testTargets = {};
  for (var target in targetConfig) {
    var suffix = target === targetConfig.defaultTarget ? '' : '-' + target;
    uglifyTargets[target] = {
      options: {
        sourceMap: true,
        sourceMapName: 'web-animations' + suffix + '.min.js.map',
        banner: grunt.file.read('templates/boilerplate'),
        wrap: true,
        compress: {
          global_defs: {
            "TESTING": false
          },
          dead_code: true
        },
        mangle: {
          eval: true
        },
      },
      nonull: true,
      dest: 'web-animations' + suffix + '.min.js',
      src: targetConfig[target].src,
    };
    gendevTargets[target] = targetConfig[target].src;
    gentestTargets[target] = targetConfig[target];
    testTargets[target] = {};
  }

  grunt.initConfig({
    uglify: uglifyTargets,
    gendev: gendevTargets,
    gentest: gentestTargets,
    gjslint: {
      options: {
        flags: [
          '--nojsdoc',
          '--strict',
          '--disable 7,121,110', //   7: Wrong blank line count
                                 // 121: Illegal comma at end of object literal
                                 // 110: Line too long
        ],
        reporter: {
          name: 'console'
        }
      },
      all: {
        src: [
          'src/*.js',
          'test/*.js',
          'test/js/*.js',
        ],
      }
    },
    test: testTargets,
  });

  grunt.task.registerMultiTask('gendev', 'Generate web-animations-<target>.dev.js', function() {
    var template = grunt.file.read('templates/web-animations.dev.js')
    var filename = 'web-animations-' + this.target + '.dev.js';
    var contents = grunt.template.process(template, {data: {target: this.target}});
    grunt.file.write(filename, contents);
    grunt.log.writeln('File ' + filename + ' created');
  });

  grunt.task.registerMultiTask('gentest', 'Generate test/runner-<target>.html', function() {
    var template = grunt.file.read('templates/runner.html')
    var filename = 'test/runner-' + this.target + '.html';
    var contents = grunt.template.process(template, {data: {target: this.target}});
    grunt.file.write(filename, contents);
    grunt.log.writeln('File ' + filename + ' created');
  });

  grunt.task.registerMultiTask('test', 'Run <target> tests under Karma', function() {
    var done = this.async();
    var config = targetConfig[this.target];
    var karmaConfig = require('./test/karma-config.js');
    karmaConfig.files = ['test/runner.js'].concat(config.src, config.test);
    var karmaServer = require('karma').server;
    karmaServer.start(karmaConfig, function(exitCode) {
      done(exitCode === 0);
    });
  });

  grunt.task.registerTask('clean', 'Remove files generated by grunt', function() {
    grunt.file.expand('web-animations-*').concat(grunt.file.expand('test/runner-*.html')).forEach(function(file) {
      grunt.file.delete(file);
      grunt.log.writeln('File ' + file + ' removed');
    });
  });

  for (var target in targetConfig) {
    grunt.task.registerTask(target, [
      'uglify:' + target,
      'gendev:' + target,
      'gentest:' + target,
      'gjslint',
    ]);
  }

  grunt.task.registerTask('default', ['uglify', 'gendev', 'gentest', 'gjslint']);
};
