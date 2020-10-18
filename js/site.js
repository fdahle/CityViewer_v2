'use strict'

//calls all functions that are needed to init the website
async function initDocument() {

  //check if local storage exists and if yes remove the warning
  if (localStorage_checkExistence() == false) {
    document.getElementById("div_warning_localStorage").classList.remove("hidden");
    return
  }

  //check if mobile device
  browser_type = mobile_checkBrowserType();

  //init the localStorage
  localStorage_initVariables();

  //adapt to mobile
  if (browser_type == "mobile") {
    mobile_adapt_dom_elements();
  }

  //init the text
  if (localStorage.getItem("settings_language") == "null"){
    var lang = window.navigator.language.split("-")[0];
  } else {
    lang = localStorage.getItem("settings_language");
  }

  //adapt the size of menus
  page_set_size();

  //init the viewer && the viewer events
  var viewer = document.getElementById("viewer");
  initViewer(viewer);
  initAxis();

  //init the settings
  page_init_settings();

  //init the normal events
  page_init_page_events();

  //init the dropbox events
  dropbox_initEvents();

  page_set_language(lang);

  //init the context menu
  page_build_contextMenu();

  logger_initLogger();
}

function dropbox_initEvents() {

  var dropbox = document.getElementById("dropbox");
  var inputFile = document.getElementById("fileElem");

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

  function click(e) {
    inputFile.click();
  }

  dropbox.addEventListener("dragenter", dragenter, false);
  dropbox.addEventListener("dragover", dragover, false);
  dropbox.addEventListener("drop", drop, false);
  dropbox.addEventListener("click", click, false);

  ['dragover'].forEach(eventName => {
    dropbox.addEventListener(eventName, highlight, false)
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropbox.addEventListener(eventName, unhighlight, false)
  });

}

function file_delete_file(fileId){

  var fileId = contextFileId;
  contextFileId = null;

  var fileName = fileIdDict[fileId];
  if (localStorage.getItem("settings_askDelete") == "true") {
    if (confirm(langDict["txt_ask_del1"] + fileName + langDict["txt_ask_del2"]) == false) {
      return
    }
  }

  //remove clicked
  delete clickedFileIds[fileId];
  if (clickedObjId != null){
    var objFileId = document.getElementById("tr_" + clickedObjId).getAttribute("fileId");
    if (objFileId == fileId){
      clickedObjId = null;
    }
  }

  if (fileId == document.getElementById("attributesTable").getAttribute("fileId")){
    document.getElementById("attributesTable").innerHTML = "";
    delete document.getElementById("attributesTable").fileId;
    delete document.getElementById("attributesTable").jsonId;
    document.getElementById("attributes").classList.add("hidden");
  }


  //delete from files table
  var tr = document.getElementById("filesTable").querySelectorAll('[fileId="' + fileId + '"]');
  tr[0].remove();

  //delete from objects table
  var trs = document.getElementById("objectsTable").querySelectorAll('[fileId="' + fileId + '"]');

  for (var elem of trs) {
    elem.remove();
  }

  //hide menus if nothing is in there
  if (document.getElementById("filesTable").rows.length == 0) {
    document.getElementById("files").classList.add("hidden");
  }
  if (document.getElementById("objectsTable").rows.length == 0) {
    document.getElementById("objects").classList.add("hidden");
  }

  //delete from the viewer
  file_delete_meshes(fileId);

  //delete from the dicts
  delete fileIdDict[fileId];
  delete fileStats[fileId]

  delete jsonVertices[fileId];
  delete jsonObjects[fileId];
  delete jsonAttributes[fileId];


}

function file_disable_file(fileId){
  var tr = document.getElementById("filesTable").querySelectorAll('[fileId="' + fileId + '"]')[0];

  tr.children[0].children[0].disabled = true;
  tr.children[1].classList.add("td_disabled");
  tr.children[2].classList.add("td_disabled");

}

function file_download_file(){

  var fileId = contextFileId;
  contextFileId = null;

  type = "json";
  if (type == "json"){
    var fileName = fileIdDict[fileId];
    var props = jsonAttributes[fileId];

    var jsonData = {};
    jsonData["type"] = props["type"];
    jsonData["version"] = props["version"];
    if ("metadata" in props){
      jsonData["metadata"] = props["metadata"];
    }

    for (var prop in props){

      //type and version are already handled
      if (prop != "CityObjects" && prop != "vertices" && prop != "metadata"){
        jsonData[prop] = json[prop];
      }
    }

    jsonData["CityObjects"] = jsonObjects[fileId];
    jsonData["vertices"] = jsonVertices[fileId];

    if (localStorage.getItem("settings_beautifyJSON") == "true"){
      var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData, null, "\t"));
    } else {
      var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData));
    }
  }

  var downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", fileName + ".json");

  document.body.appendChild(downloadAnchorNode); // required for firefox

  downloadAnchorNode.click();
  downloadAnchorNode.remove();

}

function file_duplicate_file(){
  var fileId = contextFileId;
  contextFileId = null;

  var newFileId = id_create_UUID();

  //with json parse/stringify you make a deep copy
  fileIdDict[newFileId] = JSON.parse(JSON.stringify(fileIdDict[fileId]));
  fileStats[newFileId] = JSON.parse(JSON.stringify(fileStats[fileId]));

  var fileName = fileIdDict[newFileId];
  var fileType = fileStats[newFileId]["type"];

  //add to the files menu
  menuFiles_addFileToMenu(newFileId, fileName, fileType)
  file_handle_selection(newFileId);

  logger_write_to_log("start copying of '" + fileName + "'");


  if (fileStats[newFileId]["type"] == "CityJSON"){
    jsonVertices[newFileId] = JSON.parse(JSON.stringify(jsonVertices[fileId]));
    jsonAttributes[newFileId] = JSON.parse(JSON.stringify(jsonAttributes[fileId]));
    jsonObjects[newFileId] = JSON.parse(JSON.stringify(jsonObjects[fileId]));

    objIdDict[newFileId] = {}

    clone_objects(fileId, newFileId);

    for (var key in objIdDict[fileId]){
      var newObjId = id_create_UUID();
      objIdDict[newFileId][newObjId] = JSON.parse(JSON.stringify(objIdDict[fileId][key]));
      change_cloned_object_attributes(newFileId, newObjId, key)
    }
  }

  render();
}

function file_extractName(file) {
  var file_name = file.name.substring(0, file.name.lastIndexOf(".") + 1).slice(0, -1);
  return file_name
}

function file_extractSize(file) {
  return file.size
}

function file_extractType(file) {
  var file_type = file.name.substring(file.name.lastIndexOf(".") + 1, file.name.length);
  return file_type
}

