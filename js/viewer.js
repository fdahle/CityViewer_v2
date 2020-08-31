//
// All functions related to Three js
//

//init the viewer
function initViewer(viewer) {

  //init scene
  scene = new THREE.Scene();

  //init camera
  camera = new THREE.PerspectiveCamera(
    75, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.01, // Near clipping pane  // if its smaller (for example 0.0001) the object start flickering when moving
    1000000000 // Far clipping pane
  );

  //init renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true, //TODO: check what does this do?
    alpha: true, //allows to change the background colour
    logarithmicDepthBuffer: true //to prevent flickering
  });
  renderer.setSize(viewer.offsetWidth, viewer.offsetHeight);
  renderer.setClearColor(0xFFFFFF);

  //enable shadow
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // add raycaster and mouse (for clickable objects)
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2();

  //add AmbientLight (light that is only there that there's a minimum of light and you can see color)
  //kind of the natural daylight
  am_light = new THREE.AmbientLight(0xFFFFFF, 0.7); // soft white light
  scene.add(am_light);

  // Add directional light
  spot_light = new THREE.SpotLight(0xDDDDDD);
  spot_light.castShadow = true;
  spot_light.intensity = 0.4
  scene.add(spot_light);

  //render & orbit controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', function() {
    render();
  });
  controls.screenSpacePanning = false;
  //controls.maxPolarAngle = Math.PI / 2;

  controls.update();


  //update viewer when the window is resized
  function updateWindowSize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
  }
  window.addEventListener("resize", updateWindowSize);


  //add renderer to object
  viewer.appendChild(renderer.domElement);

  render();

}

//init the axis
function initAxis(viewer_axis) {

  // renderer
  renderer2 = new THREE.WebGLRenderer();
  renderer2.setClearColor(0xf0f0f0, 1);
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

  render()

}

//init the click events for viewer
function initViewerEvents(viewer) {
  viewer.onmousedown = function(eventData) {
    if (eventData.button == 2) { //RightClick
      getClicked(eventData)
    }
  };
}

