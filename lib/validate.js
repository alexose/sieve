// TODO: Better validation feedback
module.exports = function validate(entry){

  if (toString.call(entry) === '[object Array]'){
    // return entries.map(validate);
    return true;
  }

  return true;
}
