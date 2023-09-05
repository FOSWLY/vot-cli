import protobuf from 'protobufjs';
import crypto from 'crypto';
import axios from 'axios';

const yandexHmacKey = "xtGCyGdTY2Jy6OMEKdTuXev3Twhkamgm";
const yandexUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 YaBrowser/23.7.1.1140 Yowser/2.5 Safari/537.36";

const VideoTranslationRequest = new protobuf.Type("VideoTranslationRequest")
  .add(new protobuf.Field("url", 3, "string"))
  .add(new protobuf.Field("deviceId", 4, "string")) // removed?
  .add(new protobuf.Field("firstRequest", 5, "bool")) // true for the first request, false for subsequent ones
  .add(new protobuf.Field("duration", 6, "double"))
  .add(new protobuf.Field("unknown2", 7, "int32")) // 1 1
  .add(new protobuf.Field("language", 8, "string")) // source language code
  .add(new protobuf.Field("unknown3", 9, "int32")) // 0 0
  .add(new protobuf.Field("unknown4", 10, "int32")) // 0 0
  .add(new protobuf.Field("translationHelp", 11, "int32")) // array for translation assistance ([0] -> {2: link to video, 1: "video_file_url"}, [1] -> {2: link to subtitles, 1: "subtitles_file_url"})
  .add(new protobuf.Field("responseLanguage", 14, "string")); // target language code

const VideoSubtitlesRequest = new protobuf.Type("VideoSubtitlesRequest")
  .add(new protobuf.Field("url", 1, "string"))
  .add(new protobuf.Field("language", 2, "string")); // source language code

const VideoTranslationResponse = new protobuf.Type("VideoTranslationResponse")
  .add(new protobuf.Field("url", 1, "string"))
  .add(new protobuf.Field("duration", 2, "double"))
  .add(new protobuf.Field("status", 4, "int32")) // status
  .add(new protobuf.Field("remainingTime", 5, "int32")) // secs before translation
  .add(new protobuf.Field("unknown0", 6, "int32")) // unknown 0 (1st request) -> 10 (2nd, 3th and etc requests)
  .add(new protobuf.Field("unknown1", 7, "string"))
  .add(new protobuf.Field("language", 8, "string")) // detected language (if the wrong one is set)
  .add(new protobuf.Field("message", 9, "string"));

const VideoSubtitlesObject = new protobuf.Type("VideoSubtitlesObject")
  .add(new protobuf.Field("language", 1, "string"))
  .add(new protobuf.Field("url", 2, "string"))
  .add(new protobuf.Field("unknown2", 3, "int32"))
  .add(new protobuf.Field("translatedLanguage", 4, "string"))
  .add(new protobuf.Field("translatedUrl", 5, "string"))
  .add(new protobuf.Field("unknown5", 6, "int32"))
  .add(new protobuf.Field("unknown6", 7, "int32"));

const VideoSubtitlesResponse = new protobuf.Type("VideoSubtitlesResponse")
  .add(new protobuf.Field("unknown0", 1, "int32"))
  .add(new protobuf.Field("subtitles", 2, "VideoSubtitlesObject", "repeated"));

// Create a root namespace and add the types
const root = new protobuf.Root()
  .define("yandex")
  .add(VideoTranslationRequest)
  .add(VideoTranslationResponse)
  .add(VideoSubtitlesRequest)
  .add(VideoSubtitlesObject)
  .add(VideoSubtitlesResponse);

// Export the encoding and decoding functions
export const yandexProtobuf = {
  encodeTranslationRequest(url, duration, requestLang, responseLang) {
    return root.VideoTranslationRequest.encode({
      url,
      firstRequest: true,
      duration,
      unknown2: 1,
      language: requestLang,
      unknown3: 0,
      unknown4: 0,
      responseLanguage: responseLang
    }).finish();
  },
  decodeTranslationResponse(response) {
    return root.VideoTranslationResponse.decode(new Uint8Array(response));
  }
};

function getUUID(isLower) {
    const uuid = ([1e7]+1e3+4e3+8e3+1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
    return isLower ? uuid : uuid.toUpperCase();
}

function requestVideoTranslation (url, duration, callback) {
  const body = yandexProtobuf.encodeTranslationRequest(url, duration);

  const utf8Encoder = new TextEncoder("utf-8");
  crypto.subtle.importKey('raw', utf8Encoder.encode(yandexHmacKey), { name: 'HMAC', hash: {name: 'SHA-256'}}, false, ['sign', 'verify']).then(key => {
    crypto.subtle.sign('HMAC', key, body).then(async (signature) => {
        await axios({
            url: 'https://api.browser.yandex.ru/video-translation/translate',
            method: 'post',
            headers: {
                "Accept": "application/x-protobuf",
                "Accept-Language": "en",
                "Content-Type": "application/x-protobuf",
                "User-Agent": yandexUserAgent,
                "Pragma": "no-cache",
                "Cache-Control": "no-cache",
                "Sec-Fetch-Mode": "no-cors",
                "sec-ch-ua": null,
                "sec-ch-ua-mobile": null,
                "sec-ch-ua-platform": null,
                "Vtrans-Signature": Array.prototype.map.call(new Uint8Array(signature), x => x.toString(16).padStart(2, '0')).join(''),
                "Sec-Vtrans-Token": getUUID(false)
            },
            withCredentials: true,
            responseType: 'arraybuffer',
            data: body
        }).then((response) => {
            callback((response.status === 200), response.data);
        }).catch((error) => {
            callback(false);
        });
    });
  });
}

function translateVideo(url, callback) {
  // TODO: Use real duration
  // 0x40_75_50_00_00_00_00_00
  requestVideoTranslation(url, 341, (success, response) => {
    if (!success) {
      callback(false, "Failed to request video translation");
      return;
    }

    const translateResponse = yandexProtobuf.decodeTranslationResponse(response);
    switch (translateResponse.status) {
      case 0:
        callback(false, translateResponse.message);
        return;
      case 1:
        const hasUrl = translateResponse.url != null;
        callback(hasUrl, hasUrl ? translateResponse.url : "Audio link not received");
        return;
      case 2:
        callback(false, "The translation will take a few minutes");
        return;
    }
  });
}

export default translateVideo;
