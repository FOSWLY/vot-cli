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
import logger from "./utils/logger.js";
import downloadFile from "./download.js";

const version = "1.1.0";
const HELP_MESSAGE = `
A small script that allows you to download an audio translation from Yandex via the terminal.

Usage:
  vot-cli [options] [args] <link> [link2] [link3] ...

Args:
  --output — Set the directory to download
  --lang — Set the source video language
  --reslang — Set the audio track language (You can see all supported languages in the documentation. Default: ru)

Options:
  -h, --help — Show help
  -v, --version — Show version
`;

// LANG PAIR
let REQUEST_LANG = "en";
let RESPONSE_LANG = "ru";

// ARG PARSER
const argv = parseArgs(process.argv.slice(2));

const ARG_LINKS = argv._;
const OUTPUT_DIR = argv.output;
const ARG_HELP = argv.help || argv.h;
const ARG_VERSION = argv.version || argv.v;

if (availableLangs.includes(argv.lang)) {
  REQUEST_LANG = argv.lang;
  logger.debug(`Request language is set to ${REQUEST_LANG}`);
}

if ([...availableLangs, ...additionalTTS].includes(argv.reslang)) {
  RESPONSE_LANG = argv.reslang;
  logger.debug(`Response language is set to ${RESPONSE_LANG}`);
}

// TASKS
const tasks = new Listr([], {
  concurrent: true,
  exitOnError: false,
});

const translate = async (finalURL, task) => {
  let test;

  try {
    await translateVideo(
      finalURL,
      REQUEST_LANG,
      RESPONSE_LANG,
      null,
      (success, urlOrError) => {
        if (success) {
          if (!urlOrError) {
            throw new Error(
              chalk.red("The response doesn't contain a download link"),
            );
          }

          task.title = "Video translated successfully.";
          // console.log("TEST", success, urlOrError)
          test = {
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

  return test;
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

    const videoId = getVideoId(service.host, url);
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
                  const finalURL = `${service.url}${videoId}`;
                  if (!finalURL) {
                    throw new Error(`Entered unsupported link: ${finalURL}`);
                  }
                  parent.finalURL = finalURL;
                },
              },
              {
                title: `Translating (ID: ${videoId}).`,
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
                  // console.log("RESULT", res)
                },
              },
              {
                title: `Downloading (ID: ${videoId}).`,
                exitOnError: false,
                enabled: Boolean(OUTPUT_DIR),
                task: async (ctxSub, subtask) => {
                  // await sleep(5000)
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
                  await downloadFile(
                    parent.translateResult.urlOrError,
                    `${OUTPUT_DIR}/${videoId}---${uuidv4()}.mp3`,
                    subtask,
                    `(ID: ${videoId})`,
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
