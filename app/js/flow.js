const path = require('path');
const fs = require('fs');
var ffmpeg = require('ffmpeg-static');
var ffpath = ffmpeg.path;
var filePaths = [];
var films = [];
var clips = [];
var filmCount = 0;
var clipCount = 0;

class Stream {
	constructor(streams, meta){
		this.streams = streams;
		this.meta = meta;
	}
}

class Film {
        constructor(id, filepath, video, audio, subtitle, extSubs) {
                this.id = id;
		this.filepath = filepath;
                this.video = video;
                this.audio = audio;
                this.subtitle = subtitle;
		this.extSubs = extSubs;
        }
}

class Clip {
	constructor(id, command) {
		this.id = id;
		this.command= command;
	}
}

function appendTxt(name, txt){
	$(document).ready(function () {
		$(name).append(txt);
	});
}
function radioCheck(name, val){
	$(document).ready(function () {
		$(name).prop("checked", true);
	});
}

//Clears the html within an element
function clearHtml(elemId) {
        $(elemId).html("");
}

//Removes html within an element
function removeClip(clipId, elemId) {
	var clipIndex = -1;
	for (var i = 0; i < clips.length; i++){
		var tempClip = clips[i];
		if (tempClip.id == clipId){
			clipIndex = i;
			break;
		}
	}
        $("div").remove(elemId);
	clips.splice(clipIndex, 1);
}

function runCommand(clipId){
	var command = "";
	for (var i = 0; i < clips.length; i++){
		var tempClip = clips[i];
		if (tempClip.id == clipId){
			command = tempClip.command;
			break;
		}
	}
	console.log(command);
	appendTxt('#queueCol-1-' + clipId, '<b id="creation-' + clipId + '">Clip Creation has started. Be Patient.</b>');
	//$('#queueCol-1-' + clipId).append("ayy lmao");
	var exec = require('child_process').exec, child;
	child = exec(command,
	function (error, stdout, stderr) {
		child.stderr.pipe(process.stderr);
		if (error !== null) {
			console.log('exec error: ' + error);
		}
		console.log('stdout: ' + stdout);
		console.log('stderr: ' + stderr);
		console.log("command done");
		clearHtml('#creation-' + clipId);
		appendTxt('#creation-' + clipId, '<b>Clip Done</b>');
	});
	//I guess I can try putting the finish message here
}

function ffCommand(filmId, vChoice, aChoice, sChoice, start, dur, crf, extension, clipName) {
	var workingFilm;
	for (var i = 0; i < films.length; i++){
		if (films[i].id == filmId){
			workingFilm = films[i];
		}
	}
	console.log("vChoice: " + vChoice + " aChoice: " + aChoice + " sChoice: " + sChoice);
	var clipPath = path.dirname(workingFilm.filepath) + '/' + clipName + '.' + extension;
	var outPath = '"' + clipPath + '"';
	var command = ffpath + ' -y -hide_banner';
	var ffStart = '-ss ' + start;
	var ffIn = '-i "' + workingFilm.filepath + '"';
	var ffDur = '-t ' + dur;
	var ffCrf = '-crf ' + crf;
	var ffOut = '"' + clipPath + '"';
	var ffVmap = '-map 0:v:' + vChoice;
	var ffAmap = '-map 0:a:' + aChoice;
	var ffCv = '-c:v libx264';
	var ffCa = '-c:a aac';
	var ffCompMap = '-map "[v]"';
	var subtitleCmd = '';
	var fastSubReg = /.*(pgs|PGS|dvd_subtitle).*/;
	var fastSub = 0;
	//var ffCrop
	//var ffScale
	//var ffCropScale
	
	//Check for subtitles
	if (sChoice >= 0){
		if (sChoice >= workingFilm.subtitle.length){
			var extSubInd = sChoice - workingFilm.subtitle.length;	
			var extSubPath = workingFilm.extSubs[extSubInd];
			subtitleCmd += '-vf "subtitles=' + extSubPath + '"';	
		} else {
			if (fastSubReg.test(workingFilm.subtitle[sChoice])){
				subtitleCmd += '-filter_complex "[0:v:' + vChoice + 
				'][0:s:' + sChoice + ']overlay[v]" ' + ffCompMap;	
				fastSub = 1;
			} else{
				subtitleCmd += '-vf "subtitles=' + workingFilm.filepath + ':si=' + sChoice + '"';	
			}
		}
	}

	if (sChoice >= 0){
		if (fastSub == 1){
			if (aChoice == -1){
				command += ' ' + ffStart + ' ' + ffIn + ' ' + ffDur + ' ' + subtitleCmd + 
				' ' + ffCv + ' -an ' + ffCrf + ' ' + outPath;	
			} else{
				command += ' ' + ffStart + ' ' + ffIn + ' ' + ffDur + ' ' + subtitleCmd + 
				' ' + ffAmap + ' ' + ffCv + ' ' + ffCa + ' ' + ffCrf + ' ' + outPath;	
			}
		} else{
			if (aChoice == -1){
				command += ' ' + ffIn + ' ' + ffStart + ' ' + ffDur + ' ' + ffVmap + ' ' + subtitleCmd + 
				' ' + ffCv + ' -an ' + ffCrf + ' ' + outPath;
			} else{
				command += ' ' + ffIn + ' ' + ffStart + ' ' + ffDur + ' ' + ffVmap + ' ' + subtitleCmd + 
				' ' + ffAmap + ' ' + ffCv + ' ' + ffCa + ' ' + ffCrf + ' ' + outPath;
			}
		}
	} else {
		if (aChoice == -1){
			command += ' ' + ffStart + ' ' + ffIn + ' ' + ffDur + ' ' + ffVmap + ' ' + 
			ffCv + ' -an ' + ffCrf + ' ' + outPath; 
		} else{
			command += ' ' + ffStart + ' ' + ffIn + ' ' + ffDur + ' ' + ffVmap + ' ' + 
			ffAmap + ' ' + ffCv + ' ' + ffCa + ' ' + ffCrf + ' ' + outPath; 
		}
	} 
	return command;
}

