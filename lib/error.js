module.exports = function error(e){

  var type = typeof(error);

  if (type === 'object'){
    console.log(error.stack);
    this.callback(error.toString());
  } else if (type === 'string'){
    this.callback(error);
  }

}
