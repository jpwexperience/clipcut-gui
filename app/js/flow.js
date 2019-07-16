const path = require('path');
const fs = require('fs');
const spawn = require('child_process').spawn;
const {shell} = require('electron');
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
        constructor(id, filepath, video, audio, subtitle, extSubs, width, height) {
                this.id = id;
		this.filepath = filepath;
                this.video = video;
                this.audio = audio;
		this.width = width;
		this.height = height;
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

function findFilm(filmId){
	return films.find(Film => Film.id == filmId);
}

function findClip(clipId){
	return clips.find(Clip => Clip.id == clipId);
}

//Clears the html within an element
function clearHtml(elemId) {
        $(elemId).html("");
}

//Removes html within an element
function removeClip(clipId, elemId) {
	var tempClip = findClip(clipId);
        $("div").remove(elemId);
	clips.splice(clips.indexOf(tempClip), 1);
}

//Removes html within an element
function removeFilm(filmId, elemId) {
	var tempFilm = findFilm(filmId);
        $("div").remove(elemId);
	films.splice(films.indexOf(tempFilm), 1);
}

function totalDur(time){
	//console.log('time: ' + time);
	var durArr = time.split(':');
	var len = durArr.length;
	var durNum = [];
	//console.log(durArr);
	for (var i = 0; i < len; i++){
		durNum.push(parseInt(durArr[i]));
	}
	//hours first, then minutes, then seconds
	if(len == 1){
		return Math.floor(durNum[0]);
	} else if(len == 2){
		return Math.floor(durNum[1] + (60 * durNum[0]));	
	} else if(len == 3){
		return Math.floor(durNum[2] + (60 * durNum[1]) + (3600 * durNum[0]));	
	} else{
		console.log('Too many things. Default to 1:00');
		return 60;
	}
}

function progUpdate(line, clipId, duration){
	var timeRegex = /time=[0-9][0-9]:[0-9][0-9]:[0-9][0-9][.][0-9]*/; 
	var failRegex = /Conversion failed!/;
	var fail = line.toString().match(failRegex);
	if (fail){
		return 1;
	}
	var time = line.toString().match(timeRegex);
	if (time){
		var time = time[0].substring(5);
		var timeSec = totalDur(time);
		var percentDone = Math.floor((timeSec / duration) * 100);
		appendTxt('#infoOut-' + clipId, '<p>Stderr Time: ' + time + '  Time in Seconds: ' + timeSec + 
			'Percentage: ' + percentDone.toString() + '%</p>');
		if (percentDone > 10){
			$('#progBar-' + clipId).css('width', percentDone + '%');
		}
		$('#progBar-' + clipId).html(percentDone + '%');
	}
	return 0;
}

function showFile(clipId){
	var clip = findClip(clipId);
	var path = clip.command[clip.command.length - 1];
	//console.log(path);
	shell.showItemInFolder(path);
}

function runCommand(clipId){
	var ffError = 0;
	$('#startBut-' + clipId).attr('disabled', true);
	$('#startBut-' + clipId).css('background', '#1b2532');
	$('#startBut-' + clipId).css('cursor', 'none');
	appendTxt('#clipInfo-' + clipId, '<p class="processing" id="processing-' + clipId + '"><b>Processing Clip, this can take a while</b>' + 
	'<span><b>.</b></span><span><b>.</b></span><span><b>.</b></span></p>');
	appendTxt('#clipInfo-' + clipId, '<div class="progBar" id="progBar-' + clipId + '">0%</div><br>');

	var tempClip = findClip(clipId);
	var command = tempClip.command;
	var duration = command[command.findIndex(element => element === '-t') + 1];
	var durSec = totalDur(duration);

	//console.log(command);

	const ffCmd = spawn(ffpath, command);
	ffCmd.stderr.on('data', (data) => {
		console.log(`${data}`);
		ffError = progUpdate(data, clipId, durSec);
	});

	ffCmd.on('close', (code) => {
		console.log('Command Done');
		$('button').remove('#startBut-' + clipId);
		$('p').remove('#processing-' + clipId);
		if (ffError == 0){
			$('#progBar-' + clipId).html('Clip Cut Complete.');
			appendTxt('#queueCol-1-' + clipId, '<br>');
			appendTxt('#queueButCol-0-' + clipId, '<button class="queueButton" id="openFile-' + clipId + 
		'" type="button" ' + 'onclick="showFile(' + clipId + ')">Show Clip in Folder</button>');
		} else {
			$('#progBar-' + clipId).css('width', '100%');
			$('#progBar-' + clipId).html('Error Cutting Clip.');
		}

	});

	ffCmd.on('error', (err) => {
		console.log('FFmpeg Command Issue: ' + err);
	});

}

function ffCommand(filmId, vChoice, aChoice, sChoice, start, dur, crf, extension, clipName) {
	var workingFilm = findFilm(filmId);
	//console.log("vChoice: " + vChoice + " aChoice: " + aChoice + " sChoice: " + sChoice);
	
	var commandArr = [];
	var subtitleArr = [];
	var clipPath = path.dirname(workingFilm.filepath) + '/' + clipName + '.' + extension;
	
	var fastSubReg = /.*(pgs|PGS|dvd_subtitle).*/;
	var fastSub = 0;
	
	commandArr.push('-y', '-hide_banner');
	
	//Check for subtitles
	if (sChoice >= 0){
		if (sChoice >= workingFilm.subtitle.length){
			var extSubInd = sChoice - workingFilm.subtitle.length;	
			var extSubPath = workingFilm.extSubs[extSubInd];
			subtitleArr.push('-vf', 'subtitles=' + extSubPath);
		} else {
			if (fastSubReg.test(workingFilm.subtitle[sChoice])){
				fastSub = 1;
				subtitleArr.push('-filter_complex', '[0:v:' + vChoice + 
				'][0:s:' + sChoice + ']overlay[v]', '-map', '[v]');
			} else{
				subtitleArr.push('-vf', 'subtitles=' + workingFilm.filepath + ':si=' + sChoice);
			}
		}
	}

	if (sChoice >= 0){
		if (fastSub == 1){
			if (aChoice == -1){
				commandArr.push('-ss', start, '-i', workingFilm.filepath, '-t', dur); 
				commandArr = commandArr.concat(subtitleArr);
				commandArr.push('-c:v', 'libx264', '-an', '-crf', crf, clipPath);
			} else{
				commandArr.push('-ss', start, '-i', workingFilm.filepath, '-t', dur);
				//console.log(subtitleArr);
				commandArr = commandArr.concat(subtitleArr);
				commandArr.push('-map', '0:a:' + aChoice, '-c:v', 'libx264', '-c:a', 'aac', '-crf', crf, clipPath);
			}
		} else{
			if (aChoice == -1){
				commandArr.push('-i', workingFilm.filepath, '-ss', start, 
				'-t', dur, '-map', '0:v:' + vChoice,); 
				commandArr = commandArr.concat(subtitleArr);
				commandArr.push('-c:v', 'libx264', '-an', '-crf', crf, clipPath);
			
			} else{
				commandArr.push('-i', workingFilm.filepath, '-ss', start, 
				'-t', dur, '-map', '0:v:' + vChoice); 
				commandArr = commandArr.concat(subtitleArr);
				commandArr.push('-map', '0:a:' + aChoice, '-c:v', 'libx264', 
				'-c:a', 'aac', '-crf', crf, clipPath);
			}
		}
	} else {
		if (aChoice == -1){
			commandArr.push('-ss', start, '-i', workingFilm.filepath, '-t', dur, 
			'-map', '0:v:' + vChoice, '-c:v', 'libx264', '-an', 
			'-crf', crf, clipPath);
		} else{
			commandArr.push('-ss', start, '-i', workingFilm.filepath, '-t', dur, 
			'-map', '0:v:' + vChoice, '-map', '0:a:' + aChoice, '-c:v', 'libx264', 
			'-c:a', 'aac', '-crf', crf, clipPath);
		}
	} 
	console.log(commandArr);
	return commandArr
}

function clipQueue(start, dur, crf, extension, clipName, clipCount, command){
	//console.log("clipQueue entered");

	appendTxt('.clipQueue', '<div class="queueBox" id="clip-' + clipCount + '"></div>');

	appendTxt('#clip-' + clipCount, '<div class="clipInfo" id="clipInfo-' + clipCount + '">');	
	//appendTxt('#queueRow-' + clipCount, '<div class="queueCol" id="queueCol-0-' + clipCount + '">');
	appendTxt('#clipInfo-' + clipCount, '<p><b>Clip Name: ' + clipName + '.' + extension + '</b><p>');
	/*
	appendTxt('#queueCol-0-' + clipCount, '<p><b>Start: ' + start + '</b><br>');
	appendTxt('#queueCol-0-' + clipCount, '<p><b>Duration: ' + dur + '</b></p>');
	appendTxt('#queueCol-0-' + clipCount, '<p><b>Quality Level: ' + crf + '</b></p>');
	*/
	//appendTxt('#queueRow-' + clipCount, '<div class="queueCol" id="queueCol-1-' + clipCount + '">');

	//appendTxt('#queueCol-1-' + clipCount, '<div class="infoOut" id="infoOut-' + clipCount + '"></div>');

	appendTxt('#clip-' + clipCount, '<div class="queueButtons" id="queueButtons-' + clipCount + '"></div>');

	appendTxt('#queueButtons-' + clipCount, '<div class="queueRow" id="queueButRow-' + clipCount + '"></div>');
	appendTxt('#queueButRow-' + clipCount, '<div class="queuecol" id="queueButCol-0-' + clipCount + '"></div>');
	appendTxt('#queueButRow-' + clipCount, '<div class="queuecol" id="queueButCol-1-' + clipCount + '"></div>');

	appendTxt('#queueButCol-0-' + clipCount, '<button class="queueButton" id="startBut-' + clipCount + 
	'" type="button" ' + 'onclick="runCommand(' + clipCount + ')">Start Cutting Clip</button>');

	appendTxt('#queueButCol-1-' + clipCount, '<button class="queueButton" type="button" ' +
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
	//console.log("Form ID: " + id);
	
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
	appendTxt(".clipForm", '<div id="inputDiv-' + id +'" class="inputDiv"><br></div>');
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
		'id="sStreams-nosub-' + id + '" value="-1"> No Subtitles<br>');
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
	appendTxt("#startCol-" + id, "<b>Clip Start:</b>");
	appendTxt("#startRow-" + id, '<div class="formColumn" id="startColEntry-' + id + '"></div>');
	appendTxt("#startColEntry-" + id, '<input type="text" class="textBox" id="startBox-' + 
	id + '" placeholder="00:00:00.00">');
	
	appendTxt("#form-" + id, "<br>");
	
	//duration
	appendTxt("#form-" + id, '<div class="formRow" id="durRow-' + id + '"></div>');
	appendTxt("#durRow-" + id, '<div class="formColumn" id="durCol-' + id + '"></div>');
	appendTxt("#durCol-" + id, "<b>Clip Duration:</b>");
	appendTxt("#durRow-" + id, '<div class="formColumn" id="durColEntry-' + id + '"></div>');
	appendTxt("#durColEntry-" + id, '<input type="text" class="textBox" id="durBox-' + id + '" placeholder="1:00">');
	appendTxt("#form-" + id, "<br>");
	

	//crf value
	appendTxt("#form-" + id, '<div class="formRow" id="crfRow-' + id + '"></div>');
	appendTxt("#crfRow-" + id, '<div class="formColumn" id="crfCol-' + id + '"></div>');
	appendTxt("#crfCol-" + id, "<b>Quality Level:</b>");
	appendTxt("#crfRow-" + id, '<div class="formColumn" id="crfColEntry-' + id + '"></div>');
	appendTxt("#crfColEntry-" + id, '<input type="text" class="textBox" id="crfBox-' + id + 
	'" placeholder="18-32, lower # = higher quality">');
	
	appendTxt("#form-" + id, "<br>");
	
	//crop
	appendTxt('#form-' + id, '<div class="cropRow" id="cropRow-' + id + '"></div>');	
	appendTxt('#cropRow-' + id, '<div class="cropCol" id="cropCol0-' + id + '"></div>');	
	appendTxt('#cropCol0-' + id, '<b>Crop:</b>');

	appendTxt('#cropRow-' + id, '<div class="cropCol" id="cropCol1-' + id + '"></div>');	
	appendTxt("#cropCol1-" + id, '<input type="text" class="cropBox" id="cropBox-' + id + 
	'" placeholder="' + film.width + '">');
	
	appendTxt('#cropRow-' + id, '<div class="cropCol" id="cropCol2-' + id + '"></div>');	
	appendTxt('#cropCol2-' + id, '<div style="text-align: center;"><b> x </b></div>');
	
	appendTxt('#cropRow-' + id, '<div class="cropCol" id="cropCol3-' + id + '"></div>');	
	appendTxt("#cropCol3-" + id, '<input type="text" class="cropBox" id="cropBox-' + id + 
	'" placeholder="' + film.height + '">');
	
	appendTxt("#form-" + id, "<br>");


	//scale
	appendTxt('#form-' + id, '<div class="scaleRow" id="scaleRow-' + id + '"></div>'); 
	appendTxt('#scaleRow-' + id, '<div class="scaleCol" id="scaleCol0-' + id + '"></div>'); 
	appendTxt('#scaleCol0-' + id, '<b>Scale: </b>');

	appendTxt('#scaleRow-' + id, '<div class="scaleCol" id="scaleCol1-' + id + '"></div>'); 
	appendTxt("#scaleCol1-" + id, '<input type="text" class="scaleBox" id="scaleBox-' + id + 
	'" placeholder="' + film.width + '">');
	appendTxt('#form-' + id, '<br>');

	//clip name
	appendTxt("#form-" + id, "<b>Enter Clip Name:</b>");
	appendTxt("#form-" + id, "<br>");
	var nameHolder = path.basename(film.filepath).replace(/\.[^/.]+$/, "") + "-cut";
	appendTxt("#form-" + id, '<input type="text" id="nameBox-' + id + '" placeholder="' + nameHolder + '" class="clipTextBox">');
	appendTxt("#form-" + id, "<br>");
	appendTxt("#form-" + id, "<br>");

	//extension choice
	appendTxt('#form-' + id, "<b>Extension Choice:</b>");
	appendTxt('#form-' + id, "<br>");
	appendTxt('#form-' + id, '<div class="extRow" id="extRow-' + id + '"></div>');
	appendTxt('#extRow-' + id, '<div class="extCol" id="extCol0-' + id + '"></div>');

	appendTxt('#extCol0-' + id, '<input type="radio" id="ext-' + id + '" name="ext-' + id + '" value="mp4"> .mp4');
	radioCheck('#ext-' + id, true);
	appendTxt('#extCol0-' + id, "<br>");
	appendTxt('#extCol0-' + id, '<input type="radio" name="ext-' + id + '" value="mov"> .mov');
	appendTxt('#extCol0-' + id, "<br>");
	appendTxt('#extCol0-' + id, '<input type="radio" name="ext-' + id + '" value="mkv"> .mkv');

	appendTxt('#extRow-' + id, '<div class="extCol" id="extCol1-' + id + '"></div>');
	appendTxt('#extCol1-' + id, '<input type="radio" name="ext-' + id + '" value="gif"> .gif');
	appendTxt('#extCol1-' + id, "<br>");
	appendTxt('#extCol1-' + id, '<input type="radio" name="ext-' + id + '" value="webm"> .webm');
	appendTxt('#extRow-' + id, "<br>");

	appendTxt('#form-' + id, '<div class="webmInfo" id="webmInfo-' + id + '"></div>');
	appendTxt('#webmInfo-' + id, '<div class="extraRow" id="webmRow-' + id + '"></div>');
	appendTxt('#webmRow-' + id, '<div class="extraCol" id="webmCol0-' + id + '"></div>');
	appendTxt('#webmCol0-' + id, '<b>Bitrate in MB: </b>');

	appendTxt('#webmRow-' + id, '<div class="extraCol" id="webmCol1-' + id + '"></div>');
	appendTxt("#webmCol1-" + id, '<input type="text" class="extraBox" id="extraBox-' + id + 
	'" placeholder="0.50">');
	appendTxt('#webmInfo-' + id, '<br>');

	appendTxt('#form-' + id, '<div class="gifInfo" id="gifInfo-' + id + '"></div>');
	appendTxt('#gifInfo-' + id, '<div class="extraRow" id="gifRow-' + id + '"></div>');
	appendTxt('#gifRow-' + id, '<div class="extraCol" id="gifCol0-' + id + '"></div>');
	appendTxt('#gifCol0-' + id, '<b>Framerate: </b>');

	appendTxt('#gifRow-' + id, '<div class="extraCol" id="gifCol1-' + id + '"></div>');
	appendTxt("#gifCol1-" + id, '<input type="text" class="extraBox" id="extraBox-' + id + 
	'" placeholder="23">');
	appendTxt('#gifInfo-' + id, '<br>');

	$(document).ready(function () {
		$('input:radio[name="ext-' + id + '"]').change(function() {
			if ($(this).val() == 'webm') {
				$('#webmInfo-' + id).css('display', 'inline');
				$('#gifInfo-' + id).css('display', 'none');
			} else if ($(this).val() == 'gif') {
				$('#gifInfo-' + id).css('display', 'inline');
				$('#webmInfo-' + id).css('display', 'none');
			} else {
				$('#webmInfo-' + id).css('display', 'none');
				$('#gifInfo-' + id).css('display', 'none');
			}
		});
	});

	//submit buttons
	appendTxt('#form-' + id, '<div class="formRow" id="filmBut-' + id + '"></div>');
	appendTxt('#filmBut-' + id, '<div class="formColumn" id="submitCol-' + id +'"></div>');
	appendTxt('#filmBut-' + id, '<div class="formColumn" id="removeCol-' + id +'"></div>');
	
	appendTxt("#submitCol-" + id, '<button id="submit-' + id + '" type="button" class="button" ' + 
	'onclick="formProcess(' + id + ', \'' + nameHolder + '\')">Add Clip to Queue</button>');

	appendTxt('#removeCol-' + id, '<button class="queueButton" type="button" ' +
	'onclick="removeFilm(' + id + ', \'#inputDiv-' + id + '\')">Remove Video</button>');

}

//Parse out video, audio, and subtitle streams
function streamProcess(results, filepath) {
	var streams = [];
	var vStreams = [];
	var aStreams = [];
	var sStreams = [];
	var extSubs = [];
	var width = 0;
	var height = 0;
	var streamReg = /.*Stream #.*/;
	var vReg = /.*Video:.*/;
	var aReg = /.*Audio:.*/;
	var sReg = /.*Subtitle:.*/;
	var lines = results.split("\n");
	for (var i = 0; i < lines.length; i++){
		if (streamReg.test(lines[i])){
			streams.push(lines[i]);
		}
	}
	for (var i = 0; i < streams.length; i++){
		if (vReg.test(streams[i])){
			var tempReg = /Stream #\d+:\d+.*: Video:/;
			var sizeReg = /[0-9]+x[0-9]+/;
			var pieces = streams[i].split(tempReg);
			var sizePieces = streams[i].match(sizeReg);
			var sizePieces = sizePieces[0].split('x');
			width = sizePieces[0];
			height = sizePieces[1];
			vStreams.push(pieces[1]);
		} else if (aReg.test(streams[i])){
			var tempReg = /Stream #\d+:\d+\(/;
			var pieces = streams[i].split(tempReg);
			var pieces = pieces[1].split(/\): Audio:/);
			var outStream = '<b>' + pieces[0] + '</b>: ' + pieces[1];
			aStreams.push(outStream);
		} else if (sReg.test(streams[i])){
			var tempReg = /Stream #\d+:\d+\(/;
			var pieces = streams[i].split(tempReg);
			var pieces = pieces[1].split(/\): Subtitle:/);
			var outStream = '<b>' + pieces[0] + '</b>: ' + pieces[1];
			sStreams.push(outStream);
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
	//create new film based on stream information
	var newFilm = new Film(filmCount, filepath, vStreams, aStreams, sStreams, extSubs, width, height)
	films.push(newFilm);
	filmCount++;
	//create html form from video input
	filmForm(newFilm);
}

//Get ffmpeg information from video file
function ffprobe(filepath) {
	var command = '"' + ffpath + '" -hide_banner -i "' + filepath + '"';
	var exec = require('child_process').exec, child;
	child = exec(command,
	function (error, stdout, stderr) {
		if (error !== null) {
			console.log('exec error: ' + error);
		}
		console.log('stdout: ' + stdout);
		console.log('stderr: ' + stderr);
		//send ffmpeg output to parse streams
		streamProcess(stderr, filepath);
	});
}


//Processes input files from button
function fileUp() {
        filePaths = [];
        var x = document.getElementById("upFile");
        var txt = "";
        if ('files' in x) {
        if (x.files.length == 0) {
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
	console.log(films);
	console.log(filePaths);
	//run each file through ffmpeg to get information
	for (var i = 0; i < filePaths.length; i++){
		var tempPath = filePaths[i];
		ffprobe(tempPath);
        }
}