function file_handle_selection(fileId){

  var tr = document.getElementById("filesTable").querySelectorAll('[fileId="' + fileId + '"]')[0];

  var objTable = document.getElementById("objectsTable");

  if (fileId in clickedFileIds){ //deselect
    delete clickedFileIds[fileId];
    tr.children[1].style.color = "black";


    var stillVisible=false;
    for (var i = 0, row; row = objTable.rows[i]; i++) {
      if (row.getAttribute("fileId") == fileId){
        row.classList.add("hidden");
      } else {
        stillVisible=true;
      }
    }

    if (stillVisible == false){
      document.getElementById("objects").classList.add("hidden");
    }


  } else { //select
    clickedFileIds[fileId] = null;
    tr.children[1].style.color = "cornflowerblue";

    for (var i = 0, row; row = objTable.rows[i]; i++) {
      if (row.getAttribute("fileId") == fileId){
        row.classList.remove("hidden");
      }
    }

    document.getElementById("objects").classList.remove("hidden");
  }



}

function file_parseJSON_test(file, fileId, fileName) {

  var blob_url = URL.createObjectURL(file);
  console.log(blob_url);

  oboe(blob_url)
     .done(function(json) {

       console.log(json.vertices);
       console.log("DONE");
        // we got it
     })
     .fail(function() {

       console.log("FAIL");
        // we don't got it
     });

}

function file_parseJSON(file, fileId, fileName) {

  var fr = new FileReader();
  var json=null;
  fr.addEventListener("load", async e => {
    try {
      json = JSON.parse(fr.result);
      logger_write_to_log("reading of '" + fileName + "' finished")
      file_storeJSON(json, fileId);

    } catch {
      logger_write_to_log("reading of '" + fileName + "' failed")
      window.alert("'" + fileName + langDict["txt_noObj_jsonError"]);
      file_disable_file(fileId);
    }

  });

  fr.readAsText(file);
}

function file_rename_file(){
  var fileId = contextFileId;
  contextFileId = null;

  var tr = document.getElementById("filesTable").querySelectorAll('[fileId="' + fileId + '"]')[0];

  //hide span
  tr.children[1].children[0].classList.add("hidden");

  //add input
  var input = document.createElement("input");
  input.type="text";
  input.setAttribute("fileId", fileId)
  input.value = tr.children[1].children[0].innerHTML;
  input.classList.add("td_input")
  input.onkeydown = function(){
    this.style.background = "transparent";
  }
  input.onkeyup = function(){
    if (event.keyCode === 13){
      this.blur();
    } //catch enter
  }
  input.onblur = function(){
    if (this.value.length == 0){
      this.style.background = "#ff8e8e";
      this.focus();
    } else {
      var fileId = this.getAttribute("fileId");
      var tr = document.getElementById("filesTable").querySelectorAll('[fileId="' + fileId + '"]')[0];
      tr.children[1].children[0].innerHTML = this.value;
      fileIdDict[fileId] = this.value;
      tr.children[1].children[0].classList.remove("hidden");
      this.remove();

    };
  }

  tr.children[1].append(input);
  input.focus();




}

function file_storeJSON(json, jsonId) {

  jsonAttributes[jsonId] = {};

  for (var prop in json){
    //don't save objects and vertices, these are already saved elswhere
    if (prop != "CityObjects" && prop != "vertices"){
      jsonAttributes[jsonId][prop] = json[prop];
    }
  }

  jsonVertices[jsonId] = json.vertices;

  try {
    fileStats[jsonId]["type"] = json.type;
  } catch {
    fileStats[jsonId]["type"] = null;
  }

  try {
    fileStats[jsonId]["version"] = json.version;
  } catch {
    fileStats[jsonId]["version"] = null;
  }

  try {
    fileStats[jsonId]["referenceSys"] = json.metadata.referenceSystem;
  } catch {
    fileStats[jsonId]["referenceSys"] = null;
  }

  try {
    fileStats[jsonId]["extent_minX"] = json.metadata.geographicalExtent[0];
  } catch {
    fileStats[jsonId]["extent_minX"] = null;
  }

  try {
    fileStats[jsonId]["extent_minY"] = json.metadata.geographicalExtent[1];
  } catch {
    fileStats[jsonId]["extent_minY"] = null;
  }

  try {
    fileStats[jsonId]["extent_minZ"] = json.metadata.geographicalExtent[2];
  } catch {
    fileStats[jsonId]["extent_minZ"] = null;
  }

  try {
    fileStats[jsonId]["extent_maxX"] = json.metadata.geographicalExtent[3];
  } catch {
    fileStats[jsonId]["extent_maxX"] = null;
  }

  try {
    fileStats[jsonId]["extent_maxY"] = json.metadata.geographicalExtent[4];
  } catch {
    fileStats[jsonId]["extent_maxY"] = null;
  }

  try {
    fileStats[jsonId]["extent_maxZ"] = json.metadata.geographicalExtent[5];
  } catch {
    fileStats[jsonId]["extent_maxZ"] = null;
  }

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

  for (var i in json.vertices) {

    if (json.vertices[i][0] < minX) {
      minX = json.vertices[i][0];
    }
    if (json.vertices[i][0] > maxX) {
      maxX = json.vertices[i][0];
    }

    if (json.vertices[i][1] < minY) {
      minY = json.vertices[i][1];
    }
    if (json.vertices[i][1] > maxY) {
      maxY = json.vertices[i][1];
    }

    if (json.vertices[i][2] < minZ) {
      minZ = json.vertices[i][2];
    }
    if (json.vertices[i][2] > maxZ) {
      maxZ = json.vertices[i][2];
    }
    numVertices = numVertices + 1;
  }

  var avgX = maxX - (maxX - minX) / 2;
  var avgY = maxY - (maxY - minY) / 2;
  var avgZ = maxZ - (maxZ - minZ) / 2;

  var numObjects = Object.keys(json.CityObjects).length;

  fileStats[jsonId]["real_minX"] = minX;
  fileStats[jsonId]["real_avgX"] = avgX;
  fileStats[jsonId]["real_maxX"] = maxX;

  fileStats[jsonId]["real_minY"] = minY;
  fileStats[jsonId]["real_avgY"] = avgY;
  fileStats[jsonId]["real_maxY"] = maxY;

  fileStats[jsonId]["real_minZ"] = minZ;
  fileStats[jsonId]["real_avgZ"] = avgZ;
  fileStats[jsonId]["real_maxZ"] = maxZ;

  fileStats[jsonId]["num_Vertices"] = numVertices;

  var children = [];

  objIdDict[jsonId] = {};

  for (var cityObjId in json.CityObjects) {

    //create own Id
    var objId = id_create_UUID();

    objIdDict[jsonId][objId] = cityObjId;

    //check if object has a parent, if yes, don't add it now but wait until the parents are added to the menu
    var parent = json.CityObjects[cityObjId].parents;
    if (parent != undefined){
      children.push([parent, objId, cityObjId]);
      continue
    }

    //bool doesn't matter here
    var bool = menuObjects_addObjectToMenu(jsonId, objId, cityObjId, json.CityObjects[cityObjId]);
  }

  //now add the children to the menu
  for (var child of children){
    var bool = menuObjects_addObjectToMenu(jsonId, child[1], child[2], json.CityObjects[child[2]], child[0]);
  }

  //save objects
  jsonObjects[jsonId] = json.CityObjects;

  //empty json
  json=null;

  //build the json in the viewer
  build_json(jsonId);

}

