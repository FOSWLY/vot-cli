#!/usr/bin/env node
import fs from "fs";

import chalk from "chalk";
import parseArgs from "minimist";
import { Listr } from "listr2";
import { v4 as uuidv4 } from "uuid";

import { availableLangs, additionalTTS } from "./config/constants.js";
import validate from "./utils/validator.js";
import getVideoId from "./utils/getVideoId.js";
import translateVideo from "./translateVideo.js";
import downloadFile from "./download.js";
import { clearFileName } from "./utils/utils.js";
import yandexRequests from "./yandexRequests.js";
import yandexProtobuf from "./yandexProtobuf.js";
import parseProxy from "./proxy.js";
import coursehunterUtils from "./utils/coursehunter.js";

const version = "1.4.2";
const HELP_MESSAGE = `
A small script that allows you to download an audio translation from Yandex via the terminal.

Usage:
  vot-cli [options] [args] <link> [link2] [link3] ...

Args:
  --output — Set the directory to download
  --output-file — Set the file name to download (requires specifying a dir to download in "--output" argument)
  --lang — Set the source video language
  --reslang — Set the audio track language (You can see all supported languages in the documentation. Default: ru)
  --proxy — Set proxy in format ([<PROTOCOL>://]<USERNAME>:<PASSWORD>@<HOST>[:<port>])
  --force-proxy — Don't start the transfer if the proxy could not be identified (true | false. Default: false)

Options:
  -h, --help — Show help
  -v, --version — Show version
  --subs, --subtitles — Get video subtitles instead of audio (the subtitle language for saving is taken from --reslang)
`;

// LANG PAIR
let REQUEST_LANG = "en";
let RESPONSE_LANG = "ru";
let proxyData = false;

// ARG PARSER
const argv = parseArgs(process.argv.slice(2));

const ARG_LINKS = argv._;
const OUTPUT_DIR = argv.output;
const OUTPUT_FILE = argv["output-file"];
const IS_SUBS_FORMAT_SRT = argv["subs-srt"] || argv["subtitles-srt"];
const RESPONSE_SUBTITLES_FORMAT = IS_SUBS_FORMAT_SRT ? "srt" : "json";
const IS_SUBS_REQ = argv.subs || argv.subtitles || IS_SUBS_FORMAT_SRT;
const ARG_HELP = argv.help || argv.h;
const ARG_VERSION = argv.version || argv.v;
const PROXY_STRING = argv.proxy;
let FORCE_PROXY = argv["force-proxy"] ?? false;

if (availableLangs.includes(argv.lang)) {
  REQUEST_LANG = argv.lang;
  console.log(`Request language is set to ${REQUEST_LANG}`);
}

if (
  additionalTTS.includes(argv.reslang) ||
  (Boolean(IS_SUBS_REQ) && argv.reslang)
) {
  RESPONSE_LANG = argv.reslang;
  console.log(`Response language is set to ${RESPONSE_LANG}`);
}

if (PROXY_STRING) {
  proxyData = parseProxy(PROXY_STRING);
}

if (FORCE_PROXY && !proxyData) {
  throw new Error(
    chalk.red(
      "vot-cli operation was interrupted due to the force-proxy option",
    ),
  );
}

// TASKS
const tasks = new Listr([], {
  concurrent: true,
  exitOnError: false,
});

const translate = async (finalURL, task) => {
  let translateData;

  try {
    await translateVideo(
      finalURL,
      REQUEST_LANG,
      RESPONSE_LANG,
      null,
      proxyData,
      (success, urlOrError) => {
        if (success) {
          if (!urlOrError) {
            throw new Error(
              chalk.red("The response doesn't contain a download link"),
            );
          }

          task.title = "Video translated successfully.";
          console.info(`Audio Link (${finalURL}): "${chalk.gray(urlOrError)}"`);
          translateData = {
            success,
            urlOrError,
          };

          return;
        }

        if (urlOrError === "The translation will take a few minutes") {
          task.title = `The translation is slightly delayed...`;
        } else {
          throw new Error(chalk.red(urlOrError));
        }
      },
    );
  } catch (e) {
    return {
      success: false,
      urlOrError: e.message,
    };
  }

  return translateData;
};

