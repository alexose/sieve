var helpers = require('./helpers');

module.exports = template;

function template(entry, data){
  Object.keys(data).forEach(function(key){
    var value = data[key];

    if (helpers.isArray(value)){
      var results = [];
      value.forEach(function(d){
        results.push(replace(entry, key, d));
      });
      entry = results; 
    } else {
      entry = replace(entry, key, value);
    }
  });
  return helpers.isArray(entry) ? flatten(entry) : entry; 
}

function replace(entry, key, value){
  var str = JSON.stringify(entry);
  str = str.split('{{' + key + '}}').join(value);
  return JSON.parse(str);
}

function flatten() {
  var flat = [];
  for (var i = 0; i < arguments.length; i++) {
    if (arguments[i] instanceof Array) {
      flat.push.apply(flat, flatten.apply(this, arguments[i]));
    } else {
      flat.push(arguments[i]);
    }
  }
  return flat;
}
