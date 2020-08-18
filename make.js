try {
  require('./setupEntry');
  (async function() {
    await require('./make/make')();
    process.exit();
  })();
} catch (e) {
  var install = require('child_process').spawnSync('npm', ['install'], {stdio: 'inherit'});
  if (!install.error) {
    require('child_process').spawnSync('node', ['make'], {stdio: 'inherit'});
  }
  process.exit();
}