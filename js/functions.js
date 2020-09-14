//
//generic functions that can be called from various places
//


//create an unique id
function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

//extract stats from json file
function calcStats(json, jsonId){

    var vertices = json.vertices;

    var minX = Number.MAX_VALUE;
    var minY = Number.MAX_VALUE;
    var minZ = Number.MAX_VALUE;

    var maxX = Number.MIN_VALUE;
    var maxY = Number.MIN_VALUE;
    var maxZ = Number.MIN_VALUE;

    var sumX = 0;
    var sumY = 0;
    var sumZ = 0;
    var numVertices = 0;

    for (var i in vertices) {

      if (vertices[i][0] < minX) {
        minX = vertices[i][0];
      }
      if (vertices[i][0] > maxX) {
        maxX = vertices[i][0];
      }

      if (vertices[i][1] < minY) {
        minY = vertices[i][1];
      }
      if (vertices[i][1] > maxY) {
        maxY = vertices[i][1];
      }

      if (vertices[i][2] < minZ) {
        minZ = vertices[i][2];
      }
      if (vertices[i][2] > maxZ) {
        maxZ = vertices[i][2];
      }
      numVertices = numVertices + 1;
    }

    var avgX = maxX - (maxX - minX) / 2;
    var avgY = maxY - (maxY - minY) / 2;
    var avgZ = maxZ - (maxZ - minZ) / 2;

    var numObjects = Object.keys(json.CityObjects).length;


    stats = jsonStats[jsonId];
    stats[0] = minX;
    stats[1] = minY;
    stats[2] = minZ;
    stats[3] = avgX;
    stats[4] = avgY;
    stats[5] = avgZ;
    stats[6] = maxX;
    stats[7] = maxY;
    stats[8] = maxZ;
    stats[9] = numObjects;
    stats[10] = numVertices;

    jsonStats[jsonId] = stats;

    /*
    return ([minX, minY, minZ, //0, 1 ,2
             avgX, avgY, avgZ, //3, 4, 5
             maxX, maxY, maxZ, //6, 7, 8
             numObjects, numVertices, numFaces, //9, 10, 11
             fileSize, fileType]) //12, 13
    */
}

function getValKey(object, value){
  //get the key for a value
  return Object.keys(object).find(key => object[key] === value);
}

//inserts an element after another element
function insertAfter(referenceNode, newNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

//loads an script dynamically
function loadScript(url, callback){

    var script = document.createElement("script")
    script.type = "text/javascript";

    if (script.readyState){  //IE
        script.onreadystatechange = function(){
            if (script.readyState == "loaded" ||
                    script.readyState == "complete"){
                script.onreadystatechange = null;
                callback();
            }
        };
    } else {  //Others
        script.onload = function(){
            callback();
        };
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);

    return true
}
