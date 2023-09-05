import yandexRawRequest from "./yandexRawRequest.js";
import yandexProtobuf from "./yandexProtobuf.js";
import getUUID from "./utils/getUUID.js";
import getSignature from "./utils/getSignature.js";
import logger from "./utils/logger.js";

// Request video translation from Yandex API
async function requestVideoTranslation(
  url,
  duration,
  requestLang,
  responseLang,
  translationHelp,
  callback,
) {
  try {
    logger.debug("requestVideoTranslation");
    // Initialize variables
    const body = yandexProtobuf.encodeTranslationRequest(
      url,
      duration,
      requestLang,
      responseLang,
      translationHelp,
    );
    // Send the request
    await yandexRawRequest(
      "/video-translation/translate",
      body,
      {
        "Vtrans-Signature": await getSignature(body),
        "Sec-Vtrans-Token": getUUID(false),
      },
      callback,
    );
  } catch (exception) {
    // console.error(chalk.red("[VOT-CLI] Link:", url, exception));
    // Handle errors
    callback(false);
  }
}

// Request video subtitles from Yandex API
async function requestVideoSubtitles(url, requestLang, callback) {
  try {
    logger.debug("requestVideoSubtitles");
    // Initialize variables
    const body = yandexProtobuf.encodeSubtitlesRequest(url, requestLang);
    // Send the request
    await yandexRawRequest(
      "/video-subtitles/get-subtitles",
      body,
      {
        "Vsubs-Signature": await getSignature(body),
        "Sec-Vsubs-Token": getUUID(false),
      },
      callback,
    );
  } catch (exception) {
    // console.error(chalk.red("[VOT-CLI] Link:", url, exception));
    // Handle errors
    callback(false);
  }
}

export default {
  requestVideoTranslation,
  requestVideoSubtitles,
};
