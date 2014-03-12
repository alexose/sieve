module.exports = template;

// Turns a templated entry into an array of requests 
function template(entry){

  if (toString.call(entry) === '[object Array]'){
    return entries.map(template); 
  }

  if (entry.url && entry.data){ 
 
    // Generate sets from provided data
    var sets = align(entry.data);

    // Return an array of entries  
    return replace(entry, sets);
  } else {
    return entry;
  }
}

function replace(entry, sets){

  var results = sets.map(function(d){

    var string = JSON.stringify(entry);
    Object.keys(d).forEach(function(key){
      string = string.split('{{' + key + '}}').join(d[key]);
    });

    return JSON.parse(string);
  });

  return results;

}

// Given arrays of data, let's try to align them into sets.
// (Most likely nobody will rely on this, but let's try)
// TODO: Think about having users provide sets explicitly
function align(data){

  var index = []
    , arrays = []
    , strings = [];

  Object.keys(data).forEach(function(key){

    var obj = {}
      , value = obj[key] = data[key];

    if (toString.call(value) === '[object Array]'){
      arrays.push({
        key : key,
        value : value
      });
    } else if (typeof(value) === 'string'){
      strings.push(obj);
    }
  }.bind(this));

  var sets = [];
  
  if (arrays.length){
    
    // Find shortest array
    arrays.sort(function(a,b){
      return a.value.length > b.value.length ? -1 : 1;
    });
    var shortest = arrays[0];
    for (var i in shortest.value){

      // TODO: Better cloning
      var set = JSON.parse(JSON.stringify(strings));

      for (var c in arrays){
        var arr = arrays[c]
          , key = arr.key
          , value = arr.value[i];

        set[key] = value;
      }
      sets.push(set);
    }
  } else {
    sets = JSON.parse(JSON.stringify(strings));
  }

  return sets;
}

