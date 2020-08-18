var aliasConfig = require('./alias.config');

module.exports = function (api) {
  api.cache(true);

  var presets = [
    ['@babel/preset-env', {
      useBuiltIns: 'usage',
      corejs: 3
    }]
  ];
  
  var plugins = [
    ['module-resolver', {
      alias: aliasConfig
    }]
  ];

  if (process.env.NODE_ENV === 'test') {
    plugins.push('babel-plugin-rewire');
  }

  return {
    presets,
    plugins
  };
}