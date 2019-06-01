const path = require('path');
var ffmpeg = require('ffmpeg-static');

function appendTxt(className, txt){
	$(document).ready(function () {
		$("." + className).append(txt);
	});
}

function runCmd(command) {
	var exec = require('child_process').exec, child;
	child = exec(command,
	function (error, stdout, stderr) {
		console.log('stdout: ' + stdout);
		appendTxt("main", '<br><p class="test">Stdout:<br>' + stdout + '</p>');	
		console.log('stderr: ' + stderr);
		appendTxt("main", '<br><p class="test">Stderr:<br>' + stderr + '</p>');	
		if (error !== null) {
		console.log('exec error: ' + error);
		}
	});
}

//Clears the html within an element
function clearHtml(elemId) {
        $("." + elemId).html("");
}

filePaths = [];
//Processes input files from button
function fileUp(){
        filePaths = [];
        //clear screen when new files are presented
        clearHtml("main");
        //clearHtml("ffOut");
        var x = document.getElementById("upFile");
        var txt = "";
        if ('files' in x) {
        if (x.files.length == 0) {
                txt = "Select one or more files.";
        } else {
                for (var i = 0; i < x.files.length; i++) {
                        txt += "<br><strong>" + (i+1) + ".</strong><br>";
                        var file = x.files[i];
                        if ('name' in file) {
				filePaths.push(file.path);
                                txt += "Path: " + file.path + "<br>";
                        }
                        if ('size' in file) {
                                txt += "size: " + file.size + " bytes <br>";
                        }
                }
        }
        }
        else {
                if (x.value == "") {
                        txt += "Select one or more files.";
                } else {
                        txt += "The files property is not supported by your browser!";
                        // If the browser does not support the files property, it will return the path of the selected file instead.
                        txt  += "<br>The path of the selected file: " + x.value;                }
        }
	appendTxt("clipForm", txt);
	for (i = 0; i < filePaths.length; i++){
		tempPath = filePaths[i];
                runCmd('./app/bash/streaminfo.sh ' + '"' + tempPath + '"');
        }
}

appendTxt("main", "ffmpeg static path: " + ffmpeg.path);

