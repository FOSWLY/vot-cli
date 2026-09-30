import { type ChildProcess, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

import VOTConfig from "@vot.js/shared/config";
import type { VideoData } from "@vot.js/core/types/client";
import { AudioDownloadType } from "@vot.js/core/types/providers/yandex";

import type { ProcessingContext, ProgressEvent } from "./processor";
import { debugLog, errorMessage } from "./utils";

type AudioContext = Pick<
  ProcessingContext,
  "client" | "fetchOpts" | "ytDlpSupported" | "downloadAudio"
>;

const YT_DLP_STDERR_LIMIT = 4096;
const AUDIO_UPLOAD_ATTEMPTS = 3;
const AUDIO_UPLOAD_RETRY_DELAY = 1_500;

export function ytDlpFailureMessage(code: number | null, stderr: string) {
  const lines = stderr
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const reason =
    lines.findLast((line) => line.startsWith("ERROR:")) ?? lines.at(-1);
  return reason
    ? `yt-dlp exited with code ${code}: ${reason}`
    : `yt-dlp exited with code ${code}`;
}

export async function* streamYtDlpAudio(
  binaryPath: string,
  url: string,
  lang?: string,
): AsyncGenerator<Uint8Array> {
  const format = lang && lang !== "auto" ? `ba[language^=${lang}]/ba` : "ba";
  const args = [
    "-f",
    format,
    // Language preference goes first so descriptive audio and dubs lose to the original track
    "-S",
    "lang,+size,+br",
    "-o",
    "-",
    "--no-playlist",
    "--no-part",
    "--quiet",
    "--no-warnings",
    url,
  ];
  debugLog("yt-dlp start", { binaryPath, args });
  const child = spawn(binaryPath, args, {
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (data: string) => {
    stderr = (stderr + data).slice(-YT_DLP_STDERR_LIMIT);
  });
  const exitCode = new Promise<number | null>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });
  // The rejection is observed only after stdout ends, so it must not be reported as unhandled meanwhile
  exitCode.catch(() => {});

  try {
    yield* child.stdout;
    const code = await exitCode;
    debugLog("yt-dlp exit", {
      code,
      failure: code !== 0 ? ytDlpFailureMessage(code, stderr) : undefined,
    });
    if (code !== 0) {
      throw new Error(ytDlpFailureMessage(code, stderr));
    }
  } finally {
    if (child.exitCode === null && child.signalCode === null) killTree(child);
  }
}

// The standalone Windows yt-dlp.exe is a launcher that runs the real downloader as its child
function killTree(child: ChildProcess) {
  if (process.platform !== "win32" || !child.pid) {
    child.kill();
    return;
  }

  spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
    stdio: "ignore",
    windowsHide: true,
  }).once("error", () => child.kill());
}

function concatChunks(parts: Uint8Array[], size: number) {
  const chunk = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    chunk.set(part, offset);
    offset += part.length;
  }
  return chunk;
}

// Holds one finished chunk back so the final one can be flagged before it is sent
export async function* chunkAudio(
  source: AsyncIterable<Uint8Array>,
  chunkSize: number,
): AsyncGenerator<{ audioFile: Uint8Array; isLast: boolean }> {
  let ready: Uint8Array | undefined;
  let parts: Uint8Array[] = [];
  let size = 0;

  for await (const piece of source) {
    parts.push(piece);
    size += piece.length;
    if (size < chunkSize) continue;
    if (ready) yield { audioFile: ready, isLast: false };
    ready = concatChunks(parts, size);
    parts = [];
    size = 0;
  }

  if (size > 0) {
    if (ready) yield { audioFile: ready, isLast: false };
    ready = concatChunks(parts, size);
  }
  if (!ready) throw new Error("Audio is empty");
  yield { audioFile: ready, isLast: true };
}

async function withRetries<T>(action: () => Promise<T>) {
  for (let attempt = 1; ; attempt++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await action();
    } catch (err) {
      debugLog("audio upload attempt failed", {
        attempt,
        maxAttempts: AUDIO_UPLOAD_ATTEMPTS,
        error: err,
      });
      if (attempt >= AUDIO_UPLOAD_ATTEMPTS) throw err;
      // eslint-disable-next-line no-await-in-loop
      await delay(AUDIO_UPLOAD_RETRY_DELAY);
    }
  }
}

async function uploadAudio(
  context: AudioContext,
  videoData: VideoData,
  translationId: string,
  onProgress?: (event: ProgressEvent) => void,
) {
  const { provider } = context.client;
  const fileId = `random-${AudioDownloadType.WEB_ABR}-${randomUUID()}`;
  let chunkId = 0;

  for await (const { audioFile, isLast } of chunkAudio(
    context.downloadAudio(videoData.url),
    VOTConfig.minChunkSize,
  )) {
    const audioPartsLength = isLast ? chunkId + 1 : 0;
    const response = await withRetries(() =>
      provider.requestVtransAudio(
        videoData.url,
        translationId,
        { audioFile, chunkId },
        {
          audioPartsLength,
          fileId,
          version: 1,
        },
        undefined,
        context.fetchOpts,
      ),
    );
    debugLog("requestVtransAudio chunk", {
      chunkId,
      bytes: audioFile.byteLength,
      isLast,
      audioPartsLength,
      fileId,
      response,
    });
    chunkId++;
    onProgress?.({ type: "audioUpload", chunks: chunkId });
  }
}

async function sendFailedAudio(
  context: AudioContext,
  videoData: VideoData,
  translationId: string,
) {
  const { url, videoId } = videoData;
  if (!url.startsWith("https://youtu.be/")) {
    debugLog("fail-audio fallback skipped, not a YouTube url", { url });
    return;
  }

  const { provider } = context.client;
  const failAudioResponse = await provider.requestVtransFailAudio(
    url,
    context.fetchOpts,
  );
  debugLog("requestVtransFailAudio", failAudioResponse);
  const emptyAudioResponse = await provider.requestVtransAudio(
    url,
    translationId,
    {
      audioFile: new Uint8Array(0),
      fileId: `fallback-empty-audio:video-translation:${videoId}`,
    },
    undefined,
    undefined,
    context.fetchOpts,
  );
  debugLog("requestVtransAudio empty", emptyAudioResponse);
}

export async function provideAudio(
  context: AudioContext,
  videoData: VideoData,
  translationId: string,
  onProgress?: (event: ProgressEvent) => void,
) {
  let uploadError: string | undefined;
  if (context.ytDlpSupported) {
    try {
      await uploadAudio(context, videoData, translationId, onProgress);
      return;
    } catch (err) {
      uploadError = errorMessage(err);
      debugLog("audio upload failed, falling back to empty audio", {
        error: uploadError,
      });
      onProgress?.({ type: "audioUploadFailed", error: uploadError });
    }
  }

  // Falls back to the empty audio so the translation is not stuck waiting
  try {
    await sendFailedAudio(context, videoData, translationId);
  } catch (err) {
    const reason = `Failed to send empty audio, because ${errorMessage(err)}`;
    throw new Error(
      uploadError
        ? `${reason}; audio upload failed, because ${uploadError}`
        : reason,
      { cause: err },
    );
  }
}
