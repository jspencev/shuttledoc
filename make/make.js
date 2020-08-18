var thenifyAll = require('thenify-all');
var inquirer = require('inquirer');
var fs = thenifyAll(require('fs'));
var path = require('path');
import { writeFileIfNotExist, mapObject, isFile } from '#util';
import { nvm as nvmLines, env as envLines } from './envrc';
var commandExists = require('command-exists');

async function make() {
  var isDirenv = await checkDirenv(inquirer);

  var questions = [
    {
      name: 'vscode',
      type: 'confirm',
      message: 'Are you using VS Code?'
    }
  ];
  var answers = await inquirer.prompt(questions);
  var isVscode = answers.vscode;
  if (isVscode) {
    questions = [
      {
        name: 'launch',
        type: 'confirm',
        message: 'Do you want to automatically generate launch.json and tasks.json? These will overwrite any existing files in ./vscode. These files are .gitignored so you can merge in your own custom configurations.'
      },
      {
        name: 'jsconfig',
        type: 'confirm',
        message: 'Do you want to write jsconfig.json with the project defaults? This will improve vscode\'s parsing.'
      }
    ];
    answers = await inquirer.prompt(questions);
    if (answers.launch) {
      var launchBuf = await fs.readFile(path.join(__dirname, './vscode/launch.json'));
      await writeFileIfNotExist(path.join(__dirname, '../.vscode/launch.json'), launchBuf);
    }
    if (answers.jsconfig) {
      var jsconfig = JSON.parse((await fs.readFile(path.join(__dirname, './vscode/jsconfig.json'))).toString());
      jsconfig = await convertAliasToVsCode(jsconfig);
      await writeFileIfNotExist(path.join(__dirname, '../jsconfig.json'), JSON.stringify(jsconfig, null, 2));
    }
  }
  
  var specialExit = false;
  if (isDirenv) {
    specialExit = true;
    console.log();
    console.log('!! You must run "direnv allow" to load environment variables.');
  }

  if (isVscode) {
    specialExit = true;
    console.log('!! You must restart VS Code to load the configuration.');
  }

  if (!specialExit) {
    console.log("You're good to go :)");
  } else {
    console.log();
  }
}

async function checkDirenv(inquirer) {
  var questions;
  await commandExists('direnv').catch(async function() {
    questions = [
      {
        name: 'direnv',
        type: 'input',
        message: 'This project uses direnv to manage the development env. Visit https://direnv.net/ to install direnv. To continue without direnv (not recommended), type "continue"'
      }
    ];
    var answers = await inquirer.prompt(questions);
    if (answers.direnv === 'continue') {
      return false;
    } else {
      console.log('Goodbye');
      process.exit();
    }
  });

  var nvmExists = await checkNvm();
  if (!nvmExists) {
    questions = [
      {
        name: 'nvm',
        type: 'input',
        message: 'This project specifies a design node version in .nvmrc. NVM is not currently installed on your system. Visit http://nvm.sh to install NVM. To continue without nvm (not recommended), type "continue"'
      }
    ];
    var answers = await inquirer.prompt(questions);
    if (answers.nvm !== 'continue') {
      console.log('Goodbye');
      process.exit();
    }
  }

  console.log('Writing .envrc...');
  var envrcCode = '';
  
  envLines.map(function(line) {
    envrcCode += line + '\n';
  });

  envrcCode += '\n';

  if (nvmExists) {
    nvmLines.map(function(line) {
      envrcCode += line + '\n';
    });
  }

  await writeFileIfNotExist(path.join(__dirname, '../.envrc'), envrcCode);

  return true;
}

async function checkNvm() {
  if (process.env.NVM_DIR) {
    var nvmScript = path.resolve(path.join(process.env.NVM_DIR, '/nvm.sh'));
    return await isFile(nvmScript);
  } else {
    return false;
  }
}

async function convertAliasToVsCode(jsconfig) {
  var alias = require('~root/alias.config');
  var jsconfigAlias = {};
  await mapObject(alias, async function(p, name) {
    var isF = await isFile(p);
    var basePath = path.join(__dirname, '..');
    var relative = path.relative(basePath, p);
    if (!isF) {
      relative = path.join(relative, '/*');
      name = path.join(name, '/*');
    }
    if (relative.charAt(0) === '/') {
      relative = '.' + relative;
    } else {
      relative = './' + relative;
    }
    jsconfigAlias[name] = [relative];
  });
  jsconfig.compilerOptions.paths = jsconfigAlias;
  return jsconfig;
}

module.exports = make;