import yandexRequests from "./yandexRequests.js";
import yandexProtobuf from "./yandexProtobuf.js";

export default async function translateVideo(
  url,
  requestLang,
  responseLang,
  translationHelp,
  callback,
) {
  // TODO: Use real duration (maybe)
  // 0x40_75_50_00_00_00_00_00
  const duration = 341;
  await yandexRequests.requestVideoTranslation(
    url,
    duration,
    requestLang,
    responseLang,
    translationHelp,
    (success, response) => {
      // console.log(success, response)
      if (!success) {
        callback(false, "Failed to request video translation");
        return;
      }

      const translateResponse =
        yandexProtobuf.decodeTranslationResponse(response);
      // console.log(translateResponse)
      switch (translateResponse.status) {
        case 0:
          callback(false, translateResponse.message);
          return;
        case 1: {
          const hasUrl = translateResponse.url != null;
          callback(
            hasUrl,
            hasUrl ? translateResponse.url : "Audio link not received",
          );
          return;
        }
        case 2:
          callback(false, "The translation will take a few minutes");
          return;
      }
    },
  );
}
