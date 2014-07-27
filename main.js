$(document).ready(function(){
	// var jsEditor = CodeMirror.fromTextArea($("#js_editor").get(0), {mode: "javascript", lineNumbers: true});
	var cssEditor = CodeMirror.fromTextArea($("#css_editor").get(0), {mode: "css", lineNumbers: true})
	var htmlEditor = CodeMirror.fromTextArea($("#html_editor").get(0), {mode: "htmlmixed", lineNumbers: true})

	

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


	cssEditor.on("change", compile);
	htmlEditor.on("change", compile);

	var client = new Dropbox.Client({ key: 'm0ut1fiorueyzy8' });

	client.authenticate(function(error, data) {
	    if (error) { return showError(error); }

	});

	function saveOnDropbox(func){
		if($("#UIName").val().trim() === ""){
			alert("Please give a name");
			$("#UIName").focus();
			return;
		}

		if(client.isAuthenticated()){
			var hello = client.writeFile($("#UIName").val(), $("#UIName").val() + "\n\n\n######\n\n\n" + cssEditor.getValue() + "\n\n\n######\n\n\n" + htmlEditor.getValue(), function (error) {
				if (error) {
					alert('Error: ' + error);
				} else {
					func && func();
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
				$("#shareUrl").val(shareUrl.url.replace("https://www.dropbox.com", "http://localhost:8000?share="));
			});
		}
	}

	if(getParameterByName("share")){
		var url = getParameterByName("share");
		console.log(url);
		readFromDropbox(url);
	}

	function readFromDropbox(id){
		$.ajax({
		  url: "https://dl.dropboxusercontent.com/" + id,
		  data: {},
		  success: function(data){
		  	console.log(data);
		  	var split = data.split("\n\n\n######\n\n\n");
		  	$("#UIName").val(split[0]);
		  	cssEditor.setValue(split[1]);
		  	htmlEditor.setValue(split[2]);
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
				console.log(files[0].link);
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