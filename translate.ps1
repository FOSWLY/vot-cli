# Скрипт для PowerShell который скачивает видео, перевод и смешивает
#
# Использование:
# .\translate.ps1 <ссылка на видео 1> <ссылка на видео 2> ... [отношение громкости оригинала - например: 0.4]
# 
# Usage:
# .\translate.ps1 <video link 1> <video link 2> ... [volume ratio - for example: 0.4]
#
# Буду рад узнать ваши идеи и о найденных ошибках!
# any ideas/issues are welcome!!
# Original Script: https://gitlab.com/musickiller/fishy-voice-over/-/blob/main/translate.fish




function ProcessVideo($video_link, $original_sound_ratio) {
    # No -Force, to make sure nothing is overwritten
    New-Item -ItemType Directory -Path $temp_dir -ErrorAction SilentlyContinue | Out-Null
    New-Item -ItemType Directory -Path $temp_video_dir -ErrorAction SilentlyContinue | Out-Null
    New-Item -ItemType Directory -Path $temp_audio -ErrorAction SilentlyContinue | Out-Null

    yt-dlp -o $temp_video $video_link
    $video_full_name = Get-ChildItem $temp_video_dir
    vot-cli $video_link --output $temp_audio

    $temp_video_file = (Get-ChildItem -Path $temp_video_dir)[0].FullName
    $temp_audio_file = (Get-ChildItem -Path $temp_audio)[0].FullName

    ffmpeg `
        -i $temp_video_file -i $temp_audio_file `
        -c:v copy `
		-b:a 128k `
        -filter_complex " `
            [0:a] volume=$original_sound_ratio [original]; `
            [original][1:a] amix=inputs=2:duration=longest [audio_out] `
        " `
        -map 0:v -map "[audio_out]" `
        -y $video_full_name

    Remove-Item -Recurse -Force $temp_dir
}

# Settings
$original_sound_ratio = 0.1
$temp_dir = "./temp" # will be removed
$temp_video_dir = "$temp_dir/video"
$temp_video = "$temp_video_dir/%(title)s.%(ext)s"
$temp_audio = "$temp_dir/audio"

$video_links = $args[0..($args.Length - 2)]
$volume_ratio_arg = $args[-1]

# If the last argument is a number, set the original sound ratio to that one
if ($volume_ratio_arg -as [double]) {
    $original_sound_ratio = $volume_ratio_arg
    Write-Host "Original volume is set to $original_sound_ratio"
} else {
    # If the last argument is not a number, add it back to the video links array
    $video_links += $volume_ratio_arg
}

# Check that var is init
if ($video_links) {
    foreach ($video_link in $video_links) {
        if ([string]::IsNullOrEmpty($video_link)) {
            Write-Host "Error: Link not entered."
            continue
        }
        
        Write-Host "Processing video: $video_link"
        ProcessVideo $video_link $original_sound_ratio
    }
} else {
    Write-Host "Error: Link not entered."
}
