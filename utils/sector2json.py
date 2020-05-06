import argparse
import json

parser = argparse.ArgumentParser()
parser.add_argument("sector_file")
parser.add_argument("--skip", type=int, default=42, help="the base")
args = parser.parse_args()

sector_data = []
with open(args.sector_file, "r") as infile:
	sector_data = infile.readlines()

print(len(sector_data))


worlds = {}
for i in range(32):
	worlds[i+1] = {}
	for j in range(40):
		worlds[i+1][j+1] = {
			"name": "",
			"image": "../images/Empty.jpg",
			"code" : "",
			"gas_giant" : 0,
			"zone" : " "}

for i in range(args.skip, len(sector_data)):
	world_string = sector_data[i]
	print(world_string)
	world_x_loc = int(world_string[19:21])
	world_y_loc = int(world_string[21:23])
	print(world_x_loc)
	print(world_y_loc)
	worlds[world_x_loc][world_y_loc]['name'] = world_string[0:19]
	worlds[world_x_loc][world_y_loc]['image'] = "../images/Basic.jpg"
	worlds[world_x_loc][world_y_loc]['code'] = world_string[24:33]
	worlds[world_x_loc][world_y_loc]['gas_giant'] = int(world_string[55:56])
	if worlds[world_x_loc][world_y_loc]['gas_giant'] > 0:
		worlds[world_x_loc][world_y_loc]['image'] = "../images/GasGiant.jpg"
	worlds[world_x_loc][world_y_loc]['zone'] = world_string[52:53]
	
	print(worlds[world_x_loc][world_y_loc])

with open('sector.json', 'w') as outfile:
    json.dump(worlds, outfile)