//render a json file
async function renderJSON(jsonId, json) {

  //create ThreeJS points from dict
  function parsePoints(json) {

    //create array that will contain the points
    pointsDict = {}

    //iterate all vertices
    for (var i in json.vertices) {
      var point = json.vertices[i];

      //create a point
      pointsDict[i] = new THREE.Vector3(
        point[0],
        point[1],
        point[2]
      );
    }
    return pointsDict
  }

  //create a geometry from a cityObject
  async function createGeom(cityObj, pointsDict, numFaces) {

    //create geometry
    var geom = new THREE.Geometry()

    //dependent on the geometry type the boundaries must be extracted different
    var geomType = cityObj.geometry[0].type
    if (geomType == "Solid") {
      boundaries = cityObj.geometry[0].boundaries[0];

    } else if (geomType == "MultiSurface" || geomType == "CompositeSurface") {
      boundaries = cityObj.geometry[0].boundaries;

    } else if (geomType == "MultiSolid" || geomType == "CompositeSolid") {
      boundaries = cityObj.geometry[0].boundaries;
    }


    //make boundaries flat and remove duplicates, than we have a list of vertices used for this geom
    flatBounds = boundaries.flat(2)
    uniqueBounds = [...new Set(flatBounds)]

    //the number in the json file must be converted to an internal number
    var translation = {}

    //add the vertices of these points
    for (var i = 0; i < uniqueBounds.length; i++) {

      //save the translation
      translation[uniqueBounds[i]] = i

      //add point to the geom vertices
      geom.vertices.push(pointsDict[uniqueBounds[i]])
    }

    //iterate every face of geometry
    for (var i = 0; i < boundaries.length; i++) {

      //get the point that make the face
      boundary = boundaries[i][0];

      //one face more
      numFaces = numFaces + 1

      //keeps the triangulated boundaries
      var triangles = []

      //if triangulated it's easy and a face can directly be created
      if (boundary.length == 3) {
        triangles = [boundary]

      //not good, face must be triangulated before created
      } else {

        //get all the points that belong to this boundary and save them in a temp array
        var point3DArr = []
        for (var j = 0; j < boundary.length; j++) {
          var point = pointsDict[boundary[j]]
          point3DArr.push(point)
        }

        //triangulate
        triangles = await triangulate(point3DArr, boundary)

      }

      //create the faces and push to the geometry
      for (var j = 0; j < triangles.length; j++){
        tri = triangles[j]

        //here the actual face is created
        var face = new THREE.Face3(
          translation[tri[0]],
          translation[tri[1]],
          translation[tri[2]]
        )
        geom.faces.push(face)
      }

    }
    return [geom, numFaces]
  }

  //create a mesh for a geometry
  function createMesh(cityObj, geom) {
    var coType = cityObj.type;

    var material = new THREE.MeshLambertMaterial();
    material.side = THREE.DoubleSide;

    //check if color is predefined
    if (localStorage.getItem("color_" + coType) === null) {
      hex = '0x' + Math.floor(Math.random() * 16777215).toString(16);
      localStorage.setItem("color_" + coType, hex);
    } else {
      hex = localStorage.getItem("color_" + coType)
    }
    material.color.setHex(hex);

    //create mesh
    var mesh = new THREE.Mesh(geom, material)
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh
  }

  //get starting point of loading
  var startTime = Date.now()

  //get all points of json
  pointsDict = await parsePoints(json)

  //save tempory all meshes
  var meshes = []

  //count number of faces
  var numFaces = 0

  //iterate through all cityObjects
  for (var id in json.CityObjects) {

    //get the cityObject
    cityObj = json.CityObjects[id]

    //skip obj if there's an error
    if (cityObj.geometry.length == 0) {
      continue
    }

    //create a geometry from object
    output = await createGeom(cityObj, pointsDict, numFaces)
    var geom = output[0]
    numFaces = output[1]
    geom.computeFaceNormals();

    //create mesh
    mesh = await createMesh(cityObj, geom)
    mesh.name = mesh.uuid;
    mesh.objName = id;
    mesh.jsonId = jsonId;
    mesh.coType = cityObj.type

    //add the parent mesh as info
    if (cityObj.parents != undefined){
      mesh.jsonParent=cityObj.parents[0];
    }

    //visibility settings
    mesh.jsonVisible = true;
    mesh.meshVisible = true;

    /*
    // add edge
    var edge_geom = new THREE.EdgesGeometry(mesh.geometry);
    var edge_mat = new THREE.LineBasicMaterial({color:0xD3D3D3,linewidth:2});
    var edge = new THREE.LineSegments(edge_geom,edge_mat);
    mesh.add(edge);
    */

    //add mesh to scene
    scene.add(mesh)
    meshes.push(mesh)

  }

  //get end point of loading
  var endTime = Date.now()

  //get required time for loading
  var loadingTime = endTime - startTime

  console.log("loading time in ms:", loadingTime);

  //get the statistics for this file
  var stats = getStats(json);
  var minX = stats[0];
  var minY = stats[1];
  var minZ = stats[2];
  var avgX = stats[3];
  var avgY = stats[4];
  var avgZ = stats[5];
  var maxX = stats[6];
  var maxY = stats[7];
  var maxZ = stats[8];

  stats[11] = numFaces

  jsonStats[jsonId] = stats

  //calculate the width (required for camera)
  width = ((maxX - minX) + (maxY - minY)) / 2
  if (width < 5) {
    width = 5;
  }

  spot_light.position.set(minX, minY, maxZ + 1000);
  spot_light.target.position.set(avgX, avgY, 0);
  scene.add(spot_light.target);

  //set camera position
  camera.position.set(avgX, avgY, width * 1.2);
  camera.lookAt(avgX, avgY, avgZ)
  //camera.rotation.set(1.0250179306032716, 0.011690303649862465, -0.01924645011326)

  //set controls position
  controls.target.set(avgX, avgY, 0);
  controls.update()

  //render the scene so thats's visible
  render();

  //add the objects to the menu
  await addToObjectMenu(id, meshes)

  //show loader
  toggleLoader(false)


  //delete the temp array
  meshes = [];
}

//remove all objects of a json
function removeJSON(jsonId) {

  //keep which objects should be deleted
  var toDel = []

  //iterate the scene
  scene.traverse(function(child) {
    if (child.jsonId === jsonId) {
      toDel.push(child)
    }
  });

  //delete
  for (var i = 0; i < toDel.length; i++) {
    scene.remove(toDel[i])
  }

  //reset list
  toDel = []

}

//set default position of camera
function setCamera(jsonId) {

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

  //calculate the width (required for camera)
  width = ((maxX - minX) + (maxY - minY)) / 2
  if (width < 5) {
    width = 5;
  }

  //set camera position
  camera.position.set(avgX, avgY, width * 1.2);
  camera.lookAt(avgX, avgY, avgZ)
  //camera.rotation.set(1.0250179306032716, 0.011690303649862465, -0.01924645011326)

  //set controls position
  controls.target.set(avgX, avgY, 0);
  controls.update()

  render();


}

//action if element in viewer is selected
function getClicked(e) {

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

  //save clicked Obj as variable
  var clicked = null;
  for (var i = 0; i < intersects.length; i++) {
    if (intersects[i].object.type == "Mesh") {
      clicked = intersects[i].object;
      break;
    }
  }

  //select this obj
  selectCityObj(clicked.uuid)

}

