import { Listr } from "listr2";

import phrases from "./resources/phrases";
import type { ArgsInfo } from "./types/args";
import { createProcessingContext, processUrl } from "./processor";

function progressTitle(
  input: string,
  videoId: string | undefined,
  stage: string,
) {
  const title = phrases.PerformingVariousTasksURL.replace(
    "{0}",
    videoId ?? input,
  );
  return stage ? `${title}: ${stage}` : title;
}

export async function executeVOT({ values, positionals }: ArgsInfo) {
  const { outfile, preview, json, ["no-visual"]: noVisual } = values;
  if (outfile && !preview && positionals.length > 1) {
    throw new Error("--outfile can only be used with a single URL");
  }

  const context = await createProcessingContext(values);
  const results: (Awaited<ReturnType<typeof processUrl>> | undefined)[] =
    Array.from({ length: positionals.length });
  const isOutputOnly = noVisual || json;
  const tasks = new Listr(
    positionals.map((input, index) => ({
      title: progressTitle(input, undefined, ""),
      rendererOptions: { persistentOutput: true },
      task: async (_ctx, task) => {
        let currentVideoId: string | undefined;
        const setStage = (text: string) => {
          task.title = progressTitle(input, currentVideoId, text);
        };
        const result = await processUrl(input, context, (event) => {
          if (event.type === "videoId") {
            currentVideoId = event.videoId;
            setStage("");
          } else if (event.type === "stage") {
            const stage = {
              metadata: phrases.GettingVideoData,
              translation: phrases.TranslatingVideo,
              subtitles: phrases.GettingSubtitles,
              output: phrases.AfterProcessActions,
              finished: phrases.Finish,
            }[event.stage];
            if (event.stage === "metadata") currentVideoId = undefined;
            setStage(stage);
          } else if (event.type === "translationWaiting") {
            setStage(
              phrases.WaitingTranslationWithSecs.replace(
                "{0}",
                String(event.seconds),
              ),
            );
          } else if (event.type === "audioUpload") {
            setStage(
              phrases.UploadingAudioWithChunks.replace(
                "{0}",
                String(event.chunks),
              ),
            );
          } else if (event.type === "audioUploadFailed") {
            task.output = phrases.AudioUploadFailed.replace("{0}", event.error);
          } else if (event.type === "translationFinished") {
            setStage(phrases.VideoSuccessfullyTranslated);
          } else if (event.type === "downloadProgress") {
            setStage(
              event.total
                ? phrases.DownloadingWithPercent.replace(
                    "{0}",
                    ((event.received / event.total) * 100).toFixed(2),
                  )
                : phrases.DownloadingWithBytes.replace(
                    "{0}",
                    String(event.received),
                  ),
            );
          } else if (event.type === "downloadFinished") {
            setStage(
              phrases.SuccessDownloadFile.replace("{0}", event.filename),
            );
          }
        });
        results[index] = result;
        if (result.status === "failed") throw new Error(result.error);

        if (!isOutputOnly && preview) {
          const phrase = (
            result.type === "subtitles"
              ? phrases.SubtitlesLinkOutput
              : phrases.TranslationLinkOutput
          )
            .replace("{0}", result.videoId)
            .replace("{1}", result.url);
          process.stdout.write(`${phrase}\n`);
        }

        currentVideoId = result.videoId;
        setStage(phrases.ProccessFinished.replace("{0}", result.videoId));
      },
    })),
    {
      concurrent: 5,
      exitOnError: false,
      collectErrors: !isOutputOnly,
      silentRendererCondition: isOutputOnly,
    },
  );

  await tasks.run();
  if (!isOutputOnly) {
    return {
      mode: "visual" as const,
      failed:
        Boolean(tasks.errors?.length) ||
        results.some((result) => !result || result.status === "failed"),
    };
  }

  const outputResults = positionals.map((input, index) => {
    const result = results[index];
    if (result) return result;
    return {
      input,
      status: "failed" as const,
      type: context.isSubtitles ? ("subtitles" as const) : ("audio" as const),
      videoId: null,
      url: null,
      error: "Unknown error",
    };
  });
  return {
    mode: "output" as const,
    results: outputResults,
    hasSuccess: outputResults.some(({ status }) => status === "success"),
    failed: outputResults.some(({ status }) => status === "failed"),
  };
}
