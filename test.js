process.env.NODE_ENV = 'test';
require('./setupEntry');

var _ = require('underscore');
var path = require('path');
var { findFiles } = require('./src/util');

const COVERAGE_BASE = 'coverage/code';

(async function() {
  var argv = require('yargs')
  .option('debug', {
    type: 'boolean',
    description: 'Run in debug mode'
  })
  .option('file', {
    type: 'string',
    description: 'File/Suite to run. Should start with "test/..." or be an absolute path.'
  })
  .option('skipCoverage', {
    type: 'boolean',
    description: 'Skips code coverage'
  })
  .help()
  .argv;

  if (argv.skipCoverage) {
    var test = require('./test/test');
    await test(argv);
    process.exit();
  } else {
    var args = ['node', 'test', '--skipCoverage'];
    args = mergeArgs(args, argv);
    await writeNycConfig(argv.file)
    await spawnNew(args);
    process.exit();
  }
})();

async function spawnNew(args) {
  return new Promise(function(resolve) {
    require('child_process').spawn('./node_modules/.bin/nyc', args, {stdio: 'inherit'}).on('exit', function() {
      resolve();
    });
  });
}

function mergeArgs(args, argv) {
  _.mapObject(argv, function(val, key) {
    if (key !== '$0' && key !== '_') {
      if (typeof val === 'boolean') {
        args.push('--' + key);
      } else {
        args.push('--' + key);
        args.push(val);
      }
    }
  });
  return args;
}

async function writeNycConfig(testFile) {
  if (testFile) {
    if (!path.isAbsolute(testFile)) {
      testFile = path.join(__dirname, testFile);
    }
    var rel = path.relative(__dirname, testFile);
    if (rel !== 'test/all.suite.js') {
      var relDirs = rel.split('/');
      var filename = relDirs.pop();
      relDirs.shift();
      var srcPath = 'src';
      var fileParts = filename.split('.');
      var testType;
      if (fileParts.length >= 3) {
        var fileType = fileParts[fileParts.length - 2];
        testType = relDirs.shift();
        if (!testType) {
          testType = fileParts[0];
        }
        var coveragePath = path.join(__dirname, COVERAGE_BASE, testType);
        relDirs.map(function(dir) {
          srcPath = path.join(srcPath, dir);
        });
        if (fileType === 'test') {
          var fileBase = '';
          for (var i = 0; i < fileParts.length - 2; i++) {
            var fp = fileParts[i];
            fileBase += fp + '.';
          }
          fileBase = fileBase.slice(0, -1);
          var files = await findFiles(path.join(__dirname, srcPath), fileBase);
          var srcFile = files[0];
          if (srcFile) {
            coveragePath = path.join(coveragePath, path.relative(__dirname, srcFile));
            process.env.NYC_CONFIG = JSON.stringify({
              include: makeInclude(files),
              reportDir: coveragePath
            });
          } else {
            console.log('We could not find a src file associated with this test. Will generate coverage under the name of the test file submitted.');
            coveragePath = path.join(coveragePath, srcPath, path.parse(testFile).base);
            process.env.NYC_CONFIG = JSON.stringify({
              all: true,
              reportDir: coveragePath
            });
          }
        } else {
          var files = findFiles(path.join(__dirname, srcPath));
          coveragePath = path.join(coveragePath, srcPath, 'suite');
          if (files.length > 0) {
            process.env.NYC_CONFIG = JSON.stringify({
              include: makeInclude(files),
              reportDir: coveragePath
            });
          } else {
            process.env.NYC_CONFIG = JSON.stringify({
              all: true,
              reportDir: coveragePath
            });
          }
        }
      } else {
        throw Error('ant2: File is formatted or labled incorrectly. Please point to a file in the test directory with the full extension.');
      }
    } else {
      nycConfigAll();
    }
  } else {
    nycConfigAll()
  }
}

function nycConfigAll() {
  process.env.NYC_CONFIG = JSON.stringify({
    all: true,
    reportDir: path.join(COVERAGE_BASE, '/all')
  });
}

function makeInclude(files) {
  var toPrint = [];
  files.map(function(file) {
    toPrint.push(path.relative(__dirname, file));
  });
  return toPrint;
}