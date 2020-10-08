'use strict'

//rendering variables
const X = new THREE.Vector3(1.0, 0.0, 0.0);
const Y = new THREE.Vector3(0.0, 1.0, 0.0);
const Z = new THREE.Vector3(0.0, 0.0, 1.0);

function initViewer(viewer) {

  //init scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(parseInt(localStorage.getItem("colour_background")));

  //init renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true, //TODO: check what does this do?
    alpha: true, //allows to change the background colour
    logarithmicDepthBuffer: true //to prevent flickering
  });
  renderer.setSize(viewer.offsetWidth, viewer.offsetHeight);

  //init camera
  var fov = 75;
  var aspect = window.innerWidth / window.innerHeight;
  var near = 0.01;
  var far = 1000000000;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
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
  am_light = new THREE.AmbientLight(0xFFFFFF, 0.8); // soft white light
  scene.add(am_light);

  // Add directional light
  spot_light = new THREE.SpotLight(0XDDDDDD);
  spot_light.castShadow = true;
  spot_light.intensity = 0.2;
  scene.add(spot_light);

  //add renderer to object
  viewer.appendChild(renderer.domElement);

  //add the events for the viewer
  init_viewer_events();

  render();
}

//init all events for the viewer
function init_viewer_events() {

  viewer.onmousedown = function(eventData) {

    var clickType = localStorage.getItem("viewer_select");

    if (clickType == "left"){
      var eventType = "click";
      var clickNumber = 0;
    } else if (clickType == "double_left"){
      var eventType = "doubleClick";
      var clickNumber = 0;
    } else if (clickType == "middle"){
      var eventType = "click";
      var clickNumber = 1;
    } else if (clickType == "right"){
      var eventType = "click";
      var clickNumber = 2;
    } else { //backup
      var eventType = "click";
      var clickNumber = 0;
    }

    if (eventType=="click" && eventData.button == clickNumber) {
      mesh_get_clicked(eventData);
    }
  };

  viewer.ondblclick = function(eventData) {

    var clickType = localStorage.getItem("viewer_select");

    if (clickType == "left"){
      var eventType = "click";
      var clickNumber = 0;
    } else if (clickType == "double_left"){
      var eventType = "doubleClick";
      var clickNumber = 0;
    } else if (clickType == "middle"){
      var eventType = "click";
      var clickNumber = 1;
    } else if (clickType == "right"){
      var eventType = "click";
      var clickNumber = 2;
    } else {
      var eventType = "click";
      var clickNumber = 0; //backup
    }

    if (eventData.button == clickNumber) {
      mesh_get_clicked(eventData);
    }
  };


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

function initAxis(){

    //x = red, y = green, z = blue

    var viewer_axis = document.getElementById("viewer_axis")

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

async function build_json(jsonId) {

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
  async function createGeom(cityObj, pointsDict) {

    //create geometry
    var geom = new THREE.Geometry();

    var faceCounter = 0;

    //dependent on the geometry type the boundaries must be extracted different
    var geomType = cityObj.geometry[0].type;

    var boundaries = null;
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
      faceCounter = faceCounter + 1;

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
    return [geom, faceCounter]
  }

  //create a mesh for a geometry
  function createMesh(cityObj, geom) {

    //get the right  objType
    var coType = cityObj.type;

    //set material
    var material = new THREE.MeshLambertMaterial();
    var matSide = localStorage.getItem("viewer_materialSide");
    if (matSide == "front") {
      material.side = THREE.FrontSide;
    } else if (matSide == "back") {
      material.side = THREE.BackSide;
    } else if (matSide == "double") {
      material.side = THREE.DoubleSide;
    } else if (matSide == "intelligent") {
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

  //triangulate a face
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

  var startTime = Date.now();

  //create array that will contain the points
  var pointsDict = {};

  //save some numbers for statistics
  var numFaces = 0;
  var objTypeCount = {};

  //get extent
  var minX = fileStats[jsonId]["real_minX"];
  var avgX = fileStats[jsonId]["real_avgX"];
  var maxX = fileStats[jsonId]["real_maxX"];

  var minY = fileStats[jsonId]["real_minY"];
  var avgY = fileStats[jsonId]["real_avgY"];
  var maxY = fileStats[jsonId]["real_maxY"];

  var minZ = fileStats[jsonId]["real_minZ"];
  var avgZ = fileStats[jsonId]["real_avgZ"];
  var maxZ = fileStats[jsonId]["real_maxZ"];

  //update bounding box
  scene_update_boundingbox(fileStats[jsonId]);

  //set light
  spot_light.position.set(avgX, avgY, maxZ + 10000);
  spot_light.target.position.set(avgX, avgY, 0);
  scene.add(spot_light.target);

  //set camera position
  camera.lookAt(avgX, avgY, minZ);
  camera.position.set(minX, minY, maxZ * 10);
  camera.updateProjectionMatrix();

  //set controls position
  controls.target.set(avgX, avgY, minZ);
  controls.update();

  //iterate all vertices
  for (var i in jsonVertices[jsonId]) {
    var point = jsonVertices[jsonId][i];

    //create a point
    pointsDict[i] = new THREE.Vector3(
      point[0],
      point[1],
      point[2]
    )
  }
  var numObjects = Object.keys(objIdDict[jsonId]).length;

  //iterate through all cityObjects
  var counter = 0;
  var milestone = 0.1;
  var numFaces = 0;
  for (var objId in objIdDict[jsonId]) {

    var objName = objIdDict[jsonId][objId];
    var cityObj = jsonObjects[jsonId][objName];

    //skip obj if it doesnt have a geometry
    if (cityObj.geometry.length == 0) {
      continue
    }

    //create a geometry from object
    var output = await createGeom(cityObj, pointsDict)
    var geom = output[0]
    var numFacesOfMesh = output[1]

    //compute the face normals
    geom.computeFaceNormals();

    //create mesh and set its ids
    var mesh = await createMesh(cityObj, geom);
    mesh.name = objId; //for selection scene.getObjectByName
    mesh.objId = objId;
    mesh.fileId = jsonId;
    mesh.coType = cityObj.type;

    //visibility settings
    mesh.fileVisible = true;
    mesh.meshVisible = true;
    mesh.highlighted = false;

    //add mesh to scene
    scene.add(mesh)

    numFaces = numFaces + numFacesOfMesh
    counter = counter + 1;

    if (localStorage.getItem("viewer_edges") == "true"){
      create_wireFrame(mesh);
    }

    if (localStorage.getItem("viewer_normals") == "true"){
      create_normal(mesh);
    }


    if (counter % 100 == 0){
      logger_write_to_log("$(val)% of objects created", Math.round(counter/numObjects) * 100);
    }


  }

  fileStats[jsonId]["num_Objects"] = numObjects;
  fileStats[jsonId]["num_Faces"] = numFaces;

  //get end point of loading
  var endTime = Date.now();

  //get required time for loading
  var loadingTime = endTime - startTime;

  render();

}

//update the viewer as well as the axis
function render() {
  renderer.render(scene, camera);

  if (renderer2 != undefined) {
    renderer2.render(scene2, camera2);
  }
}

//update the axis when moving
function animate(){
  requestAnimationFrame( animate );

  controls.update();

  camera2.position.copy( camera.position );
  camera2.position.sub( controls.target ); // added by @libe

  camera2.lookAt( scene2.position );
  render();
}

function camera_set_defaultPosition(pos){

  if (centeredFileId == undefined){
    return
  }

  var stats = fileStats[centeredFileId];

  var minX = stats["real_minX"];
  var avgX = stats["real_avgX"];
  var maxX = stats["real_maxX"];

  var minY = stats["real_minY"];
  var avgY = stats["real_avgY"];
  var maxY = stats["real_maxY"];

  var minZ = stats["real_minZ"];
  var avgZ = stats["real_avgZ"];
  var maxZ = stats["real_maxZ"];

  if (pos == "+X"){
    var posX = maxX+150;
    camera.position.set(posX, avgY, avgZ);
  }

  if (pos == "-X"){
    var posX = minX - 150;
    camera.position.set(posX, avgY, avgZ);
  }

  if (pos == "+Y"){
    var posY = maxY+150;
    camera.position.set(avgX, posY, avgZ);
  }

  if (pos == "-Y"){
    var posY = minY - 150;
    camera.position.set(avgX, posY, avgZ);
  }

  if (pos == "+Z"){
    var posZ = 500;
    if (maxZ > 500){
      posZ = maxZ*1.5;
    }
    camera.position.set(avgX, avgY, posZ);
  }

  if (pos == "-Z"){
    var posZ = -500;
    if (minZ < -500){
      posZ = minZ*1.5;
    }
    camera.position.set(avgX, avgY, posZ);
  }

  if (pos == "+90"){
    console.log(camera);
  }

  controls.target.set(avgX, avgY, avgZ);
  render();

}

function change_materialSide() {
  var matSide = localStorage.getItem("viewer_materialSide");

  scene.traverse(function(child) {
    if (child.type === "Mesh") {

      var material = child.material;

      if (matSide == "front") {
        material.side = THREE.FrontSide;
      } else if (matSide == "back") {
        material.side = THREE.BackSide;
      } else if (matSide == "double") {
        material.side = THREE.DoubleSide;
      } else if (matSide == "intelligent") {
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

function change_colour_background() {
  var colour = localStorage.getItem("colour_background");
  scene.background = new THREE.Color(parseInt(colour));

  render();
}

//TODO
function change_colour_grid() {

}

function change_colour_normals() {
  var colour = localStorage.getItem("colour_normals");
  scene.traverse(function(child) {
    if (child.vtype === "normal") {
      child.material.color.setHex(colour);
    }
  });
  render();
}

function change_colour_object(objType) {
  var colour = localStorage.getItem("colour_" + objType.toLowerCase());

  scene.traverse(function(child) {
    if (child.type === "Mesh" && child.coType.toLowerCase() == objType) {
      child.material.color.setHex(colour);
    }
  });

  render();
}

function change_colour_wireframes() {
  var colour = localStorage.getItem("colour_wireframes");
  scene.traverse(function(child) {
    if (child.vtype === "wireframe") {
      child.material.color.setHex(colour);
    }
  });
}

function create_wireFrame(obj){
  var colour = localStorage.getItem("colour_wireframes");

  var geo = new THREE.EdgesGeometry(obj.geometry);
  var mat = new THREE.LineBasicMaterial({
    color: parseInt(colour),
    linewidth: .1,
    transparent: true,
    opacity: 0.8
  });
  var wireframe = new THREE.LineSegments(geo, mat);
  wireframe.vtype = "wireframe";
  wireframe.fileId = obj.fileId;
  scene.add(wireframe);

}

function create_normal(obj){
  var colour = localStorage.getItem("colour_normals");
  var normal = new FaceNormalsHelper(obj, 2, parseInt(colour), 1);
  normal.vtype = "normal";
  normal.fileId = obj.fileId;
  scene.add(normal);

}

function file_delete_meshes(fileId){

  var toDel = [];

  //iterate the scene
  scene.traverse(function(child) {

    if (child.fileId == fileId) {
      toDel.push(child)
    }
  });

  for (obj of toDel){
    scene.remove(obj);
  }

  render();

}

function file_set_camera(){

  var fileId = contextFileId;
  contextFileId = null;

  if (centeredFileId != null){
    var fileTr = document.getElementById("filesTable").querySelectorAll('[fileId="' + centeredFileId + '"]')[0];
    var statusDiv = fileTr.children[3].children[0];
    statusDiv.innerHTML = "";
  }
  centeredFileId = fileId;

  var fileTr = document.getElementById("filesTable").querySelectorAll('[fileId="' + fileId + '"]')[0];
  var statusDiv = fileTr.children[3].children[0];
  var icon = document.createElement("i");
  icon.classList.add("icon-crosshairs");
  statusDiv.append(icon);

  //get extent
  var minX = fileStats[fileId]["real_minX"];
  var avgX = fileStats[fileId]["real_avgX"];
  var maxX = fileStats[fileId]["real_maxX"];

  var minY = fileStats[fileId]["real_minY"];
  var avgY = fileStats[fileId]["real_avgY"];
  var maxY = fileStats[fileId]["real_maxY"];

  var minZ = fileStats[fileId]["real_minZ"];
  var avgZ = fileStats[fileId]["real_avgZ"];
  var maxZ = fileStats[fileId]["real_maxZ"];

  //set light
  spot_light.position.set(avgX, avgY, maxZ + 10000);
  spot_light.target.position.set(avgX, avgY, 0);
  scene.add(spot_light.target);

  //set camera position
  camera.lookAt(avgX, avgY, minZ);
  camera.position.set(minX, minY, maxZ * 10);
  camera.updateProjectionMatrix();

  //set controls position
  controls.target.set(avgX, avgY, minZ);
  controls.update();


}

function file_setVisibility(fileId, bool){

  var objIds = []

  scene.traverse(function(child) {
    if (child.fileId == fileId){
      child.fileVisible = bool;
      mesh_toggleVisibility(child.objId, false);
    }
  });

  render();

  return objIds
}

function mesh_get_clicked(e){

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

  var objId = clicked.objId;
  var fileId = clicked.fileId;

  object_handle_selection(fileId, objId);

}

function mesh_setVisibility(objId, type, bool){

  var mesh = scene.getObjectByName(objId);

  if (type == "file"){
    mesh.fileVisible = bool;
  }
  if (type == "mesh"){
    mesh.meshVisible = bool;
  }

}

function mesh_toggleHighlight(objId){

  var mesh = scene.getObjectByName(objId);

  function highlight(obj){
    //highlight the obj with glowing
    obj.oldHex = obj.material.emissive.getHex();
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
    wireframe.fileId = obj.fileId;
    wireframe.vtype="highlight";
    scene.add(wireframe);
  }

  function dehighlight(obj){
    obj.material.emissive.setHex(obj.oldHex);
    delete obj.oldHex;
    var oldWireFrame = scene.getObjectByName("wireframeHighlight_" + obj.uuid);
    scene.remove(oldWireFrame);
  }


  if (mesh.highlighted == false){
    highlight(mesh);
    mesh.highlighted = true;
  } else {
    dehighlight(mesh);
    mesh.highlighted = false;
  }

  render();
}

function mesh_toggleMaterial(elem){
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

function mesh_toggleVisibility(objId, _render=true){

  var mesh = scene.getObjectByName(objId);

  //if one condition is not true hide object
  if (mesh.fileVisible == false || mesh.meshVisible == false) {
    mesh.visible = false;
  }

  //if all conditions are true show object
  if (mesh.fileVisible == true && mesh.meshVisible == true) {
    mesh.visible = true;
  }

  //update the scene
  if (_render){
    render();
  }

}

function scene_update_boundingbox(stats){

  if (scene_BoundingBox[0] == null || stats["real_minX"] < scene_BoundingBox[0]){
    scene_BoundingBox[0] = stats["real_minX"];
  }
  if (scene_BoundingBox[1] == null || stats["real_maxX"] > scene_BoundingBox[1]){
    scene_BoundingBox[1] = stats["real_maxX"];
  }

  if (scene_BoundingBox[2] == null || stats["real_minY"] < scene_BoundingBox[2]){
    scene_BoundingBox[2] = stats["real_minY"];
  }
  if (scene_BoundingBox[3] == null || stats["real_maxY"] > scene_BoundingBox[3]){
    scene_BoundingBox[3] = stats["real_maxY"];
  }

  if (scene_BoundingBox[4] == null || stats["real_minZ"] < scene_BoundingBox[4]){
    scene_BoundingBox[4] = stats["real_minZ"];
  }
  if (scene_BoundingBox[5] == null || stats["real_maxZ"] > scene_BoundingBox[5]){
    scene_BoundingBox[5] = stats["real_maxZ"];
  }
}

function toggle_grid(bool) {

  localStorage.setItem("viewer_grid", bool)

  if (bool){

    for (var val of scene_BoundingBox){
      if (val == null){
        return
      };
    }

    var distance = 100;

    function createArr(min, max, step){
      var arr = [];
      var start = parseInt(min);
      while (start < parseInt(max)){
        arr.push(start);
        start = start + step;
      }
      arr.push(start);

      return arr;
    }

    var xArr = createArr(scene_BoundingBox[0], scene_BoundingBox[1], distance)
    var yArr = createArr(scene_BoundingBox[2], scene_BoundingBox[3], distance)
    var zArr = createArr(scene_BoundingBox[4], scene_BoundingBox[5], distance)

    var material = new THREE.LineBasicMaterial( { color: 0x0000ff } );

    for (var x = 0; x < xArr.length; x++){
        var points = [];

        var point1 = new THREE.Vector3(xArr[x], yArr[0], zArr[0]);
        var point2 = new THREE.Vector3(xArr[x], yArr[yArr.length-1], zArr[0]);

        points.push(point1);
        points.push(point2);

        var geometry = new THREE.BufferGeometry().setFromPoints( points );
        var line = new THREE.Line( geometry, material );
        line.vtype = "grid";
        scene.add( line );
    }

    for (var y = 0; y < yArr.length; y++){

        var points = [];

        var point1 = new THREE.Vector3(xArr[0], yArr[y], zArr[0]);
        var point2 = new THREE.Vector3(xArr[xArr.length-1], yArr[y], zArr[0]);

        points.push(point1);
        points.push(point2);

        var geometry = new THREE.BufferGeometry().setFromPoints( points );
        var line = new THREE.Line( geometry, material );
        line.vtype = "grid";
        scene.add( line );
    }

  } else {
    //keep which objects should be deleted
    var toDel = [];

    //iterate the scene
    scene.traverse(function(child) {
      if (child.vtype === "grid") {
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

}

function toggle_normals(bool) {
  localStorage.setItem("viewer_normals", bool)

  if (bool){

    //traverse scene
    scene.traverse(function(child) {
      if (child.type === "Mesh") {
        create_normal(child);
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
  }

  render();

}

function toggle_wireframe(bool) {
  localStorage.setItem("viewer_edges", bool);

  if (bool) {
    scene.traverse(function(child) {
      if (child.type == "Mesh") {
        create_wireFrame(child);
      }
    });
  } else {

    //keep which objects should be deleted
    var toDel = [];

    //iterate the scene
    scene.traverse(function(child) {
      if (child.vtype == "wireframe") {
        toDel.push(child);
      }
    });

    //delete
    for (var i = 0; i < toDel.length; i++) {
      scene.remove(toDel[i]);
    }
  }

  render();
}
