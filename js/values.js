//
//default values & global variables
//

//Camera variables
var scene;
var camera;
var renderer;
var raycaster;
var mouse;
var controls;
var spot_light;

//axis camera variables
var renderer2;
var scene2;
var camera2;
var axes2;

//rendering variables
const X = new THREE.Vector3(1.0, 0.0, 0.0);
const Y = new THREE.Vector3(0.0, 1.0, 0.0);
const Z = new THREE.Vector3(0.0, 0.0, 1.0);

//variables for json
var jsonDict = {}; //the complete json file
var jsonIdDict = {}; //translation between unique id and json name (can be multiple files with same name)
var jsonObjectsIdDict = {};
var jsonStats = {};
var jsonObjectsCount = {};

//determine which objects are marked
var clickedObjId = null;
var clickedFileId = null;
var clickedContextFileId = null;
var highlightedObjects = [];

//for the contextMenus
var contextMenuFiles = null;

var lang = window.navigator.language.split("-")[0];

var globalSettings = {
  "width_files": 220,
  "width_objects": 220,
  "width_attributes": 220,
  "settings_language": lang,
  "settings_log": false,
  "settings_navigation": true,
  "settings_verifyJSON": false,
  "settings_beautifyJSON": false,
  "settings_askDelete": true,
  "viewer_edges": false,
  "viewer_normals": false,
  "viewer_axis": false,
  "viewer_materialSide": "double",
  "viewer_select": "right"
}

//default colours for citObjects
var ALLCOLOURS = {
  "background": 0xFFFFFF,
  "edges": 0x808080,
  "normals": 0x5FF3FF,
  "Building": 0xcc0000,
  "BuildingPart": 0xcc0000,
  "BuildingInstallation": 0xcc0000,
  "Bridge": 0x999999,
  "BridgePart": 0x999999,
  "BridgeInstallation": 0x999999,
  "BridgeConstructionElement": 0x999999,
  "CityObjectGroup": 0xffffb3,
  "CityFurniture": 0xcc0000,
  "GenericCityObject": 0xcc0000,
  "LandUse": 0xffffb3,
  "PlantCover": 0x39ac39,
  "Railway": 0x000000,
  "Road": 0x999999,
  "SolitaryVegetationObject": 0x39ac39,
  "TINRelief": 0x3FD43F,
  "TransportSquare": 0x999999,
  "Tunnel": 0x999999,
  "TunnelPart": 0x999999,
  "TunnelInstallation": 0x999999,
  "WaterBody": 0x4da6ff
};

