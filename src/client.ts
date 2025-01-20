import fs from "node:fs/promises";
import path from "node:path";
import fsSync from "node:fs";

import { Listr, ListrTask } from "listr2";
import VOTConfig from "@vot.js/shared/config";
import { LoggerLevel } from "@vot.js/shared/types/logger";

VOTConfig.loggerLevel = LoggerLevel.SILENCE;

import VOTClient, { VOTWorkerClient } from "@vot.js/node";
import { VideoData, VOTOpts } from "@vot.js/core/types/client";
import { TranslatedVideoTranslationResponse } from "@vot.js/core/types/yandex";
import { getVideoData } from "@vot.js/node/utils/videoData";
import { VOTAgent, VOTProxyAgent } from "@vot.js/node/utils/fetchAgent";
import { SubtitlesObject } from "@vot.js/shared/protos";
import { SubtitleFormat, SubtitlesData } from "@vot.js/shared/types/subs";
import { RequestLang, ResponseLang } from "@vot.js/shared/types/data";
import { convertSubs } from "@vot.js/shared/utils/subs";

import phrases from "./resources/phrases";
import { ArgsInfo } from "./types/args";

type CtxItem = {
  videoData: VideoData;
  translationResult?: TranslatedVideoTranslationResponse;
  subtitles?: SubtitlesObject;
};

type Ctx = Record<string, CtxItem>;

async function translateVideoImpl(
  task: ListrTask,
  client: VOTWorkerClient,
  videoData: VideoData,
  requestLang: RequestLang,
  responseLang: ResponseLang,
  useNewModel = true,
  timer: ReturnType<typeof setTimeout> | undefined = undefined,
): Promise<TranslatedVideoTranslationResponse> {
  clearTimeout(timer);
  const res = await client.translateVideo({
    videoData,
    requestLang,
    responseLang,
    extraOpts: {
      useNewModel,
    },
  });

  if (res.translated && res.remainingTime < 1) {
    task.title = phrases.VideoSuccessfullyTranslated;
    return res;
  }

  task.title = phrases.WaitingTranslationWithSecs.replace(
    "{0}",
    String(res.remainingTime),
  );

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    timer = setTimeout(async () => {
      try {
        const res = await translateVideoImpl(
          task,
          client,
          videoData,
          requestLang,
          responseLang,
          useNewModel,
          timer,
        );
        if (res.translated && res.remainingTime < 1) {
          task.title = phrases.VideoSuccessfullyTranslated;
          resolve(res);
        }
      } catch (err) {
        reject(err as Error);
      }
    }, 30_000);
  });
}