function file_toggle_metadata(){

  if (document.getElementById("metadata").classList.contains("hidden")){
    var fileId = contextFileId;
    contextFileId = null;

    var stats = fileStats[fileId];

    document.getElementById("metadata").classList.remove("hidden");
    document.getElementById("overlay").style.zIndex = 1;

    document.getElementById("td_meta_type").innerHTML = stats["type"];
    document.getElementById("td_meta_version").innerHTML = stats["version"];

    if (stats["referenceSys"] == null){
      var refSys = "&ltnot defined&gt"
    } else{
      var refSys = stats["referenceSys"];
    }
    document.getElementById("td_meta_reference").innerHTML = refSys;

    if (stats["extent_minX"] != stats["real_minX"]){
      document.getElementById("td_meta_minX").innerHTML = stats["extent_minX"] + " (" + stats["real_minX"] + ")";
    } else {
      document.getElementById("td_meta_minX").innerHTML = stats["extent_minX"];
    }
    if (stats["extent_maxX"] != stats["real_maxX"]){
      document.getElementById("td_meta_maxX").innerHTML = stats["extent_maxX"] + " (" + stats["real_maxX"] + ")";
    } else {
      document.getElementById("td_meta_maxX").innerHTML = stats["extent_maxX"];
    }
    if (stats["extent_minY"] != stats["real_minY"]){
      document.getElementById("td_meta_minY").innerHTML = stats["extent_minY"] + " (" + stats["real_minY"] + ")";
    } else {
      document.getElementById("td_meta_minY").innerHTML = stats["extent_minY"];
    }
    if (stats["extent_maxY"] != stats["real_maxY"]){
      document.getElementById("td_meta_maxY").innerHTML = stats["extent_maxY"] + " (" + stats["real_maxY"] + ")";
    } else {
      document.getElementById("td_meta_maxY").innerHTML = stats["extent_maxY"];
    }
    if (stats["extent_minZ"] != stats["real_minZ"]){
      document.getElementById("td_meta_minZ").innerHTML = stats["extent_minZ"] + " (" + stats["real_minZ"] + ")";
    } else {
      document.getElementById("td_meta_minZ").innerHTML = stats["extent_minZ"];
    }
    if (stats["extent_maxZ"] != stats["real_maxZ"]){
      document.getElementById("td_meta_maxZ").innerHTML = stats["extent_maxZ"] + " (" + stats["real_maxZ"] + ")";
    } else {
      document.getElementById("td_meta_maxZ").innerHTML = stats["extent_maxZ"];
    }
  } else {
    document.getElementById("metadata").classList.add("hidden");
    document.getElementById("overlay").style.zIndex = -1;
  }
}

function file_toggle_statistics(){

  if (document.getElementById("statistics").classList.contains("hidden")){
    var fileId = contextFileId;
    contextFileId = null;

    var stats = fileStats[fileId];

    console.log(stats);

    document.getElementById("statistics").classList.remove("hidden");
    document.getElementById("overlay").style.zIndex = 1;

    document.getElementById("td_stat_fileSize").innerHTML = stats["size"]
    document.getElementById("td_stat_numObjects").innerHTML = stats["num_Objects"]
    document.getElementById("td_stat_numFaces").innerHTML = stats["num_Faces"]
    document.getElementById("td_stat_numVertices").innerHTML = stats["num_Vertices"]

  } else {
    document.getElementById("statistics").classList.add("hidden");
    document.getElementById("overlay").style.zIndex = -1;

  }
}

function files_handleFiles(files) {

  //if no files are there return
  if (files[0] == null) {
    return
  }

  for (var i = 0; i < files.length; i++) {

    //create unique id for each file
    var fileId = id_create_UUID();
    var fileName = file_extractName(files[i]);
    var fileType = file_extractType(files[i]);
    var fileSize = file_extractSize(files[i])

    fileIdDict[fileId] = fileName
    fileStats[fileId] = {};
    fileStats[fileId]["type"] = fileType;
    fileStats[fileId]["size"] = fileSize;

    //read content
    if (fileType == "json") {
      //add to the files menu
      menuFiles_addFileToMenu(fileId, fileName, fileType)

      file_handle_selection(fileId);

      logger_write_to_log("start loading of '" + fileName + "'");

      file_parseJSON(files[i], fileId, fileName)
    } else {
      window.alert("'" + fileName + "." + fileType + langDict["txt_noObj_notValid"]);
      continue
    }

    //to save where the center of view is
    centeredFileId = fileId;

  }

}

function files_resetFileLoader() {
  document.getElementById("fileElem").value = "";
}

function help_load_example(){
  var json = JSON.parse(json_example);
  var jsonName = "example";

  var jsonId = id_create_UUID();

  fileIdDict[jsonId] = jsonName;
  fileStats[jsonId] = {};
  fileStats[jsonId]["type"] = "json";
  fileStats[jsonId]["size"] = 1665;


  menuFiles_addFileToMenu(jsonId, jsonName, "json");

  file_storeJSON(json, jsonId);

  help_toggle_help();

  overlay_toggle_overlay(false);

}

function help_toggle_help(){

  var help = document.getElementById("help");

  if (help.classList.contains("hidden")){
    help.classList.remove("hidden");
    document.getElementById("overlay").style.zIndex = 1;
  } else {
    help.classList.add("hidden");
    document.getElementById("overlay").style.zIndex = -1;
  }

}

function id_create_UUID() {
  var dt = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
  return uuid;
}

function licences_toggle_licences(){

  var licences = document.getElementById("licences");

  if (licences.classList.contains("hidden")){
    licences.classList.remove("hidden");
    document.getElementById("overlay").style.zIndex = 1;

    //fill licences at first call
    if (document.getElementById("licencesContent").childElementCount == 0){

      var content = document.getElementById("licencesContent");

      var ul = document.createElement("ul")

      //get keys of dict to sort alphabetically
      var keys = Object.keys(licencesDict);
      keys.sort(function(a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      });


      //create ul
      for (var key of keys) {
        var li = document.createElement("li");
        var link = document.createElement("a")
        link.href = "#licence_" + key.toLowerCase();
        link.innerHTML = key;
        li.append(link);
        ul.append(li);

      };
      content.append(ul)

      for (var key of keys) {

        var divCaption = document.createElement("div");
        divCaption.innerHTML = key;
        divCaption.id = "licence_" + key.toLowerCase();
        divCaption.classList.add("licence_subsub");
        content.append(divCaption);

        var link = document.createElement("a");
        link.innerHTML = licencesDict[key][0];
        link.href = licencesDict[key][0];
        link.target = "_blank";
        link.classList.add("licence_link");
        content.append(link);

        var divText = document.createElement("div");
        divText.innerHTML = licencesDict[key][1];
        divText.classList.add("licence_text");
        content.append(divText);
      }

    }

  } else {
    licences.classList.add("hidden");
  }

}

