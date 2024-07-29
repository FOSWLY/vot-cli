function clearFileName(name) {
  return name.replace(/[^\w.-]/g, "");
}

function convertToSrtTimeFormat(seconds) {
  let hours = Math.floor(seconds / 3600);
  let minutes = Math.floor((seconds % 3600) / 60);
  let remainingSeconds = Math.floor(seconds % 60);
  let milliseconds = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")},${milliseconds.toString().padStart(3, "0")}`;
}

function jsonToSrt(jsonData) {
  let srtContent = "";
  let index = 1;
  for (const entry of jsonData) {
    let startTime = entry.startMs / 1000.0;
    let endTime = (entry.startMs + entry.durationMs) / 1000.0;

    srtContent += `${index}\n`;
    srtContent += `${convertToSrtTimeFormat(startTime)} --> ${convertToSrtTimeFormat(endTime)}\n`;
    srtContent += `${entry.text}\n\n`;
    index++;
  }

  return srtContent.trim();
}

export { clearFileName, jsonToSrt };
