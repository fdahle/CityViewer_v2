//Camera variables
var scene;
var camera;
var renderer;
var raycaster;
var mouse;
var controls;
var spot_light;

//axis camera variables
var renderer2
var scene2
var camera2
var axes2


//variables for json
var jsonDict = {} //the complete json file
var jsonIdDict = {} //translation between unique id and json name (can be multiple files with same name)
var jsonStats = {}
//determine which object is clicked in three js
var clickedObj = null

var ALLCOLOURS = {
  "Building": 0xcc0000,
  "BuildingPart": 0xcc0000,
  "BuildingInstallation": 0xcc0000,
  "Bridge": 0x999999,
  "BridgePart": 0x999999,
  "BridgeInstallation": 0x999999,
  "BridgeConstructionElement": 0x999999,
  "CityObjectGroup": 0xffffb3,
  "CityFurniture": 0xcc0000,
  "GenericCityObject": 0xcc0000,
  "LandUse": 0xffffb3,
  "PlantCover": 0x39ac39,
  "Railway": 0x000000,
  "Road": 0x999999,
  "SolitaryVegetationObject": 0x39ac39,
  "TINRelief": 0x3FD43F,
  "TransportSquare": 0x999999,
  "Tunnel": 0x999999,
  "TunnelPart": 0x999999,
  "TunnelInstallation": 0x999999,
  "WaterBody": 0x4da6ff
};
