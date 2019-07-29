# Clip Cut Gui

<img src="https://clipcut.jpwexperience.com/images/clipcut-screenshot-1.5.jpg">

An electron application that allows easier cutting of clips and burning subtitles from movies.

Allows you to select the video, audio, and subtitle stream to create the clip with. 

Currently all clips are encoded with x264 and AAC. 

External subtitles are searched for in the video file firectory.

Don't have any error checking on the form as of now so ill formated entries will likely cause problems.

Getting Started:
1. Clone repository
2. run 'npm install' while in repository
3. run 'npm start'

Distributables: <a href="https://clipcut.jpwexperience.com" target="_blank">clipcut.jpwexperience.com</a>

User Input Options:<br />
Clip Start: Timecode (00:00:00.00) or number of seconds of when the clip should start<br />
Clip Duration: Length of the clip in timecode or seconds<br />
Quality Level: The crf value when encoding with x264. The lower the number, the higher the quality. Sane range is 18-32.<br />
Clip Name: The name of the newly generated clip. Currently the clip will be generated within the directory of the source video.<br />
