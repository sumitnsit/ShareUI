var app = {};

// this is to monitor if code has been Modified
app.compileCount = 0;

// returns query parameter value
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// generates share url
function makePublic(name, shareType){
  name = name || $("#UIName").val();

    app.dropboxclient.authenticate(function(error, data) {
        if (error) {
          console.log("Authentication Error");
          console.log(error);
          return false;
        }
    });

  if(app.dropboxclient.isAuthenticated()){
    app.dropboxclient.makeUrl(name, {longUrl: true}, function(error, shareUrl){
      var url = (shareType)?"UI.html?UI=":"?share=";
      $("#shareLink").val(shareUrl.url.replace("https://www.dropbox.com", location.origin + location.pathname + url));
      app.customLogS("You may share following link with others:")
      app.customLogS($("#shareLink").val());
    });
  }
}

function colorChanged(color){
	var selected = app.cssCodeMirror.getSelection();
	if(checkHex(selected)){
		app.cssCodeMirror.replaceSelection(color.toString(), "around");
	}
}

function colorSelected(){
  var myPicker = $("#colorPicker").get(0).color;
  var selectedColor = app.cssCodeMirror.getSelection();
  if(checkHex(selectedColor)){
    $("#colorPicker").css("left", event.pageX);
    $("#colorPicker").css("top", event.pageY);
    myPicker.fromString(selectedColor);
      myPicker.showPicker();
  }
}

function hidePicker(){
  var myPicker = $("#colorPicker").get(0).color;
  myPicker.hidePicker();
}

function checkHex(color) {
    return /(^[0-9A-F]{6}$)|(^[0-9A-F]{3}$)/i.test(color);
}

function keyDownValueChange(){
  var selectedText = app.cssCodeMirror.getSelection();
  if(selectedText && (event.keyCode === 38 || event.keyCode === 40)){
    if(/^-?\d+$/.test(selectedText)){
      if(event.keyCode === 40){
        app.cssCodeMirror.replaceSelection("" + (parseInt(selectedText)-1), "around");
      } else if(event.keyCode === 38){
        app.cssCodeMirror.replaceSelection("" +  (parseInt(selectedText)+1), "around");
      }
      event.preventDefault();
    } else if (/^-?\d+px$/i.test(selectedText)){
      var val = selectedText.substring(0, selectedText.length-2);
      if(event.keyCode === 40){
        app.cssCodeMirror.replaceSelection("" + (parseInt(val)-1) + "px", "around");
      } else if(event.keyCode === 38){
        app.cssCodeMirror.replaceSelection("" +  (parseInt(val)+1) + "px", "around");
      }
      event.preventDefault();
    } else if(/^-?\d+\.?\d+EM$/i.test(selectedText)){
      var val = selectedText.substring(0, selectedText.length-2);
      val = parseFloat(val);
      if(event.keyCode === 40){
        app.cssCodeMirror.replaceSelection("" + (val-0.05).toFixed(2) + "em", "around");
      } else if(event.keyCode === 38){
        app.cssCodeMirror.replaceSelection("" +  (val+0.05).toFixed(2) + "em", "around");
      }
      event.preventDefault();
    }
  }
}

function shareUI(){


  if($("#UIName").val().trim() === ""){
    app.customLogE("Please provide a UI name to share");
    alert("Please provide a UI name to share");
    $("#UIName").focus();
    return;
  }

  var func = function(data){
    app.customLog("Saving UI on dropbox...");

      app.dropboxclient.authenticate(function(error, data) {
          if (error) {
            console.log("Authentication Error");
            console.log(error);
            return false;
          }
      });

    var response = app.dropboxclient.writeFile("public_ui/" + $("#UIName").val() + ".html", data, function (error) {
      if (error) {
        app.customLogE('Error: ' + error);
      } else {
        makePublic($("#UIName").val() + ".html", "UI");
      }
    });
  }

  compile(func);
}


function sharePublic(){
  if($("#UIName").val().trim() === ""){
    app.customLogE("Please provide a UI name to share");
    alert("Please provide a UI name to share");
    $("#UIName").focus();
    return;
  }



  var func = function(){
    app.customLog("Getting shared public URL...");
    makePublic();
  }

  saveOnDropbox(func);
}


function readFromDropbox(id){
  $.ajax({
    url: "https://dl.dropboxusercontent.com" + id,
    data: {},
    success: function(data){
      var file = JSON.parse(data);
     $("#UIName").val(file.name);
      app.cssCodeMirror.setValue(file.css);
      app.htmlCodeMirror.setValue(file.html);
    },
    dataType: "text"
  });
}

