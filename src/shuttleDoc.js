var thenify = require('thenify');
var thenifyAll = require('thenify-all');
var jsdoc = require('jsdoc-api');
var glob = thenify(require('glob'));
var fs = thenifyAll(require('fs'));
var babelParser = require('@babel/parser');
var parseComment = require('comment-parser');

export async function parse(opts = {}) {
  var defaultOpts = {
    exclude: [
      'node_modules/**'
    ]
  };
  opts = Object.assign({}, defaultOpts, opts);

  // var g = '**/*.js';
  var g = '**/a.js';
  var matches = await glob(g, {ignore: opts.exclude});
  var files = {};
  for (var i = 0; i < matches.length; i++) {
    var match = matches[i];
    var code = (await fs.readFile(match)).toString();
    var parsed = babelParser.parse(code, {
      allowImportExportEverywhere: true,
      sourceFilename: match,
      sourceType: 'unambiguous'
    });
    var topLevels = parsed.program.body;
    var decs = [];
    var named = [];
    topLevels.map(function(node) {
      var dec;
      if (node.type === 'ExportDefaultDeclaration' || node.type === "ExportNamedDeclaration") {
        var name;
        if (node.declaration.type === 'Identifier') {
          name = node.declaration.name;
        } else {
          name = node.declaration.id.name;
        }
        if (named.includes(name)) {
          for (var j = 0; j < decs.length; decs++) {
            if (decs[j].name === name) {
              dec = decs[j];
              break;
            }
          }
        } else {
          dec = {
            name: name
          };
        }
        dec.is_export = true;
        var leadingComments = node.leadingComments;
        node = node.declaration;
        node.leadingComments = leadingComments;
      }
      if (node.type === 'VariableDeclaration') {
        node.declarations.map(function(declaration) {
          dec = parseDeclaration(dec, declaration);
        });
      } else if (node.type === 'FunctionDeclaration') {
        dec = parseDeclaration(dec, node);
      } else if (node.type === 'ClassDeclaration') {
        if (!dec) {
          dec = {
            name: node.id.name
          }
        }
        var internal = {};
        var internals = node.body.body;
        internals.map(function(declaration) {
          var int = {
            name: declaration.key.name
          }
          int = parseDeclaration(int, declaration);
          int = parseLeadingComments(int, declaration.leadingComments);
          internal[int.name] = int;
        });
        dec.class_internals = internal;
      }
      dec = parseLeadingComments(dec, node.leadingComments);
      if (dec) {
        if (dec.name && !named.includes(dec.name)) {
          named.push(dec.name);
          decs.push(dec);
        }
      }
    });
    files[match] = decs;
  }
  return files;
}

function parseDeclaration(dec, declaration) {
  if (!dec) {
    dec = {
      name: declaration.id.name
    };
  }
  if (declaration.type === 'VariableDeclarator') {
    dec.type = 'variable';
  } else if (declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassMethod') {
    dec.type = 'function';
    var ps = {};
    declaration.params.map(function(param) {
      ps[param.name] = {
        name: param.name
      };
    });
    dec.params = ps;
    if (declaration.kind === 'constructor') {
      dec.is_constructor = true;
    }
  }
  return dec;
}

function parseLeadingComments(dec, comments) {
  if (comments) {
    comments.map(function(commentBlock) {
      var comment = '/*' + commentBlock.value + '*/';
      var parsedComment = parseComment(comment);
      parsedComment = parsedComment[0];
      dec.has_description = !!parsedComment.description;
      parsedComment.tags.map(function(tag) {
        var tagType = tag.tag;
        if (tagType === 'param' && dec.params[tag.name]) {
          dec.params[tag.name].has_description = !!tag.description;
          dec.params[tag.name].has_type = !!tag.type;
        } else if (tagType === 'returns') {
          dec.has_return = {
            has_description: !!tag.description,
            has_type: !!tag.type
          }
        }
      });
    });
  }
  return dec;
}