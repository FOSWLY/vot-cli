import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { finished, pipeline } from "node:stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { setTimeout as delay } from "node:timers/promises";

import VOTConfig from "@vot.js/shared/config";
import { LoggerLevel } from "@vot.js/shared/types/logger";
import VOTClient from "@vot.js/node";
import { getVideoData } from "@vot.js/node/utils/videoData";
import { VOTAgent, VOTProxyAgent } from "@vot.js/node/utils/fetchAgent";
import { VOTNextWorkerProvider } from "@vot.js/core/providers/votworker";
import { YandexProvider } from "@vot.js/core/providers/yandex";
import type { VideoData } from "@vot.js/core/types/client";
import type { TranslatedVideoTranslationResponse } from "@vot.js/core/types/providers/yandex";
import type { SubtitleFormat, SubtitlesData } from "@vot.js/shared/types/subs";
import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";
import { convertSubs } from "@vot.js/shared/utils/subs";
import _YTDlpWrap from "yt-dlp-wrap-plus";

import type { Schema } from "./types/schema";
import { isLivelyVoiceAllowed, validateFilename } from "./utils";

VOTConfig.loggerLevel = LoggerLevel.SILENCE;

// workaround to fix `undefined is not a constructor (evaluating 'new YTDlpWrap')` in node build
const YTDlpWrap = ((_YTDlpWrap as unknown as { default: typeof _YTDlpWrap })
  .default ?? _YTDlpWrap) as typeof _YTDlpWrap;
const ytdlp = new YTDlpWrap();
let ytDlpSupportedPromise: Promise<boolean> | undefined;

function isYtDlpSupported() {
  ytDlpSupportedPromise ??= ytdlp
    .getVersion()
    .then(() => true)
    .catch(() => false);

  return ytDlpSupportedPromise;
}

async function getVideoTitle(url: string, fallback: string) {
  try {
    const info = (await ytdlp.getVideoInfo(url)) as { title?: unknown };
    const title = typeof info.title === "string" ? info.title.trim() : "";
    return title || fallback;
  } catch {
    return fallback;
  }
}

export type ProgressEvent =
  | {
      type: "stage";
      stage: "metadata" | "translation" | "subtitles" | "output" | "finished";
    }
  | { type: "videoId"; videoId: string }
  | { type: "translationWaiting"; seconds: number }
  | { type: "translationFinished" }
  | { type: "downloadProgress"; received: number; total?: number }
  | { type: "downloadFinished"; filename: string };

export type ProcessingResult =
  | {
      input: string;
      status: "success";
      type: "audio" | "subtitles";
      videoId: string;
      url: string;
      outputPath?: string;
    }
  | {
      input: string;
      status: "failed";
      type: "audio" | "subtitles";
      videoId: string | null;
      url: null;
      error: string;
    };

type ProcessingContext = {
  values: Partial<Schema>;
  isSubtitles: boolean;
  subtitleFormat: SubtitleFormat;
  client: VOTClient;
  fetchOpts: Record<string, unknown>;
  ytDlpSupported: boolean;
  reserveFilename: (filename: string, ext: string) => string;
};

export async function createProcessingContext(values: Partial<Schema>) {
  const {
    ["worker-host"]: workerHost,
    ["api-token"]: apiToken,
    ["subs-format"]: subtitleFormat,
    out,
    outdir,
    subs,
    subtitles,
    proxy,
  } = values;
  const fetchOpts: Record<string, unknown> = {
    dispatcher: proxy ? new VOTProxyAgent(proxy) : new VOTAgent(),
  };
  const isWorker = Boolean(workerHost);
  const client = new VOTClient({
    host: workerHost,
    fetchOpts,
    apiToken,
    provider: isWorker ? VOTNextWorkerProvider : YandexProvider,
  });
  const outDir = path.resolve(out ?? outdir ?? ".");
  const reservedFilenames = new Set<string>();

  return {
    values,
    isSubtitles: subs ?? subtitles ?? false,
    subtitleFormat: subtitleFormat ?? "srt",
    client,
    fetchOpts,
    ytDlpSupported: await isYtDlpSupported(),
    reserveFilename(filename: string, ext: string) {
      let safeFilename = validateFilename(outDir, filename, ext);
      while (reservedFilenames.has(safeFilename)) {
        safeFilename = validateFilename(
          outDir,
          `${filename}_${reservedFilenames.size + 1}`,
          ext,
        );
      }

      reservedFilenames.add(safeFilename);
      return safeFilename;
    },
  } satisfies ProcessingContext;
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

async function translateVideo(
  context: ProcessingContext,
  videoData: VideoData,
  useLivelyVoice = true,
  onProgress?: (event: ProgressEvent) => void,
): Promise<TranslatedVideoTranslationResponse> {
  const { values, client } = context;
  const requestLang = values.lang as RequestLang;
  const responseLang = values.reslang as ResponseLang;
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const result = await client.translateVideo({
      videoData,
      requestLang,
      responseLang,
      extraOpts: {
        useLivelyVoice:
          useLivelyVoice &&
          isLivelyVoiceAllowed(
            requestLang,
            responseLang,
            client.provider.apiToken,
          ),
      },
    });

    if (result.translated && result.remainingTime < 1) {
      onProgress?.({ type: "translationFinished" });
      return result;
    }

    onProgress?.({ type: "translationWaiting", seconds: result.remainingTime });
    // eslint-disable-next-line no-await-in-loop
    await delay(30_000);
  }
}

