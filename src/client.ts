import fs from "node:fs/promises";
import path from "node:path";

import { Listr, ListrTask } from "listr2";
import VOTConfig from "@vot.js/shared/config";
import { LoggerLevel } from "@vot.js/shared/types/logger";

VOTConfig.loggerLevel = LoggerLevel.SILENCE;

import VOTClient, { VOTWorkerClient } from "@vot.js/node";
import type { VideoData, VOTOpts } from "@vot.js/core/types/client";
import type {
  SubtitleItem,
  TranslatedVideoTranslationResponse,
} from "@vot.js/core/types/yandex";
import { getVideoData } from "@vot.js/node/utils/videoData";
import { VOTAgent, VOTProxyAgent } from "@vot.js/node/utils/fetchAgent";
import type { SubtitleFormat, SubtitlesData } from "@vot.js/shared/types/subs";
import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";
import { convertSubs } from "@vot.js/shared/utils/subs";
import _YTDlpWrap from "yt-dlp-wrap-plus";

import phrases from "./resources/phrases";
import type { ArgsInfo } from "./types/args";
import { isLivelyVoiceAllowed, validateFilename } from "./utils/utils";

// workaround to fix `undefined is not a constructor (evaluating 'new YTDlpWrap')` in node build
const YTDlpWrap = ((_YTDlpWrap as unknown as { default: typeof _YTDlpWrap })
  .default ?? _YTDlpWrap) as typeof _YTDlpWrap;

type CtxItem = {
  videoData: VideoData;
  translationResult?: TranslatedVideoTranslationResponse;
  subtitles?: SubtitleItem;
  outputPath?: string;
};

type Ctx = Record<string, CtxItem>;

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

async function translateVideoImpl(
  task: ListrTask,
  client: VOTWorkerClient,
  videoData: VideoData,
  requestLang: RequestLang,
  responseLang: ResponseLang,
  useLivelyVoice = true,
  timer: ReturnType<typeof setTimeout> | undefined = undefined,
): Promise<TranslatedVideoTranslationResponse> {
  clearTimeout(timer);
  const isLivelyVoice =
    useLivelyVoice &&
    isLivelyVoiceAllowed(requestLang, responseLang, client.apiToken);

  const result = await client.translateVideo({
    videoData,
    requestLang,
    responseLang,
    extraOpts: {
      useLivelyVoice: isLivelyVoice,
    },
  });

  if (result.translated && result.remainingTime < 1) {
    task.title = phrases.VideoSuccessfullyTranslated;
    return result;
  }

  task.title = phrases.WaitingTranslationWithSecs.replace(
    "{0}",
    String(result.remainingTime),
  );

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    timer = setTimeout(async () => {
      try {
        const translationResult = await translateVideoImpl(
          task,
          client,
          videoData,
          requestLang,
          responseLang,
          useLivelyVoice,
          timer,
        );
        if (
          translationResult.translated &&
          translationResult.remainingTime < 1
        ) {
          task.title = phrases.VideoSuccessfullyTranslated;
          resolve(translationResult);
        }
      } catch (err) {
        reject(err as Error);
      }
    }, 30_000);
  });
}