const fetchSubtitles = async (finalURL, task) => {
  let subtitlesData;

  try {
    await yandexRequests.requestVideoSubtitles(
      finalURL,
      REQUEST_LANG,
      proxyData,
      (success, response) => {
        if (!success) {
          throw new Error(chalk.red("Failed to get Yandex subtitles"));
        }

        const subtitlesResponse =
          yandexProtobuf.decodeSubtitlesResponse(response);

        let subtitles = subtitlesResponse.subtitles ?? [];
        subtitles = subtitles.reduce((result, yaSubtitlesObject) => {
          if (
            yaSubtitlesObject.language &&
            !result.find((e) => {
              if (
                e.source === "yandex" &&
                e.language === yaSubtitlesObject.language &&
                !e.translatedFromLanguage
              ) {
                return e;
              }
            })
          ) {
            result.push({
              source: "yandex",
              language: yaSubtitlesObject.language,
              url: yaSubtitlesObject.url,
            });
          }
          if (yaSubtitlesObject.translatedLanguage) {
            result.push({
              source: "yandex",
              language: yaSubtitlesObject.translatedLanguage,
              translatedFromLanguage: yaSubtitlesObject.language,
              url: yaSubtitlesObject.translatedUrl,
            });
          }
          return result;
        }, []);

        task.title = "Subtitles for the video have been received.";
        console.info(
          `Subtitles response (${finalURL}): "${chalk.gray(
            JSON.stringify(subtitles, null, 2),
          )}"`,
        );

        subtitlesData = {
          success: true,
          subsOrError: subtitles,
        };
      },
    );
  } catch (e) {
    return {
      success: false,
      subsOrError: e.message,
    };
  }

  return subtitlesData;
};

