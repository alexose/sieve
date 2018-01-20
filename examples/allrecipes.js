var sieve = require('../sieve');
var entry = {
  url: 'https://allrecipes.com/recipe/{{id}}',
  selector: '$(".recipe-ingred_txt").text()',
  engine: 'jQuery',
  data: {
    id: Array.from(new Array(10), (x,i) => i + 6663)
  }
};

sieve(entry, { onResult: function(result){
  console.log(result);
}});
