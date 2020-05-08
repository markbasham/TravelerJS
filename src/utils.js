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

function get_sector(sector) {
  var data_string = httpGet("../json/"+sector+".json")
  var data = JSON.parse(data_string);
  return data
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
  world.starport = get_value_from_table('world_starport', code.substring(0, 1));
  world.size = get_value_from_table('world_size', code.substring(1, 2));
  world.atmosphere = get_value_from_table('world_atmosphere', code.substring(2, 3));
  world.hydrographics = get_value_from_table('world_hydrographics', code.substring(3, 4));
  world.population = get_value_from_table('world_population', code.substring(4, 5));
  world.government = get_value_from_table('world_government', code.substring(5, 6));
  world.law_level = get_value_from_table('world_law_level', code.substring(6, 7));
  world.tech_level = get_value_from_table('world_tech_level', code.substring(8, 9));
  trim_illegal_posessions(world);
  return world;
}

function world_data_to_rows(name, data) {
  var title = name;
  for (const property in data) {
    document.write(`<tr><th>${title}</th><th>${property}</th><th>${data[property]}</th></tr>`);
    title = "";
  }
}

function world_data_to_table(world) {
  document.write("<table><tr><th style='width:25%'>Information</th><th style='width:40%'>Content</th><th style='width:35%'></th></tr>");
  world_data_to_rows("World Starport", world.starport);
  world_data_to_rows("World Size", world.size);
  world_data_to_rows("World Atmosphere", world.atmosphere);
  world_data_to_rows("World Hydrographics", world.hydrographics);
  world_data_to_rows("World Population", world.population);
  world_data_to_rows("World Government", world.government);
  world_data_to_rows("World Illegal Possessions", world.law_level);
  world_data_to_rows("World Tech Level", world.tech_level);
  document.write("</table>");
}
	
function create_empty_jump_map(jump_drive, world_x, world_y) {
  const sector = get_sector('spinward_marches');
  document.write(Object.keys(sector[1][1]));
  document.write(sector[1][1]['image']);
  const size = (jump_drive*2)+1;
  const table_width = 64*size;
  document.write(`<table border='0' cellspacing='0' cellpadding='0' width='${table_width}px' valign='top' style="color:#ffffff">`);
  
  // First line
  var full = (jump_drive%2)==0;
  var i = 0;
  document.write("<tr height='32px'>");
  for (j = 0; j < size; j++) {
	var x = j-jump_drive+world_x;
	var y = i-jump_drive+world_y;
	if (full) {
      document.write(`<td width="64px" rowspan="2" style="font-size:70%;" align="center" valign="bottom" background="${sector[x][y]['image']}"><a href="world.html?name=${sector[x][y]['name']}&code=${sector[x][y]['code']}">${sector[x][y]['name']}</a></td>`);
	} else {
	  document.write(`<td width='64px' rowspan='1' style="font-size:70%;" align="center" valign="bottom" background='../images/Top.jpg'></td>`);
	}
	full = !full;
  }
  document.write("</tr>");
  
  // Body of the grid
  const first_row_count = (Math.floor((jump_drive-1)/2)+1)*2;
  const second_row_count = Math.floor(jump_drive/2)*2+1;
  for (i = 1; i < size; i++) {
	var y = i-jump_drive+world_y;  
	if (world_x%2 == 1) {
	  y = y-1;
	}
	document.write("<tr height='32px'>");
	for (j = 0; j < first_row_count; j++) {
	  var x = j*2-jump_drive+world_x;
	  if (jump_drive%2 == 0) {
	    x = x+1;
	  }
	  document.write(`<td width="64px" rowspan="2" style="font-size:70%;" align="center" valign="bottom" background="${sector[x][y]['image']}"><a href="world.html?name=${sector[x][y]['name']}&code=${sector[x][y]['code']}">${sector[x][y]['name']}</a></td>`);
	}
	document.write("</tr>");
	
    document.write("<tr height='32px'>");
	var y = i-jump_drive+world_y;
	for (j = 0; j < second_row_count; j++) {
	  var x = j*2-jump_drive+1+world_x;
	  if (jump_drive%2 == 0) {
	    x = x-1;
	  }
	  document.write(`<td width="64px" rowspan="2" style="font-size:70%;" align="center" valign="bottom" background="${sector[x][y]['image']}"><a href="world.html?name=${sector[x][y]['name']}&code=${sector[x][y]['code']}">${sector[x][y]['name']}</a></td>`);
	}
	document.write("</tr>");
  }

  // Last line of the grid
  var full = (jump_drive%2)==0;
  document.write("<tr height='32px'>");
  for (j = 0; j < size; j++) {
	if (!full) {
	  document.write(`<td width='64px' rowspan='1' background='../images/Bottom.jpg'></td>`);
	}
	full = !full;
  }
  document.write("</tr>");
  document.write("</table>");
}





