async function toggleOverview(){

  //load script
  loadScript("https://bossanova.uk/jexcel/v4/jexcel.js")
  loadScript("https://bossanova.uk/jsuites/v3/jsuites.js")

  var jsonId = clickedContextFileId;

  if (document.getElementById("overview").style.display == "none"){
    toggleSpinner(true);

    returner = await buildList(jsonId);

    var columns = returner[0];
    var data = returner[1];
    var widths = returner[2]

    createTable(data, columns, widths)

    //await buildTableHeader(table, columns);
    //await buildTableContent(table, data, columns);

    toggleSpinner(false);

    document.getElementById("overview").style.display = "block";
    document.getElementById("overlay").style.zIndex = 1;
  } else {
    document.getElementById("overview").style.display = "none";
    document.getElementById("overlay").style.zIndex = -1;

    clearOverview();

  }
}

//clear the temp content
function clearOverview(){
  //remove and recreate to clean the table
  document.getElementById("overview_content").remove();
  var div = document.createElement("div");
  div.id="overview_content"
  document.getElementById("overview").append(div);

}

function createTable(data, columns, widths){
  $("#overview_content").jexcel({
    data:data,
    colHeaders: columns,
    colWidths: widths
  });
}

//convert the json data to a list of lists
function buildList(jsonId){

  var jsonObjects = jsonObjectsIdDict[jsonId];
  var list = []

  //build the basic list
  for (var key in jsonObjects){
    var row = [];

    row.push(key);

    var obj = getObjectByName(jsonId, jsonObjects[key]);
    row.push(obj.type);

    list.push(row);
  }

  //check which columns are needed
  var columns = []
  for (var key in jsonObjects){
    var obj = getObjectByName(jsonId, jsonObjects[key])
    var attributes = obj.attributes;

    for (attrKey in attributes){
      if (columns.includes(attrKey) == false){
        columns.push(attrKey)
      }
    }
  }

  //fill the list with the values
  var i = 0;
  for (var key in jsonObjects){

    row = list[i];

    var obj = getObjectByName(jsonId, jsonObjects[key])
    var attributes = obj.attributes;

    for (var col of columns){
      if (col in attributes){
        row.push(attributes[col]);
      } else {
        row.push("");
      }
    }

    list[i] = row;
    i = i + 1;

  }
  columns.unshift("id", "type");

  function displayTextWidth(text, font) {
    let canvas = displayTextWidth.canvas || (displayTextWidth.canvas = document.createElement("canvas"));
    let context = canvas.getContext("2d");
    context.font = font;
    let metrics = context.measureText(text);
    return metrics.width;
  }

  //get the columnWidth
  var widths = []
  font = "'Roboto', sans-serif"
  for (var caption of columns){
    //var width = Math.ceil(displayTextWidth(caption, font));
    width = 200;
    widths.push(width)
  }

  return [columns, list, widths]
}
