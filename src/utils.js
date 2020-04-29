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

function trim_illegal_posessions(world) {
  if (world.government["Common Contraband"].includes("Varies")) {
    // List everything just in case
    return;
  }
  var keys = ["Weapons", "Drugs", "Information", "Technology", "Travellers", "Psionics"];
  for (const key of keys) {
    if (!world.government["Common Contraband"].includes(key)) {
      delete world.law_level[key];
    }
  }
}


function get_world_data(code) {
  var world = new Object();
  world.size = get_value_from_table('world_size', code.substring(1, 2));
  world.atmosphere = get_value_from_table('world_atmosphere', code.substring(2, 3));
  world.hydrographics = get_value_from_table('world_hydrographics', code.substring(3, 4));
  world.population = get_value_from_table('world_population', code.substring(4, 5));
  world.government = get_value_from_table('world_government', code.substring(5, 6));
  world.law_level = get_value_from_table('world_law_level', code.substring(6, 7));
  trim_illegal_posessions(world);
  return world;
}

function world_data_to_table(name, data) {
  var title = name;
  for (const property in data) {
    document.write(`<tr><th>${title}</th><th>${property}</th><th>${data[property]}</th><tr>`);
    title = "";
  }
}
