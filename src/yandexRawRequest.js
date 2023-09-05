import axios from "axios";
import { workerHost, yandexUserAgent } from "./config/config.js";
import logger from "./utils/logger.js";

export default async function yandexRawRequest(path, body, headers, callback) {
  logger.debug("yandexRequest:", path);
  await axios({
    url: `https://${workerHost}${path}`,
    method: "post",
    headers: {
      ...{
        Accept: "application/x-protobuf",
        "Accept-Language": "en",
        "Content-Type": "application/x-protobuf",
        "User-Agent": yandexUserAgent,
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
        "Sec-Fetch-Mode": "no-cors",
        "sec-ch-ua": null,
        "sec-ch-ua-mobile": null,
        "sec-ch-ua-platform": null,
      },
      ...headers,
    },
    responseType: "arraybuffer",
    data: body,
  })
    .then((response) => {
      logger.debug("yandexRequest:", response.status, response.data);
      callback(response.status === 200, response.data);
    })
    .catch(() => {
      callback(false);
    });
}
