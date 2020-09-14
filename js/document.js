//
//connection to the website
//only here is the js interacts with the document
//document.getElementById and locastore only allowed here
//

async function initDocument() {

  //remove no js warning
  document.getElementById("warning_js").style.display = "none";

  //check if local storage is defined
  var bool = checkLocalStorage();
  if (bool){
    document.getElementById("warning_ls").style.display = "none";
  } else {
    return
  }

  //check localStorage
  initLocalStorage();

  //init viewer
  var viewer = document.getElementById("viewer");
  await initViewer(viewer);

  //init events for viewer
  initViewerEvents();

  //init axisHelper
  var viewer_axis = document.getElementById("viewer_axis");
   initAxis(viewer_axis);

  //init dropbox
  var dropbox = document.getElementById("dropbox");
  var inputFile = document.getElementById("fileElem");
  initDropbox(dropbox, inputFile);

  //init events
  initEvents();

  //init the settings
  initSettings();

  //add the text to all dom elements
  toggleText(localStorage.getItem("settings_language"));

  //build Context Menus
  buildContextMenus();

  //init serviceWorker
  //initServiceWorker();
}

//init all actions for dropbox
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

//init the events for the DOM elements
function initEvents() {

//monitor the size of the files box
var filesBox = document.getElementById("files");
new ResizeObserver(function(){
  storeBoxSize(filesBox)
}).observe(filesBox);

//monitor the size of the objects box
var objectsBox = document.getElementById("objects");
new ResizeObserver(function(){
  storeBoxSize(objectsBox)
}).observe(objectsBox);

//monitor the size of the objects box
var attributesBox = document.getElementById("attributes");
new ResizeObserver(function(){
  storeBoxSize(attributesBox)
}).observe(attributesBox);

}

//init the offline functionality
function initServiceWorker(){
  if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then((reg) => {
      console.log('Service worker registered -->', reg);
    }, (err) => {
      console.error('Service worker not registered -->', err);
    });
  }
}

//init the local storage variables
function initLocalStorage() {

  for (var key in globalSettings){
    if (localStorage.getItem(key) === null){
      localStorage.setItem(key, globalSettings[key]);
    }
  }

  //viewer & cityObject colours
  for (var key in ALLCOLOURS) {
    if (localStorage.getItem("colour_" + key.toLowerCase()) === null) {
      var elem = ALLCOLOURS[key].toString(16)
      if (elem == 0) {
        elem = "000000"
      }
      localStorage.setItem("colour_" + key.toLowerCase(), "0x" + elem);
    }
  }


}

