//
//all functions regarding the viewer can be found here
//

//init the viewer
function initViewer(viewer) {

  //init scene
  scene = new THREE.Scene();

  //init renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true, //TODO: check what does this do?
    alpha: true, //allows to change the background colour
    logarithmicDepthBuffer: true //to prevent flickering
  });
  renderer.setSize(viewer.offsetWidth, viewer.offsetHeight);
  renderer.setClearColor(0xFFFFFF);

  //init camera
  var fov = 75;
  var aspect = window.innerWidth / window.innerHeight;
  var near = 0.01;
  var far = 1000000000;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.updateProjectionMatrix();
  camera.up.set(0, 0, 1);

  //render & orbit controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.screenSpacePanning = false;
  controls.update();

  //enable shadow
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // add raycaster and mouse (for clickable objects)
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  //add AmbientLight (light that is only there that there's a minimum of light and you can see color)
  //kind of the natural daylight
  am_light = new THREE.AmbientLight(0xFFFFFF, 0.7); // soft white light
  scene.add(am_light);

  // Add directional light
  spot_light = new THREE.SpotLight(0xDDDDDD);
  spot_light.castShadow = true;
  spot_light.intensity = 0.4;
  scene.add(spot_light);

  //axes = new THREE.AxesHelper();
  //scene.add(axes);

  //var gridXZ = new THREE.GridHelper(10, 1);
  //scene.add(gridXZ);


  //background color
  var backgroundColour = localStorage.getItem("colour_background");
  changeBackground(backgroundColour)

  //add renderer to object
  viewer.appendChild(renderer.domElement);

  //otherwise the screen is black
  render();
}

//init the axis
function initAxis(viewer_axis) {

  //x = red
  //y = green
  //z = blue

  // renderer
  renderer2 = new THREE.WebGLRenderer({
    alpha: true
  });
  renderer.setClearColor( 0x000000, 0 ); // the default
  renderer2.setSize(viewer_axis.offsetWidth, viewer_axis.offsetHeight);
  viewer_axis.appendChild(renderer2.domElement);

  // scene
  scene2 = new THREE.Scene();

  // camera
  camera2 = new THREE.PerspectiveCamera(50, viewer_axis.offsetWidth / viewer_axis.offsetHeight, 1, 1000);
  camera2.up = camera.up; // important!

  // axes
  axes2 = new THREE.AxesHelper(100);
  scene2.add(axes2);

  render();
  animate();

}

//events for the viewer
function initViewerEvents() {

  viewer.onmousedown = function(eventData) {

    var clickType = localStorage.getItem("viewer_select");

    var eventType = null;
    var clickNumber = null;

    if (clickType == "left"){
      eventType = "click";
      clickNumber = 0;
    } else if (clickType == "double_left"){
      eventType = "doubleClick";
      clickNumber = 0;
    } else if (clickType == "middle"){
      eventType = "click";
      clickNumber = 1;
    } else if (clickType == "right"){
      eventType = "click";
      clickNumber = 2;
    } else {
      eventType = "click";
      clickNumber = 0; //backup
    }

    if (eventType=="click" && eventData.button == clickNumber) {
      getClickedMesh(eventData);
    }
  };

  viewer.ondblclick = function(eventData) {

    var clickType = localStorage.getItem("viewer_select");

    var eventType = null;
    var clickNumber = null;

    if (clickType == "left"){
      eventType = "click";
      clickNumber = 0;
    } else if (clickType == "double_left"){
      eventType = "doubleClick";
      clickNumber = 0;
    } else if (clickType == "middle"){
      eventType = "click";
      clickNumber = 1;
    } else if (clickType == "right"){
      eventType = "click";
      clickNumber = 2;
    } else {
      eventType = "click";
      clickNumber = 0; //backup
    }

    if (eventData.button == clickNumber) {
      getClickedMesh(eventData);
    }
  }

  //update viewer when the window is resized
  function updateWindowSize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
  }
  window.addEventListener("resize", updateWindowSize);

  //if controls are moving the screen should be updated
  controls.addEventListener('change', function() {
    render();
  });

  //update controls that the new settings are applied
  controls.update();

}

