#!/usr/bin/env bash
streamArr=()
input="$1"
if [[ -e $input && $input != "-v" ]]; then
	base=${input##*/}
	temp=${base%.*}
	dir=${input%$base}
	ext=${input##*.}
	echo -e "\nbase: $base dir: $dir ext: $ext"
	#get file information, redirect sterr
	info="$(ffprobe -analyzeduration 100M -probesize 500K -i "$input" -hide_banner 2>&1)"
	IFS='\n' read -ra ADDR <<< "$info"
	ffprobeOut=()
	ffprobeOutSize=${#ffprobeOut[@]}
	#read each line of ffprobe output
	#for line in "${ffprobeOut[@]}"; do
	while read -r line; do
		ffprobeOut+=("$line")
	done <<< "$info"
	outLen=${#ffprobeOut[@]}
	for ((i = 0; i < $outLen; i++)); do
		line=${ffprobeOut[i]}
		if [[ $line =~ (S|s)"tream #"(.*) ]]; then
			#echo "$line"
			streamArr+=("$line")
		fi
	done
	for ((i = 0; i < ${#streamArr[@]}; i++)); do
		tempStream=${streamArr[i]}
		echo "$tempStream<br>"
	done
else
	echo "Not a file."
	exit 1
fi