function clipQueue(start, dur, crf, extension, clipName, clipCount, command){
	//console.log("clipQueue entered");

	appendTxt('.clipQueue', '<div class="queueBox" id="clip-' + clipCount + '"></div>');

	appendTxt('#clip-' + clipCount, '<div class="queueRow" id="queueRow-' + clipCount + '">');	
	appendTxt('#queueRow-' + clipCount, '<div class="queueCol" id="queueCol-0-' + clipCount + '">');
	appendTxt('#queueCol-0-' + clipCount, '<b>Clip Name: ' + clipName + '.' + extension + '</b><br>');
	appendTxt('#queueCol-0-' + clipCount, '<b>Start: ' + start + '</b><br>');
	appendTxt('#queueCol-0-' + clipCount, '<b>Duration: ' + dur + '</b><br>');
	appendTxt('#queueCol-0-' + clipCount, '<b>Quality Level: ' + crf + '</b><br>');
	//appendTxt('#queueCol-0-' + clipCount, '<b>FFmpeg Command: ' + command + '</b><br>');
	appendTxt('#queueRow-' + clipCount, '<div class="queueCol" id="queueCol-1-' + clipCount + '">');

	appendTxt('#clip-' + clipCount, '<div class="queueButtons" id="queueButtons-' + clipCount + '"></div>');
	appendTxt('#queueButtons-' + clipCount, '<button class="queueButton" type="button" ' + 
	'onclick="runCommand(' + clipCount + ')">Start Cutting Clip</button>');

	appendTxt("#queueButtons-" + clipCount, "<br><br>");

	appendTxt('#queueButtons-' + clipCount, '<button class="queueButton" type="button" ' +
	'onclick="removeClip(' + clipCount + ', \'#clip-' + clipCount + '\')">Remove from Queue</button>');

}

//elem: some object
//if object is null, return val
//return the object otherwise
function emptyCheck(elem, val) {
        if (elem){
                return elem
        }
        else {
                return val
        }
}