function localStorage_checkExistence() {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return true;
  } catch (e) {
    return false;
  }
}

function localStorage_initVariables() {

  //init the default settings
  for (var key in globalSettings) {
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(key, globalSettings[key]);
    }
  }

  //viewer & cityObject colours
  for (var key in allColours) {
    if (localStorage.getItem("colour_" + key.toLowerCase()) === null) {
      var elem = allColours[key].toString(16);
      if (elem == 0) {
        elem = "000000";
      }
      localStorage.setItem("colour_" + key.toLowerCase(), "0x" + elem);
    }
  }
}

function logger_initLogger(){
  document.getElementById("logger_content").innerHTML = "Welcome to the CityViewer<br>";
}

function logger_write_to_log(text, value=null){

  var logger = document.getElementById("logger_content");

  if (text != logger_oldText){
    logger_oldText = text;
    text = text.replace("$(val)", value)

    var span = document.createElement("span");
    span.innerHTML = text + "<br>";
    logger.append(span);
  } else {
    logger_oldText = text;
    text = text.replace("$(val)", value)

    span = logger.lastChild;
    span.innerHTML = text + "<br>";
  }

}

function menuAttributes_fill_menu(fileId, objId, multiWarning=false){


  document.getElementById("attributes").classList.remove("hidden");
  document.getElementById("attr_warning1").classList.add("hidden");
  document.getElementById("attr_warning2").classList.add("hidden");

  var objName = objIdDict[fileId][objId];
  var obj = jsonObjects[fileId][objName];

  var table = document.getElementById("attributesTable");

  table.innerHTML = "";

  if (multiWarning){
    document.getElementById("attr_warning2").classList.remove("hidden");
    return
  }
  table.setAttribute("fileId", fileId);
  table.setAttribute("objId", objId);

  var attributes = obj.attributes;

  var noAttributes = true;
  for (var key in attributes){

    var tr = document.createElement("tr");

    var td = document.createElement("td");
    td.classList.add("td_key");
    td.innerHTML = key;
    tr.append(td);

    var td = document.createElement("td");
    td.classList.add("td_attr");
    td.innerHTML = attributes[key];
    tr.append(td);

    table.append(tr);

    noAttributes = false;

  }


  if (noAttributes){
    document.getElementById("attributes_warning").classList.remove("hidden");
  }

}

function menuFiles_addFileToMenu(fileId, fileName, fileType) {

  document.getElementById("files").classList.remove("hidden");

  var table = document.getElementById("filesTable");

  var tr = document.createElement('tr');
  tr.setAttribute("fileId", fileId);

  //catch normal context menu and put own context menu in there
  tr.addEventListener('contextmenu', function(ev) {
    contextFileId = tr.getAttribute("fileId");
    ev.preventDefault();
    basicContext.show(contextMenuFiles, ev)
    return false;
  }, false);


  var td = document.createElement('td');
  td.classList.add("td_checkBox")
  var checkBox = document.createElement('input');
  checkBox.type = "checkbox";
  checkBox.checked = true;
  checkBox.onchange = function() {
    var fileId = this.parentElement.parentElement.getAttribute("fileId");
    file_setVisibility(fileId, this.checked);
  }
  td.append(checkBox);
  tr.append(td);

  var td = document.createElement('td');
  td.classList.add("td_text")
  td.onclick = function(){
    var fileId = this.parentElement.getAttribute("fileId");
    file_handle_selection(fileId);
  }
  var label = document.createElement("span");
  label.innerText = fileName;
  td.append(label);
  tr.append(td);

  var td = document.createElement('td');
  td.classList.add("td_type")
  var type = document.createElement("span");
  type.innerText = fileType;
  type.classList.add("fileType");
  td.append(type);
  tr.append(td);


  var td = document.createElement('td');
  td.classList.add("td_status")
  var fileStatus = document.createElement("div");
  fileStatus.classList.add("fileStatus");
  td.append(fileStatus);
  tr.append(td);

  table.append(tr)

}

function menuFiles_search(){

  var searchText = document.getElementById("filesSearchField").value;

  if (searchText.length > 0){
    document.getElementById("filesSearchButton").classList.remove("icon-search");
    document.getElementById("filesSearchButton").classList.add("icon-search-plus");
  } else {
    document.getElementById("filesSearchButton").classList.remove("icon-search-plus");
    document.getElementById("filesSearchButton").classList.add("icon-search");
  }

  //iterate all table elements
  for (var i = 0, row; row = document.getElementById("filesTable").rows[i]; i++) {
    if (searchText.length == 0 || row.children[1].children[0].innerHTML.includes(searchText)){
      row.classList.remove("hidden");
    } else {
      row.classList.add("hidden");
    }
  }

}

function menuFiles_toggleMenu(){
  if (document.getElementById("filesHideButton").classList.contains("icon-eye-slash")){
    document.getElementById("filesHideButton").classList.remove("icon-eye-slash");
    document.getElementById("filesHideButton").classList.add("icon-eye");
    document.getElementById("filesHideButton").classList.add("box_i_hide_hidden")

    document.getElementById("files").children[0].classList.add("menu_caption_hidden");

    document.getElementById("files").classList.add("filesSmall");
    document.getElementById("txt_files").classList.add("txt_caption_rotated");

    document.getElementById("files").children[1].classList.add("hidden");
    document.getElementById("filesSearchField").classList.add("hidden");

  } else {
    document.getElementById("filesHideButton").classList.remove("icon-eye");
    document.getElementById("filesHideButton").classList.add("icon-eye-slash");
    document.getElementById("filesHideButton").classList.remove("box_i_hide_hidden")

    document.getElementById("files").children[0].classList.remove("menu_caption_hidden");

    document.getElementById("files").classList.remove("filesSmall");
    document.getElementById("txt_files").classList.remove("txt_caption_rotated");

    document.getElementById("files").children[1].classList.remove("hidden");

    if (document.getElementById("filesSearchField").getAttribute("visible") == "true"){
      document.getElementById("filesSearchField").classList.remove("hidden");
    }
  }
}

function menuFiles_toggleSearch(){

  //show searchField
  if (document.getElementById("filesSearchField").classList.contains("hidden")){
    document.getElementById("filesSearchField").classList.remove("hidden");
    document.getElementById("filesSearchField").setAttribute("visible", true);
    document.getElementById("filesSearchField").focus();

    document.getElementById("files").children[0].classList.add("menu_caption_large");
    document.getElementById("files").children[1].classList.add("menu_content_small");

    document.getElementById("filesHideButton").classList.add("box_largeCaption");
    document.getElementById("filesSearchButton").classList.add("box_largeCaption");
  } else {
    document.getElementById("filesSearchField").classList.add("hidden");
    document.getElementById("filesSearchField").removeAttribute("visible");

    document.getElementById("files").children[0].classList.remove("menu_caption_large");
    document.getElementById("files").children[1].classList.remove("menu_content_small");

    document.getElementById("filesHideButton").classList.remove("box_largeCaption");
    document.getElementById("filesSearchButton").classList.remove("box_largeCaption");
  }
}

