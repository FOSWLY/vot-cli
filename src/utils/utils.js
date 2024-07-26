function clearFileName(name) {
  return name.replace(/[^\w.-]/g, "");
}

function convertToSrtTimeFormat(ms) {
  const date = new Date(ms);
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  const milliseconds = String(date.getUTCMilliseconds()).padStart(3, "0");
  return `${hours}:${minutes}:${seconds},${milliseconds}`;
}

function jsonToSrt(subtitles) {
  return subtitles
    .map((s, index) => {
      const { text, startMs, durationMs } = s;
      const startTime = convertToSrtTimeFormat(startMs);
      const endTime = convertToSrtTimeFormat(startMs + durationMs);
      return `${index + 1}\n${startTime} --> ${endTime}\n${text}\n`;
    })
    .join("\n")
    .trim();
}

export { clearFileName, jsonToSrt };
