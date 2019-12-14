# Clip Cut Gui

<img src="https://jpwexperience.com/assets/images/clipcut/clipcut-screenshot-1.6.jpg">

An electron application that allows easier cutting of clips and burning subtitles from movies.

Allows you to select the video, audio, and subtitle stream to create the clip with. 

Currently all clips are encoded with x264 and AAC for video and audio respectively. 
	Messing around with bitrates for social posts and am currently trying out 128kbs.

External subtitles are searched for in the video file firectory.

Don't have any error checking on the form as of now so ill formated entries will likely cause problems.

### Getting Started:
1. Clone repository
2. run 'npm install' while in repository
3. run 'npm start'

#### Distributables (may not incorporate latest features): <a href="https://clipcut.jpwexperience.com" target="_blank">clipcut.jpwexperience.com</a>

### Input Options:
Clip Start: Timecode (00:00:00.00) or number of seconds of when the clip should start<br />
Clip Duration: Length of the clip in timecode or seconds<br />
Quality Level: The crf value when encoding with x264. The lower the number, the higher the quality. Sane range is 18-32 but can go beyond for higher/lower filesizes. May be useful to lower the number when burning subtitles depending on the source.<br />
Clip Name: The name of the newly generated clip. Currently the clip will be generated within the directory of the source video.<br />
Crop: Width and Height of the output video in pixels.<br />
Scale: Width of output video in pixels. Final video height will be scaled accordingly. If final video height is an odd number, pixels will eb added until it is even due to ffmpeg's usage.<br />
FPS: Frames per second of output gif<br />
Bitrate: Bitrate of output webm in MB<br />

### Video Player Settings - Not Tested on Windows
* Must have MPV installed to use functionality. 
* Uses mpv command line interface to play video. Not likely to work on windows in current state.
####Shortcuts
* CTRL + Q - Grabs starting time.
* CTRL + W - Grabs end time and calculates duration.
* CTRL + E - Adds clip to queue given the current settings and starts processing