function menuObjects_addObjectToMenu(fileId, objId, objName, obj, parent=undefined) {

  document.getElementById("objects").classList.remove("hidden");

  var table = document.getElementById("objectsTable");

  if (parent != undefined){
    var parTr = menuObjects_getParent(fileId, parent);

    //parent not yet there
    if (parTr == null){
      return false
    }
    var level = parseInt(parTr.getAttribute("level")) + 1;

  } else {
    var level = 0;
  }

  var tr = document.createElement('tr');
  tr.id = "tr_" + objId;
  tr.setAttribute("fileId", fileId);
  tr.setAttribute("objId", objId);
  tr.setAttribute("objType", obj.type.toLowerCase());
  tr.setAttribute("level", level)
  tr.setAttribute("hasChildren", false);

  var td = document.createElement('td');
  td.classList.add("td_toggle");
  var icon = document.createElement('i');
  td.append(icon);
  tr.append(td);


  var td = document.createElement('td');
  td.classList.add("td_checkBox")
  td.style.paddingLeft = level * 9 + "px";
  var checkBox = document.createElement('input');
  checkBox.type = "checkbox";
  checkBox.checked = true;
  checkBox.onchange = function() {
    var objId = this.parentElement.parentElement.getAttribute("objId");
    mesh_setVisibility(objId, "mesh", this.checked);
    mesh_toggleVisibility(objId);
  }
  td.append(checkBox);
  tr.append(td);

  var td = document.createElement('td');
  td.classList.add("td_icon");
  td.style.paddingLeft = level * 9 + "px";
  var icon = document.createElement('i');
  var iconSettings = menuObjects_selectIcon(obj.type);
  icon.classList.add(iconSettings[0]);
  icon.style.color = iconSettings[1];
  td.append(icon);
  tr.append(td);


  var td = document.createElement('td');
  td.classList.add("td_text")
  td.style.paddingLeft = level * 9 + "px";
  td.onclick = function() {
    var fileId = this.parentElement.getAttribute("fileId");
    var objId = this.parentElement.getAttribute("objId");
    object_handle_selection(fileId, objId);
  }
  var label = document.createElement("span");
  label.innerText = objName;
  td.append(label);
  tr.append(td);

  if (parent == undefined){
    table.append(tr);
  } else {

    //element has a child so add chevron to the parent Element
    parTr.children[0].classList.add("icon-caret-down");
    parTr.children[0].style.cursor="pointer";
    parTr.children[0].onclick=function(){
      menuObjects_toggleRows(parTr.getAttribute("objId"));
    }
    parTr.setAttribute("hasChildren", true);

    parTr.parentNode.insertBefore(tr, parTr.nextSibling);

    //hide element
    tr.classList.add("hidden");
  }

  return true
}

function menuObjects_changeIconColour(type){
  var table = document.getElementById("objectsTable");
  var color = localStorage.getItem("colour_" + type).replace("0x", "#");

  for (var i = 0, row; row = table.rows[i]; i++) {
    if (row.getAttribute("objType") == type){
      row.children[2].children[0].style.color=color;
    }
  }

}

function menuObjects_getParent(fileId, objName){

  var trs = document.getElementById("objectsTable").querySelectorAll('[fileId="' + fileId + '"]');

  for (var tr of trs){
    if (tr.children[3].children[0].innerHTML == objName){
      return tr
    }
  }

  return null
}

function menuObjects_search(){

  var searchText = document.getElementById("objectsSearchField").value;

  if (searchText.length > 0){
    document.getElementById("filesSearchButton").classList.remove("icon-search");
    document.getElementById("filesSearchButton").classList.add("icon-search-plus");
  } else {
    document.getElementById("filesSearchButton").classList.remove("icon-search-plus");
    document.getElementById("filesSearchButton").classList.add("icon-search");
  }

  //iterate all table elements
  for (var i = 0, row; row = document.getElementById("objectsTable").rows[i]; i++) {
    if (searchText.length == 0 || row.children[3].children[0].innerHTML.includes(searchText)){
      row.classList.remove("hidden");
    } else {
      row.classList.add("hidden");
    }
  }

}

function menuObjects_selectIcon(objType){

  var icon = null;
  var colour = null;
  objType = objType.toLowerCase();

  if (objType == "building"){
    icon = "icon-office";
    colour = localStorage.getItem("colour_building").replace("0x", "#");
  } else if (objType == "buildingpart") {
    icon = "icon-office";
    colour = localStorage.getItem("colour_buildingpart").replace("0x", "#");
  } else if (objType == "waterbody") {
    icon = "icon-droplet";
    colour = localStorage.getItem("colour_waterbody").replace("0x", "#");
  } else if (objType == "plantcover") {
    icon = "icon-leaf";
    colour = localStorage.getItem("colour_plantcover").replace("0x", "#");
  } else if (objType == "genericcityobject") {
    icon = "icon-cube";
    colour = localStorage.getItem("colour_genericcityobject").replace("0x", "#");
  } else if (objType == "road") {
    icon = "icon-road";
    colour = localStorage.getItem("colour_road").replace("0x", "#");
  } else if (objType == "landuse") {
    icon = "icon-area-chart";
    colour = localStorage.getItem("colour_landuse").replace("0x", "#");
  } else {
    icon = "icon-question-circle";
    colour = "black";
  }

  return [icon, colour]
}

function menuObjects_toggleMenu(){
  if (document.getElementById("objectsHideButton").classList.contains("icon-eye-slash")){
    document.getElementById("objectsHideButton").classList.remove("icon-eye-slash");
    document.getElementById("objectsHideButton").classList.add("icon-eye");
    document.getElementById("objectsHideButton").classList.add("box_i_hide_hidden")

    document.getElementById("objects").children[0].classList.add("menu_caption_hidden");

    document.getElementById("objects").classList.add("objectsSmall");
    document.getElementById("txt_objects").classList.add("txt_caption_rotated");

    document.getElementById("objects").children[1].classList.add("hidden");
    document.getElementById("objectsSearchField").classList.add("hidden");

  } else {
    document.getElementById("objectsHideButton").classList.remove("icon-eye");
    document.getElementById("objectsHideButton").classList.add("icon-eye-slash");
    document.getElementById("objectsHideButton").classList.remove("box_i_hide_hidden")

    document.getElementById("objects").children[0].classList.remove("menu_caption_hidden");

    document.getElementById("objects").classList.remove("objectsSmall");
    document.getElementById("txt_objects").classList.remove("txt_caption_rotated");

    document.getElementById("objects").children[1].classList.remove("hidden");

    if (document.getElementById("objectsSearchField").getAttribute("visible") == "true"){
      document.getElementById("objectsSearchField").classList.remove("hidden");
    }
  }
}

