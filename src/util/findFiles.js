var thenify = require('thenify');
var path = require('path');
var glob = thenify(require('glob'));

const EXTENSIONS = [
  '',
  '.js',
  '.jsx'
];

/**
 * Find all files in a directory (recursive) or look for a specific file in a specific directory (non-recursive)
 * 
 * @param {string} absolutePath - Absolute path to the directory you want to look in.
 * @param {string} [file] - File to look for in the directory.
 * @returns {Promise<string[]>} - Array of absolute path files found.
 */

 export default async function(absolutePath, file) {
   var files = [];
   if (file) {
    for (var i = 0; i < EXTENSIONS.length; i++) {
      var ext = EXTENSIONS[i];
      var tryFile = file + ext;
      var tryPath = path.join(absolutePath, tryFile);
      matches = await glob(tryPath);
      if (matches.length >= 1) {
        files = matches;
        break;
      }
    }
    return files;
   } else {
    var pattern = path.join(absolutePath, '**/*.js');
    files = await glob(pattern);
    return files;
   }
 }