//english Language
lang_en = {
  txt_dropper1: "Drop your files here",
  txt_dropper2: "or click to open",
  txt_files: "Files",
  txt_files_rota: "Files",
  txt_objects: "Objects",
  txt_objects_rota: "Objects",
  txt_attributes: "Attributes",
  txt_attributes_rota: "Attributes",
  txt_btn_help: "Help",
  txt_btn_settings: "Settings",
  txt_settings_caption: "Settings",
  txt_tab_general: "General",
  txt_tab_viewer: "Viewer",
  txt_tab_colour: "Colours",
  txt_general_options: "General options",
  txt_display_log: "Display log",
  txt_display_navi: "Display navigation-menu",
  txt_json_options: "JSON options",
  txt_verify_json: "Verify JSON-files",
  txt_beautify_json: "Save beautified JSON-files",
  txt_ask_del: "Ask when deleting",
  txt_language_options: "Language options",
  txt_setting_licences: "Licences",
  txt_settings_advanced: "Advanced Options",
  txt_reset_settings: "Reset all settings",
  txt_show_licences: "Show licences",
  txt_helper_options: "Helper options",
  txt_show_edges: "Show edges",
  txt_show_normals: "Show normals",
  txt_show_axis: "Show axis",
  txt_material_options: "Material options",
  txt_material_side: "Material side",
  txt_front_side: "Front side",
  txt_back_side: "Back side",
  txt_double_side: "Double Side",
  txt_intelligent_side: "Intelligent",
  txt_select_options: "Select options",
  txt_object_selection: "Object selection",
  txt_left_click: "Left click",
  txt_double_left_click: "Double left click",
  txt_middle_click: "Middle click",
  txt_right_click: "Right click",
  txt_colour_caption_viewer: "Viewer",
  txt_colour_background: "Background",
  txt_colour_edges: "Edges",
  txt_colour_normals: "Normals",
  txt_colour_caption_default: "Default CityJSON Objects",
  txt_colour_building: "Building",
  txt_colour_buildingpart: "BuildingPart",
  txt_colour_buildinginstallation: "BuildingInstallation",
  txt_colour_bridge: "Bridge",
  txt_colour_bridgepart: "BridgePart",
  txt_colour_bridgeinstallation: "BridgeInstallation",
  txt_colour_bridgeconstructionelement: "BridgeConstructionElement",
  txt_colour_cityobjectgroup: "CityObjectGroup",
  txt_colour_cityfurniture: "CityFurniture",
  txt_colour_genericcityobject: "GenericCityObject",
  txt_colour_landuse: "LandUse",
  txt_colour_plantcover: "PlantCover",
  txt_colour_railway: "Railway",
  txt_colour_road: "Road",
  txt_SolitaryVegetationObject: "SolitaryVegetationObject",
  txt_TINRelief: "TINRelief",
  txt_TransportSquare: "TransportSquare",
  txt_Tunnel: "Tunnel",
  txt_TunnelPart: "TunnelPart",
  txt_TunnelInstallation: "TunnelInstallation",
  txt_WaterBody: "WaterBody",
  txt_statistics_caption: "Statistics",
  txt_stat_fileSize: "File size",
  txt_stat_numObjects: "Number of objects",
  txt_stat_numVertices: "Number of vertices",
  txt_stat_numFaces: "Number of faces",
  txt_metadata_caption: "Metadata",
  txt_meta_type: "Type",
  txt_meta_version: "Version",
  txt_meta_reference: "Reference system",
  txt_meta_minX: "Min X",
  txt_meta_maxX: "Max X",
  txt_meta_minY: "Min Y",
  txt_meta_maxY: "Max Y",
  txt_meta_minZ: "Min Z",
  txt_meta_maxZ: "Max Z",
  txt_info: "Information",
  txt_info1: "CityViewer is a tool for viewing & editing CityJSON-files in the browser.",
  txt_info2: "CityJSON is a JSON-based encoding for storing 3D city models, also called digital maquettes or digital twins. For more information click <a id='txt_infoLink' href='https://www.cityjson.org/' target='_blank'>here</a>",
  txt_info_toDo: "Following information can be helpful:",
  txt_info_todo1: "Currently only CityJSON-files can be handled, but more types will follow.",
  txt_info_todo2: "Click on an object in the tree or in the 3D view to select it.",
  txt_info_todo3: "A rightclick on a file or an object in the tree opens a context-menu.",
  txt_info_todo4: "Many options can be changed in the settings.",
  txt_info_todo5: "This app can also be used offline.",
  txt_info3: "Click here to load a simple CityJSON-Example.",
  txt_context_goto: "Go to",
  txt_context_edit: "Edit",
  txt_context_duplicate: "Duplicate",
  txt_context_download: "Download",
  txt_context_delete: "Delete",
  txt_context_overview: "Overview",
  txt_context_metadata: "Metadata",
  txt_context_statistics: "Statistics",
  txt_context_settings: "Settings",
  txt_context_quit: "Quit",
  txt_overview_caption: "Overview"
};

