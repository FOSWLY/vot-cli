import path from "node:path";
import fs from "node:fs";
import { RequestLang, ResponseLang } from "@vot.js/shared/types/data";

export function validateFilename(
  outdir: string,
  filename: string,
  ext = "mp3",
) {
  filename = filename
    .replace(/^https?:\/\//, "")
    .replace(/[\\/:*?"'<>|]/g, "-");
  const file = `${filename}.${ext}`;
  const exist = fs.existsSync(path.join(outdir, file));
  if (!exist) {
    return file;
  }

  return `${filename}_${Date.now()}.${ext}`;
}

export function isLivelyVoiceAllowed(
  requestLang: RequestLang,
  responseLang: ResponseLang,
  apiToken?: string,
) {
  if (requestLang === "auto" || responseLang !== "ru") {
    return false;
  }

  // allowed only with auth
  if (!apiToken) {
    return false;
  }

  return true;
}