function menuObjects_toggleRows(objId){
  var tr = document.getElementById("tr_" + objId);
  var level = tr.getAttribute("level");

  var icon = tr.children[0];

  if (icon.classList.contains("icon-caret-up")){
    icon.classList.remove("icon-caret-up");
    icon.classList.add("icon-caret-down");

    tr = tr.nextElementSibling;

    while (tr.getAttribute("level") > level){
      tr.classList.add("hidden");
      tr = tr.nextElementSibling;
    }

  } else {
    icon.classList.remove("icon-caret-down");
    icon.classList.add("icon-caret-up");

    tr = tr.nextElementSibling;

    while (tr != null && tr.getAttribute("level") > level){
      tr.classList.remove("hidden");
      tr = tr.nextElementSibling;
    }
  }
}

function menuObjects_toggleSearch(){

  //show searchField
  if (document.getElementById("objectsSearchField").classList.contains("hidden")){
    document.getElementById("objectsSearchField").classList.remove("hidden");
    document.getElementById("objectsSearchField").setAttribute("visible", true);
    document.getElementById("objectsSearchField").focus();

    document.getElementById("objects").children[0].classList.add("menu_caption_large");
    document.getElementById("objects").children[1].classList.add("menu_content_small");

    document.getElementById("objectsHideButton").classList.add("box_largeCaption");
    document.getElementById("objectsSearchButton").classList.add("box_largeCaption");
  } else {
    document.getElementById("objectsSearchField").classList.add("hidden");
    document.getElementById("objectsSearchField").removeAttribute("visible");

    document.getElementById("objects").children[0].classList.remove("menu_caption_large");
    document.getElementById("objects").children[1].classList.remove("menu_content_small");

    document.getElementById("objectsHideButton").classList.remove("box_largeCaption");
    document.getElementById("objectsSearchButton").classList.remove("box_largeCaption");
  }
}

function mobile_adapt_dom_elements() {

  document.getElementById("dropbox").classList.add("dropbox_mobile");

  document.getElementById("settingsBox").classList.add("settingsBox_mobile");
  document.getElementById("txt_btn_settings").classList.add("noText");
  document.getElementById("btn_settings").children[0].classList.add("boxIcon_mobile");

}

function mobile_checkBrowserType() {
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    // true for mobile device
    return "mobile"
  } else {
    // false for not mobile device
    return "desktop"
  }

}

function object_handle_selection(fileId, objId){

  if (localStorage.getItem("settings_objectSelection") == "single"){

    for (var key in clickedObjIds){
      var objTr = document.getElementById("objectsTable").querySelectorAll('[objId="' + key + '"]')[0];
      objTr.children[3].style.color = "black";
      delete clickedObjIds[key];

      if (markedObjIds[key] != ""){
        for (var childKey of markedObjIds[key]){
          mesh_toggleHighlight(childKey);
        }
      } else {
        mesh_toggleHighlight(key);
      }
      delete markedObjIds[key];
    }

    var objTr = document.getElementById("objectsTable").querySelectorAll('[objId="' + objId + '"]')[0];
    var fileTr = document.getElementById("filesTable").querySelectorAll('[fileId="' + fileId + '"]')[0];

    objTr.children[3].style.color = "cornflowerblue";

    //make tr row visible
    if (objTr.classList.contains("hidden")){
      var tr = objTr;

      while (tr != null && tr.getAttribute("level") > 0){
        tr = tr.previousSibling;
      }

      var parentId = tr.getAttribute("objId");
      menuObjects_toggleRows(parentId);
    }

    //scroll to file if needed
    fileTr.scrollIntoViewIfNeeded();
    objTr.scrollIntoViewIfNeeded();

    //select file if not selected
    if (fileId in clickedFileIds == false){
      file_handle_selection(fileId);
    }

    //this happens when a parent is clicked that has no meshes
    if (document.getElementById("tr_" + objId).getAttribute("hasChildren") == "true"){
      var tr = document.getElementById("tr_" + objId);
      var trLevel = parseInt(tr.getAttribute("level"));

      tr = tr.nextElementSibling;

      var markedChildren = []

      //get next row until level is equal or higher
      while (tr != null && tr.getAttribute("level") > trLevel){
        mesh_toggleHighlight(tr.getAttribute("objId"));
        markedChildren.push(tr.getAttribute("objId"));
        tr = tr.nextElementSibling;
      }
      markedObjIds[objId] = markedChildren;

    } else {
      mesh_toggleHighlight(objId);
      markedObjIds[objId] ="";
    }

    clickedObjIds[objId] = "";
    menuAttributes_fill_menu(fileId, objId);

  } else if (localStorage.getItem("settings_objectSelection") == "multi"){

    var objTr = document.getElementById("objectsTable").querySelectorAll('[objId="' + objId + '"]')[0];
    var fileTr = document.getElementById("filesTable").querySelectorAll('[fileId="' + fileId + '"]')[0];

    if (objId in clickedObjIds){
      delete clickedObjIds[objId];
      objTr.children[3].style.color = "black";

      if (objId in markedObjIds){
        if (markedObjIds[objId] != ""){
          for (var childKey of markedObjIds[objId]){
            mesh_toggleHighlight(childKey);
          }
        } else {
          mesh_toggleHighlight(objId);
        }
        delete markedObjIds[objId];
      }

    } else {
      clickedObjIds[objId] = ""
      objTr.children[3].style.color = "cornflowerblue";

      //make tr row visible
      if (objTr.classList.contains("hidden")){
        var tr = objTr;

        while (tr.getAttribute("level") > 0){
          tr = tr.previousSibling;
        }

        var parentId = tr.getAttribute("objId");
        menuObjects_toggleRows(parentId);
      }

      //scroll to file if needed
      fileTr.scrollIntoViewIfNeeded();
      objTr.scrollIntoViewIfNeeded();

      //select file if not selected
      if (fileId in clickedFileIds == false){
        file_handle_selection(fileId);
      }

      //this happens when a parent is clicked that has no meshes
      if (document.getElementById("tr_" + objId).getAttribute("hasChildren") == "true"){
        var tr = document.getElementById("tr_" + objId);
        var trLevel = parseInt(tr.getAttribute("level"));

        tr = tr.nextElementSibling;

        var markedChildren = []

        //get next row until level is equal or higher
        while (tr != null && tr.getAttribute("level") > trLevel){
          mesh_toggleHighlight(tr.getAttribute("objId"));
          markedChildren.push(tr.getAttribute("objId"));
          tr = tr.nextElementSibling;
        }
        markedObjIds[objId] = markedChildren;

      } else {
        mesh_toggleHighlight(objId);
        markedObjIds[objId] ="";
      }

    }

    if (Object.keys(clickedObjIds).length == 0){
      document.getElementById("attributes").classList.add("hidden");
    } else if (Object.keys(clickedObjIds).length == 1){
      var objId = Object.keys(clickedObjIds)[0];
      var fileId = document.getElementById("tr_" + objId).getAttribute("fileId");
      menuAttributes_fill_menu(fileId, objId);
    } else {
      menuAttributes_fill_menu(fileId, objId, true);
    }
  }
}

