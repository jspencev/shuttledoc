require = require('import-fresh');

var path = require('path');
var Mocha = require('mocha');
import { writeFileIfNotExist } from '#util';

async function test(config) {
  var mochaOpts = {
    ui: 'bdd',
    bail: false,
    colors: true
  };
  if (config.debug) {
    mochaOpts.timeout = 999999;
  }
  var mocha = new Mocha(mochaOpts);

  var filename = path.join(__dirname, '../', './test/tmp/mainTestFile.js');
  var suiteName = config.file || 'test/all.suite.js';
  var suiteFilename;
  if (path.isAbsolute(suiteName)) {
    suiteFilename = suiteName;
  } else {
    suiteFilename = path.join(__dirname, '../', suiteName);
  }
  var lines = [
    "import run from '" + suiteFilename + "'",
    "run();"
  ];
  var code = '';
  lines.map(function(line) {
    code += line + '\n';
  });
  await writeFileIfNotExist(filename, code);
  mocha.addFile(filename);
  await runMocha(mocha);
}

async function runMocha(mocha) {
  return new Promise(function(resolve) {
    mocha.run(function() {
      resolve();
    });
  });
}

module.exports = test;