async function downloadFile(
  src: string,
  outputPath: string,
  fetchOpts: Record<string, unknown>,
  onProgress?: (event: ProgressEvent) => void,
) {
  let ownsOutput = false;
  let body: ReadableStream<Uint8Array> | null = null;
  let writerClosed: Promise<void> | undefined;

  try {
    const res = await fetch(src, {
      headers: { "User-Agent": VOTConfig.userAgent },
      ...fetchOpts,
    });
    body = res.body as ReadableStream<Uint8Array> | null;
    if (!res.ok) throw new Error("Response isn't ok");
    if (!body) throw new Error("Body is null");

    const contentLength = Number(res.headers.get("Content-Length"));
    const hasContentLength =
      Number.isFinite(contentLength) && contentLength > 0;
    let receivedLength = 0;
    const writer = createWriteStream(outputPath, { flags: "wx" });
    writerClosed = finished(writer).catch(() => {});
    writer.once("open", () => {
      ownsOutput = true;
    });
    await pipeline(
      Readable.fromWeb(body as unknown as NodeReadableStream),
      async function* (source) {
        for await (const value of source) {
          receivedLength += value.length;
          onProgress?.({
            type: "downloadProgress",
            received: receivedLength,
            ...(hasContentLength ? { total: contentLength } : {}),
          });
          yield value;
        }
      },
      writer,
    );
  } catch (err) {
    if (body && !body.locked) await body.cancel().catch(() => {});
    await writerClosed;
    const cleanupError = ownsOutput
      ? await fs.unlink(outputPath).then(
          () => undefined,
          (unlinkError: unknown) => unlinkError ?? new Error("Unknown error"),
        )
      : undefined;
    if (cleanupError) {
      throw new Error(
        `Failed to download audio, because ${errorMessage(err)}; additionally failed to remove partial output: ${errorMessage(cleanupError)}`,
        { cause: err },
      );
    }
    throw new Error(`Failed to download audio, because ${errorMessage(err)}`, {
      cause: err,
    });
  }

  onProgress?.({
    type: "downloadFinished",
    filename: outputPath.split(/\\|\//).pop()!,
  });
}

async function downloadSubtitle(
  src: string,
  outputPath: string,
  subtitleFormat: SubtitleFormat,
  fetchOpts: Record<string, unknown>,
  onProgress?: (event: ProgressEvent) => void,
) {
  try {
    const res = await fetch(src, {
      headers: { "User-Agent": VOTConfig.userAgent },
      ...fetchOpts,
    });
    if (!res.ok) throw new Error("Response isn't ok");
    let data = await res.text();
    if (subtitleFormat !== "json") {
      data = convertSubs(
        JSON.parse(data) as SubtitlesData,
        subtitleFormat,
      ) as string;
    }
    await fs.writeFile(outputPath, data, { flag: "wx" });
    onProgress?.({
      type: "downloadFinished",
      filename: outputPath.split(/\\|\//).pop()!,
    });
  } catch (err) {
    throw new Error(
      `Failed to download subtitle, because ${errorMessage(err)}`,
      { cause: err },
    );
  }
}

export async function processUrl(
  input: string,
  context: ProcessingContext,
  onProgress?: (event: ProgressEvent) => void,
): Promise<ProcessingResult> {
  const type = context.isSubtitles ? "subtitles" : "audio";
  let videoId: string | null = null;
  try {
    onProgress?.({ type: "stage", stage: "metadata" });
    const videoData = await getVideoData(input);
    videoId = videoData.videoId;
    onProgress?.({ type: "videoId", videoId });

    let url: string;
    let outputPath: string | undefined;
    if (context.isSubtitles) {
      onProgress?.({ type: "stage", stage: "subtitles" });
      const result = await context.client.getSubtitles({
        videoData,
        requestLang: context.values.lang,
      });
      if (!result.subtitles.length) throw new Error("No subtitles");
      const subtitles = result.subtitles.find(
        (sub) => sub.translatedLanguage === context.values.reslang,
      );
      if (!subtitles) throw new Error("No subtitles with response language");
      url = subtitles.translatedUrl;
    } else {
      onProgress?.({ type: "stage", stage: "translation" });
      url = (
        await translateVideo(
          context,
          videoData,
          context.values["lively-voice"],
          onProgress,
        )
      ).url;
    }

    onProgress?.({ type: "stage", stage: "output" });
    if (!context.values.preview) {
      const outfile = context.values.outfile;
      const base =
        outfile || context.values["no-title"] || !context.ytDlpSupported
          ? (outfile ?? videoId)
          : await getVideoTitle(input, videoId);
      const filename = context.reserveFilename(
        base,
        context.isSubtitles ? context.subtitleFormat : "mp3",
      );
      outputPath = path.join(
        path.resolve(context.values.out ?? context.values.outdir ?? "."),
        filename,
      );
      if (context.isSubtitles) {
        await downloadSubtitle(
          url,
          outputPath,
          context.subtitleFormat,
          context.fetchOpts,
          onProgress,
        );
      } else {
        await downloadFile(url, outputPath, context.fetchOpts, onProgress);
      }
    }

    onProgress?.({ type: "stage", stage: "finished" });
    return {
      input,
      status: "success",
      type,
      videoId,
      url,
      ...(outputPath ? { outputPath } : {}),
    };
  } catch (err) {
    return {
      input,
      status: "failed",
      type,
      videoId,
      url: null,
      error: errorMessage(err),
    };
  }
}
