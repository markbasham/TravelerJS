function httpGet(theUrl) {
  var xmlHttp = null;
  xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "GET", theUrl, false );
  xmlHttp.send( null );
  return xmlHttp.responseText;
}

function roll_dice(dice_value) {
  if (dice_value.includes('D') == false) {
	  return parseInt(dice_value);
  }
  var d_split = dice_value.split('D')
  var multiplier = 1;
  if (d_split[0].length > 0) {
    multiplier = parseInt(d_split[0]);
  }
  var modifier = 0;
  var dice = "";
  if (d_split[1].includes("+")) {
    var m_split = d_split[1].split("+");
	dice = m_split[0];
	modifier = parseInt(m_split[1]);
  } else if (d_split[1].includes("-")){
	var m_split = d_split[1].split("-");
	dice = m_split[0];
	modifier = -parseInt(m_split[1]);
  } else {
	  dice = d_split[1];
  }
  var roll = 0;
  for (var i = 0; i < multiplier; i++) {
    switch(dice) {
      case "6":
	    roll += Math.floor(Math.random() * 6 + 1);
	    break;
	  case "66":
	    roll += (Math.floor(Math.random() * 6 + 1)*10)+Math.floor(Math.random() * 6 + 1);
		break;
	}
  }
  roll += modifier;
  return roll;	  
}

function get_value_from_table(table, lookup='0') {
  var data_string = httpGet("../json/"+table+".json");
  var data = JSON.parse(data_string);
  var index = 'D'+lookup;
  switch(data.select) {
    case "D66":
      index = ('R' + Math.floor(Math.random() * 6 + 1))+ Math.floor(Math.random() * 6 + 1);
      break;
	case "value":
	  var value = lookup
	  if (value > data['value_max']) {
		  value = data['value_max'];
	  }
	  if (value < data['value_min']) {
		  value = data['value_min'];
	  }
	  index = ('V' + value);
      break;
  }
  return data.data[index];
}

function get_trade_codes() {
  var data_string = httpGet("../json/trade_codes.json");
  var data = JSON.parse(data_string);
  return data['data'];
}

function get_freight_traffic() {
  var data_string = httpGet("../json/freight_traffic.json");
  var data = JSON.parse(data_string);
  return data;
}

function get_passenger_traffic() {
  var data_string = httpGet("../json/passenger_traffic.json");
  var data = JSON.parse(data_string);
  return data;
}

function get_sector(sector) {
  var data_string = httpGet("../json/"+sector+".json");
  var data = JSON.parse(data_string);
  return data;
}

function get_jump_map() {
  var data_string = httpGet("../json/jump_map.json");
  var data = JSON.parse(data_string);
  return data;
}

function get_passenger_fees() {
  var data_string = httpGet("../json/passenger_fees.json");
  var data = JSON.parse(data_string);
  return data;
}

function get_worlds_at_jump_range(sector, world_x, world_y, jump){
  var jump_map = get_jump_map();
  //document.write("<br>Jump "+jump.toString()+" : ");
  var x_grid = 'odd';
  if (world_x % 2 == 0){
	  x_grid = 'even';
  }
  world_list = [];
  jump_list = jump_map[x_grid]['J'+jump.toString()];
  for (var i = 0; i < jump_list.length; i++) {
    var jump_world = sector[world_x + jump_list[i][0]][world_y + jump_list[i][1]];
	if (!(jump_world.name == "")) {
	  world_list.push(jump_world);
	  //document.write(jump_world.name+", ");
	}
  }
  return world_list;
}

function get_freight_modifiers(world, destination) {
  var freight_traffic = get_freight_traffic();
  var lookup = freight_traffic['current'];
  if (destination) {
    lookup = freight_traffic['destination'];    
  }
  var mod = 0;
  for (const code of world.trade_codes) {
	  mod = mod + parseInt(lookup[code]);
  }
  return mod;
}

function get_passenger_modifiers(world, destination) {
  var passenger_traffic = get_passenger_traffic();
  var lookup = passenger_traffic['current'];
  if (destination) {
    lookup = passenger_traffic['destination'];    
  }
  var mod = 0;
  for (const code of world.trade_codes) {
	  mod = mod + parseInt(lookup[code]);
  }
  return mod;
}

function get_mail_modifiers(tech_level, freight_DM, ship_armed=false, NSFT_rank=0, social_standing_DM=0) {
  var mail_DM = NSFT_rank;
  if (freight_DM <= -10) {mail_DM -= 2}
  if (freight_DM <= -5 && freight_DM >= -9 ) {mail_DM -= 1}
  if (freight_DM >= 5 && freight_DM <= 9 ) {mail_DM += 1}
  if (freight_DM >= 10) {mail_DM += 2}
  if (ship_armed) {mail_DM += 2}
  mail_DM += social_standing_DM;
  if (tech_level <= 5) {mail_DM -= 4}
  return mail_DM;  
}

