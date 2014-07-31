var cssEditor = null;

$(document).ready(function(){
	// var jsEditor = CodeMirror.fromTextArea($("#js_editor").get(0), {mode: "javascript", lineNumbers: true});
	cssEditor = CodeMirror.fromTextArea($("#css_editor").get(0), {mode: "css", lineNumbers: true, theme: "neo"});
	var htmlEditor = CodeMirror.fromTextArea($("#html_editor").get(0), {mode: "htmlmixed", lineNumbers: true, theme: "neo"});

	
function makeTinyUrl(url, func)
{
	func(url);
    // $.getJSON('https://json-tinyurl.appspot.com/?url=' + url + '&callback=?', func);
}



	function compile () {
        var d= frames[0].document;
        d.open();
        d.write(
            '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional //EN" "http://www.w3.org/TR/html4/loose.dtd">'+
            '<html><head><style type="text/css">'+
            '*{margin: 0px; padding: 0px;}' +
            cssEditor.getValue() +
            '<\/style><\/head><body>' + 
            htmlEditor.getValue() +
            '<\/body><\/html>'
        );
        d.close();

        // d.body.innerHTML= '<em>Hello</em>';
	}


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

	cssEditor.on("keydown", keyDownValueChange);
	cssEditor.on("change", compile);
	cssEditor.on("mousedown", hidePicker);
	cssEditor.on("dblclick", colorSelected);
	htmlEditor.on("change", compile);

	var client = new Dropbox.Client({ key: 'm0ut1fiorueyzy8' });

	client.authenticate(function(error, data) {
	    if (error) {
	    	console.log("Authentication Error");
	    	console.log(error);
	    }
	});


	function saveOnDropbox(func){

		if($("#UIName").val().trim() === ""){
			alert("Please give a name to your UI snippet");
			$("#UIName").focus();
			return;
		}

		client.authenticate(function(error, data) {
		    if (error) {
		    	consle.log("Authentication Error");
		    	console.log(error);
		    }
		});

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
					if(func){

						func();
					}
				}
			});		 
		}
	}

	function getParameterByName(name) {
	    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	        results = regex.exec(location.search);

	    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}

	function makePublic(){
		if(client.isAuthenticated()){
			client.makeUrl($("#UIName").val(), {longUrl: true}, function(error, shareUrl){
				var func = function(data){
					$("#shareUrl").val(data);
				}

				makeTinyUrl(shareUrl.url.replace("https://www.dropbox.com", location.origin + location.pathname + "?share="), func);
				
			});
		}
	}

	if(getParameterByName("share")){
		var url = getParameterByName("share");
		console.log(url);
		readFromDropbox(url);
	} else {
		readFromDropbox("/s/4xa5uasyoanbod0/Init");
	}

	function readFromDropbox(id){
		$.ajax({
		  url: "https://dl.dropboxusercontent.com/" + id,
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

	function sharePublic(){

		if($("#UIName").val().trim() === ""){
			alert("Please give a name");
			$("#UIName").focus();
			return;
		}
		console.log("Share Public");

		var func = function(){
			console.log("Making Public");
			makePublic();
		}

		saveOnDropbox(func);
	}

	function loadFile(){
		var options = {
			success: function(files) {
				var lnk = files[0].link.replace("https://www.dropbox.com", "");
				readFromDropbox(lnk);
    		}
		};
		Dropbox.choose(options);
	}

	$("#load").on('click', loadFile);
	$("#share").on('click', sharePublic);
	$("#save").on('click', null, false, saveOnDropbox);
});


function checkHex(color) {
    return /(^[0-9A-F]{6}$)|(^[0-9A-F]{3}$)/i.test(color);
}

function colorChanged(color){
	var selected = cssEditor.getSelection();
	if(checkHex(selected)){
		cssEditor.replaceSelection(color.toString(), "around");
	}
}