function readUIFromDropbox(id){
  $.ajax({
    url: "https://dl.dropboxusercontent.com" + id,
    data: {},
    success: function(data){
     document.write(data);
     document.close();

    },
    dataType: "text"
  });
}

function loadFile(){
  var options = {
    success: function(files) {
      var lnk = files[0].link.replace("https://www.dropbox.com", "");
      readFromDropbox(lnk);
      app.compileCount = 0;
      }
  };
  Dropbox.choose(options);
}

function saveOnDropbox(func){

		// $("#status").html("Saving <b>" + $("#UIName").val() + "</b>");


		if($("#UIName").val().trim() === ""){
			alert("Please give a name to your UI snippet");
			$("#UIName").focus();
			return;
		}

		// init();

		if(app.dropboxclient.isAuthenticated()){
			var data = {};

			data.name = $("#UIName").val();
			data.css = app.cssCodeMirror.getValue();
			data.html = app.htmlCodeMirror.getValue();

      app.customLog('Saving UI "' + data.name + '"...');

			var response = app.dropboxclient.writeFile(data.name, JSON.stringify(data), function (error) {
				if (error) {
					app.customLogE('Error: ' + error);
				} else {
					if(typeof func === "function"){
						func();
					}

					app.customLogS('"' + data.name + '" UI saved');
          $("#save").css("background-color", "#86B526");
          $("#save").text("Saved");
				}
			});
		}
	}

function compile (func) {
  if(!$$.get('liveCk').checked) return;
   app.compileCount++;

   if(app.compileCount > 2){
    $("#save").css("background-color", "#9C27B0");
    $("#save").text("Modified");
   }

      var d = frames[0].document;
      d.customLog = function(text){
        app.customLog(text);
      };
      d.customLogE = function(text){
        app.customLogE(text);
      };
      d.open();
      var HTML =
          '<!DOCTYPE HTML>'+
          '<html><head><meta name="viewport" content = "width = device-width, initial-scale = 1.0, minimum-scale = 1, maximum-scale = 1, user-scalable = no" /><meta name="apple-mobile-web-app-title" content="ShareUI" /><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black" /><style type="text/css">'+
          '*{margin: 0px; padding: 0px;}' +
          app.cssCodeMirror.getValue() +
          '<\/style><script>console.log = document.customLog; console.error = document.customLogE; </script><\/head><body>' +
          app.htmlCodeMirror.getValue() +
          '<\/body><\/html>';
      d.write(HTML);
      d.close();

      if(typeof func === "function"){
        func(HTML);
      }
}

app.settings = {};
app.CONSTANTS = {
  navBar: {
    height: 50
  }
};


app.customLog  = function(text){
  app.log.innerHTML = log.innerHTML + "<br/>> " + text;
  app.log.scrollTop = app.log.scrollHeight;
}

app.customLogS  = function(text){
  app.log.innerHTML = log.innerHTML + "<br/>> <span style='color: yellowgreen;'>" + text + "</span>";
  app.log.scrollTop = app.log.scrollHeight;
}

app.customLogE  = function(text){
  app.log.innerHTML = log.innerHTML + "<br/>> <span style='color: #FF3F3F;'>" + text + "</span>";
  app.log.scrollTop = app.log.scrollHeight;
}

app.handleLogRzMouseDown = function(event){
  window.onmousemove = app.handleLogRzMouseMove;
  var console = $$.get("log");
  console.style.transition = "none";
  $(".mask").css("z-index", 10);
};

app.handleConsole = function(e){
    var logWin = $$.get("log");
$(logWin).slideToggle(300);
    if(!e.checked){

      // app.settings.consoleHeight = logWin.style.height;
      // $$.get("logRz").style.display = "none";
      // logWin.style.height = "0px";
    } else {
      // $$.get("logRz").style.display = "block";
        // logWin.style.height = app.settings.consoleHeight;
    }
};

app.handleAsideDividerMouseDown = function(event){
    window.onmousemove = app.handleAsideDividerMouseMove;
}

app.handleAsideDividerMouseMove = function(event){
    if(event.which != 1) return;
    if(event.pageY < 50) return;

    if((app.aside.divHeight - event.pageY - 4) < 0) return;

    app.cssEditor.style.height = (event.pageY - app.CONSTANTS.navBar.height) + "px";

      app.htmlEditor.style.height = (app.aside.divHeight - event.pageY - 4) + "px";
}




app.handleAsideRzMouseDown = function (event){
  window.onmousemove = app.handleAsideRzMouseMove;
  $(".mask").css("z-index", 10);
}

app.handleAsideRzMouseMove = function (event) {
    if(event.which != 1) return;
    app.aside .setAttribute("style","width:" + event.pageX + "px");
  };

  app.handleLogRzMouseMove = function (event) {
   if(event.which != 1) return;
   if(event.pageY < 50)return;

   app.log.style.height = (window.innerHeight - event.pageY) + "px";
 }