//add or remove the click event from the overlay div for smoother feelings
function overlay_prevent_overlay(bool) {

  if (bool) {
    document.getElementById("overlay").onclick = "";
  } else {
    //to prevent that a click in the overlay box outside while input color is opened
    //closes the settings field we wait 1 second until the overlay box get it's function back
    setTimeout(function() {
      document.getElementById("overlay").onclick = function() {
        overlay_toggle_overlay(false);
      };
    }, 10);
  }

}

function overlay_toggle_overlay(bool){
  var overlay = document.getElementById("overlay");

  if (bool){
    overlay.style.zIndex = 1;

  } else {

    if (document.getElementById("licences").classList.contains("hidden") == false){
      document.getElementById("licences").classList.add("hidden");
      return
    }

    document.getElementById("settings").classList.add("hidden");
    document.getElementById("help").classList.add("hidden");
    document.getElementById("metadata").classList.add("hidden");
    document.getElementById("statistics").classList.add("hidden");
    overlay.style.zIndex = -1;
  }
}

function page_build_contextMenu(){

    contextMenuFiles = [
      //go to
      {
        type: 'item',
        title: langDict["txt_noObj_context_goto"],
        icon: 'icon-crosshairs',
        fn: function() {
          file_set_camera()
        }
      },
      {
        type: 'separator'
      },
      //rename
      {
        type: 'item',
        title: langDict["txt_noObj_context_rename"],
        icon: 'icon-edit',
        fn: function() {
          file_rename_file()
        }
      },
      //duplicate
      {
        type: 'item',
        title: langDict["txt_noObj_context_duplicate"],
        icon: 'icon-copy',
        fn: function() {
          file_duplicate_file()
        }
      },
      //download
      {
        type: 'item',
        title: langDict["txt_noObj_context_download"],
        icon: 'icon-download',
        fn: function() {
          file_download_file()
        }
      },
      //delete
      {
        type: 'item',
        title: langDict["txt_noObj_context_delete"],
        icon: 'icon-trash-o',
        fn: function() {
          file_delete_file()
        }
      },
      {
        type: 'separator'
      },
      //overview
      {
        type: 'item',
        title: langDict["txt_noObj_context_overview"],
        icon: 'icon-table',
        fn: function() {
          overview_toggle_overview()
        }
      },
      //metadata
      {
        type: 'item',
        title: langDict["txt_noObj_context_metadata"],
        icon: 'icon-globe',
        fn: function() {
          file_toggle_metadata()
        }
      },
      //statistics
      {
        type: 'item',
        title: langDict["txt_noObj_context_statistics"],
        icon: 'icon-info-circle',
        fn: function() {
          file_toggle_statistics()
        }
      },
      //settings
      //{ type: 'item', title: langDict["txt_noObj_context_settings"], icon: 'fas fa-cog', fn: function() {}},
      {
        type: 'separator'
      },
      //quit
      {
        type: 'item',
        title: langDict["txt_noObj_context_quit"],
        icon: 'icon-times',
        fn: function() {}
      }
    ]
}

function page_init_page_events() {

  function onWindowResize() {
    page_set_size();
  }

  window.onresize = onWindowResize
}

function page_init_settings(){

  if (localStorage.getItem("settings_log") == "true") {
    document.getElementById("inputLog").checked = true;
    document.getElementById("logger").classList.remove("hidden");
  } else {
    document.getElementById("inputLog").checked = false;
  }

  if (localStorage.getItem("settings_navigation") == "true"){
    document.getElementById("inputNavigation").checked = true;
    document.getElementById("navigation").classList.remove("hidden");
  } else {
    document.getElementById("inputNavigation").checked = false;
  }

  if (localStorage.getItem("settings_searchStyle") == "regex"){
    document.getElementById("inputSearchStyle").checked = true;
  } else {
    document.getElementById("inputSearchStyle").checked = false;
  }

  if (localStorage.getItem("settings_objectSelection") == "single"){
    document.getElementById("inputSelectionNumber").checked = false;
  } else {
    document.getElementById("inputSelectionNumber").checked = true;
  }

  if (localStorage.getItem("settings_verifyJSON") == "true"){
    document.getElementById("inputVerify").checked = true;
  } else {
    document.getElementById("inputVerify").checked = false;
  }

  if (localStorage.getItem("settings_beautifyJSON") == "true"){
    document.getElementById("inputBeautify").checked = true;
  } else {
    document.getElementById("inputBeautify").checked = false;
  }

  if (localStorage.getItem("settings_askDelete") == "true"){
    document.getElementById("inputAskDelete").checked = true;
  } else {
    document.getElementById("inputAskDelete").checked = false;
  }

  if (localStorage.getItem("viewer_edges") == "true"){
    document.getElementById("inputWireframe").checked = true;
  } else {
    document.getElementById("inputWireframe").checked = false;
  }

  if (localStorage.getItem("viewer_normals") == "true"){
    document.getElementById("inputNormals").checked = true;
  } else {
    document.getElementById("inputNormals").checked = false;
  }

  if (localStorage.getItem("viewer_grid") == "true"){
    document.getElementById("inputGrid").checked = true;
  } else {
    document.getElementById("inputGrid").checked = false;
  }

  var materialSide = localStorage.getItem("viewer_materialSide");
  document.getElementById("select_material_side").value = materialSide;

  var selectType = localStorage.getItem("viewer_select");
  document.getElementById("select_click").value = selectType;

  //colour viewer settings
  var table = document.getElementById("table_viewer_colour");
  for (var i = 0, row; row = table.rows[i]; i++) {

    //change input color
    var input = row.children[1].children[0];
    var colour = localStorage.getItem(input.id).replace("0x", "#");
    input.value = colour;

    //change td colour (for visual)
    row.children[1].style.backgroundColor = colour;
  }

  //colour cityObject settings
  var table = document.getElementById("table_cityObjects_colour");
  for (var i = 0, row; row = table.rows[i]; i++) {

    //change input color
    var input = row.children[1].children[0];
    var colour = localStorage.getItem(input.id).replace("0x", "#");
    input.value = colour;

    //change td colour (for visual)
    row.children[1].style.backgroundColor = colour;
  }


}

