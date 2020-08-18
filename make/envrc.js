var quote = require('quote');
var appRoot = require('app-root-path').toString();

export const env = [
  'export ROOT_PATH=' + quote(appRoot)
]

export const nvm = [
  'type nvm >/dev/null 2>&1 || . ~/.nvm/nvm.sh',
  'nvm install'
]