//german Language
lang_de = {
  txt_dropper1: "Dateien hier ablegen",
  txt_dropper2: "oder für Öffnen klicken",
  txt_files: "Dateien",
  txt_files_rota: "Dateien",
  txt_objects: "Objekte",
  txt_objects_rota: "Objekte",
  txt_attributes: "Attribute",
  txt_attributes_rota: "Attribute",
  txt_btn_help: "Hilfe",
  txt_btn_settings: "Einstellungen",
  txt_settings_caption: "Einstellungen",
  txt_tab_general: "Allgemein",
  txt_tab_viewer: "Anzeige",
  txt_tab_colour: "Farben",
  txt_general_options: "Allgemeine Optionen",
  txt_display_log: "Log anzeigen",
  txt_display_navi: "Navigationsmenü anzeigen",
  txt_json_options: "JSON-Optionen",
  txt_verify_json: "JSON-Dateien verifizieren",
  txt_beautify_json: "Formatierte JSON-Dateien speichern",
  txt_ask_del: "Beim Löschen nachfragen",
  txt_language_options: "Sprach-Optionen",
  txt_setting_licences: "Lizenzen",
  txt_settings_advanced: "Erweiterte Optionen",
  txt_reset_settings: "Alle Einstellungen<br>zurücksetzen",
  txt_show_licences: "Lizenzen anzeigen",
  txt_helper_options: "Helfer-Optionen",
  txt_show_edges: "Kanten anzeigen",
  txt_show_normals: "Normal-Vektoren anzeigen",
  txt_show_axis: "Axis anzeigen",
  txt_material_options: "Material-Optionen",
  txt_material_side: "Material-seite",
  txt_front_side: "Vorderseitig",
  txt_back_side: "Hinterseitig",
  txt_double_side: "Doppelseiting",
  txt_intelligent_side: "Intelligent",
  txt_select_options: "Auswahl-Optionen",
  txt_object_selection: "Objektauswahl",
  txt_left_click: "Linksklick",
  txt_double_left_click: "Doppel-Linksklick",
  txt_middle_click: "Mittelklick",
  txt_right_click: "Rechtsklick",
  txt_colour_caption_viewer: "Viewer",
  txt_colour_background: "Hintergrund",
  txt_colour_edges: "Kante",
  txt_colour_normals: "Normal-Vektor",
  txt_colour_caption_default: "Standard CityJSON Objekte",
  txt_colour_building: "Gebäude",
  txt_colour_buildingpart: "Gebäude-Teil",
  txt_colour_buildinginstallation: "Gebäude-Installation",
  txt_colour_bridge: "Brücke",
  txt_colour_bridgepart: "Brückenteil",
  txt_colour_bridgeinstallation: "Brücken-Installation",
  txt_colour_bridgeconstructionelement: "Brücken-Konstruktions-Element",
  txt_colour_cityobjectgroup: "Stadt-Objekt",
  txt_colour_cityfurniture: "Stadt-Einrichtung",
  txt_colour_genericcityobject: "Generisches Stadt-Objekt",
  txt_colour_landuse: "Landnutzung",
  txt_colour_plantcover: "Vegetation",
  txt_colour_railway: "Eisenbahn",
  txt_colour_road: "Straße",
  txt_SolitaryVegetationObject: "Einzelne Vegetation",
  txt_TINRelief: "TINRelief",
  txt_TransportSquare: "Transport",
  txt_Tunnel: "Tunnel",
  txt_TunnelPart: "Tunnel-Teil",
  txt_TunnelInstallation: "Tunnel-Installation",
  txt_WaterBody: "Gewässer",
  txt_statistics_caption: "Statistiken",
  txt_stat_fileSize: "Dateigröße",
  txt_stat_numObjects: "Anzahl an Objekten",
  txt_stat_numVertices: "Anzahl an Eckpunkten",
  txt_stat_numFaces: "Anzahl an Flächen",
  txt_metadata_caption: "Metadaten",
  txt_meta_type: "Typ",
  txt_meta_version: "Version",
  txt_meta_reference: "Referenzsystem",
  txt_meta_minX: "Min X",
  txt_meta_maxX: "Max X",
  txt_meta_minY: "Min Y",
  txt_meta_maxY: "Max Y",
  txt_meta_minZ: "Min Z",
  txt_meta_maxZ: "Max Z",
  txt_info: "Information",
  txt_info1: "CityViewer ist ein Werkzeug für das Betrachten und Editieren von CityJSON-Dateien im Browser.",
  txt_info2: "CityJSON ist eine JSON-basierte Codierung für das Speichern von 3D Stadtmodellen, auch bekannt als digitale Modelle oder digitale Zwillinge. Für mehr Informationen <a id='txt_infoLink' href='https://www.cityjson.org/' target='_blank'>hier</a> klicken.",
  txt_info_toDo: "Folgende Information können hilfreich sein:",
  txt_info_todo1: "Momentan können nur CityJSON-Dateien gehandhabt werden, mehr Dateiformate werden folgen.",
  txt_info_todo2: "Ein Objekt kann mit einem Klick in der Übersicht oder im Betrachter angewählt werden.",
  txt_info_todo3: "Ein Rechtsklick auf eine Datei oder ein Object in der Übersicht öffnet ein Kontextmenü.",
  txt_info_todo4: "Viele Optionen können in den Einstellungen verändert werden.",
  txt_info_todo5: "Diese App kann auch offline genutzt werden.",
  txt_info3: "<a id='txt_infoLink' href='https://www.cityjson.org/' target='_blank'>Hier</a> klicken um ein einfaches CityJSON Beispiel zu laden.",
  txt_context_goto: "Fokussieren",
  txt_context_edit: "Editieren",
  txt_context_duplicate: "Duplizieren",
  txt_context_download: "Download",
  txt_context_delete: "Löschen",
  txt_context_overview: "Übersicht",
  txt_context_metadata: "Metadaten",
  txt_context_statistics: "Statistiken",
  txt_context_settings: "Einstellungen",
  txt_context_quit: "Verlassen",
  txt_overview_caption: "Übersicht"
};

