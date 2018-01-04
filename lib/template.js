module.exports = template;

function template(entry, data){
  var string = JSON.stringify(entry);
  Object.keys(data).forEach(function(key){
    string = string.split('{{' + key + '}}').join(data[key]);
  });
  return JSON.parse(string);
}