async function downloadFile(
  src: string,
  task: ListrTask,
  outputPath: string,
  fetchOpts: Record<string, any> = {},
) {
  try {
    const res = await fetch(src, {
      headers: {
        "User-Agent": VOTConfig.userAgent,
      },
      ...fetchOpts,
    });
    if (!res.ok) {
      throw new Error("Response isn't ok");
    }

    const readable = res.body as ReadableStream<Uint8Array> | null;
    if (!readable) {
      throw new Error("Body is null");
    }

    const contentLength = Number(res.headers.get("Content-Length"));
    const hasContentLength =
      Number.isFinite(contentLength) && contentLength > 0;
    let receivedLength = 0;
    const chunks = [];

    for await (const value of readable) {
      chunks.push(value);
      receivedLength += value.length;
      task.title = hasContentLength
        ? phrases.DownloadingWithPercent.replace(
            "{0}",
            ((receivedLength / contentLength) * 100).toFixed(2),
          )
        : phrases.DownloadingWithBytes.replace("{0}", String(receivedLength));
    }

    await fs.writeFile(outputPath, chunks, { flag: "wx" });

    const filename = outputPath.split(/\\|\//).pop()!;
    task.title = phrases.SuccessDownloadFile.replace("{0}", filename);
  } catch (err) {
    throw new Error(
      `Failed to download audio, because ${(err as Error).message}`,
      { cause: err },
    );
  }
}

async function downloadSubtitle(
  src: string,
  task: ListrTask,
  outputPath: string,
  subtitleFormat: SubtitleFormat = "srt",
  fetchOpts: Record<string, any> = {},
) {
  try {
    const res = await fetch(src, {
      headers: {
        "User-Agent": VOTConfig.userAgent,
      },
      ...fetchOpts,
    });
    if (!res.ok) {
      throw new Error("Response isn't ok");
    }

    let data = await res.text();
    if (subtitleFormat !== "json") {
      data = convertSubs(
        JSON.parse(data) as SubtitlesData,
        subtitleFormat,
      ) as string;
    }

    await fs.writeFile(outputPath, data, { flag: "wx" });

    const filename = outputPath.split(/\\|\//).pop()!;
    task.title = phrases.SuccessDownloadFile.replace("{0}", filename);
  } catch (err) {
    throw new Error(
      `Failed to download subtitle, because ${(err as Error).message}`,
      { cause: err },
    );
  }
}

export async function executeVOT({ values, positionals }: ArgsInfo) {
  const {
    ["worker-host"]: workerHost,
    ["vot-host"]: votHost,
    ["lively-voice"]: useLivelyVoice,
    ["no-visual"]: noVisual,
    ["no-title"]: noTitle,
    ["subs-format"]: subtitleFormat,
    ["api-token"]: apiToken,
    outfile,
    out,
    outdir,
    reslang: responseLang,
    lang: requestLang,
    subs,
    subtitles,
    preview,
    proxy,
    json,
  } = values;

  const isSubtitles = subs ?? subtitles ?? false;
  const isOutputOnly = noVisual || json;
  const subtitleFormatValue = subtitleFormat ?? "srt";
  const ytDlpSupported = await isYtDlpSupported();
  const getFilenameBase = async (positional: string, videoId: string) => {
    if (outfile || noTitle || !ytDlpSupported) {
      return outfile ?? videoId;
    }

    return await getVideoTitle(positional, videoId);
  };
  const outDirName = out ?? outdir;
  const outDir = path.resolve(outDirName ?? ".");
  const reservedFilenames = new Set<string>();
  const reserveFilename = (filename: string, ext: string) => {
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
  };

  if (outfile && !preview && positionals.length > 1) {
    throw new Error("--outfile can only be used with a single URL");
  }

  const fetchOpts: Record<string, unknown> = {
    dispatcher: proxy ? new VOTProxyAgent(proxy) : new VOTAgent(),
  };
  const clientOpts: VOTOpts = {
    host: workerHost,
    hostVOT: votHost,
    fetchOpts,
    apiToken,
  };
  const client = new (workerHost ? VOTWorkerClient : VOTClient)(clientOpts);

  const tasks: Listr<Ctx> = new Listr<Ctx>(
    positionals.map((positional) => {
      return {
        title: phrases.PerformingVariousTasksURL.replace("{0}", positional),
        task: (ctx, parentTask) =>
          parentTask.newListr(
            (parent) => [
              {
                title: phrases.GettingVideoData,
                task: async () => {
                  ctx[positional] = {
                    videoData: await getVideoData(positional),
                  };

                  parent.title = phrases.PerformingVariousTasksURL.replace(
                    "{0}",
                    ctx[positional].videoData.videoId,
                  );
                },
              },
              {
                title: phrases.TranslatingVideo,
                enabled: !isSubtitles,
                task: async (_, subtask) => {
                  const currentCtx = ctx[positional];

                  currentCtx.translationResult = await translateVideoImpl(
                    subtask as unknown as ListrTask,
                    client,
                    currentCtx.videoData,
                    requestLang as RequestLang,
                    responseLang as ResponseLang,
                    useLivelyVoice,
                  );
                },
              },
              {
                title: phrases.GettingSubtitles,
                enabled: isSubtitles,
                task: async () => {
                  const currentCtx = ctx[positional];

                  const result = await client.getSubtitles({
                    videoData: currentCtx.videoData,
                    requestLang,
                  });
                  if (!result.subtitles.length) {
                    throw new Error("No subtitles");
                  }

                  const selectedSubtitles = result.subtitles.find(
                    (sub) => sub.translatedLanguage === responseLang,
                  );
                  if (!selectedSubtitles) {
                    throw new Error("No subtitles with response language");
                  }

                  currentCtx.subtitles = selectedSubtitles;
                },
              },
              {
                title: phrases.AfterProcessActions,
                enabled: !isSubtitles,
                task: async (_, subtask) => {
                  const currentCtx = ctx[positional];
                  if (isOutputOnly && preview) {
                    return;
                  }

                  if (preview) {
                    const phrase = phrases.TranslationLinkOutput.replace(
                      "{0}",
                      currentCtx.videoData.videoId,
                    ).replace("{1}", currentCtx.translationResult!.url);
                    process.stdout.write(`${phrase}\n`);
                    return true;
                  }

                  const filenameBase = await getFilenameBase(
                    positional,
                    currentCtx.videoData.videoId,
                  );
                  const filename = reserveFilename(filenameBase, "mp3");

                  const outputPath = path.join(outDir, filename);
                  await downloadFile(
                    currentCtx.translationResult!.url,
                    subtask as unknown as ListrTask,
                    outputPath,
                    fetchOpts,
                  );
                  currentCtx.outputPath = outputPath;
                },
              },
              {
                title: phrases.AfterProcessActions,
                enabled: isSubtitles,
                task: async (_, subtask) => {
                  const currentCtx = ctx[positional];
                  if (isOutputOnly && preview) {
                    return;
                  }

                  if (preview) {
                    const phrase = phrases.SubtitlesLinkOutput.replace(
                      "{0}",
                      currentCtx.videoData.videoId,
                    ).replace("{1}", currentCtx.subtitles!.translatedUrl);
                    process.stdout.write(`${phrase}\n`);
                    return true;
                  }

                  const filenameBase = await getFilenameBase(
                    positional,
                    currentCtx.videoData.videoId,
                  );
                  const filename = reserveFilename(
                    filenameBase,
                    subtitleFormatValue,
                  );

                  const outputPath = path.join(outDir, filename);
                  await downloadSubtitle(
                    currentCtx.subtitles!.translatedUrl,
                    subtask as unknown as ListrTask,
                    outputPath,
                    subtitleFormatValue,
                    fetchOpts,
                  );
                  currentCtx.outputPath = outputPath;
                },
              },
              {
                title: phrases.Finish,
                task: () => {
                  const currentCtx = ctx[positional];
                  parent.title = phrases.ProccessFinished.replace(
                    "{0}",
                    currentCtx.videoData.videoId,
                  );
                },
              },
            ],
            {
              concurrent: false,
              rendererOptions: {
                collapseSubtasks: false,
              },
              exitOnError: true,
            },
          ),
      };
    }),
    {
      concurrent: true,
      exitOnError: false,
      silentRendererCondition: isOutputOnly,
    },
  );

  await tasks.run();
  if (!isOutputOnly) {
    return;
  }

  let hasSuccess = false;
  let hasFailed = false;
  let successCount = 0;
  let failedCount = 0;
  const outputType = isSubtitles ? "subtitles" : "audio";
  const results = positionals.map((positional) => {
    const context = tasks.ctx[positional];
    const videoId = context?.videoData.videoId ?? null;
    if (context?.translationResult) {
      hasSuccess = true;
      successCount += 1;
      return {
        input: positional,
        status: "success",
        type: outputType,
        videoId,
        url: context.translationResult.url,
        ...(context.outputPath ? { outputPath: context.outputPath } : {}),
      };
    }

    if (context?.subtitles) {
      hasSuccess = true;
      successCount += 1;
      return {
        input: positional,
        status: "success",
        type: outputType,
        videoId,
        url: context.subtitles.translatedUrl,
        ...(context.outputPath ? { outputPath: context.outputPath } : {}),
      };
    }

    hasFailed = true;
    failedCount += 1;
    return {
      input: positional,
      status: "failed",
      type: outputType,
      videoId,
      url: null,
    };
  });

  if (hasFailed) {
    process.exitCode = 1;
  }

  const output = json
    ? JSON.stringify({
        ok: !hasFailed,
        summary: {
          total: results.length,
          success: successCount,
          failed: failedCount,
        },
        results,
      })
    : results.map((result) => result.url ?? "FAILED").join("\n");

  process[hasSuccess ? "stdout" : "stderr"].write(`${output}\n`);
}
