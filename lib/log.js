// Simple logging function.
// TODO: colors
var config = '../config.js';
var levels = {
  silent: 0,
  error: 1,
  verbose: 2,
  info: 3
};
var current = levels[config.logging] || 1;

module.exports = function(message, level){
  level = level || 'verbose';
  if (levels[level] <= current){
    console.log(level + ': ' + message);
  }
};
