function httpGet(theUrl) {
  var xmlHttp = null;
  xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "GET", theUrl, false );
  xmlHttp.send( null );
  return xmlHttp.responseText;
}

function get_value_from_table(table, lookup='0') {
  var data_string = httpGet("../json/"+table+".json")
  var data = JSON.parse(data_string);
  var index = 'D'+lookup;
  switch(data.select) {
    case "D66":
      index = ('R' + Math.floor(Math.random() * 6 + 1))+ Math.floor(Math.random() * 6 + 1);
      break;
  }
  return data.data[index]
}

function get_world_data(code) {
  var world = new Object();
  world.size = get_value_from_table('world_size', code.substring(1, 2));
  world.atmosphere = get_value_from_table('world_atmosphere', code.substring(2, 3));
  world.hydrographics = get_value_from_table('world_hydrographics', code.substring(3, 4));
  return world;
}

function world_data_to_table(name, data) {
  var title = name;
  for (const property in data) {
    document.write(`<tr><th>${title}</th><th>${property}</th><th>${data[property]}</th><tr>`);
    title = "";
  }
}