//render a json file that it can be displayed
async function renderJSON(jsonId, json, fileSize) {

  //create ThreeJS points from dict
  function parsePoints(json) {

    //create array that will contain the points
    var pointsDict = {};

    //iterate all vertices
    for (var i in json.vertices) {
      var point = json.vertices[i];

      //create a point
      pointsDict[i] = new THREE.Vector3(
        point[0],
        point[1],
        point[2]
      )
    }

    return pointsDict
  }

  //create a geometry from a cityObject
  async function createGeom(cityObj, pointsDict, numFaces) {

    //create geometry
    var geom = new THREE.Geometry();

    //dependent on the geometry type the boundaries must be extracted different
    var geomType = cityObj.geometry[0].type;

    if (geomType == "Solid") {
      boundaries = cityObj.geometry[0].boundaries[0];

    } else if (geomType == "MultiSurface" || geomType == "CompositeSurface") {
      boundaries = cityObj.geometry[0].boundaries;

    } else if (geomType == "MultiSolid" || geomType == "CompositeSolid") {
      boundaries = cityObj.geometry[0].boundaries;
    }


    //make boundaries flat and remove duplicates, than we have a list of vertices used for this geom
    var flatBounds = boundaries.flat(2);
    var uniqueBounds = [...new Set(flatBounds)];

    //the number in the json file must be converted to an internal number
    var translation = {};

    //add the vertices of these points
    for (var i = 0; i < uniqueBounds.length; i++) {

      //save the translation
      translation[uniqueBounds[i]] = i;

      //add point to the geom vertices
      geom.vertices.push(pointsDict[uniqueBounds[i]]);
    }

    //iterate every face of geometry
    for (var i = 0; i < boundaries.length; i++) {

      //get the point that make the face
      var boundary = boundaries[i][0];

      //one face more
      var numFaces = numFaces + 1;

      //keeps the triangulated boundaries
      var triangles = [];

      //if triangulated it's easy and a face can directly be created
      if (boundary.length == 3) {
        triangles = [boundary];

        //not good, face must be triangulated before created
      } else {

        //get all the points that belong to this boundary and save them in a temp array
        var point3DArr = [];
        for (var j = 0; j < boundary.length; j++) {
          var point = pointsDict[boundary[j]];
          point3DArr.push(point);
        }

        //triangulate
        triangles = await triangulate(point3DArr, boundary);

      }

      //create the faces and push to the geometry
      for (var j = 0; j < triangles.length; j++) {
        var tri = triangles[j];

        //here the actual face is created
        var face = new THREE.Face3(
          translation[tri[0]],
          translation[tri[1]],
          translation[tri[2]]
        );
        geom.faces.push(face);
      }

    }
    return [geom, numFaces]
  }

  //create a mesh for a geometry
  function createMesh(cityObj, geom) {

    //get the right  objType
    var coType = cityObj.type;

    //set material
    var material = new THREE.MeshLambertMaterial();
    var matSide = localStorage.getItem("viewer_materialSide");
      if (matSide == "front"){
        material.side = THREE.FrontSide;
      } else if (matSide == "back"){
        material.side = THREE.BackSide;
      } else if (matSide == "double"){
        material.side = THREE.DoubleSide;
      } else if (matSide == "intelligent"){
        //// TODO: implement intelligent
        material.side = THREE.DoubleSide;
      } else {
        material.side = THREE.DoubleSide; //backup for failing
      }


    //check if color is predefined
    if (localStorage.getItem("colour_" + coType.toLowerCase()) === null) {

      //if not set a random color
      var hex = '0x' + Math.floor(Math.random() * 16777215).toString(16);
      localStorage.setItem("colour_" + coType.toLowerCase(), hex);

      //use predeinfed color
    } else {
      var hex = localStorage.getItem("colour_" + coType.toLowerCase());
    }


    material.color.setHex(hex);

    //create mesh
    var mesh = new THREE.Mesh(geom, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh
  }

  async function triangulate(points, boundary) {

    //calculate centroid
    var centroid = new THREE.Vector3();
    centroid.setScalar(0.0);
    for (var k = 0, l = points.length; k < l; k++) {
      centroid.add(points[k]);
    }
    centroid.multiplyScalar(1.0 / l);

    //compute face normal
    var plane = new THREE.Plane();
    plane.setFromCoplanarPoints(centroid, points[0], points[1]);
    var faceNormal = plane.normal;

    //compute basis
    var quat = new THREE.Quaternion();
    var x = new THREE.Vector3();
    var y = new THREE.Vector3();
    quat.setFromUnitVectors(Z, faceNormal);
    x.copy(X).applyQuaternion(quat);
    y.crossVectors(x, faceNormal);
    y.normalize();
    var basis = new THREE.Matrix4();
    basis.makeBasis(x, y, faceNormal);
    basis.setPosition(centroid);

    // project the 3D points on the 2D plane
    var projPoints = [];
    var _tmp = new THREE.Vector3();
    for (var k = 0, l = points.length; k < l; k++) {
      _tmp.subVectors(points[k], centroid);
      projPoints.push(_tmp.dot(x))
      projPoints.push(_tmp.dot(y))
    }

    //triangulate with earcut
    var tr = await earcut(projPoints, null, 2);
    var deviation = await earcut.deviation(projPoints, 0, 2, tr);
    if (deviation > 1) {
      console.log(tr);
    }

    //chunk in triangles and translate the indices
    var chunked = [];
    for (var k = 0; k < tr.length; k += 3) {

      var p1 = boundary[tr[k]];
      var p2 = boundary[tr[k + 1]];
      var p3 = boundary[tr[k + 2]];

      chunked.push([p1, p2, p3]);
    }

    return chunked
  }

  //get starting point of loading
  var startTime = Date.now();

  //get all points of json
  pointsDict = await parsePoints(json);

  //count number of faces
  var numFaces = 0;

  //own obj dict per jsonFile
  var objDict = {};

  //count obj types
  var objTypeCount = {};

  //iterate through all cityObjects
  for (var key in json.CityObjects) {

    //get the cityObject
    cityObj = json.CityObjects[key];

    //create an uniqueId for this object
    var objId = create_UUID();

    //add object to dict
    objDict[objId] = key

    //skip obj if it doesnt have a geometry
    if (cityObj.geometry.length == 0) {
      continue
    }

    //create a geometry from object
    output = await createGeom(cityObj, pointsDict, numFaces)
    var geom = output[0]
    numFaces = output[1]

    //compute the face normals
    geom.computeFaceNormals();

    //create mesh and set its ids
    var mesh = await createMesh(cityObj, geom);
    mesh.name = objId + "_" + jsonId;
    mesh.coType = cityObj.type;

    //count object types
    if (objTypeCount.hasOwnProperty(cityObj.type)){
      objTypeCount[cityObj.type] = objTypeCount[cityObj.type] + 1;
    } else {
      objTypeCount[cityObj.type] = 1;
    }

    //visibility settings
    mesh.jsonVisible = true;
    mesh.meshVisible = true;

    //add mesh to scene
    scene.add(mesh)

    //if wireframe active create
    if (localStorage.getItem("viewer_edges") == "true"){
      createWireFrame(mesh);
    }

    if (localStorage.getItem("viewer_normals") == "true"){
      createNormals(mesh)
    }

  }

  //add objDict to the all objects dict
  jsonObjectsIdDict[jsonId] = objDict;
  jsonObjectsCount[jsonId] = objTypeCount;

  //get end point of loading
  var endTime = Date.now();

  //get required time for loading
  var loadingTime = endTime - startTime;

  //get and save the statistics for this file
  var stats = jsonStats[jsonId];
  var minX = stats[0];
  var minY = stats[1];
  var minZ = stats[2];
  var avgX = stats[3];
  var avgY = stats[4];
  var avgZ = stats[5];
  var maxX = stats[6];
  var maxY = stats[7];
  var maxZ = stats[8];

  //set numFaces
  stats[11] = numFaces;

  //save jsonStats
  jsonStats[jsonId] = stats;

  //calculate the width (required for camera)
  var width = ((maxX - minX) + (maxY - minY)) / 2;
  if (width < 5) {
    width = 5;
  }

  //set light
  spot_light.position.set(minX, minY, maxZ + 1000);
  spot_light.target.position.set(avgX, avgY, 0);
  scene.add(spot_light.target);

  //set camera position
  camera.position.set(minX, avgY, 0.3*maxZ);
  camera.rotation.x = 180 * THREE.Math.DEG2RAD;
  camera.lookAt(avgX, avgY, minZ);
  camera.updateProjectionMatrix();

  //set controls position
  controls.target.set(avgX, avgY, minZ);
  controls.update();

  //render the scene so thats's visible
  render();

  return loadingTime
}

//create a wireframe for an object
function createWireFrame(obj){

  edgesColor = localStorage.getItem("colour_edges");
  if (edgesColor == null){ //backup
    edgesColor = 0x000000;
  }

  var geo = new THREE.EdgesGeometry(obj.geometry);
  var mat = new THREE.LineBasicMaterial({
    color: parseInt(edgesColor),
    linewidth: .1,
    transparent: true,
    opacity: 0.2
  });
  var wireframe = new THREE.LineSegments(geo, mat);
  wireframe.name = "wireframe_" + obj.name;
  wireframe.jsonId = obj.name.split("_")[1];
  wireframe.vtype = "wireframe";
  scene.add(wireframe);
}

//create normals for an object
function createNormals(obj){
  normalsColour = localStorage.getItem("colour_normals");
  if (normalsColour == null){ //backup
    normalsColour = 0x00ff00;
  }

  var normal = new FaceNormalsHelper(obj, 2, parseInt(normalsColour), 1);
  normal.jsonId = obj.name.split("_")[1];
  normal.vtype = "normal";
  scene.add(normal);
}

//action if element in viewer is selected
function getClickedMesh(e){
  //get mouseposition
  mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
  mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;

  //get cameraposition
  raycaster.setFromCamera(mouse, camera);

  //calculate intersects
  var intersects = raycaster.intersectObjects(scene.children);

  //if clicked on nothing return
  if (intersects.length == 0) {
    return
  }

  //save clickedObj
  var clicked = null;
  for (var i = 0; i < intersects.length; i++) {
    if (intersects[i].object.type == "Mesh") {
      var clicked = intersects[i].object;
      break;
    }
  }

  //get identifiers
  var objId = clicked.name.split("_")[0];
  var jsonId = clicked.name.split("_")[1];

  handleObjectSelect(jsonId, objId);

}

function deHighlightMesh(obj){

  obj.material.emissive.setHex(obj.oldHex);
  delete obj.oldHex;
  var oldWireFrame = scene.getObjectByName("wireframeHighlight_" + obj.uuid);
  scene.remove(oldWireFrame);

  render();

}

//highlight an object
function highlightMesh(objId, jsonId){

  //get new object
  var meshId = objId + "_" + jsonId;
  var clickedObj = scene.getObjectByName(meshId);

  function highlight(obj){
    //highlight the obj with glowing
    obj.oldHex = clickedObj.material.emissive.getHex();
    obj.material.emissive.setHex(0xff0000);

    //add wireframe to still see strucutre
    var geo = new THREE.EdgesGeometry(obj.geometry);
    var mat = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: .1,
      transparent: true,
      opacity: 0.2
    });
    var wireframe = new THREE.LineSegments(geo, mat);
    wireframe.name = "wireframeHighlight_" + obj.uuid;
    wireframe.jsonId = obj.name.split("_")[1];
    scene.add(wireframe);
  }

  //a parent was clicked
  if (clickedObj == undefined){

    var ids = getChildrenRows(objId)

    for (var id of ids){
      meshId = id + "_" + jsonId;
      clickedObj = scene.getObjectByName(meshId);
      highlight(clickedObj);
      highlightedObjects.push(clickedObj);
    }

  } else {
    highlight(clickedObj);
    highlightedObjects.push(clickedObj)
  }

  render();
}

