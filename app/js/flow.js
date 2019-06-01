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

appendTxt("main", "ffmpeg static path: " + ffmpeg.path);
runCmd(ffmpeg.path + 
	' -i "/media/internal4tb/Television/ameridad/Family Guy - season\'s 1-9/Family Guy - Season 2/202 - Holy Crap.avi"');
