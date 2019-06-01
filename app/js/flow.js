const path = require('path');
const fs = require('fs');
var ffmpeg = require('ffmpeg-static');
var ffpath = ffmpeg.path;
var filePaths = [];
var films = [];

class Stream {
	constructor(streams, meta){
		this.streams = streams;
		this.meta = meta;
	}
}

class Film {
        constructor(filepath, video, audio, subtitle, extSubs) {
                this.filepath = filepath;
                this.video = video;
                this.audio = audio;
                this.subtitle = subtitle;
		this.extSubs = extSubs;
        }
}

function appendTxt(className, txt){
	$(document).ready(function () {
		$("." + className).append(txt);
	});
}

//Clears the html within an element
function clearHtml(elemId) {
        $("." + elemId).html("");
}

function streamProcess(results, filepath) {
	//appendTxt("main", results);
	var streams = [];
	var vStreams = [];
	var aStreams = [];
	var sStreams = [];
	var extSubs = [];
	var streamReg = /.*Stream #.*/;
	var vReg = /.*Video:.*/;
	var aReg = /.*Audio:.*/;
	var sReg = /.*Subtitle:.*/;
	var lines = results.split("\n");
	for (var i = 0; i < lines.length; i++){
		//appendTxt("main", lines[i] + "<br>");
		if (streamReg.test(lines[i])){
			streams.push(lines[i]);
		}
	}
	for (var i = 0; i < streams.length; i++){
		//appendTxt("main", streams[i] + "<br>");
		if (vReg.test(streams[i])){
			vStreams.push(streams[i]);
		} else if (aReg.test(streams[i])){
			aStreams.push(streams[i]);
		} else if (sReg.test(streams[i])){
			sStreams.push(streams[i]);
		} else {;}
	}
	var dirpath = path.dirname(filepath);
	var files = fs.readdirSync(dirpath);
	for (i = 0; i < files.length; i++){
                var ext = files[i].split('.').pop();
                if (ext === "srt" || ext === "ass"){
                        var extSub = dirpath + "/" + files[i];
                        extSubs.push(extSub);
                }
        }
	console.log("Video Streams: " + vStreams);
	console.log("Audio Streams: " + aStreams);
	console.log("Subtitle Streams: " + sStreams);
	console.log("External Subtitles: " + extSubs);
	var newFilm = new Film(filepath, vStreams, aStreams, sStreams, extSubs)
	films.push(newFilm);
}

function ffprobe(filepath) {
	var command = ffpath + ' -hide_banner -i "' + filepath + '"';
	var exec = require('child_process').exec, child;
	child = exec(command,
	function (error, stdout, stderr) {
		if (error !== null) {
			console.log('exec error: ' + error);
		}
		console.log('stdout: ' + stdout);
		console.log('stderr: ' + stderr);
		streamProcess(stderr, filepath);
	});
}

//Processes input files from button
function fileUp() {
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
	for (var i = 0; i < filePaths.length; i++){
		var tempPath = filePaths[i];
		ffprobe(tempPath);
        }
}

appendTxt("main", "ffmpeg static path: " + ffmpeg.path);