app.handleMouseUp = function (event) {
  window.onmousemove = null;
  $(".mask").css("z-index", 0);
}

var $$ = {};
$$.get = function(id){
  return document.getElementById(id);
};

$(document).ready(function(){

  app.aside = $$.get('aside');
  app.cssEditor = $$.get('cssEditor');
  app.htmlEditor = $$.get('htmlEditor');
  app.asideDivider = $$.get('asideDivider');
  app.asideRz = $$.get('asideRz');
  app.log = $$.get('log');
  app.logRz = $$.get('logRz');
  app.aside.divHeight = app.aside.clientHeight;

  // app.cssEditor.divHeight = app.cssEditor.clientHeight;
  // app.htmlEditor.divHeight = app.aside.divHeight - app.cssEditor.divHeight  - app.CONSTANTS.divider.height;

  // app.cssEditor.style.height = app.cssEditor.divHeight + "px";
  // app.asideDivider.style.height = app.CONSTANTS.divider.height + "px";
  // htmlEditor.style.height = app.htmlEditor.divHeight + "px";

  app.cssCodeMirror = CodeMirror(app.cssEditor, {
    mode: "css",
    lineNumbers: true,
  	theme: "neo",
    lineWrapping: true,
    smartIndent: true,
    extraKeys: {"Ctrl-Space": "autocomplete"},
  });

  app.cssCodeMirror.on("keydown", keyDownValueChange);
  app.cssCodeMirror.on("cursorActivity", colorSelected);
  app.cssCodeMirror.on("mousedown", hidePicker);

  app.htmlCodeMirror = CodeMirror(app.htmlEditor, {
    mode: "htmlmixed",
    lineNumbers: true,
    theme: "neo",
    lineWrapping: true,
		smartIndent: true,
  });



  console.log("Registering events...");
  app.asideDivider.onmousedown = app.handleAsideDividerMouseDown;
  app.asideRz.onmousedown = app.handleAsideRzMouseDown;
  app.logRz.onmousedown = app.handleLogRzMouseDown;
  app.cssCodeMirror.on("change", compile);
  app.htmlCodeMirror.on("change", compile);

  $("#load").on('click', loadFile);
  $("#save").on('click', null, false, saveOnDropbox);
  $("#shareCode").on('click', sharePublic);
  $("#shareUI").on('click', shareUI);

  app.orLog = console.log;
  app.orLogE = console.error;

  app.liveCk = $$.get('liveCk');
  app.liveCk.onchange = function(e){
    if(this.checked){
      compile();
    }
  };
  window.onmouseup = app.handleMouseUp;



  (function init(){
    app.dropboxclient = new Dropbox.Client({ key: 'm0ut1fiorueyzy8'});

    window.onbeforeunload = function() {
      return "Are you sure you want to navigate away?";
    }

    // app.dropboxclient.authenticate(function(error, data) {
    //     if (error) {
    //       console.log("Authentication Error");
    //       console.log(error);
    //       return false;
    //     }
    // });
  })();

  if(getParameterByName("share")){
    var url = getParameterByName("share");
    console.log(url);
    readFromDropbox(url);
  } else if(getParameterByName("UI")) {
    var url = getParameterByName("UI");
    console.log(url);
    readUIFromDropbox(url);
  } else {
    readFromDropbox("/s/4xa5uasyoanbod0/Init");
  }

});

//
//
// var ck = document.getElementById("logCk");
// ck.onchange = function(event){
//   if(this.checked)
//  document.getElementById("dd").innerHTML = "Show Logs";
//   else
//     document.getElementById("dd").innerHTML = "Hide Logs";
// }
//

// var data = {};
// (function() {
//
//
//   document.getElementById("iframe").onmousemove = function(event){
//   console.log(event.pageY);
//   }
//

      // document.getElementById("vDivider").onmousedown = handleVMouseDown;



//   function handleLMouseDown(event){
//     data.mouseDown = true;
//     window.onmousemove = handleLMouseMove;
//   }
//
//   function handleVMouseDown(event){
//     data.mouseDown = true;
//     window.onmousemove = handleYMouseMove;
//   }
//

//

//
//   function handleYMouseMove(event) {
//     if(!data.mouseDown) return;
//     if((event.pageY-50)<0)return;
//     var a = document.getElementById("cssEditor");
//     var htmlEditor = document.getElementById('htmlEditor');
//     a.style.height = (event.pageY-50) + "px";
//     htmlEditor.style.height = (915 - event.pageY+46) + "px";
//
//   }
//   })();
