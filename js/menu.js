//
//all functions directly related to the functionality of the website
//


//init all event listener of the site
function initEvents(dropbox, inputFile) {

  //init Dropbox functions
  initDropbox(dropbox, inputFile)

}

//init default settings
function initSettings(){

  //save default color information in settings
  for (var key in ALLCOLOURS) {
    if (localStorage.getItem("color_" + key) === null) {
      var elem = ALLCOLOURS[key].toString(16)
      if (elem == 0) {
        elem = "000000"
      }
      localStorage.setItem("color_" + key, "0x" + elem);
    }
    var hex = localStorage.getItem("color_" + key)
    setColourVal(key, hex)
  }

  //save default value for viewers
  if (localStorage.getItem("viewer_wireframe") === null) {
    localStorage.setItem("viewer_wireframe", false);
  }
  if (localStorage.getItem("viewer_normals") === null) {
    localStorage.setItem("viewer_normals", false);
  }
  if (localStorage.getItem("viewer_axis") === null) {
    localStorage.setItem("viewer_axis", false);
  }

}

// Dropbox functions
function initDropbox(dropbox, inputFile) {

  function highlight(e) {
    dropbox.classList.add('highlight')
  }

  function unhighlight(e) {
    dropbox.classList.remove('highlight')
  }

  function dragenter(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  function dragover(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  function drop(e) {
    e.stopPropagation();
    e.preventDefault();
    var dt = e.dataTransfer;
    var files = dt.files;
    handleFiles(files);
  }

  function clickDropBox(e) {
    inputFile.click()
  }

  dropbox.addEventListener("dragenter", dragenter, false);
  dropbox.addEventListener("dragover", dragover, false);
  dropbox.addEventListener("drop", drop, false);
  dropbox.addEventListener("click", clickDropBox, false);

  ['dragover'].forEach(eventName => {
    dropbox.addEventListener(eventName, highlight, false)
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropbox.addEventListener(eventName, unhighlight, false)
  });

}

//executed when files are uploaded
async function handleFiles(files) {

  //if no files are there
  if (files[0] == null) {
    return
  }

  //show loader
  toggleLoader(true)

  async function handleSingleFile(file) {
    id = await loadFile(file)
    if (id != -1) {
      addToFileMenu(id)

      //get json content
      json = jsonDict[id]

      //render json file
      renderJSON(id, json)
    }
  }

  //iterate all files
  for (var i = 0; i < files.length; i++) {
    file = files[i]
    handleSingleFile(file)
  }

  //set value of loader to zero that new files can be uploaded
  resetFileLoader()

}

function findObj(objId, jsonId){
  var json = jsonDict[jsonId]

  for (var id in json.CityObjects) {
    if (objId == id){
      return cityObj
    }
  }
}

//load a single file
async function loadFile(file) {

  //split file with last point
  var file_name = file.name.substring(0, file.name.lastIndexOf(".") + 1).slice(0, -1);
  var file_type = file.name.substring(file.name.lastIndexOf(".") + 1, file.name.length);

  //if file is not json
  if (file_type != "json") {
    toggleLoader(false)
    alert(file.name + "' is not a json file");
    return (-1)
  }

  //load json file to memory
  async function loadJSON(url) {

    var objectURL = window.URL.createObjectURL(url)

    try {
      //load json
      var getjson = await $.getJSON(objectURL, function(data) {
        _data = data
      });
    } catch (e) {
      return (-1)
    }

    return (_data);

  }
  var json = await loadJSON(file)

  //json file has an error and cannot be loaded
  if (json == -1) {
    toggleLoader(false);
    window.alert("File " + file.name + ".json has an error and cannot be loaded!");
    return (-1)
  }

  /*
  //if wished check if file is valid
  if (localStorage.getItem("settings_validateJSON") == "true") {
    valid = validateCityJSON(json);
    if (valid == false){
      window.alert("File " + jsonName + ".is not valid!")
        continue
      }
    }
    */

  id = create_UUID()

  //add json to the dict
  jsonDict[id] = json;
  jsonIdDict[id] = file_name

  return id
}

// edit a file
function editFile(id) {
  console.log("edit", id);
}

//download a file
function downloadFile(id) {

  json = jsonDict[id];
  jsonName = jsonIdDict[id]

  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json));
  var downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", jsonName + ".json");

  document.body.appendChild(downloadAnchorNode); // required for firefox

  downloadAnchorNode.click();
  downloadAnchorNode.remove();

}

//get the statitstics for a file
function statisticsForFile(id) {

  console.log("ID", id);

  console.log(jsonIdDict);
  console.log(jsonStats);

  stats = jsonStats[id]

  toggleStatistics(stats)

}

function settingsForFile(id) {

}

function copyFile(id) {

}

function deleteFile(jsonId) {
  if (confirm('Are you sure you want to delete this file?')) {

    //delete from dicts
    delete jsonDict[jsonId];
    delete jsonIdDict[jsonId];

    //delete from scene
    removeJSON(jsonId)

    //delete from menu
    removeFromFileMenu(jsonId)

    //delete the objects from objects menu
    removeObjectsFromMenu(jsonId)

  } else {
    // Do nothing!
  }

}
