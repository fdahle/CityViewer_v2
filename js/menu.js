//
//all functions for the proper function of the website can be found here
//and that do not interact with DOM elements or localStorage
//

//load a single file; also used to duplicate a file; so if jsonId is null it's a new file
async function handleSingleFile(file, existingJsonId){

  //load single file
  async function loadFile(file){

    //get file information
    var file_name = file.name.substring(0, file.name.lastIndexOf(".") + 1).slice(0, -1);
    var file_type = file.name.substring(file.name.lastIndexOf(".") + 1, file.name.length);
    var file_size = file.size;

    //if file is not json
    if (file_type != "json") {
      alert(file.name + "' is not a json file");
      return (null)
    }

    //load json file to memory
    async function loadJSON(url) {

      var objectURL = window.URL.createObjectURL(url);

      try {
        //load json
        var getjson = await $.getJSON(objectURL, function(data) {
          _data = data;
        });
      } catch (e) {
        return (null)
      }

      return (_data);

    }

    //call json loading function
    var json = await loadJSON(file)

    //json file has an error and cannot be loaded
    if (json == null) {
      window.alert("File " + file.name + ".json has an error and cannot be loaded!");
      return null
    } else {
      return [json, file_name, file_type, file_size]
    }
  }

  if (existingJsonId == null){
    var jsonFile = await loadFile(file);
  } else {

    var json = jsonDict[existingJsonId];
    var jsonName = jsonIdDict[existingJsonId];
    var jsonType = jsonStats[existingJsonId][13];

    var jsonFile = [json, jsonName, jsonType];
  }

  //proceed only with valid files
  if (jsonFile != null) {

    //create an unique id
    var jsonId = create_UUID()

    //add json to the dict
    jsonDict[jsonId] = jsonFile[0];

    //add translation of filename to id
    jsonIdDict[jsonId] = jsonFile[1];

    //create stats for jsonFile
    stats = [null, null, null,
             null, null, null,
             null, null, null,
             null, null, null,
             null, null];

    //save fileSize and type
    stats[12] = jsonFile[3] // fileSize
    stats[13] = jsonFile[2] // fileType

    jsonStats[jsonId] = stats;
    calcStats(jsonFile[0], jsonId);

    //render json file
    var time = await renderJSON(jsonId, jsonFile[0]);
    writeToLogger("- '" + jsonFile[1] + "' rendered in " + time + " ms.")

    //add this file to the filebox
    addToFiles(jsonId);
    toggleBox("files", true);

    //select the entry
    handleFileSelect(jsonId);

    //add the objects to the menu
    addToObjects(jsonId);
    toggleBox("objects", true);

  }
}

//function to handle all the files
async function handleFiles(files){

  //if no files are there
  if (files[0] == null) {
    return
  }

  //show loader
  toggleSpinner(true);

  //iterate all files
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    await handleSingleFile(file, null);
  }

  //hide loader
  toggleSpinner(false)

  //set value of loader to zero that new files can be uploaded
  resetFileLoader()

}

//all actions that need to be done if a file is selected
function handleFileSelect(jsonId){

  //first time a file is clicked
  if (clickedFileId == null){

    //highlight this file
    selectFile(jsonId)

    //save id
    clickedFileId = jsonId;
    return
  }

  //same file: nothing happened
  if (clickedFileId == jsonId){
    return
  }

  //otherwise deselect old and select new
  //only show content of this file
  switchObjects(jsonId);
  deselectFile(clickedFileId);
  selectFile(jsonId);
  jumpToFile(jsonId);

  //save id
  clickedFileId = jsonId;
}

//all actions that need to be done if a object is selected
function handleObjectSelect(jsonId, objId){

  //if the same object is selected nothing needs to happen
  if (clickedObjId != null && clickedObjId == jsonId + "_" + objId){
    return
  }

  // deselect old obj
  if (clickedObjId != null){
    var split = clickedObjId.split("_")
    deselectObject(split[1]);
  }

  if (highlightedObjects.length>0){
    for (obj of highlightedObjects){
      deHighlightMesh(obj);
    }
    highlightedObjects = [];
  }


  //do all necessary actions
  jumpToObject(objId);
  selectObject(objId);
  highlightMesh(objId, jsonId);
  toggleBox("attributes", true);
  displayAttributeBox(objId, jsonId)
  clickedObjId = jsonId + "_" + objId;
}

//get an object by its name
function getObjectByName(jsonId, objName){

  var json = jsonDict[jsonId];

  var obj = json.CityObjects[objName];

  return obj;

}

function contextDownloadFile(jsonId){

}

function checkLocalStorage(){
  var test = 'test';
  try {
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
  } catch(e) {
      return false;
  }
}
