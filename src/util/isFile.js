var fs = require('fs');
var path = require('path');

/**
 * Checks whether a given path is a file or directory.
 * 
 * @param {String} absolutePath - Abolute path to the file/directory to check.
 * @returns {Boolean} - True if file, false if directory.
 */
export default async function isFile(absolutePath) {
  return new Promise(function(resolve) {
    if (path.isAbsolute(absolutePath)) {
      fs.stat(absolutePath, function(err, stats) {
        if (err) {
          throw err;
        }
        resolve(stats.isFile());
      });
    } else {
      throw Error('j8se: The path submitted was not absolute.');
    }
  });
}