var licences = {
  "Three.js": ["https://threejs.org/",
              'The MIT License'+
              '<br><br>'+
              'Copyright © 2010-2020 three.js authors'+
              '<br><br>'+
              'Permission is hereby granted, free of charge, to any person obtaining a copy'+
              'of this software and associated documentation files (the "Software"), to deal'+
              'in the Software without restriction, including without limitation the rights'+
              'to use, copy, modify, merge, publish, distribute, sublicense, and/or sell'+
              'copies of the Software, and to permit persons to whom the Software is'+
              'furnished to do so, subject to the following conditions:'+
              '<br><br>'+
              'The above copyright notice and this permission notice shall be included in'+
              'all copies or substantial portions of the Software.'+
              '<br><br>'+
              'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR'+
              'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,'+
              'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE'+
              'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER'+
              'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,'+
              'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN'+
              'THE SOFTWARE.'],
  "Earcut": ["https://github.com/mapbox/earcut",
            'ISC License'+
            '<br><br>'+
            'Copyright (c) 2016, Mapbox'+
            '<br><br>'+
            'Permission to use, copy, modify, and/or distribute this software for any purpose'+
            'with or without fee is hereby granted, provided that the above copyright notice'+
            'and this permission notice appear in all copies.'+
            '<br><br>'+
            'THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH'+
            'REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND'+
            'FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,'+
            'INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS'+
            'OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER'+
            'TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF'+
            'THIS SOFTWARE.'],
  "JExcel": ["https://bossanova.uk/jexcel/v4/",
            'MIT License'+
            '<br><br>'+
            'Copyright (c) 2020 Paul Hodel'+
            '<br><br>'+
            'Permission is hereby granted, free of charge, to any person obtaining a copy'+
            'of this software and associated documentation files (the "Software"), to deal'+
            'in the Software without restriction, including without limitation the rights'+
            'to use, copy, modify, merge, publish, distribute, sublicense, and/or sell'+
            'copies of the Software, and to permit persons to whom the Software is'+
            'furnished to do so, subject to the following conditions:'+
            '<br><br>'+
            'The above copyright notice and this permission notice shall be included in all'+
            'copies or substantial portions of the Software.'+
            '<br><br>'+
            'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR'+
            'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,'+
            'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE'+
            'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER'+
            'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,'+
            'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE'+
            'SOFTWARE.'],
  "FontAwesome": ["https://fontawesome.com/", 'Font Awesome Free License' +
                  '<br>-------------------------' +
                  '<br><br>' +
                  'Font Awesome Free is free, open source, and GPL friendly. You can use it for' +
                  'commercial projects, open source projects, or really almost whatever you want.' +
                  'Full Font Awesome Free license: https://fontawesome.com/license/free.' +
                  '<br><br>' +
                  '# Icons: CC BY 4.0 License (https://creativecommons.org/licenses/by/4.0/)' +
                  'In the Font Awesome Free download, the CC BY 4.0 license applies to all icons' +
                  'packaged as SVG and JS file types.' +
                  '<br><br>' +
                  '# Fonts: SIL OFL 1.1 License (https://scripts.sil.org/OFL)' +
                  'In the Font Awesome Free download, the SIL OFL license applies to all icons' +
                  'packaged as web and desktop font files.' +
                  '<br><br>' +
                  '# Code: MIT License (https://opensource.org/licenses/MIT)' +
                  'In the Font Awesome Free download, the MIT license applies to all non-font and' +
                  'non-icon files.' +
                  '<br><br>' +
                  '# Attribution' +
                  'Attribution is required by MIT, SIL OFL, and CC BY licenses. Downloaded Font' +
                  'Awesome Free files already contain embedded comments with sufficient' +
                  'attribution, so you shouldn´t need to do anything additional when using these' +
                  'files normally.' +
                  '<br><br>' +
                  'We´ve kept attribution comments terse, so we ask that you do not actively work' +
                  'to remove them from files, especially code. They´re a great way for folks to' +
                  'learn about Font Awesome.' +
                  '<br><br>' +
                  '# Brand Icons' +
                  'All brand icons are trademarks of their respective owners. The use of these' +
                  'trademarks does not indicate endorsement of the trademark holder by Font' +
                  'Awesome, nor vice versa. **Please do not use brand logos for any purpose except' +
                  'to represent the company, product, or service to which they refer.**'],
  "flag-icon-css": ["https://github.com/lipis/flag-icon-css",
                  'The MIT License (MIT)' +
                  '<br><br>' +
                  'Copyright (c) 2013 Panayiotis Lipiridis' +
                  '<br><br>' +
                  'Permission is hereby granted, free of charge, to any person obtaining a copy of' +
                  'this software and associated documentation files (the "Software"), to deal in' +
                  'the Software without restriction, including without limitation the rights to' +
                  'use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies' +
                  'of the Software, and to permit persons to whom the Software is furnished to do' +
                  'so, subject to the following conditions:' +
                  '<br><br>' +
                  'The above copyright notice and this permission notice shall be included in all' +
                  'copies or substantial portions of the Software.' +
                  '<br><br>' +
                  'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR' +
                  'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,' +
                  'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE' +
                  'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER' +
                  'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,' +
                  'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE' +
                  'SOFTWARE.']
}
