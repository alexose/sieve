module.exports = template;

// Turns a templated entry into an array of requests 
function template(entry){

  if (this.isArray(entry)){
    return entries.map(template); 
  }

  if (entry.url && entry.data){ 
 
    // Generate sets from provided data
    var sets = sets(entry.data);

    // Return an array of entries  
    return replace(entry, sets);
  } else {
    return entry;
  }
}

// Text replacement
function replace(entry, sets){

  var results = sets.map(function(d){

    var string = entry.url;
    Object.keys(d).forEach(function(key){
      string = string.replace('{{' + key + '}}', d[key]);  
    });

    // TODO: Better cloning
    var child = JSON.parse(JSON.stringify(entry));
    child.url = string;
    child.data = d;

    return child;
  });

  return results;
}

// Given arrays of data, let's try to align them into sets.
// (Most likely nobody will rely on this, but let's try)
// TODO: Think about having users provide sets explicitly
function sets(data){

  var index = []
    , arrays = []
    , strings = [];

  Object.keys(data).forEach(function(key){

    var obj = {}
      , value = obj[key] = data[key];

    if (this.isArray(value)){
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

