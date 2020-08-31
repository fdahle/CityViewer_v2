//
//only here is document.getElementById allowed
//

async function initDocument() {

  //init viewer
  var viewer = document.getElementById("viewer")
  await initViewer(viewer)

  //init axisHelper
  var viewer_axis = document.getElementById("viewer_axis")
  initAxis(viewer_axis)

  //init events for viewer
  initViewerEvents(viewer)

  //init events
  var dropbox = document.getElementById("dropbox");
  var inputFile = document.getElementById("fileElem")
  initEvents(dropbox, inputFile)

  //init Settings
  initSettings()

}

//add an entry to file menu
function addToFileMenu(id) {

  //make div visible
  document.getElementById("filesBox").style.display = 'block'

  //get menu element
  menu = document.getElementById("filesTable")

  //get json Name
  var jsonName = jsonIdDict[id]

  var tr = document.createElement('tr');
  tr.setAttribute("id", "file_" + id);

  //create checkbox
  var td = document.createElement('td');
  td.classList.add("td_files_check")
  var checkBox = document.createElement('input');
  checkBox.type = "checkbox";
  checkBox.checked = true;
  checkBox.style.marginRight = "7px";
  checkBox.onchange = function(){
    //get the id of the object to hide
    var jsonId = this.parentElement.parentElement.id;
    jsonId = jsonId.split("_")[1]
    toggleJSON(jsonId)
  }

  td.appendChild(checkBox)
  tr.appendChild(td)

  //create the json text
  var td = document.createElement('td');
  td.classList.add("td_objects_text")
  var jsonText = document.createElement("span");
  jsonText.innerText = jsonName;
  td.append(jsonText)
  tr.append(td)

  //add to menu
  menu.append(tr)
}

//delete an entry from the file menu
function removeFromFileMenu(jsonid) {

  //get menu element and remove
  var elem = document.getElementById("file_" + jsonid)
  elem.remove();

  //count number of children and if zero hide the menu
  var childCount = document.getElementById("filesTree").childElementCount;
  if (childCount == 0) {
    //make div visible
    document.getElementById("filesBox").style.display = 'none'
  }

}

//add objects to the file menu
function addToObjectMenu(jsonid, objects) {

  //make div visible
  document.getElementById("objectsBox").style.display = ''

  //get menu element
  var menu = document.getElementById("objectsTable")

  for (var i = 0; i < objects.length; i++) {

    var obj = objects[i];

    var extraPadding = undefined
    if (obj.jsonParent != undefined){
      console.log(obj.jsonParent);
      var parent = undefined
      console.log("CHILD", menu.children);
      for (var j = 0; j < menu.children.length; j++){
        var child = menu.children[j]
        console.log(child.jsonId, obj.jsonId);
        console.log(child.objName, obj.jsonParent);
        if (child.jsonId == obj.jsonId && child.objName==obj.jsonParent){
          parent = child;
          break
        }
      }

      extraPadding = parent.firstChild.style.paddingLeft
    }
    console.log(extraPadding);

    var tr = document.createElement('tr');
    tr.setAttribute("id", "object_" + obj.uuid);
    tr.setAttribute("json_id", obj.jsonId);
    tr.setAttribute("objName", obj.objName)

    //add checkbox
    var td = document.createElement('td');
    td.classList.add("td_objects_check")
    var checkBox = document.createElement('input');
    checkBox.type = "checkbox";
    checkBox.checked = true;
    checkBox.style.marginRight = "7px";
    checkBox.onchange = function(){
      //get the id of the object to hide
      var id = this.parentElement.parentElement.id;
      id = id.split("_")[1]
      toggleMesh(id)
    }
    td.appendChild(checkBox)
    tr.append(td)

    //add icon
    var td = document.createElement('td');
    td.classList.add("td_objects_icon")
    var icon = document.createElement('i')
    icon.classList.add("fa");

    //select right icon
    var objType = obj.coType.toLowerCase();
    if (objType == "building" || objType == "buildingpart") {
      icon.classList.add("fa-building");
    } else if (objType == "waterbody") {
      icon.classList.add("fa-tint")
      console.log("HI");
    } else if (objType == "plantcover") {
      icon.classList.add("fa-leaf")
    } else if (objType == "genericcityobject") {
      icon.classList.add("fa-cube")
    } else if (objType == "road") {
      icon.classList.add("fa-road")
    } else if (objType == "landuse") {
      icon.classList.add("fa-mountain")
    } else {
      icon.classList.add("fa-question-circle");
    }
    td.appendChild(icon)
    tr.append(td)


    //add object text
    var td = document.createElement('td');
    td.classList.add("td_objects_text");
    td.style.color = "black";
    td.onclick = function() {
      id = this.parentElement.id.split("_")[1]
      selectCityObj(id)
    };
    var objectText = document.createElement("span");
    objectText.innerText = obj.objName;
    td.append(objectText)
    tr.append(td)

    menu.append(tr)
  }



}