function deleteMeshes(jsonId){

  var toDel = [];

  //iterate the scene
  scene.traverse(function(child) {

    var childJsonid = child.name.split("_")[1];

    //only the objects of this json file
    if (childJsonid === jsonId || child.jsonId == jsonId) {
      toDel.push(child)
    }
  });

  for (obj of toDel){
    scene.remove(obj);
  }

  toDel = [];

  //update the scene
  render();
}

//hide or show all json objects
function toggleFile(bool, jsonId) {

  //iterate the scene
  scene.traverse(function(child) {

    var childJsonid = child.name.split("_")[1];

    //only the objects of this json file
    if (childJsonid === jsonId) {

      //set visibility
      child.jsonVisible = bool;

      //if one condition is not true hide object
      if (child.jsonVisible == false || child.meshVisible == false) {
        child.visible = false;
      }

      //if all conditions are true show object
      if (child.jsonVisible == true && child.meshVisible == true) {
        child.visible = true;
      }
    }

  });

  //update the scene
  render();

}

//hide or show a single json object
function toggleObject(bool, jsonId, objId) {

  //get this object
  var meshId = objId + "_" + jsonId;
  var obj = scene.getObjectByName(meshId);

  //set visibility
  obj.meshVisible = bool;

  //if one condition is not true hide object
  if (obj.jsonVisible == false || obj.meshVisible == false) {
    obj.visible = false;
  }

  //if all conditions are true show object
  if (obj.jsonVisible == true && obj.meshVisible == true) {
    obj.visible = true;
  }

  //update the scene
  render();

}

