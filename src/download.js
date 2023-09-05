import fs from "fs";
import axios from "axios";

function calcPercents(current, max) {
  return ((current / max) * 100).toFixed(1);
}

export default async function downloadFile(url, outputPath, subtask, videoId) {
  if (!url) {
    throw new Error("Invalid download link");
  }

  const writer = fs.createWriteStream(outputPath);
  const { data, headers } = await axios({
    method: "get",
    url: url,
    responseType: "stream",
  });

  const totalLength = headers["content-length"];
  let downloadedLength = 0;

  data.on("data", (chunk) => {
    downloadedLength += chunk.length;
    if (subtask) {
      subtask.title = `Downloading ${videoId}: ${calcPercents(
        downloadedLength,
        totalLength,
      )}%`;
    }
    // console.log(calcPercents(downloadedLength, totalLength))
  });

  data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

// await downloadFile(link, "./1244.mp3")