//delete the objects from objects menu
function removeObjectsFromMenu(jsonid) {

  //get the table rows
  var tableRows = document.getElementById("objectsTable").children;

  //iterate rows
  for (var i = tableRows.length - 1; i >= 0; i--) {
    var tr = tableRows[i]
    //if row belongs to this json remove
    if (tr.getAttribute('json_id') == jsonid) {
      tr.remove()
    }
  }

  //count number of children and if zero hide the menu
  var childCount = document.getElementById("objectsTable").childElementCount;
  if (childCount == 0) {
    //make div visible
    document.getElementById("objectsBox").style.display = 'none'
  }
}

//jump to an entry in the file menu
function jumpToFileEntry(id) {
  var td = document.getElementById("object_" + id)
  td.scrollIntoViewIfNeeded()
}

//make selected object blue or black
function toggleText(id) {

  var tr = document.getElementById("object_" + id);
  var td = tr.children[2];

  if (td.style.color == "black") {
    td.style.color = "cornflowerblue";
    td.style.fontWeight = "bold";
  } else {
    td.style.color = "black";
    td.style.fontWeight = "normal";
  }

}

//show or hide the loader
function toggleLoader(bool) {

  loader = document.getElementById("loader")

  //show loader
  if (bool) {
    loader.style.display = 'block';
  } else {
    loader.style.display = 'none'
  }
}

//show or hide statistics
function toggleStatistics(stats) {

  console.log(stats);

  var statistics = document.getElementById("statisticsMenu")

  if (statistics.style.display == 'none') {

    document.getElementById("td_stat_fileSize").innerHTML = "";
    document.getElementById("td_stat_numObjects").innerHTML = stats[9];
    document.getElementById("td_stat_numVertices").innerHTML = stats[10];
    document.getElementById("td_stat_numFaces").innerHTML = stats[11];
    document.getElementById("td_stat_minX").innerHTML = stats[0];
    document.getElementById("td_stat_maxX").innerHTML = stats[6];
    document.getElementById("td_stat_minY").innerHTML = stats[1];
    document.getElementById("td_stat_maxY").innerHTML = stats[7];
    document.getElementById("td_stat_minZ").innerHTML = stats[2];
    document.getElementById("td_stat_maxZ").innerHTML = stats[8];


    statistics.style.display = 'block';
  } else {
    statistics.style.display = 'none'
  }
}

//show or hide settings menu
function toggleSettings() {

  var settings = document.getElementById("settingsMenu")
  var overlay = document.getElementById("overlayBox")

  if (settings.style.display == 'none') {
    settings.style.display = 'block';
    overlay.style.zIndex = 1;
  } else {
    settings.style.display = 'none'
    overlay.style.zIndex = -1;
  }
}