function get_trade_map(sector, world_name, jump, ship_armed, NSFT_rank, social_standing_DM) {
  var world_pos = get_world_location(world_name, sector);
  var world_x = world_pos[0];
  var world_y = world_pos[1];	
	
  var trade_map = new Object(); 
  trade_map.world = get_world_data(sector[world_x][world_y].code);
  var current_freight_DM = get_freight_modifiers(trade_map.world, false);
  var current_passenger_DM = get_passenger_modifiers(trade_map.world, false);
  for (var i = 1; i <= jump; i++) {
    trade_map[i] = get_worlds_at_jump_range(sector, world_x, world_y, i);
	//document.write("<br>Jump "+i.toString()+" : ");
	for (var j = 0; j < trade_map[i].length; j++) {
		var destination_world = get_world_data(trade_map[i][j].code);
		
		// Set up the freight information
		trade_map[i][j]["freight_DM"] = current_freight_DM + get_freight_modifiers(destination_world, true);
		var freight_traffic_value = parseInt(destination_world.population_value, 16);
		freight_traffic_value += trade_map[i][j]["freight_DM"];
		trade_map[i][j]["Available_freight_lots"] = get_value_from_table("freight_available_lots", lookup = freight_traffic_value);
		
		// Set up the mail values
		trade_map[i][j]["mail_DM"] = get_mail_modifiers(parseInt(world.tech_level_value,16),
		   trade_map[i][j]["freight_DM"],
		   ship_armed=ship_armed,
		   NSFT_rank=NSFT_rank,
		   social_standing_DM=social_standing_DM);
		
		// Set up the freight information
		trade_map[i][j]["passenger_DM"] = current_passenger_DM + get_passenger_modifiers(destination_world, true);
		var passenger_traffic_value = parseInt(destination_world.population_value, 16);
		passenger_traffic_value += trade_map[i][j]["passenger_DM"];
		trade_map[i][j]["Available_passengers"] = get_value_from_table("passenger_available_lots", lookup = passenger_traffic_value);
	}
  }
  return trade_map;
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

function get_world_trade_codes(world){
  var trade_codes = get_trade_codes();
  var world_codes = [];
  for (const code in trade_codes) {
	//document.write("<b>================="+code+"</b><br>");
	delete trade_codes[code].Classification;
	delete trade_codes[code].Description;
	var code_valid = true;
    for (const requirement in trade_codes[code]) {	
      //document.write(requirement+"<br>");		  
	  var req_value = parseInt(world[requirement+'_value'], 16);
	  var req_valid = false;
      for (const range of trade_codes[code][requirement].split(',')) {
		//document.write(range.toString(), "<br>"); 
		var min = parseInt(range.substring(0, 2));
		var max = Math.abs(parseInt(range.substring(2)));
		//document.write(`${req_value},${min},${max}<br>`); 
		if (req_value >= min && req_value <= max) {
			req_valid = true;
		}
		//document.write(req_valid,"<br>");
	  }
	  if (req_valid == false) {
		  code_valid = false;
	  }
	  //document.write(code_valid,"<br>");
    }
	if (code_valid) {
	  world_codes.push(code);
	}
  }
  //document.write("WORLD CODES", world_codes,"<br>");
  return(world_codes);
}

function get_world_data(code) {
  var world = new Object();  
  world.starport_value = code.substring(0, 1);
  world.size_value = code.substring(1, 2);
  world.atmosphere_value = code.substring(2, 3);
  world.hydrographics_value = code.substring(3, 4);
  world.population_value = code.substring(4, 5);
  world.government_value = code.substring(5, 6);
  world.law_level_value = code.substring(6, 7);
  world.tech_level_value = code.substring(8, 9);
  
  world.starport = get_value_from_table('world_starport', world.starport_value);
  world.size = get_value_from_table('world_size', world.size_value);
  world.atmosphere = get_value_from_table('world_atmosphere', world.atmosphere_value);
  world.hydrographics = get_value_from_table('world_hydrographics', world.hydrographics_value);
  world.population = get_value_from_table('world_population', world.population_value);
  world.government = get_value_from_table('world_government', world.government_value);
  world.law_level = get_value_from_table('world_law_level', world.law_level_value);
  world.tech_level = get_value_from_table('world_tech_level', world.tech_level_value);
  trim_illegal_posessions(world);
  
  world.trade_codes = get_world_trade_codes(world);
  return world;
}

function world_data_to_rows(name, data) {
  var title = name;
  for (const property in data) {
    document.write(`<tr><td>${title}</td><td>${property}</td><td>${data[property]}</td></tr>`);
    title = "";
  }
}

function world_data_to_table(world) {
  document.write("<table class='world_table'><tr><th style='width:25%'>Information</th><th style='width:40%'>Content</th><th style='width:35%'></th></tr>");
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

function world_trade_data_to_table(world) {
  var trade_codes = get_trade_codes();
  document.write("<table class='world_trade_table'><tr><th style='width:10%'>Code</th><th style='width:25%'>Classification</th><th style='width:65%'>Description</th></tr>");
  for (const code of world.trade_codes) {
	  document.write(`<tr><td>${code}</td><td>${trade_codes[code]['Classification']}</td><td>${trade_codes[code]['Description']}</td></tr>`);
  }
  document.write("</table>");
}

function build_freight_table(trade_map) {
  var trade_codes = get_trade_codes();
  document.write("<table class='freight_table'><tr><th style='width:10%'>World</th><th style='width:20%'>Jump</th><th style='width:30%'>Tons of Freight</th><th style='width:30%'>Freight type</th><th style='width:10%'>Fee</th></tr>");
  const pop = parseInt(trade_map.world.population_value, 16);
  for (var j = 0; j < Math.ceil(pop/3.0); j++) {
    document.write(`<tr><th>Source ${j}</th><th></th><th></th><th></th><th></th></tr>`);
	var base_source_cost=500;
    for (const jump in trade_map) {
	  if (jump === 'world') { continue; }
      for (const freight of trade_map[jump]) {
	    for (const freight_type in freight.Available_freight_lots) {
		  for (var i = 0; i < roll_dice(freight.Available_freight_lots[freight_type]); i++) {
		    var freight_weight = roll_dice('D6');
		    if (freight_type == 'Minor') { freight_weight *= 5 }
		    if (freight_type == 'Major') { freight_weight *= 10 }
			var fee = (freight_weight*base_source_cost)*(1+(0.2*(parseInt(jump)-1)));
		    document.write(`<tr><td>${freight.name}</td><td>${jump}</td><td>${freight_weight}</td><td>Goods</td><td>${fee}</td></tr>`);
		  }
		}
	  }
	}
  }
  document.write("</table>");
}

function build_mail_table(trade_map) {
  var trade_codes = get_trade_codes();
  document.write("<table class='mail_table'><tr><th style='width:25%'>Jump</th><th style='width:50%'>World</th><th style='width:25%'>Fee</th></tr>");
  var base_mail_cost=20000;
  for (const jump in trade_map) {
	if (jump == 'world') { continue; }
    for (const mail of trade_map[jump]) {
      var mail_check = roll_dice("2D6") + mail.mail_DM;
	  if (mail_check >= 12) {
		  document.write(`<tr><td>${jump}</td><td>${mail.name}</td><td>${base_mail_cost}</td></tr>`);
	  }
	}
  }
  document.write("</table>");
}

function get_number_of_special_passengers(number_of_passengers) {
  var number_or_rolls = Math.floor(number_of_passengers/6);
  if (number_of_passengers != 0 && number_or_rolls == 0) {
	  number_or_rolls++;
  }
  var specials = 0;
  var i;
  for (i = 0; i < number_or_rolls; i++) {
    if (roll_dice("D6") > 3) {
	  specials++;
	}
  }
  return specials;
}

function build_special_pasenger_list(quantity){
  if (quantity == 0) {
	  return "";
  }
  var i;
  var result = get_value_from_table("random_passenger")["passenger"];
  for (i = 1; i < quantity; i++) {
    result += "<br>" + get_value_from_table("random_passenger")["passenger"];
  }
  return result;
}

function build_passenger_table(trade_map) {
  var trade_codes = get_trade_codes();
  document.write("<table class='passenger_table'><tr><th style='width:15%'>World</th><th style='width:5%'>Jump</th><th style='width:10%'>Low Passengers</th><th style='width:10%'>Fee per Passenger</th><th style='width:10%'>Middle Passengers</th><th style='width:10%'>Fee per Passenger</th><th style='width:10%'>High Passengers</th><th style='width:10%'>Fee per Passenger</th><th style='width:10%'>Middle Special Passengers</th><th style='width:10%'>High Special Passengers</th></tr>");
  for (const jump in trade_map) {
	if (jump == 'world') { continue; }
    for (const dest_world of trade_map[jump]) {
      var low_passage = roll_dice(dest_world["Available_passengers"].Low);
	  var mid_passage = roll_dice(dest_world["Available_passengers"].Middle);
	  var high_passage = roll_dice(dest_world["Available_passengers"].High);
	  const mid_specials = get_number_of_special_passengers(mid_passage);
	  const high_specials = get_number_of_special_passengers(high_passage);
	  const passenger_fees = get_passenger_fees()[jump];
	  
      document.write(`<tr><td>${dest_world.name}</td><td>${jump}</td><td>${low_passage}</td><td>${passenger_fees['Low']}</td><td>${mid_passage}(${mid_specials})</td><td>${passenger_fees['Middle']}</td><td>${high_passage}(${high_specials})</td><td>${passenger_fees['High']}</td><td>${build_special_pasenger_list(mid_specials)}</td><td>${build_special_pasenger_list(high_specials)}</td></tr>`);
	}
  }
  document.write("</table>");
}

function get_world_location(world_name, sector) {
  var world_x;
  var world_y;
  var i;
  var j;
  for (i = 1; i < 33; i++) {
    for (j = 1; j < 41; j++) {
	  if (world_name.trim() == sector[i][j]['name'].trim()) {
		world_x = i;
	    world_y = j;
	  }
    }
  }
  return [world_x, world_y];
}  
	
	
function create_jump_map(jump_drive, world_name, ship_armed,  NSFT_rank, social_standing_DM) {
  const sector = get_sector('spinward_marches');
  var world_pos = get_world_location(world_name, sector);
  var world_x = world_pos[0];
  var world_y = world_pos[1];

  const size = (jump_drive*2)+1;
  const table_width = 64*size;
  document.write(`<table class='sector_table' width='${table_width}px'>`);
  
  // First line
  var full = (jump_drive%2)==0;
  var i = 0;
  document.write("<tr class='sector_table_row'>");
  for (j = 0; j < size; j++) {
	var x = j-jump_drive+world_x;
	var y = i-jump_drive+world_y;
	if (full) {
      document.write(`<td class='sector_table_column' rowspan="2" background="${sector[x][y]['image']}"> <div class="startport_text">${sector[x][y]['code'].substring(0, 1)}</div> <br> <a class="world_link"  href="world.html?name=${sector[x][y]['name']}&code=${sector[x][y]['code']}&jump=${jump_drive}&ship_armed=${ship_armed}&NSFT_rank=${NSFT_rank}&social_standing_DM=${social_standing_DM}"> ${sector[x][y]['name']} </a> </td>`);
	} else {
	  document.write(`<td class='sector_table_column' rowspan='1' align="center" valign="bottom" background='../images/Top.jpg'></td>`);
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
	document.write("<tr class='sector_table_row'>");
	for (j = 0; j < first_row_count; j++) {
	  var x = j*2-jump_drive+world_x;
	  if (jump_drive%2 == 0) {
	    x = x+1;
	  }
      document.write(`<td class='sector_table_column' rowspan="2" background="${sector[x][y]['image']}"> <div class="startport_text">${sector[x][y]['code'].substring(0, 1)}</div> <br> <a class="world_link"  href="world.html?name=${sector[x][y]['name']}&code=${sector[x][y]['code']}&jump=${jump_drive}&ship_armed=${ship_armed}&NSFT_rank=${NSFT_rank}&social_standing_DM=${social_standing_DM}"> ${sector[x][y]['name']} </a> </td>`);
	}
	document.write("</tr>");
	
    document.write("<tr class='sector_table_row'>");
	var y = i-jump_drive+world_y;
	for (j = 0; j < second_row_count; j++) {
	  var x = j*2-jump_drive+1+world_x;
	  if (jump_drive%2 == 0) {
	    x = x-1;
	  }
      document.write(`<td class='sector_table_column' rowspan="2" background="${sector[x][y]['image']}"> <div class="startport_text">${sector[x][y]['code'].substring(0, 1)}</div> <br> <a class="world_link"  href="world.html?name=${sector[x][y]['name']}&code=${sector[x][y]['code']}&jump=${jump_drive}&ship_armed=${ship_armed}&NSFT_rank=${NSFT_rank}&social_standing_DM=${social_standing_DM}"> ${sector[x][y]['name']} </a> </td>`);
	}
	document.write("</tr>");
  }

  // Last line of the grid
  var full = (jump_drive%2)==0;
  document.write("<tr class='sector_table_row'>");
  for (j = 0; j < size; j++) {
	if (!full) {
	  document.write(`<td class='sector_table_column' rowspan='1' background='../images/Bottom.jpg'></td>`);
	}
	full = !full;
  }
  document.write("</tr>");
  document.write("</table>");
  
  return sector;
}




