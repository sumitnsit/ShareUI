var cssEditor = null;
var myPicker = null;

$(document).ready(function(){

	var compileCount = 0;
	var drag = {};

	$("#hresizer").mousedown(function(e){
		e.preventDefault();
		drag.vdragging = true;
		drag.hdragging = false;
	});

	$("#vresizer").mousedown(function(e){
		e.preventDefault();
		drag.vdragging = false;
		drag.hdragging = true;
	});

	$(document).mousemove(function(e){
		e.preventDefault();
		var diff = 0;
		if(drag.vdragging){
			diff = e.pageY - $(".ktoprow").offset().top;
			$(".ktoprow").css("height", diff + "px")

			diff = $(".kvertical").height() - $(".ktoprow").height() - 1;
			$(".kbottomrow").css("height", diff + "px")
		}

		if(drag.hdragging){
			diff = e.pageX;
			$(".kleftpan").css("width", diff + "px")

			diff = $(".kworkarea").width() - $(".kleftpan").width() - 4;
			$(".krightpan").css("width", diff + "px")
		}
	});

	$(document).mouseup(function(e){
		e.preventDefault();
		drag.vdragging = false;
		drag.hdragging = false;
	});


	diff = $(".kworkarea").width() - $(".kleftpan").width() - 4;
	$(".krightpan").css("width", diff + "px")

	// CodeMirror

	  cssEditor = CodeMirror(document.getElementById("ktoprow"), {
				    lineNumbers: true,
				    mode: "css",
				    theme: "neo",
				    lineWrapping: true,
				    smartIndent: true,
				    extraKeys: {"Ctrl-Space": "autocomplete"},
				  });

	cssEditor.on("change", compile);
	cssEditor.on("keydown", keyDownValueChange);
	cssEditor.on("cursorActivity", colorSelected);
	cssEditor.on("mousedown", hidePicker);

	 var htmlEditor = CodeMirror(document.getElementById("kbottomrow"), {
				    lineNumbers: true,
				    mode: "htmlmixed",
				    theme: "neo",
				    lineWrapping: true,
				    smartIndent: true,
				  });

	htmlEditor.on("change", compile);

	$("#load").on('click', loadFile);
	$("#share").on('click', sharePublic);
	$("#save").on('click', null, false, saveOnDropbox);


	var client = null;

	function init(){

	 	client = new Dropbox.Client({ key: 'm0ut1fiorueyzy8' });
		client.authenticate(function(error, data) {
		    if (error) {
		    	console.log("Authentication Error");
		    	console.log(error);
		    	return false;
		    }
		});
	}

	if(getParameterByName("share")){
		var url = getParameterByName("share");
		console.log(url);
		readFromDropbox(url);
	} else {
		readFromDropbox("/s/4xa5uasyoanbod0/Init");
	}

	function loadFile(){
		var options = {
			success: function(files) {
				var lnk = files[0].link.replace("https://www.dropbox.com", "");
				readFromDropbox(lnk);
				compileCount = 0;
				$("#status").html("");
    		}
		};
		Dropbox.choose(options);
	}

	function saveOnDropbox(func){

		$("#status").html("Saving <b>" + $("#UIName").val() + "</b>");

		if($("#UIName").val().trim() === ""){
			alert("Please give a name to your UI snippet");
			$("#UIName").focus();
			return;
		}

		init();

		if(client.isAuthenticated()){
			var data = {};
			data.name = $("#UIName").val();
			data.css = cssEditor.getValue();
			data.html = htmlEditor.getValue();
			console.log(JSON.stringify(data));
			var hello = client.writeFile(data.name, JSON.stringify(data), function (error) {
				if (error) {
					alert('Error: ' + error);
				} else {
					if(typeof func === "function"){
						func();
					}

					$("#status").html("Saved <b>" + $("#UIName").val() + "</b>");
				}
			});
		}
	}
	function sharePublic(){
		if($("#UIName").val().trim() === ""){
			alert("Please give a name");
			$("#UIName").focus();
			return;
		}
		console.log("Share Public");

		var func = function(){
			$("#status").html("<i>" + $("#UIName").val() + "</i> generating URL");
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
		  	cssEditor.setValue(file.css);
		  	htmlEditor.setValue(file.html);
		  },
		  dataType: "text"
		});
	}

	function getParameterByName(name) {
	    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	        results = regex.exec(location.search);

	    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}

	setTimeout(function(){
		// Hide the address bar!
		window.scrollTo(0, 1);
	}, 0);

	function compile () {
		compileCount++;

		if(compileCount > 2){
			$("#status").html("<i>" + $("#UIName").val() + "</i> updated");
		}

        var d = frames[0].document;
        d.open();
        d.write(
            '<!DOCTYPE HTML>'+
            '<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" /><style type="text/css">'+
            '*{margin: 0px; padding: 0px;}' +
            cssEditor.getValue() +
            '<\/style><\/head><body>' +
            htmlEditor.getValue() +
            '<\/body><\/html>'
        );
        d.close();
	}

		window.scrollTo(0,1);

	function makePublic(){
		if(client.isAuthenticated()){
			client.makeUrl($("#UIName").val(), {longUrl: true}, function(error, shareUrl){
				$("#shareUrl").val(shareUrl.url.replace("https://www.dropbox.com", location.origin + location.pathname + "?share="));
				$("#status").html("You may copy <b>URL</b>");

				// var func = function(data){
				// 	$("#shareUrl").val(data);
				// }

				// makeTinyUrl(shareUrl.url.replace("https://www.dropbox.com", location.origin + location.pathname + "?share="), func);

			});
		}
	}

	// function makeTinyUrl(url, func)
	// 	{
	// 		func(url);
	// 	    $.getJSON('https://json-tinyurl.appspot.com/?url=' + url + '&callback=?', func);
	// 	}

	function keyDownValueChange(){
		var selectedText = cssEditor.getSelection();
		if(selectedText && (event.keyCode === 38 || event.keyCode === 40)){
			if(/^-?\d+$/.test(selectedText)){
				if(event.keyCode === 40){
					cssEditor.replaceSelection("" + (parseInt(selectedText)-1), "around");
				} else if(event.keyCode === 38){
					cssEditor.replaceSelection("" +  (parseInt(selectedText)+1), "around");
				}
				event.preventDefault();
			} else if (/^-?\d+px$/i.test(selectedText)){
				var val = selectedText.substring(0, selectedText.length-2);
				if(event.keyCode === 40){
					cssEditor.replaceSelection("" + (parseInt(val)-1) + "px", "around");
				} else if(event.keyCode === 38){
					cssEditor.replaceSelection("" +  (parseInt(val)+1) + "px", "around");
				}
				event.preventDefault();
			} else if(/^-?\d+\.?\d+EM$/i.test(selectedText)){
				var val = selectedText.substring(0, selectedText.length-2);
				val = parseFloat(val);
				if(event.keyCode === 40){
					cssEditor.replaceSelection("" + (val-0.05).toFixed(2) + "em", "around");
				} else if(event.keyCode === 38){
					cssEditor.replaceSelection("" +  (val+0.05).toFixed(2) + "em", "around");
				}
				event.preventDefault();
			}
		}
	}



});

	function colorSelected(){
		var myPicker = $("#colorPicker").get(0).color;
		var selectedColor = cssEditor.getSelection();
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

function colorChanged(color){
	var selected = cssEditor.getSelection();
	if(checkHex(selected)){
		cssEditor.replaceSelection(color.toString(), "around");
	}
}

// $(document).ready(function(){
// 	// var jsEditor = CodeMirror.fromTextArea($("#js_editor").get(0), {mode: "javascript", lineNumbers: true});
// 	cssEditor = CodeMirror.fromTextArea($("#css_editor").get(0), {mode: "css", lineNumbers: true, theme: "neo"});
// 	var htmlEditor = CodeMirror.fromTextArea($("#html_editor").get(0), {mode: "htmlmixed", lineNumbers: true, theme: "neo"});
















//
// 	cssEditor.on("change", compile);
//
//
// 	htmlEditor.on("change", compile);

















// });