//change the material
function toggleMaterialSide(elem){
  localStorage.setItem("viewer_materialSide", elem.value);

  scene.traverse(function(child) {
    if (child.type === "Mesh") {

      var material = child.material;

      if (elem.value == "front"){
        material.side = THREE.FrontSide;
      } else if (elem.value == "back"){
        material.side = THREE.BackSide;
      } else if (elem.value == "double"){
        material.side = THREE.DoubleSide;
      } else if (elem.value == "intelligent"){
        //// TODO: implement intelligent
        material.side = THREE.DoubleSide;
      } else {
        material.side = THREE.DoubleSide; //backup for failing
      }

      child.material = material;

    }
  });

  render();
}

function toggleWireframe(bool){

  //save variable
  localStorage.setItem("viewer_edges", bool)

  toggleSpinner(true);

  if (bool){

    //traverse scene
    scene.traverse(function(child) {
      if (child.type === "Mesh") {
        createWireFrame(child);
      }
    });
  } else {

    //keep which objects should be deleted
    var toDel = [];

    //iterate the scene
    scene.traverse(function(child) {
      if (child.vtype === "wireframe") {
        toDel.push(child);
      }
    });

    //delete
    for (var i = 0; i < toDel.length; i++) {
      scene.remove(toDel[i]);
    }

    //reset list
    toDel = [];
  }

  render();
  toggleSpinner(false);

}