//toggle between the settings tabs
function toggleSettingsTab(tab) {

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

//show or hide attributes
function toggleAttributes(bool, id, jsonId){

  var attributesBox = document.getElementById("attributesBox")
  var objectsTable = document.getElementById("objectsTable")

  //get id of object
  var id = document.getElementById("object_" + id).lastChild.lastChild.innerHTML

  //find the object
  var obj = findObj(id, jsonId)

  if (bool) {

    //get the attributes
    var attributes = obj.attributes

    //get the table and clear from previous content
    attrTable = document.getElementById("attributesTable")
    attrTable.innerHTML = '';

    var tr = document.createElement('tr');

    //create the value text
    var th = document.createElement('th');
    th.classList.add("td_attribute_value")
    var valText = document.createElement("span");
    valText.innerText = "Value";
    th.append(valText)
    tr.append(th)

    //create the key text (must be lasted as whole div is mirrored)
    var th = document.createElement('th');
    th.classList.add("td_attribute_key")
    var keyText = document.createElement("span");
    keyText.innerText = "Attribute";
    th.append(keyText)
    tr.append(th)
    attrTable.append(tr)

    //build the table
    Object.keys(attributes).forEach(function(key) {

      var tr = document.createElement('tr');

      //create the value text
      var td = document.createElement('td');
      td.classList.add("td_attribute_value")
      var valText = document.createElement("span");
      valText.innerText = attributes[key];
      td.append(valText)
      tr.append(td)

      //create the key text (must be lasted as whole div is mirrored)
      var td = document.createElement('td');
      td.classList.add("td_attribute_key")
      var keyText = document.createElement("span");
      keyText.innerText = key;
      td.append(keyText)
      tr.append(td)

      //add to menu
      attrTable.append(tr)
    });

    attributesBox.style.display = 'block';
  } else {
    attributesBox.style.display = 'none'
  }
}

//set color for an input color picker in settings
function setColourVal(key, hex) {

  var hex = hex.replace("0x", "#");

  var input = document.getElementById("colour_" + key.toLowerCase())
  input.value = hex;

  var td = input.parentElement
  td.style.backgroundColor = hex;
}

//if a new color is selected change the colour where needed
function changeColour(elem) {

  //get all attributes
  var td = elem.parentElement
  var colour = elem.value
  var id = elem.id.split("_")[1]

  //change in local storage

  //change in td
  td.style.backgroundColor = colour

  //change in three js
  changeObjectColour(id, colour)
}

//reset file loeader that new files can be uploaded
function resetFileLoader() {

  document.getElementById("fileElem").value = "";

}

//action when clicked on overlay
function clickOverlay(){
  toggleSettings()
}

//context menu
$(function() {
  $('#filesTable').contextMenu({
    selector: 'tr',
    callback: function(key, options) {
      id = $(this).attr('id');
      id = id.substr(5)
      if (key == "goto") {
        setCamera(id)
      } else if (key == "edit") {
        editFile(id)
      } else if (key == "duplicate") {
        copyFile(id)
      } else if (key == "download") {
        downloadFile(id)
      } else if (key == "table"){
        openTable(id)
      } else if (key == "statistics") {
        statisticsForFile(id)
      } else if (key == "settings") {
        settingsForFile(id)
      } else if (key == "delete") {
        deleteFile(id)
      } else if (key == "quit") {

      }
    },
    items: {
      "goto": {
        name: "Go to",
        icon: "fa-crosshairs"
      },
      "edit": {
        name: "Edit",
        icon: "edit"
      },
      "duplicate": {
        name: "Duplicate",
        icon: "copy"
      },
      "download": {
        name: "Download",
        icon: "fa-download"
      },
      "table":{
        name: "Table",
        icon: "fa-table"
      },
      "statistics": {
        name: "Statistics",
        icon: "fa-info-circle"
      },
      "settings": {
        name: "Settings",
        icon: "fa-cog"
      },
      "delete": {
        name: "Delete",
        icon: "delete"
      },
      "sep1": "---------",
      "quit": {
        name: "Quit",
        icon: function($element, key, item) {
          return 'context-menu-icon context-menu-icon-quit';
        }
      }
    }
  });

  $('#objectsTable').contextMenu({
    selector: 'tr',
    callback: function(key, options) {
      id = $(this).attr('id');
      id = id.substr(5)
      if (key == "goto") {
        setCamera(id)
      } else if (key == "edit") {
        editFile(id)
      } else if (key == "copy") {
        copyFile(id)
      } else if (key == "download") {
        downloadFile(id)
      } else if (key == "statistics") {
        statisticsForFile(id)
      } else if (key == "delete") {
        deleteFile(id)
      } else if (key == "quit") {

      }
    },
    items: {
      "goto": {
        name: "Go to",
        icon: "fa-crosshairs"
      },
      "edit": {
        name: "Edit",
        icon: "edit"
      },
      "copy": {
        name: "Copy",
        icon: "copy"
      },
      "download": {
        name: "Download",
        icon: "fa-download"
      },
      "statistics": {
        name: "Statistics",
        icon: "fa-info-circle"
      },
      "delete": {
        name: "Delete",
        icon: "delete"
      },
      "sep1": "---------",
      "quit": {
        name: "Quit",
        icon: function($element, key, item) {
          return 'context-menu-icon context-menu-icon-quit';
        }
      }
    }
  });

});
