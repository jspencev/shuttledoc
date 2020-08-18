var thenifyAll = require('thenify-all');
var fs = thenifyAll(require('fs'));
var path = require('path');

/**
 * Write a file at a location. If the directory does not exist, it's created for you.
 * 
 * @param {String} file - Absolute path to the file
 * @param {String|Buffer} data - Data to write
 */
export default async function writeFileIfNotExist(file, data) {
  if (typeof data !== 'string') {
    data.toString();
  }
  var dirs = file.split('/');
  var filedir = '';
  for (var i = 0; i < dirs.length - 1; i++) {
    var dir = dirs[i];
    filedir += '/' + dir;
  }
  await fs.mkdir(filedir, {recursive: true});
  filedir = path.join(filedir, dirs[dirs.length-1]);
  await fs.writeFile(filedir, data);
}