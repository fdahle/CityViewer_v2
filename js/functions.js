//
//generic functions that can be called from various places
//


function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

function getStats(json){

    vertices = json.vertices

    var minX = Number.MAX_VALUE;
    var minY = Number.MAX_VALUE;
    var minZ = Number.MAX_VALUE;

    var maxX = Number.MIN_VALUE;
    var maxY = Number.MIN_VALUE;
    var maxZ = Number.MIN_VALUE;

    var sumX = 0;
    var sumY = 0;
    var sumZ = 0
    var numVertices = 0

    for (var i in vertices) {

      if (vertices[i][0] < minX) {
        minX = vertices[i][0]
      }
      if (vertices[i][0] > maxX) {
        maxX = vertices[i][0]
      }

      if (vertices[i][1] < minY) {
        minY = vertices[i][1]
      }
      if (vertices[i][1] > maxY) {
        maxY = vertices[i][1]
      }

      if (vertices[i][2] < minZ) {
        minZ = vertices[i][2]
      }
      if (vertices[i][2] > maxZ) {
        maxZ = vertices[i][2]
      }
      numVertices = numVertices + 1
    }

    var avgX = maxX - (maxX - minX) / 2;
    var avgY = maxY - (maxY - minY) / 2;
    var avgZ = maxZ - (maxZ - minZ) / 2;

    var numObjects = Object.keys(json.CityObjects).length;

    var numFaces = undefined //for later

    return ([minX, minY, minZ, //0, 1 ,2
             avgX, avgY, avgZ, //3, 4, 5
             maxX, maxY, maxZ, //6, 7, 8
             numObjects, numVertices, numFaces]) //9, 10, 11
}

/*
function get_normal_newell(points) {

  // find normal with Newell's method
  var n = [0.0, 0.0, 0.0];

  for (var i = 0; i < points.length; i++) {
    var nex = i + 1;
    if (nex == points.length) {
      nex = 0;
    };
    n[0] = n[0] + ((points[i].y - points[nex].y) * (points[i].z + points[nex].z));
    n[1] = n[1] + ((points[i].z - points[nex].z) * (points[i].x + points[nex].x));
    n[2] = n[2] + ((points[i].x - points[nex].x) * (points[i].y + points[nex].y));
  };
  var b = new THREE.Vector3(n[0], n[1], n[2]);
  return (b)
};

function to_2d(p, n) {
  p = new THREE.Vector3(p.x, p.y, p.z)
  var x3 = new THREE.Vector3(1.1, 1.1, 1.1);
  if (x3.distanceTo(n) < 0.01) {
    x3.add(new THREE.Vector3(1.0, 2.0, 3.0));
  }
  var tmp = x3.dot(n);
  var tmp2 = n.clone();
  tmp2.multiplyScalar(tmp);
  x3.sub(tmp2);
  var y3 = n.clone();
  y3.cross(x3);
  let x = p.dot(x3);
  let y = p.dot(y3);
  var re = {
    x: x,
    y: y
  };
  return re;
}
*/

const X = new THREE.Vector3(1.0, 0.0, 0.0);
const Y = new THREE.Vector3(0.0, 1.0, 0.0);
const Z = new THREE.Vector3(0.0, 0.0, 1.0);

async function triangulate(points, boundary){

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
  if (deviation > 1){
    console.log(tr);
  }

  //chunk in triangles and translate the indices
  var chunked = []
  for (var k = 0; k < tr.length; k += 3) {

    var p1 = boundary[tr[k]]
    var p2 = boundary[tr[k+1]]
    var p3 = boundary[tr[k+2]]

    chunked.push([p1,p2,p3])
  }

  return chunked
}