//init all settings for the settings
function initSettings() {

  //general settings
  if(localStorage.getItem("settings_log") == "true"){
    document.getElementById("logBox").checked = true;
    document.getElementById("logger").style.display="block";
  } else {
    document.getElementById("logBox").checked = false;
  }
  document.getElementById("logger").innerHTML="Welcome to the CityJSON-viewer.<br>";


  if(localStorage.getItem("settings_navigation") == "true"){
    document.getElementById("naviBox").checked = true;
    document.getElementById("navigation").style.display="block";
  } else {
    document.getElementById("naviBox").checked = false;
  }


  if(localStorage.getItem("settings_verifyJSON") == "true"){
    document.getElementById("verifyBox").checked = true;
  } else {
    document.getElementById("verifyBox").checked = false;
  }
  if(localStorage.getItem("settings_beautifyJSON") == "true"){
    document.getElementById("beautifyBox").checked = true;
  } else {
    document.getElementById("beautifyBox").checked = false;
  }
  if(localStorage.getItem("settings_askDelete") == "true"){
    document.getElementById("askDelBox").checked = true;
  } else {
    document.getElementById("askDelBox").checked = false;
  }

  //viewer settings
  if(localStorage.getItem("viewer_edges") == "true"){
    document.getElementById("wireframeBox").checked = true;
  } else {
    document.getElementById("wireframeBox").checked = false;
  }

  if(localStorage.getItem("viewer_normals") == "true"){
    document.getElementById("normalsBox").checked = true;
  } else {
    document.getElementById("normalsBox").checked = false;
  }

  if(localStorage.getItem("viewer_axis") == "true"){
    document.getElementById("axisBox").checked = true;
  } else {
    document.getElementById("axisBox").checked = false;
  }


  document.getElementById("selectMatSide").value = localStorage.getItem("viewer_materialSide");
  document.getElementById("selectClick").value = localStorage.getItem("viewer_select");


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

//create the different boxes
function addToObjects(jsonId) {

  //get the menu
  var box = document.getElementById("objects");
  var table = box.children[1].children[0];

  function createObject(key, obj, jsonId, parentId){

    //create necessary elements
    var tr = document.createElement('tr');
    var td = document.createElement('td');
    var div = document.createElement('div');

    //set position of div dependend on the child level
    if (parentId != null){
      var parent = document.getElementById("tr_" + parentId);
      var marg = parseFloat(parent.firstChild.firstChild.style.marginLeft);
      marg = marg + 10;
      div.style.marginLeft = marg + "px";
      var childLevel = parent.getAttribute("childLevel");
      tr.setAttribute("childLevel", parseInt(childLevel) + 1);
    } else {
      div.style.marginLeft = "0px";
      tr.setAttribute("childLevel", 0);
    }

    //set id for tr
    tr.id = "tr_" + key;
    tr.setAttribute("jsonId", jsonId);
    tr.onclick = function(e){
      //this click event should not be done if the checkbox or the chevron is selected
      if (e.target.classList.contains("box_check")){
        return
      };
      if (e.target.classList.contains("fa-chevron-down")){
        return
      };
      if (e.target.classList.contains("fa-chevron-right")){
        return
      };
      var jsonId = this.getAttribute("jsonId");
      var objId = this.id.split("_")[1]

      handleObjectSelect(jsonId, objId);
    }

    var chevDiv = document.createElement("div")
    chevDiv.classList.add("objects_chev")
    div.appendChild(chevDiv)

    //checkbox for toggling File
    var checkBox = document.createElement('input');
    checkBox.type = "checkbox";
    checkBox.checked = true;
    checkBox.onchange = function() {
      //get the id of the object to hide
      var jsonId = this.parentElement.parentElement.parentElement.getAttribute("jsonId");
      var objId = this.parentElement.parentElement.parentElement.id.split("_")[1];
      toggleObject(this.checked, jsonId, objId);
    }
    div.append(checkBox);

    //select the right icon and color for this object
    function selectIcon(objType, icon) {

        var fa1 = null;
        var fa2 = null;
        objType = objType.toLowerCase();

        if (objType == "building" || objType == "buildingpart") {
          fa1 = "fa"
          fa2 = "fa-building";
          if (objType == "building"){
            icon.style.color = localStorage.getItem("colour_building").replace("0x", "#")
          } else if (objType == "buildingpart"){
            icon.style.color = localStorage.getItem("colour_buildingpart").replace("0x", "#")
          }
        } else if (objType == "waterbody") {
          fa1 = "fa"
          fa2 = "fa-tint";
          icon.style.color = localStorage.getItem("colour_waterbody").replace("0x", "#")
        } else if (objType == "plantcover") {
          fa1 = "fa"
          fa2 = "fa-leaf";
          icon.style.color = localStorage.getItem("colour_plantcover").replace("0x", "#")
        } else if (objType == "genericcityobject") {
          fa1 = "fa"
          fa2 = "fa-cube";
        } else if (objType == "road") {
          fa1 = "fa"
          fa2 = "fa-road";
          icon.style.color = localStorage.getItem("colour_road").replace("0x", "#")
        } else if (objType == "landuse") {
          fa1 = "fas"
          fa2 = "fa-chart-area";
          icon.style.color = localStorage.getItem("colour_landuse").replace("0x", "#")
        } else {
            fa1 = "far"
            fa2 = "fa-question-circle";
          }

          return [fa1, fa2]
      }

    var iconDiv = document.createElement("div");
    var icon = document.createElement('i');

    //select the suitable icon
    var iconClasses = selectIcon(obj.type, icon);
    icon.classList.add(iconClasses[0]);
    icon.classList.add(iconClasses[1]);
    icon.setAttribute("objType", obj.type.toLowerCase());

    iconDiv.append(icon);
    div.append(iconDiv);

    //create the json text
    var textDiv = document.createElement("div");
    textDiv.classList.add('box_text');

    var jsonText = document.createElement("span");
    jsonText.innerText = objects[key];
    jsonText.style.color = "black"; //important for selecting/deselecting
    jsonText.classList.add("small_box_text");
    textDiv.append(jsonText);
    div.append(textDiv);

    //set the classes
    tr.classList.add('trBox');
    td.classList.add('tdBox');
    checkBox.classList.add('box_check');

    //append everything
    td.append(div);
    tr.append(td);

    //if it is a children not append at the end but after the parent
    if (parent != null){

      //insert after parent and make it invisible
      insertAfter(parent, tr)
      tr.style.display = "none"

      //add chevron
      var chevDiv = parent.firstChild.firstChild.firstChild;;

      //but only if not already added
      if (chevDiv.childElementCount == 0){
        var icon = document.createElement('i')
        icon.classList.add("fas");
        icon.classList.add("fa-chevron-right");
        chevDiv.style.cursor="pointer"
        chevDiv.prepend(icon)
        chevDiv.onclick = function() {
          toggleChildrenFiles(this)
        };
      }
    } else {
      table.append(tr);
    }
  }

  //get the objects
  var objects = jsonObjectsIdDict[jsonId];

  //init array for objects with parentes
  var objectsToDo = [];

  //iterate and add
  for (var key in objects) {
    var obj = getObjectByName(jsonId, objects[key])

    if (obj.parents != undefined){
      objectsToDo.push([key, obj, jsonId]);
    } else {
      createObject(key, obj, jsonId, null);
    }
  }

  //now do objects with parent
  for (var i = 0; i < objectsToDo.length; i++){
    var key = objectsToDo[i][0];
    var obj = objectsToDo[i][1];
    var jsonId = objectsToDo[i][2];

    //get the objId and parent and position
    var objParentId = getValKey(objects, obj.parents[0]);

    //create row but now a little more to the right
    createObject(key, obj, jsonId, objParentId)

  }

}

//hide or show the children of an element
function toggleChildrenFiles(row){


  var icon = row.firstChild;
  var tr = row.parentElement.parentElement.parentElement;
  var trLevel = tr.getAttribute("childLevel");

  //show the elements
  if (icon.classList.contains("fa-chevron-right")){
    icon.classList.remove("fa-chevron-right");
    icon.classList.add("fa-chevron-down");

    //iterate all tr
    while (tr.nextElementSibling != undefined && tr.nextElementSibling.getAttribute("childLevel") > trLevel){
      if (tr.nextElementSibling.getAttribute("childLevel") == parseInt(trLevel) + 1){
        tr.nextElementSibling.style.display = "block";
      }
      tr = tr.nextElementSibling;
    }

  //hide the elements
  } else {
    icon.classList.remove("fa-chevron-down");
    icon.classList.add("fa-chevron-right");

    while (tr.nextElementSibling != undefined && tr.nextElementSibling.getAttribute("childLevel") > trLevel){
      if (tr.nextElementSibling.getAttribute("childLevel") == parseInt(trLevel) + 1){
        tr.nextElementSibling.style.display = "none";
      }
      tr = tr.nextElementSibling;
    }
  }
}

//add to files table
function addToFiles(jsonId) {

  //get the menu
  var box = document.getElementById("files");
  var table = box.children[1].children[0];

  var jsonName = jsonIdDict[jsonId];

  //create necessary elements
  var tr = document.createElement('tr');
  var td = document.createElement('td');
  var div = document.createElement('div');

  tr.id = "tr_" + jsonId;

  tr.onclick = function(e){

    //this click event should not be done if the checkbox is selected
    if (e.target.classList.contains("box_check")){
      return
    };
    var jsonId = this.id.split("_")[1];
    handleFileSelect(jsonId);
  }

  //catch normal context menu and put own context menu in there
  tr.addEventListener('contextmenu', function(ev) {
      clickedContextFileId = tr.id.split("_")[1];
      ev.preventDefault();
      basicContext.show(contextMenuFiles, ev)
      return false;
  }, false);


  //checkbox for toggling File
  var checkBox = document.createElement('input');
  checkBox.type = "checkbox";
  checkBox.checked = true;
  checkBox.onchange = function() {
    //get the id of the object to hide
    var jsonId = this.parentElement.parentElement.parentElement.id.split("_")[1];
    toggleFile(this.checked, jsonId);
  }
  div.append(checkBox);

  //create the json text
  var textDiv = document.createElement("div");
  textDiv.classList.add('box_text');

  var jsonText = document.createElement("span");
  jsonText.innerText = jsonName;
  jsonText.style.color = "black"; //important for selecting/deselecting
  div.append(jsonText);

  //set the classes
  tr.classList.add('trBox');
  td.classList.add('tdBox');
  checkBox.classList.add('box_check');

  //append everything
  td.append(div);
  tr.append(td);
  table.append(tr);
}

//show or hide a box
function toggleBox(type, bool){

  if (bool){
    document.getElementById(type).style.display="block";

    //set width of element
    var width = getBoxSize(type);
    document.getElementById(type).style.width = width + "px";
  } else {
    document.getElementById(type).style.display="none";
  }
}

//show or hide the search field
function toggleSearch(type){

  var input = document.getElementById(type + "SearchField")

  if (input.style.display == "none"){
    input.style.display = "block";
    input.setAttribute("displayed", true);
    input.focus();
  } else {
    input.style.display = "none";
    input.setAttribute("displayed", false);
  }

}

//maximize or minimize a box
function toggleBigBox(type) {

  //get the elements
  var box = document.getElementById(type);
  var hideIcon = document.getElementById(type + "HideButton");
  var searchIcon = document.getElementById(type + "SearchButton");
  var searchField = document.getElementById(type + "SearchField");
  var text = document.getElementById("txt_" + type);
  var captionRotated = document.getElementById(type + "CaptionRotated");
  var content = document.getElementById(type + "Content");

  var boxWidth = getBoxSize(type);

  if (hideIcon.classList.contains("fa-eye-slash")) {

    //change the hide icon
    hideIcon.classList.remove("fa-eye-slash");
    hideIcon.classList.add("fa-eye");

    //change the box
    box.classList.add("box_hidden");
    box.style.width = "30px";

    //change the caption
    captionRotated.style.display = "block";

    //hide elements
    searchIcon.classList.add("hidden");
    text.classList.add("hidden");
    content.classList.add("hidden");
    searchField.classList.add("hidden")

  } else {

    //change the hide icon
    hideIcon.classList.add("fa-eye-slash");
    hideIcon.classList.remove("fa-eye");

    //change the box
    box.classList.remove("box_hidden");
    box.style.width = boxWidth + "px"

    //change the caption
    captionRotated.style.display = "none";

    //show elements
    searchIcon.classList.remove("hidden")
    text.classList.remove("hidden");
    content.classList.remove("hidden")

    searchField.classList.remove("hidden");

  }

}

//store boxSize to local storage
function storeBoxSize(box){
  var width = box.offsetWidth - 2; //remove border

  //minimized size doesn't matter
  if (width < 220){
    return
  }

  localStorage.setItem("width_" + box.id, width)
}

//get boxsize from local storage
function getBoxSize(id){
  return localStorage.getItem("width_" + id)
}

//init the text for all dom elements
function toggleText(lang) {

  localStorage.setItem("settings_language", lang)

  //set the text of an object
  function setHTML(domId, text) {
    try{
      document.getElementById(domId).innerHTML = text;
    } catch{
      console.log("Element with id '" + domId + "' is missing");
    }
  }

  //set other to gray
  var row = document.getElementById("tr_flags");
  for (var j = 0, col; col = row.cells[j]; j++) {
    if (col.id.split("_")[1] == lang){
      col.children[0].style.paddingTop = "13px";
      col.children[0].style.borderBottom = "2px solid black";
    } else {
      col.children[0].style.paddingTop = "0px";
      col.children[0].style.borderBottom = "none";
    }
  }


  //check which dict must be taken which english as backup
  var langDict = null
  if (lang == "en") {
    langDict = lang_en;
  } else if (lang == "de") {
    langDict = lang_de;
  } else {
    langDict = lang_en;
  }

  for (key in langDict){
    var langType = key.split("_")[1];
    if (langType != "context"){
      setHTML(key, langDict[key])
    }
  }

  //change some size
  if (lang == "en"){
    document.getElementById("information").style.height = "470px";
    document.getElementById("infoBox").style.right = "130px";
  } else if (lang == "de"){
    document.getElementById("information").style.height = "590px";
    document.getElementById("infoBox").style.right = "170px";
  }

}

//only display the objects that belong to this file
function switchObjects(jsonId){
  var table = document.getElementById("objectsTable");

  for (var i = 0, row; row = table.rows[i]; i++) {
    if (row.getAttribute("jsonId") == jsonId){
      row.classList.remove("hidden");
    } else {
      row.classList.add("hidden");
    }
  }
}

//highlight a file in the box
function selectFile(fileId){

  var tr = document.getElementById("tr_" + fileId);

  //get the textfield
  var div = tr.children[0].children[0].children[1];
  div.style.color = "cornflowerblue";
  div.style.fontWeight = "bold";
}

//highlight an object in the box
function selectObject(objId){
  var tr = document.getElementById("tr_" + objId);
  var div = tr.children[0].children[0].children[3].children[0];
  div.style.color = "cornflowerblue";
  div.style.fontWeight = "bold";
}

//deHighlight a file in the box
function deselectFile(fileId){
  var tr = document.getElementById("tr_" + fileId);
  //get the textfield
  var div = tr.children[0].children[0].children[1];
  div.style.color = "black";
  div.style.fontWeight = "normal";
}

//deHighlight an object in the box
function deselectObject(objId){
  var tr = document.getElementById("tr_" + objId);
  var div = tr.children[0].children[0].children[3].children[0];
  div.style.color = "black";
  div.style.fontWeight = "normal";
}

//show the attributeBox
function displayAttributeBox(objId, jsonId){
  //clear table
  var table = document.getElementById("attributesTable");
  table.innerHTML = ""

  //get object
  var jsonObjects = jsonDict[jsonId].CityObjects;
  var objectId = jsonObjectsIdDict[jsonId][objId];
  var obj = jsonObjects[objectId];

  //iterate all attributes
  for (var key in obj.attributes){
    var val = obj.attributes[key];

    var tr = document.createElement("tr");;
    tr.classList.add('trBox');

    var td = document.createElement('td')
    td.classList.add('tdBox_attr');
    td.classList.add("small_box_text");

    var divKey = document.createElement("div");
    var txtKey = document.createElement("td");
    txtKey.innerHTML = key;
    divKey.classList.add("txt_attr");
    divKey.append(txtKey)
    td.append(divKey);

    var divVal = document.createElement("div");
    var txtVal = document.createElement("td");
    txtVal.innerHTML = val;
    divVal.classList.add("txt_attr");
    divVal.append(txtVal)
    td.append(divVal);

    tr.append(td);
    table.append(tr);
  }

  //only show box if not hidden
  if (document.getElementById("attributesHideButton").classList.contains("fa-eye-slash")){
    toggleBox("attributes", true);
  }


}

//jump to a particular file in the box
function jumpToFile(fileId){
  //select row
  var tr = document.getElementById("tr_" + fileId);
  //jump to element
  tr.scrollIntoViewIfNeeded();
}

//jump to a particular object in the box
function jumpToObject(objId){
  var tr = document.getElementById("tr_" + objId);

  //if element is a hidden child
  if (tr.style.display == "none"){

    var childLevel = tr.getAttribute("childLevel");

    var origTr = tr;

    //display children after this tr
    while (tr.nextElementSibling != undefined && tr.nextElementSibling.getAttribute("childLevel") >= childLevel){
      if (tr.nextElementSibling.getAttribute("childLevel") == parseInt(childLevel)){
        tr.nextElementSibling.style.display = "block";
      }
      tr = tr.nextElementSibling;
    }

    tr = origTr;

    //show previous children
    while (tr != undefined && tr.getAttribute("childLevel") > 0){
      tr.style.display = "block";
      tr = tr.previousSibling;
    }

    //sometimes you need the first method to get the element, sometimes the second..
    var elem = tr[0];
    if (elem == undefined){
      elem = tr;
    }

    //change the chevron
    var icon = elem.children[0].children[0].children[0].children[0];
    icon.classList.remove("fa-chevron-right");
    icon.classList.add("fa-chevron-down");


    origTr.scrollIntoViewIfNeeded();

  } else {

    //jump to element
    tr.scrollIntoViewIfNeeded();
  }
}

//return the objIds of childrens of an object
function getChildrenRows(objId){

  var tr = document.getElementById("tr_" + objId);
  childLevel = tr.getAttribute("childLevel");

  var ids = [];

  while (tr.nextElementSibling != undefined && tr.nextElementSibling.getAttribute("childLevel") >= childLevel){
    tr = tr.nextElementSibling;
    var id = tr.id.split("_")[1];
    ids.push(id);
  }

  return ids
}

//show or hide the settings
function toggleSettings(){
  var settings = document.getElementById("settings");
  var overlay = document.getElementById("overlay");


  if (settings.style.display == "none"){
    settings.style.display = "block";
    overlay.style.zIndex = 1;
  } else {
    settings.style.display = "none";
    overlay.style.zIndex = -1;
  }
}

//switch between the different settings tabs
function toggleSettingsTab(tab){
  //change button
  var elements = document.getElementsByClassName('tablinks');
  for (var i = 0; i < elements.length; i++) {
    elements[i].classList.remove("active")
  }
  document.getElementById("button_" + tab).classList.add("active")

  //change tab
  var elements = document.getElementsByClassName('tabcontent');
  for (var i = 0; i < elements.length; i++) {
    elements[i].style.display = 'none'
  }
  document.getElementById(tab).style.display = 'block'

}

//call the right function for changing the colour
function changeColour(elem){

  //get information
  var id = elem.id;
  var col = elem.value;

  //set color of td
  document.getElementById(id).parentElement.style.backgroundColor = col;

  col = col.replace("#", "0x");

  //set color in localStorage
  localStorage.setItem(id, col);

  //change background Colour
  if (id == "colour_background"){
    changeBackground(col.replace("#", "0x"));
  } else if (id == "colour_normals"){

  } else if (id == "colour_edges"){

  } else {
    var coType = id.split("_")[1];
    changeObjectColour(col, coType);
    changeObjectIconColour(col, coType);
  }


}

//change the colour of an icon in the object table
function changeObjectIconColour(col, coType){

  var table = document.getElementById("objectsTable");

  col = col.replace("0x", "#");

  for (var i = 0, row; row = table.rows[i]; i++) {

    var icon = row.children[0].children[0].children[2].children[0];

    if (icon.getAttribute("objType") == coType){
      icon.style.color = col;
    }

  }

}

//show or hide the info window
function toggleInfo(){

  if (document.getElementById("information").style.display == "none"){
    document.getElementById("information").style.display = "block";
    document.getElementById("overlay").style.zIndex = 1;
  } else {
    document.getElementById("information").style.display = "none";
    document.getElementById("overlay").style.zIndex = -1;
  }

}

//show or hide the log
function toggleLog(elem){
  localStorage.setItem("settings_log", elem.checked);

  if (elem.checked){
    document.getElementById("logger").style.display="block";
  } else {
    document.getElementById("logger").style.display="none";
  }
}

function toggleNavigation(elem){
  localStorage.setItem("settings_navigation", elem.checked);

  if (elem.checked){
    document.getElementById("navigation").style.display="block";
  } else {
    document.getElementById("navigation").style.display="none";
  }
}

//enable or disable Json verification
function toggleVerifyJSON(elem){
  localStorage.setItem("settings_verifyJSON", elem.checked);
}

//enable or disable asking when deleting
function toggleConfirmationDelete(elem){
  localStorage.setItem("settings_askDelete", elem.checked);
}

//show or hide the Licences
function toggleLicenses(){

  if (document.getElementById("licences").style.display == "none"){
    document.getElementById("licences").style.display="block";

    var content = document.getElementById("licences_content");

    var ul = document.createElement("ul")

    //get keys of dict to sort alphabetically
    var keys = Object.keys(licences);
    keys.sort(function (a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });


    //create ul
    for (var key of keys){
      var li = document.createElement("li");
      var link = document.createElement("a")
      link.href="#licence_" + key.toLowerCase();
      link.innerHTML = key;
      li.append(link);
      ul.append(li);

    };
    content.append(ul)

    for (var key of keys){

      var licence = licences[key]

      var divCaption = document.createElement("div");
      divCaption.innerHTML = key;
      divCaption.id = "licence_" + key.toLowerCase();
      divCaption.classList.add("licence_subsub");
      content.append(divCaption);

      var link = document.createElement("a");
      link.innerHTML = licence[0];
      link.href = licence[0];
      link.target = "_blank";
      link.classList.add("licence_link");
      content.append(link);

      var divText = document.createElement("div");
      divText.innerHTML = licence[1];
      divText.classList.add("licence_text");
      content.append(divText);
    }

  } else {
    document.getElementById("licences").style.display="none";
    document.getElementById("licences_content").innerHTML="";
  }



}

//change the selection method´in the viewer
function toggleSelect(elem){
  localStorage.setItem("viewer_select", elem.value)
}

//show or hide the spinner
function toggleSpinner(bool) {
  var spinner = document.getElementById("spinner");

  if (bool) {
    spinner.style.display = 'block';
  } else {
    spinner.style.display = 'none';
  }
}

//close all windows due to overlay
function closeAll(){

  document.getElementById("overlay").style.zIndex = -1;

  if (document.getElementById("licences").style.display == "none"){
    document.getElementById("settings").style.display = "none";
  } else {
    document.getElementById("overlay").style.zIndex = 1;
  }
  document.getElementById("licences").style.display = "none";
  document.getElementById("statistics").style.display = "none";
  document.getElementById("metadata").style.display = "none";
  document.getElementById("information").style.display = "none";
  document.getElementById("overview").style.display = "none";

  //clean temp content
  clearStatistics();
  clearOverview();

}

//reset file loeader that new files can be uploaded
function resetFileLoader() {
  document.getElementById("fileElem").value = "";
}

//add or remove the click event from the overlay div for smoother feelings
function toggleOverlayEvent(bool){

  if(bool){

    //to prevent that a click in the overlay box outside while input color is opened
    //closes the settings field we wait 1 second until the overlay box get it's function back
    setTimeout(function (){
      document.getElementById("overlay").onclick = function(){
        closeAll();
      };
    }, 1000);

  } else {
    document.getElementById("overlay").onclick = "";
  }

}

//show or hide the statistics box
function toggleStatistics(){

  if (document.getElementById("statistics").style.display == "none"){

    var table = document.getElementById("statisticsTable");

    //get the information for this file
    var jsonId = clickedContextFileId;
    var stats = jsonStats[jsonId]
    var objectsCount = jsonObjectsCount[jsonId];

    //calculate fileSize
    var fileSize = stats[12];

    //in kb
    var prettyFileSize = Math.round(fileSize/1024);
    var sizeType = "KB"

    //in mn
    if (prettyFileSize > 1024){
      var prettyFileSize = Math.round(prettyFileSize/1024);
      var sizeType = "MB"
    }

    if (prettyFileSize > 1024){
      var prettyFileSize = Math.round(prettyFileSize/1024);
      var sizeType = "GB"
    }


    //set the values
    document.getElementById("td_stat_fileSize").innerHTML = prettyFileSize + " " + sizeType;
    document.getElementById("td_stat_numObjects").innerHTML = stats[9];
    document.getElementById("td_stat_numVertices").innerHTML = stats[10];
    document.getElementById("td_stat_numFaces").innerHTML = stats[11];

    //add the temp objects
    for (key in objectsCount){
      var tr = document.createElement("tr");
      tr.classList.add("stat_temp");
      var td = document.createElement("td");
      var desc = document.createElement("span");
      desc.innerHTML = "Number of " + key;
      var val = document.createElement("span");
      val.classList.add("span_val");
      val.innerHTML = objectsCount[key];

      td.append(desc);
      td.append(val);
      tr.append(td);
      table.append(tr);
    }
    td.classList.add("lastStatTd")

    //show statistics
    document.getElementById("statistics").style.display = "block";

    //show overlay
    document.getElementById("overlay").style.zIndex = 1;

  } else {
    document.getElementById("statistics").style.display = "none";
    document.getElementById("overlay").style.zIndex = -1;

    clearStatistics();
  }

}

//remove temp objects from statistics
function clearStatistics(){
  //remove temp objects
  var elements = document.getElementsByClassName("stat_temp");
  while(elements.length > 0){
    elements[0].parentNode.removeChild(elements[0]);
  }
}

function toggleMetadata(){
  if (document.getElementById("metadata").style.display == "none"){

    //get the information for this file
    var jsonId = clickedContextFileId;
    var stats = jsonStats[jsonId]

    document.getElementById("td_meta_minX").innerHTML = stats[0];
    document.getElementById("td_meta_maxX").innerHTML = stats[6];
    document.getElementById("td_meta_minY").innerHTML = stats[1];
    document.getElementById("td_meta_maxY").innerHTML = stats[7];
    document.getElementById("td_meta_minZ").innerHTML = stats[2];
    document.getElementById("td_meta_maxZ").innerHTML = stats[8];


    document.getElementById("metadata").style.display = "block";
    document.getElementById("overlay").style.zIndex = 1;
  } else {
    document.getElementById("metadata").style.display = "none";
    document.getElementById("overlay").style.zIndex = -1;
  }
}

//delete all elements in local storage and init again
function resetLocalStorage(){
  if (confirm('Are you sure you want to reset all settings (including colours) to default? This action cannot be undone.')) {


    //clear the local storage
    localStorage.clear();

    //and fill the local storage again with the default values
    initLocalStorage();

    //and now new colours must be applied
    for (var i = 0; i < localStorage.length; i++){

      if (localStorage.key(i).split("_")[0] == "colour"){

        var col = localStorage.getItem(localStorage.key(i));
        col = col.replace("0x", "#");
        var colObj = {id:localStorage.key(i),
                      value: col
                     };

        changeColour(colObj);
      }
    }


  }

}

//function to search a box
function searchBox(type){
  var table = document.getElementById(type + "Table");

  var inputText = new RegExp(document.getElementById(type + "SearchField").value);


  var searchIcon = document.getElementById(type + "SearchButton");

  //change icon of filtering to indicate that a filter is active
  if (inputText.length > 0){
      searchIcon.classList.remove("fa-search");
      searchIcon.classList.add("fa-search-plus");
  } else {
    searchIcon.classList.add("fa-search");
    searchIcon.classList.remove("fa-search-plus");
  }

  //iterate all table elements
  for (var i = 0, row; row = table.rows[i]; i++) {

    //get the text of the row
    if (type == "files"){
      var rowText = row.children[0].children[0].children[1].innerHTML;
    } else if (type == "objects"){
      var rowText = row.children[0].children[0].children[3].children[0].innerHTML;
    }

    //check if text is in row
    if (rowText.includes(inputText) == false){
      row.classList.add("hidden")
    } else {

      //check if json file is selected
      if (row.getAttribute("jsonId") == clickedFileId){
        row.classList.remove("hidden")
      }
    }
  }
}

//write logs to the logger
function writeToLogger(text){

  logger = document.getElementById("logger");

  logger.innerHTML = logger.innerHTML + text + "<br>"

}

function contextEditFile(){
  var jsonId = clickedContextFileId;
}

function contextSettings(){
  var jsonId = clickedContextFileId;
}

function deleteFile(){

  var jsonId = clickedContextFileId;
  var jsonName = jsonIdDict[jsonId];

  if (localStorage.getItem("settings_askDelete") == "true"){
    if (confirm("Are you sure you want to delete '" + jsonName + "'? This action cannot be undone.") == false){
      return
    }
  }

  var toDel = []

  //select to delete objects from filesMenu
  var tableFiles = document.getElementById("filesTable");
  for (var i = 0, row; row = tableFiles.rows[i]; i++) {
    if (row.id.split("_")[1] == jsonId){
      toDel.push(row);
    }
  }

  //select to delete objects from objectsMenu
  var tableObjects = document.getElementById("objectsTable");
  for (var i = 0, row; row = tableObjects.rows[i]; i++) {
    if (row.getAttribute("jsonId") == jsonId){
      toDel.push(row);
    }
  }

  //the actual delete
  for (elem of toDel){
    elem.remove();
  }

  //hide menus if nothing is in there
  if (tableFiles.rows.length == 0){
    document.getElementById("files").style.display = "none";
  }
  if (tableObjects.rows.length == 0){
    document.getElementById("objects").style.display = "none";
  }

  //remove clicked
  if (clickedFileId == jsonId){
    clickedFileId = null;
  }
  console.log("todo the same with objects");

  //delete from the viewer
  deleteMeshes(jsonId);

  //delete from the dicts
  delete jsonDict[jsonId];
  delete jsonIdDict[jsonId];
  delete jsonObjectsIdDict[jsonId];
  delete jsonStats[jsonId];
  delete jsonObjectsCount[jsonId];
}

function duplicateFile(){
  var jsonId = clickedContextFileId;
  var jsonContent = jsonDict[jsonId];
  var jsonName = jsonIdDict[jsonId];
  handleSingleFile(jsonContent, jsonId);
  writeToLogger("- '" + jsonName + "' will be duplicated.")
}

function buildContextMenus(){

  var lang = localStorage.getItem("settings_language");
  var langDict = null;
  if (lang == "en"){
    langDict = lang_en;
  } else if (lang == "de"){
    langDict = lang_de;
  }

  contextMenuFiles = [
    //go to
    { type: 'item', title: langDict["txt_context_goto"], icon: 'fas fa-crosshairs', fn: function() {setCamera()}},
    { type: 'separator' },
    //edit
    { type: 'item', title: langDict["txt_context_edit"], icon: 'fas fa-edit', fn: function() {contextEditFile()}},
    //duplicate
    { type: 'item', title: langDict["txt_context_duplicate"], icon: 'fas fa-copy', fn: function() {duplicateFile()}},
    //download
    { type: 'item', title: langDict["txt_context_download"], icon: 'fas fa-download', fn: function() {contextDownloadFile()}},
    //delete
    { type: 'item', title: langDict["txt_context_delete"], icon: 'fas fa-trash', fn: function() {deleteFile()}},
    { type: 'separator' },
    //overview
    { type: 'item', title: langDict["txt_context_overview"], icon: 'fas fa-table', fn: function() {toggleOverview()}},
    //metadata
    { type: 'item', title: langDict["txt_context_metadata"], icon: 'fas fa-globe', fn: function() {toggleMetadata()}},
    //statistics
    { type: 'item', title: langDict["txt_context_statistics"], icon: 'fas fa-info-circle', fn: function() {toggleStatistics()}},
    //settings
    { type: 'item', title: langDict["txt_context_settings"], icon: 'fas fa-cog', fn: function() {}},
    { type: 'separator' },
    //quit
    { type: 'item', title: 'Logout', icon: 'fas fa-times', fn: function() {}}
  ]
}
