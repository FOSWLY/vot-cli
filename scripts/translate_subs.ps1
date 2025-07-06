# Скрипт для PowerShell, который скачивает видео, субтитры и вшивает их (hard-subs, вжигание) (на основе скрипта Dragoy)
#
# Использование:
# .\translate_subs_embed.ps1 <ссылка на видео 1> <ссылка на видео 2> ...
#
# Настройки внешнего вида субтитров задаются на строчке "Вшиваем субтитры с помощью ffmpeg"

function ProcessVideo($video_link) {
    # Создаём временные папки
    New-Item -ItemType Directory -Path $temp_dir -ErrorAction SilentlyContinue | Out-Null
    New-Item -ItemType Directory -Path $temp_video_dir -ErrorAction SilentlyContinue | Out-Null
    New-Item -ItemType Directory -Path $temp_subs_dir -ErrorAction SilentlyContinue | Out-Null

    # Скачиваем видео
    yt-dlp -o $temp_video $video_link

    # Скачиваем переведённые субтитры с помощью vot-cli
    vot-cli $video_link --subs-srt --output $temp_subs_dir

    # Получаем имена файлов
    $video_file = (Get-ChildItem -Path $temp_video_dir | Where-Object { $_.Extension -match "mp4|mkv|webm" })[0].FullName
    $subs_file = (Get-ChildItem -Path $temp_subs_dir -Filter *.srt)[0].FullName

    # Подготавливаем путь к субтитрам для ffmpeg в Windows
    # Это исправляет ошибку, когда ffmpeg не может найти файл из-за двоеточия в пути (C:\...)
    $escaped_subs_path = $subs_file.Replace('\', '/') -replace ':', '\:'

    # Формируем имя итогового файла
    $video_base_name = [System.IO.Path]::GetFileNameWithoutExtension($video_file)
    $video_ext = [System.IO.Path]::GetExtension($video_file)
    $output_file = Join-Path (Get-Location) "$video_base_name-sub$video_ext"

    # Вшиваем субтитры с помощью ffmpeg
    ffmpeg -i "$video_file" -vf "subtitles='$escaped_subs_path':force_style='FontSize=12'" -c:a copy -y "$output_file"

    Write-Host "Video with subtitles saved: $output_file"

    # Удаляем временные папки
    Remove-Item -Recurse -Force $temp_dir
}

# Папки
$temp_dir = "./temp"
$temp_video_dir = "$temp_dir/video"
$temp_video = "$temp_video_dir/%(title)s.%(ext)s"
$temp_subs_dir = "$temp_dir/subs"

# Список ссылок
$video_links = $args

# Проверка ссылок
if ($video_links) {
    foreach ($video_link in $video_links) {
        if ([string]::IsNullOrEmpty($video_link)) {
            Write-Host "Error: reference not entered."
            continue
        }

        Write-Host "Processing video: $video_link"
        ProcessVideo $video_link
    }
} else {
    Write-Host "Error: no video links."
}