//mark an clicked object in the viewer
function selectCityObj(id) {

  //empty the previous clicked object
  if (clickedObj != null) {
    toggleText(clickedObj.uuid)
    clickedObj.material.emissive.setHex(clickedObj.oldHex);
    delete clickedObj.oldHex
    var oldWireFrame = scene.getObjectByName("wireframe_" + clickedObj.uuid);
    scene.remove(oldWireFrame);
  }

  //get this object
  clickedObj = scene.getObjectByName(id);

  //jump to object in table
  jumpToFileEntry(id)

  //highlight the obj with glowing
  clickedObj.oldHex = clickedObj.material.emissive.getHex();
  clickedObj.material.emissive.setHex(0xff0000);
  toggleText(clickedObj.uuid)

  //add wireframe to still see strucutre
  var geo = new THREE.EdgesGeometry(clickedObj.geometry);
  var mat = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: .1,
    transparent: true,
    opacity: 0.2
  });
  var wireframe = new THREE.LineSegments(geo, mat);
  wireframe.name = "wireframe_" + clickedObj.uuid
  scene.add(wireframe);

  //show attributesBox
  toggleAttributes(true, id, clickedObj.jsonId)

  render();
}

//change colour of an object
function changeObjectColour(type, hex) {

  var colorValue = parseInt ( hex.replace("#","0x"), 16 );

  if (type == "background") {
    renderer.setClearColor(colorValue);
    renderer2.setClearColor(colorValue);
  } else {

    //iterate the scene
    scene.traverse(function(child) {
      if (typeof child.coType === "string" && child.coType.toLowerCase() === type) {
        child.material.color.setHex(colorValue);
      }
    });
  }

  render();

}

//show or hide the wireframe
function toggleWireframe(checked){

  toggleLoader(true)
  localStorage.setItem("viewer_wireframe", checked);

  if (checked){

    //traverse scene
    scene.traverse(function(child) {
      if (child.type === "Mesh") {
        var geo = new THREE.EdgesGeometry(child.geometry);
        var mat = new THREE.LineBasicMaterial({
          color: 0x000000,
          linewidth: .1,
          transparent: true,
          opacity: 0.2
        });
        var wireframe = new THREE.LineSegments(geo, mat);
        wireframe.name = "wireframe_" + child.name
        wireframe.vtype = "wireframe"
        scene.add(wireframe);
      }
    });
  } else {

    //keep which objects should be deleted
    var toDel = []

    //iterate the scene
    scene.traverse(function(child) {
      if (child.vtype === "wireframe") {
        toDel.push(child)
      }
    });

    //delete
    for (var i = 0; i < toDel.length; i++) {
      scene.remove(toDel[i])
    }

    //reset list
    toDel = []
  }

  render();
  toggleLoader(false)


}

//show or hide the normals
function toggleNormals(checked){

  toggleLoader(true)
  localStorage.setItem("viewer_normals", checked);

  if (checked){

    //traverse scene
    scene.traverse(function(child) {
      if (child.type === "Mesh") {
        var normal = new FaceNormalsHelper(child, 2, 0x00ff00, 1);
        normal.vtype = "normal"
        scene.add(normal);
      }
    });
  } else {

    //keep which objects should be deleted
    var toDel = []

    //iterate the scene
    scene.traverse(function(child) {
      if (child.vtype === "normal") {
        toDel.push(child)
      }
    });

    //delete
    for (var i = 0; i < toDel.length; i++) {
      scene.remove(toDel[i])
    }

    //reset list
    toDel = []
  }

  render();
  toggleLoader(false)

}

function toggleJSON(jsonId){

  //iterate the scene
  scene.traverse(function(child) {
    if (child.jsonId === jsonId) {

      //toggle visibility
      if (child.jsonVisible == false){
        child.jsonVisible = true;
      } else {
        child.jsonVisible = false;
      }

      //check if all conditions for visibility apply
      if (child.jsonVisible == false){
        child.visible = false
      }
      if (child.jsonVisible == true && child.meshVisible == true){
        child.visible = true;
      }
    }
  });

  render();

}

//show or hide a single mesh
function toggleMesh(id){
  //get this object
  var obj = scene.getObjectByName(id);

  //toggle visibility
  if (obj.meshVisible == false){
    obj.meshVisible = true;
  } else {
    obj.meshVisible = false;
  }

  //check if all conditions for visibility apply
  if (obj.meshVisible == false){
    obj.visible = false
  }
  if (obj.jsonVisible == true && obj.meshVisible == true){
    obj.visible = true;
  }

  render();
}

//update the viewer as well as the axis
function render() {
    renderer.render(scene,camera)
    if (renderer2 != undefined){
      renderer2.render(scene2,camera2);
    }
}

/*
//render the scenes
function render() {

    render();
    renderer2.render(scene2,camera2);

}

//called with any movement
(function animate() {

  requestAnimationFrame(animate);

  if (camera != null){
    camera2.position.copy(camera.position);
  	camera2.position.sub(controls.target);

    camera2.lookAt(scene2.position);
    render();

  };


})();
*/
