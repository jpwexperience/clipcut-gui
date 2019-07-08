# Clip Cut Gui
An electron application that allows easier cutting of clips and burning subtitles from movies.

Allows you to select the video, audio, and subtitle stream to create the clip with. 

Currently all clips are encoded with x264 and AAC. 

Don't have any error checking on the form as of now so I'll formated entries will likely cause problems.

Getting Started:
1. Clone repository
2. run 'npm install' while in repository
3. run 'npm start'

User Input Options:<br />
Clip Start: Timecode (00:00:00.00) or number of seconds of when the clip should start<br />
Clip Duration: Length of the clip in timecode or seconds<br />
Quality Level: The crf value when encoding with x264. The lower the number, the higher the quality. Sane range is 18-32.<br />
Clip Name: The name of the newly generated clip. Currently the clip will be generated within the directory of the source video.<br />