function toggleNormals(bool){

  //save variable
  localStorage.setItem("viewer_normals", bool)

  toggleSpinner(true);

    if (bool){

      //traverse scene
      scene.traverse(function(child) {
        if (child.type === "Mesh") {
          createNormals(child);
        }
      });
    } else {

      //keep which objects should be deleted
      var toDel = [];

      //iterate the scene
      scene.traverse(function(child) {
        if (child.vtype === "normal") {
          toDel.push(child);
        }
      });

      //delete
      for (var i = 0; i < toDel.length; i++) {
        scene.remove(toDel[i]);
      }

      //reset list
      toDel = [];
    }

    render();
    toggleSpinner(false);
}

function toggleAxis(bool){

}

//change the background Color of the viewer
function changeBackground(colour){

  scene.background = new THREE.Color(parseInt(colour));

  render();
}

//change the colour of an mesh in the viewer
function changeObjectColour(colour, coType){
  scene.traverse(function(child) {
    if (child.type === "Mesh" && child.coType.toLowerCase() == coType) {
      child.material.color.setHex(colour);
    }
  });

  render();
}

//set camera focus on file
function setCamera(){

  var jsonId = clickedContextFileId;
  var stats = jsonDict[jsonId];

  var minX = stats[0];
  var minY = stats[1];
  var avgX = stats[3];
  var avgY = stats[4];
  var avgZ = stats[5];
  var maxX = stats[6];
  var maxY = stats[7];
  var maxZ = stats[8];

  //calculate the width (required for camera)
  var width = ((maxX - minX) + (maxY - minY)) / 2;
  if (width < 5) {
    width = 5;
  }

  //set camera position
  camera.position.set(avgX, avgY, width * 1.2);
  camera.lookAt(avgX, avgY, avgZ);

  //set light
  spot_light.position.set(minX, minY, maxZ + 1000);
  spot_light.target.position.set(avgX, avgY, 0);

  //set controls position
  controls.target.set(avgX, avgY, 0);
  controls.update();

  //render the scene so thats's visible
  render();


}

function setCameraDefaultPos(pos){

  jsonId = clickedFileId

  var stats = jsonDict[jsonId];

  var minX = stats[0];
  var minY = stats[1];
  var avgX = stats[3];
  var avgY = stats[4];
  var avgZ = stats[5];
  var maxX = stats[6];
  var maxY = stats[7];
  var maxZ = stats[8];

  if(pos == "+x"){

    console.log("+ X");

    camera.position.set(avgX, avgY, maxZ+500);
    camer.lookat(new THREE.Vector3(avX, avgY, minZ));
  } else if(pos == "-x")

    console.log("- X");
    camera.position.x = 1;

  render();

  console.log(pos);
}

function printCameraInfo(type){
  console.log(camera);
  if (type == "pos"){
    console.log(camera.position);
  } else if (type == "lookAt"){

  } else if (type == "worldMatrix"){

  }
}

//update the viewer as well as the axis
function render() {
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);

  if (renderer2 != undefined) {
    renderer2.render(scene2, camera2);
  }
}

function animate(){
  requestAnimationFrame( animate );

  controls.update();

  camera2.position.copy( camera.position );
  camera2.position.sub( controls.target ); // added by @libe

  camera2.lookAt( scene2.position );
  render();
}
