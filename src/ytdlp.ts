import { execFile } from "node:child_process";
import { promisify } from "node:util";

import _YTDlpWrap from "yt-dlp-wrap-plus";

import type { Schema } from "./types/schema";
import { errorMessage } from "./utils";

// workaround to fix `undefined is not a constructor (evaluating 'new YTDlpWrap')` in node build
const YTDlpWrap = ((_YTDlpWrap as unknown as { default: typeof _YTDlpWrap })
  .default ?? _YTDlpWrap) as typeof _YTDlpWrap;
export const ytdlp = new YTDlpWrap();

export const YT_DLP_NOT_FOUND = "not found";

export type YtDlpInfo =
  | { version: string; error: null }
  | { version: null; error: string };

const execFileAsync = promisify(execFile);
let ytDlpInfoPromise: Promise<YtDlpInfo> | undefined;

export function ytDlpCookieArgs(
  values: Partial<Pick<Schema, "cookies" | "cookies-from-browser">>,
) {
  const args: string[] = [];
  if (values.cookies) args.push("--cookies", values.cookies);
  if (values["cookies-from-browser"]) {
    args.push("--cookies-from-browser", values["cookies-from-browser"]);
  }
  return args;
}

export function ytDlpErrorReason(err: unknown) {
  const { code, stderr } = (err ?? {}) as { code?: unknown; stderr?: unknown };
  if (code === "ENOENT") return YT_DLP_NOT_FOUND;

  const lastStderrLine =
    typeof stderr === "string"
      ? stderr
          .split(/\r?\n/)
          .map((line) => line.trim())
          .findLast(Boolean)
      : undefined;
  return lastStderrLine ?? errorMessage(err);
}

// yt-dlp-wrap-plus flattens spawn errors into a plain message, so the version is
// requested directly to tell a missing binary apart from a failed launch
// (e.g. Deno without an unscoped --allow-run)
async function readYtDlpInfo(): Promise<YtDlpInfo> {
  try {
    const { stdout } = await execFileAsync(
      ytdlp.getBinaryPath(),
      ["--version"],
      { windowsHide: true },
    );
    return { version: stdout.trim(), error: null };
  } catch (err) {
    return { version: null, error: ytDlpErrorReason(err) };
  }
}

export function getYtDlpInfo() {
  ytDlpInfoPromise ??= readYtDlpInfo();
  return ytDlpInfoPromise;
}