async function main() {
  if (ARG_LINKS.length === 0) {
    if (ARG_HELP) {
      return console.log(HELP_MESSAGE);
    } else if (ARG_VERSION) {
      return console.log(`vot-cli ${version}`);
    } else {
      return console.error(chalk.red("No links provided"));
    }
  }

  if (Boolean(OUTPUT_DIR) && !fs.existsSync(OUTPUT_DIR)) {
    try {
      fs.mkdirSync(OUTPUT_DIR);
    } catch {
      throw new Error("Invalid output directory");
    }
  }

  for (const url of ARG_LINKS) {
    const service = validate(url);
    if (!service) {
      console.error(chalk.red(`URL: ${url} is unknown service`));
      continue;
    }

    let videoId = getVideoId(service.host, url);
    if (
      typeof videoId === "object" &&
      ["coursehunter"].includes(service.host)
    ) {
      const [statusOrID, lessonId] = videoId;
      if (!statusOrID) {
        console.error(chalk.red(`Entered unsupported link: ${url}`));
        continue;
      }

      const coursehunterData = await coursehunterUtils
        .getVideoData(statusOrID, lessonId)
        .then((data) => data);

      videoId = coursehunterData.url;
    }

    if (!videoId) {
      console.error(chalk.red(`Entered unsupported link: ${url}`));
      continue;
    }

    tasks.add([
      {
        title: `Performing various tasks (ID: ${videoId}).`,
        task: async (ctx, task) =>
          task.newListr(
            (parent) => [
              {
                title: `Forming a link to the video`,
                task: async () => {
                  const finalURL =
                    videoId.startsWith("https://") || service.host === "custom"
                      ? videoId
                      : `${service.url}${videoId}`;
                  if (!finalURL) {
                    throw new Error(`Entered unsupported link: ${finalURL}`);
                  }
                  parent.finalURL = finalURL;
                },
              },
              {
                title: `Translating (ID: ${videoId}).`,
                enabled: !IS_SUBS_REQ,
                exitOnError: false,
                task: async (ctxSub, subtask) => {
                  // ! TODO: НЕ РАБОТАЕТ ЕСЛИ ВИДЕО НЕ ИМЕЕТ ПЕРЕВОДА
                  await new Promise(async (resolve, reject) => {
                    try {
                      let result;
                      result = await translate(parent.finalURL, subtask);
                      // console.log("transalting", result)
                      if (typeof result !== "object") {
                        await new Promise(async (resolve) => {
                          const intervalId = setInterval(async () => {
                            // console.log("interval...", result)
                            result = await translate(parent.finalURL, subtask);
                            if (typeof result === "object") {
                              // console.log("finished", parent.translateResult)
                              clearInterval(intervalId);
                              resolve(result);
                            }
                          }, 30000);
                        });
                      }
                      // console.log("translated", result)
                      parent.translateResult = result;
                      if (!result.success) {
                        subtask.title = result.urlOrError;
                      }
                      resolve(result);
                    } catch (e) {
                      reject(e);
                    }
                  });
                },
              },
              {
                title: `Fetching subtitles (ID: ${videoId}).`,
                enabled: Boolean(IS_SUBS_REQ),
                exitOnError: false,
                task: async (ctxSub, subtask) => {
                  await new Promise(async (resolve, reject) => {
                    try {
                      let result;
                      result = await fetchSubtitles(parent.finalURL, subtask);
                      parent.translateResult = result;
                      if (!result.success) {
                        subtask.title = result.urlOrError;
                      }
                      resolve(result);
                    } catch (e) {
                      reject(e);
                    }
                  });
                },
              },
              {
                title: `Downloading (ID: ${videoId}).`,
                exitOnError: false,
                enabled: Boolean(OUTPUT_DIR) && !IS_SUBS_REQ,
                task: async (ctxSub, subtask) => {
                  // * Video download

                  if (
                    !(
                      parent.translateResult?.success &&
                      parent.translateResult?.urlOrError
                    )
                  ) {
                    throw new Error(
                      chalk.red(
                        `Downloading failed! Link "${parent.translateResult?.urlOrError}" not found`,
                      ),
                    );
                  }

                  const taskSubTitle = `(ID: ${videoId})`;
                  const filename = OUTPUT_FILE
                    ? OUTPUT_FILE.endsWith(".mp3")
                      ? OUTPUT_FILE
                      : `${OUTPUT_FILE}.mp3`
                    : `${clearFileName(videoId)}---${uuidv4()}.mp3`;
                  await downloadFile(
                    parent.translateResult.urlOrError,
                    `${OUTPUT_DIR}/${filename}`,
                    subtask,
                    `(ID: ${videoId} as ${filename})`,
                  )
                    .then(() => {
                      subtask.title = `Download ${taskSubTitle} completed!`;
                    })
                    .catch((e) => {
                      subtask.title = `Error. Download ${taskSubTitle} failed! Reason: ${e.message}`;
                    });
                },
              },
              {
                title: `Downloading (ID: ${videoId}).`,
                exitOnError: false,
                enabled: Boolean(OUTPUT_DIR) && Boolean(IS_SUBS_REQ),
                task: async (ctxSub, subtask) => {
                  // * Subs download

                  if (
                    !(
                      parent.translateResult?.success &&
                      parent.translateResult?.subsOrError
                    )
                  ) {
                    throw new Error(
                      chalk.red(
                        `Downloading failed! Link "${parent.translateResult?.subsOrError}" not found`,
                      ),
                    );
                  }

                  const subOnReqLang = parent.translateResult.subsOrError.find(
                    (s) => s.language === RESPONSE_LANG,
                  );
                  if (!subOnReqLang) {
                    throw new Error(
                      chalk.red(
                        `Downloading failed! Failed to find ${RESPONSE_LANG} in the resulting list of subtitles`,
                      ),
                    );
                  }

                  const taskSubTitle = `(ID: ${videoId})`;
                  const filename = OUTPUT_FILE
                    ? OUTPUT_FILE.endsWith(`.${RESPONSE_SUBTITLES_FORMAT}`)
                      ? OUTPUT_FILE
                      : `${OUTPUT_FILE}.${RESPONSE_SUBTITLES_FORMAT}`
                    : `${subOnReqLang.language}---${clearFileName(
                        videoId,
                      )}---${uuidv4()}.${RESPONSE_SUBTITLES_FORMAT}`;
                  await downloadFile(
                    subOnReqLang.url,
                    `${OUTPUT_DIR}/${filename}`,
                    subtask,
                    `(ID: ${videoId} as ${filename})`,
                  )
                    .then(() => {
                      subtask.title = `Download ${taskSubTitle} completed!`;
                    })
                    .catch((e) => {
                      subtask.title = `Error. Download ${taskSubTitle} failed! Reason: ${e.message}`;
                    });
                },
              },
              {
                title: `Finish (ID: ${videoId}).`,
                task: () => {
                  parent.title = `Translating finished! (ID: ${videoId}).`;
                },
              },
            ],
            {
              concurrent: false,
              rendererOptions: {
                collapseSubtasks: false,
              },
              exitOnError: false,
            },
          ),
      },
    ]);
  }

  try {
    await tasks.run();
  } catch (e) {
    console.error(e);
  }
}

await main().catch((e) => {
  console.error(chalk.red("[VOT]", e));
});