function page_set_language(lang) {

  //change in localStorage
  localStorage.setItem("settings_language", lang)

  var flags = document.getElementsByClassName("td_flag");

  for (var flag of flags){
    flag.classList.add("gray");
  }
  document.getElementById("lang_" + lang).classList.remove("gray");

  //change desc in html site
  document.getElementById("html").setAttribute("lang", lang);

  //check which dict must be taken which english as backup
  langDict = null
  if (lang == "en") {
    langDict = lang_en;
  } else if (lang == "de") {
    langDict = lang_de;
  } else {
    langDict = lang_en;
  }

  for (var key in langDict) {
    try {
      if (key.split("_")[1] == "noObj"){
        continue
      }
      if (document.getElementById(key).classList.contains("noText") == false){
        document.getElementById(key).innerHTML = langDict[key];
      }
    } catch {
      try{
        document.getElementById(key).value = langDict[key];
      } catch{
        console.log("Element with id '" + key + "' is missing");
      }
    }
  }

  page_set_size();
  page_build_contextMenu();
}

function page_set_size() {

  var pageHeight = document.documentElement.scrollHeight;
  var pageWidth = document.body.clientWidth;

  document.getElementById("files").style.top = "120px";
  if (pageHeight * 0.2 > 200) {
    document.getElementById("files").style.height = "200px";
  } else {
    document.getElementById("files").style.height = pageHeight * 0.2 + "px";
  }
  var filesBottom = 120 + parseInt(document.getElementById("files").style.height, 10);

  document.getElementById("objects").style.top = filesBottom + 30 + "px";
  var heightLeftOver = pageHeight - filesBottom - 30 - 150;
  document.getElementById("objects").style.height = heightLeftOver + "px";

  document.getElementById("attributes").style.top = "120px";
  document.getElementById("attributes").style.minHeight = "70px";
  document.getElementById("attributes").style.maxHeight = parseInt(document.getElementById("files").style.height, 10) + 30 + parseInt(document.getElementById("objects").style.height, 10) + "px";

  var settingsLeft = pageWidth * 0.5 - 400 * 0.5;
  if (settingsLeft < 0){
    settingsLeft = 0;
  }
  document.getElementById("settings").style.left = settingsLeft + "px";

  var settingsTop = 0.05 * pageHeight
  if (pageHeight < 800){
    settingsTop = 0;
    document.getElementById("settings").style.height = "calc(100% - 10px)";
    document.getElementById("settings").style.boxShadow = "none";
  }

  if (pageWidth < 500){
      document.getElementById("settings").style.left = "0px";
      document.getElementById("settings").style.width = "calc(100% - 10px)";
      document.getElementById("settings").style.boxShadow = "none";
  }

  document.getElementById("settings").style.top = settingsTop + "px";

  var lang = localStorage.getItem("settings_language");
  if (lang == "en") {
    document.getElementById("help").style.height = "470px";
    document.getElementById("helpBox").style.right = "130px";
  } else if (lang == "de") {
    document.getElementById("help").style.height = "590px";
    document.getElementById("helpBox").style.right = "170px";
  }

}

function select_object_selected() {


}

function settings_change_setting(type, bool){

  if (type == 'log'){
    localStorage.setItem("settings_log", bool);
    if (bool){
      document.getElementById("logger").classList.remove("hidden");
    } else {
      document.getElementById("logger").classList.add("hidden");
    }
  }

  if (type == 'navigation'){
    localStorage.setItem("settings_navigation", bool);
    if (bool){
      document.getElementById("navigation").classList.remove("hidden");
    } else {
      document.getElementById("navigation").classList.add("hidden");
    }
  }

  if (type == 'searchStyle'){
    if (bool){
      localStorage.setItem("settings_searchStyle", "regex")
    } else {
      localStorage.setItem("settings_searchStyle", "normal")
    }
  }

  if (type == 'verifyJSON'){
    if (bool){
      localStorage.setItem("settings_verifyJSON", "true")
    } else {
      localStorage.setItem("settings_verifyJSON", "false")
    }
  }

  if (type == 'beautifyJSON'){
    if (bool){
      localStorage.setItem("settings_beautifyJSON", "true")
    } else {
      localStorage.setItem("settings_beautifyJSON", "false")
    }
  }

  if (type == 'askDelete'){
    if (bool){
      localStorage.setItem("settings_askDelete", "true")
    } else {
      localStorage.setItem("settings_askDelete", "false")
    }
  }

  if (type == 'objectSelectionNumber'){
    if (bool){
      localStorage.setItem("settings_objectSelection", "multi");
    } else {
      localStorage.setItem("settings_objectSelection", "single");
    }
  }
}

function settings_download_app(){

}

function settings_reset_storage(){
  if (confirm('Are you sure you want to reset all settings (including colours) to default? This action cannot be undone.')) {

    //clear the local storage
    localStorage.clear();

    //init variables again
    localStorage_initVariables();

    change_colour_grid();
    change_colour_normals();
    change_colour_wireframes();

    for (var key in allColours){
      if (key in ["background", "wireframes", "normals", "grid"] == false){
        change_colour_object(key.toLowerCase());
      }
    }

    console.log("TODO: change settings");

  }
}

function settings_set_colour(type, elem){

  //set colour of td
  elem.parentElement.style.backgroundColor = elem.value;

  localStorage.setItem("colour_" + type, elem.value.replace("#", "0x"));

  if (type == "background"){
    change_colour_background();
  } else if (type == "grid"){
    change_colour_grid();
  } else if (type == "normals"){
    change_colour_normals();
  } else if (type == "wireframes"){
    change_colour_wireframes();
  } else {
    menuObjects_changeIconColour(type);
    change_colour_object(type);
  }
}

function settings_switch_tab(tab){

  for (var elem of document.getElementById("tabs").children){
    elem.classList.remove("active");
  }

  document.getElementById("tab" + tab).classList.add("active");

  var elements = document.getElementsByClassName('tabcontent');
  for (var i = 0; i < elements.length; i++) {
    elements[i].classList.add("hidden");
  }

  document.getElementById("settings_" + tab).classList.remove("hidden");


}

function settings_toggle_advanced(){
  if (document.getElementById("btn_advancedSettings").classList.contains("icon-caret-down")){
    document.getElementById("btn_advancedSettings").classList.remove("icon-caret-down");
    document.getElementById("btn_advancedSettings").classList.add("icon-caret-up");

    document.getElementById("divAdvancedSettings").classList.remove("hidden");

  } else {
    document.getElementById("btn_advancedSettings").classList.remove("icon-caret-up");
    document.getElementById("btn_advancedSettings").classList.add("icon-caret-down");

    document.getElementById("divAdvancedSettings").classList.add("hidden");
  }
}

function settings_toggleSelect(elem){
  localStorage.setItem("viewer_select", elem.value);
}

function settings_toggle_settings(){

  if (document.getElementById("settings").classList.contains("hidden")){
    document.getElementById("settings").classList.remove("hidden");
    overlay_toggle_overlay(true);
  } else {
    document.getElementById("settings").classList.add("hidden");
    overlay_toggle_overlay(false);
  }

}