function formProcess(id, emptyName){
	console.log("Form ID: " + id);
	
	var vChoice = $("input[name=vStreams-" + id + "]:checked").val();
	var aChoice = $("input[name=aStreams-" + id + "]:checked").val();
	var sChoice = $("input[name=sStreams-" + id + "]:checked").val();
	var extension = $("input[name=ext-" + id + "]:checked").val();

	var start = emptyCheck($("#startBox-" + id).val(), "0");
	var dur = emptyCheck($("#durBox-" + id).val(), "1:00");
	var crf = emptyCheck($("#crfBox-" + id).val(), 18);
	var clipName = emptyCheck($("#nameBox-" + id).val(), emptyName); 
	
	var newCommand = ffCommand(id, vChoice, aChoice, sChoice, start, dur, crf, extension, clipName);
	clipQueue(start, dur, crf, extension, clipName, clipCount, newCommand);
	var tempClip = new Clip(clipCount, newCommand);
	//console.log("FFmpeg Command: " + newCommand);
	clips.push(tempClip);
	clipCount++;
}

function filmForm(film){
	var id = film.id;
	appendTxt(".clipForm", '<br><div id="inputDiv-' + id +'" class="inputDiv"></div>');
	appendTxt("#inputDiv-" + id, '<form method="post" id="form-' + id + '"></form>');
	appendTxt("#form-" + id, "<b>Filename: " + path.basename(film.filepath) + "</b><br><br>"); 

	//Video Choice
	if (film.video.length == 0){
		appendTxt("#form-" + id, "<b>No Video Streams</b><br>");
	} else{
		appendTxt("#form-" + id, "<b>Video Streams</b><br>");
		for (var i = 0; i < film.video.length; i++){
			appendTxt("#form-" + id, '<input type="radio" name="vStreams-' + id + '" ' + 
			'id="vStreams-' + i + '-' + id + '" value="' + i + '">' + film.video[i] + '<br>');
			if(i == 0){
				radioCheck("#vStreams-" + i + "-" + id, true);
			}
		}
	}
	appendTxt("#form-" + id, "<br>");

	//Audio Choice
	if (film.audio.length == 0){
		appendTxt("#form-" + id, "<b>No Audio Streams</b><br>");
		appendTxt("#form-" + id, '<input type="radio" name="aStreams-' + id + '" ' + 
		'id="aStreams-noaudio-"' + id + '" value="-1">No Audio<br>');
		radioCheck("#aStreams-noaudio-" + id, true);
	} else{
		appendTxt("#form-" + id, "<b>Audio Streams</b><br>");
		appendTxt("#form-" + id, '<input type="radio" name="aStreams-' + id + '" ' + 
		'id="aStreams-noaudio-' + id + '" value="-1"> No Audio<br>');
		for (var i = 0; i < film.audio.length; i++){
			appendTxt("#form-" + id, '<input type="radio" name="aStreams-' + id + '" ' + 
			'id="aStreams-' + i + '-' + id + '" value="' + i + '">' + film.audio[i] + '<br>');
			if(i == 0){
				radioCheck("#aStreams-" + i + "-" + id, true);
			}
		}
	}
	appendTxt("#form-" + id, "<br>");

	//Subtitle Choice
	if (film.subtitle.length + film.extSubs.length == 0){
		appendTxt("#form-" + id, "<b>No Subtitles Available</b><br>");
		appendTxt("#form-" + id, '<input type="radio" name="sStreams-' + id + '" ' + 
		'id="sStreams-nosub-"' + id + '" value="-1"> No Subtitles<br>');
		radioCheck("#sStreams-nosub-" + id, true);
	} else{
		appendTxt("#form-" + id, "<b>Subtitle Streams</b><br>");
		appendTxt("#form-" + id, '<input type="radio" name="sStreams-' + id + '" ' + 
		'id="sStreams-nosub-' + id + '" value="-1"> No Subtitles<br>');
		radioCheck("#sStreams-nosub-" + id, true);
		for (var i = 0; i < film.subtitle.length + film.extSubs.length; i++){
			if (i < film.subtitle.length){
				appendTxt("#form-" + id, '<input type="radio" name="sStreams-' + id + '" ' + 
				'id="sStreams-' + i + '-' + id + '" value="' + i + '">' + film.subtitle[i] + '<br>');
			} else{
				var extInd = i - film.subtitle.length;
				appendTxt("#form-" + id, '<input type="radio" name="sStreams-' + id + '" ' + 
				'id="sStreams-' + i + '-' + id + '" value="' + i + '"> ' + 
				path.basename(film.extSubs[extInd]) + '<br>');
			}
		}
	}
	appendTxt("#form-" + id, "<br>");

	//start time
	appendTxt("#form-" + id, '<div class="formRow" id="startRow-' + id + '"></div>');
	appendTxt("#startRow-" + id, '<div class="formColumn" id="startCol-' + id + '"></div>');
	appendTxt("#startCol-" + id, "<b>Clip Start</b>");
	appendTxt("#startRow-" + id, '<div class="formColumn" id="startColEntry-' + id + '"></div>');
	appendTxt("#startColEntry-" + id, '<input type="text" class="textBox" id="startBox-' + 
	id + '" placeholder="00:00:00.00">');
	
	appendTxt("#form-" + id, "<br>");
	
	//duration
	appendTxt("#form-" + id, '<div class="formRow" id="durRow-' + id + '"></div>');
	appendTxt("#durRow-" + id, '<div class="formColumn" id="durCol-' + id + '"></div>');
	appendTxt("#durCol-" + id, "<b>Clip Duration</b>");
	appendTxt("#durRow-" + id, '<div class="formColumn" id="durColEntry-' + id + '"></div>');
	appendTxt("#durColEntry-" + id, '<input type="text" class="textBox" id="durBox-' + id + '" placeholder="1:00">');
	appendTxt("#form-" + id, "<br>");
	

	//crf value
	appendTxt("#form-" + id, '<div class="formRow" id="crfRow-' + id + '"></div>');
	appendTxt("#crfRow-" + id, '<div class="formColumn" id="crfCol-' + id + '"></div>');
	appendTxt("#crfCol-" + id, "<b>Quality Level</b>");
	appendTxt("#crfRow-" + id, '<div class="formColumn" id="crfColEntry-' + id + '"></div>');
	appendTxt("#crfColEntry-" + id, '<input type="text" class="textBox" id="crfBox-' + id + '" placeholder="18-32">');
	appendTxt("#form-" + id, "<br>");
	

	//scale
	

	//crop
	

	//clip name
	appendTxt("#form-" + id, "<b>Enter Clip Name:</b>");
	appendTxt("#form-" + id, "<br>");
	var nameHolder = path.basename(film.filepath).replace(/\.[^/.]+$/, "") + "-cut";
	appendTxt("#form-" + id, '<input type="text" id="nameBox-' + id + '" placeholder="' + nameHolder + '" class="clipTextBox">');
	appendTxt("#form-" + id, "<br>");
	appendTxt("#form-" + id, "<br>");

	//extension choice
	appendTxt("#form-" + id, '<input type="radio" id="ext-' + id + '" name="ext-' + id + '" value="mp4"> .mp4');
	radioCheck("#ext-" + id, true);
	appendTxt("#form-" + id, "<br>");
	appendTxt("#form-" + id, '<input type="radio" name="ext-' + id + '" value="mov"> .mov');
	appendTxt("#form-" + id, "<br>");
	appendTxt("#form-" + id, '<input type="radio" name="ext-' + id + '" value="mkv"> .mkv');
	appendTxt("#form-" + id, "<br>");
	appendTxt("#form-" + id, "<br>");

	//submit button
	appendTxt("#form-" + id, '<button id="submit-' + id + '" type="button" class="button" ' + 
	'onclick="formProcess(' + id + ', \'' + nameHolder + '\')">Add Clip to Queue</button>');
}

function streamProcess(results, filepath) {
	//appendTxt(".main", results);
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
		//appendTxt(".main", lines[i] + "<br>");
		if (streamReg.test(lines[i])){
			streams.push(lines[i]);
		}
	}
	for (var i = 0; i < streams.length; i++){
		//appendTxt(".main", streams[i] + "<br>");
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
	var newFilm = new Film(filmCount, filepath, vStreams, aStreams, sStreams, extSubs)
	films.push(newFilm);
	filmCount++;
	filmForm(newFilm);
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
	films = [];
        filePaths = [];
        //clear screen when new files are presented
        clearHtml(".clipForm");
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
	//appendTxt(".clipForm", txt);
	for (var i = 0; i < filePaths.length; i++){
		var tempPath = filePaths[i];
		ffprobe(tempPath);
        }
}

//appendTxt(".main", "ffmpeg static path: " + ffmpeg.path);