function validateFilename(outdir: string, filename: string, ext = "mp3") {
  filename = filename.replace(/[\\/:*?"'<>|]/g, "");
  const file = `${filename}.${ext}`;
  const exist = fsSync.existsSync(path.join(outdir, file));
  if (!exist) {
    return file;
  }

  return `${filename}_${Date.now()}.${ext}`;
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

    const contentLength = parseInt(res.headers.get("Content-Length") ?? "0");
    let receivedLength = 0;
    const chunks = [];

    for await (const value of readable) {
      chunks.push(value);
      receivedLength += value.length;
      const percent = ((receivedLength / contentLength) * 100).toFixed(2);
      task.title = phrases.DownloadingWithPercent.replace("{0}", percent);
    }

    await fs.writeFile(outputPath, chunks);

    const filename = outputPath.split(/\\|\//).pop()!;
    task.title = phrases.SuccessDownloadFile.replace("{0}", filename);
  } catch (err) {
    throw new Error(
      `Failed to download audio, because ${(err as Error).message}`,
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

    await fs.writeFile(outputPath, data);

    const filename = outputPath.split(/\\|\//).pop()!;
    task.title = phrases.SuccessDownloadFile.replace("{0}", filename);
  } catch (err) {
    throw new Error(
      `Failed to download subtitle, because ${(err as Error).message}`,
    );
  }
}

export async function executeVOT({ values, positionals }: ArgsInfo) {
  const {
    ["worker-host"]: workerHost,
    ["vot-host"]: votHost,
    ["old-model"]: useOldModel,
    ["no-visual"]: noVisual,
    ["subs-format"]: subtitleFormat,
    outfile,
    out,
    outdir,
    reslang: responseLang,
    lang: requestLang,
    subs,
    subtitles,
    preview,
    proxy,
  } = values;

  const useNewModel = !useOldModel;
  const isSubtitles = subs ?? subtitles ?? false;
  const outDirName = out ?? outdir;
  const outDir =
    outDirName && path.isAbsolute(outDirName)
      ? path.join(outDirName)
      : path.join(__dirname);
  const fetchOpts: Record<string, unknown> = {
    dispatcher: proxy ? new VOTProxyAgent(proxy) : new VOTAgent(),
  };
  const clientOpts: VOTOpts = {
    host: workerHost,
    hostVOT: votHost,
    fetchOpts,
  };
  const client = new (workerHost ? VOTWorkerClient : VOTClient)(clientOpts);

  const tasks: Listr<Ctx> = new Listr<Ctx>(
    positionals.map((positional) => {
      return {
        title: phrases.PerformingVariousTasksURL.replace("{0}", positional),
        task: (ctx, task) =>
          task.newListr(
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
                task: async (_, task) => {
                  const currentCtx = ctx[positional];

                  currentCtx.translationResult = await translateVideoImpl(
                    task as unknown as ListrTask,
                    client,
                    currentCtx.videoData,
                    requestLang as RequestLang,
                    responseLang as ResponseLang,
                    useNewModel,
                  );
                },
              },
              {
                title: phrases.GettingSubtitles,
                enabled: isSubtitles,
                task: async (_) => {
                  const currentCtx = ctx[positional];

                  const result = await client.getSubtitles({
                    videoData: currentCtx.videoData,
                    requestLang,
                  });
                  if (!result.subtitles.length) {
                    throw new Error("No subtitles");
                  }

                  const subtitles = result.subtitles.find(
                    (sub) => sub.translatedLanguage === responseLang,
                  );
                  if (!subtitles) {
                    throw new Error("No subtitles with response language");
                  }

                  currentCtx.subtitles = subtitles;
                },
              },
              {
                title: phrases.AfterProcessActions,
                enabled: !isSubtitles,
                task: async (_, task) => {
                  const currentCtx = ctx[positional];
                  if (noVisual && preview) {
                    return;
                  }

                  if (preview) {
                    const phrase = phrases.TranslationLinkOutput.replace(
                      "{0}",
                      currentCtx.videoData.videoId,
                    ).replace("{1}", currentCtx.translationResult!.url);
                    process.stdout.write(phrase);
                    return true;
                  }

                  const filename = validateFilename(
                    outDir,
                    outfile ?? currentCtx.videoData.videoId,
                    "mp3",
                  );

                  const outputPath = path.join(outDir, filename);
                  await downloadFile(
                    currentCtx.translationResult!.url,
                    task as unknown as ListrTask,
                    outputPath,
                    fetchOpts,
                  );
                },
              },
              {
                title: phrases.AfterProcessActions,
                enabled: isSubtitles,
                task: async (_, task) => {
                  const currentCtx = ctx[positional];
                  if (noVisual && preview) {
                    return;
                  }

                  if (preview) {
                    const phrase = phrases.SubtitlesLinkOutput.replace(
                      "{0}",
                      currentCtx.videoData.videoId,
                    ).replace("{1}", currentCtx.subtitles!.translatedUrl);
                    process.stdout.write(phrase);
                    return true;
                  }

                  const filename = validateFilename(
                    outDir,
                    outfile ?? currentCtx.videoData.videoId,
                    subtitleFormat,
                  );

                  const outputPath = path.join(outDir, filename);
                  await downloadSubtitle(
                    currentCtx.subtitles!.translatedUrl,
                    task as unknown as ListrTask,
                    outputPath,
                    subtitleFormat,
                    fetchOpts,
                  );
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
      silentRendererCondition: noVisual,
    },
  );

  await tasks.run();
  if (!noVisual) {
    return;
  }

  let isFailed = true;
  const result = Object.values(tasks.ctx)
    .map((context) => {
      if (Object.hasOwn(context, "translationResult")) {
        isFailed = false;
        return context.translationResult!.url;
      }

      if (Object.hasOwn(context, "subtitles")) {
        isFailed = false;
        return context.subtitles!.translatedUrl;
      }

      return "FAILED";
    })
    .join("\n");
  process[isFailed ? "stderr" : "stdout"].write(result);
}
