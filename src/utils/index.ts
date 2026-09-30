import path from "node:path";
import fs from "node:fs";

import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";

export function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

// TEMPORARY: remove together with all debugLog calls
export function debugLog(scope: string, data: unknown) {
  let serialized: string;
  try {
    serialized = JSON.stringify(data, function (key, value: unknown) {
      const original = (this as Record<string, unknown>)[key];
      if (original instanceof Uint8Array)
        return `<${original.byteLength} bytes>`;
      if (original instanceof Error) return original.message;
      return value;
    });
  } catch (err) {
    serialized = `<unserializable: ${errorMessage(err)}>`;
  }
  process.stderr.write(
    `[vot-debug ${new Date().toISOString()}] ${scope} ${serialized}\n`,
  );
}

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
