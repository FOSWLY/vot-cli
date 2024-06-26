import chalk from "chalk";

import logger from "./logger.js";

export default function getVideoId(service, url) {
  logger.debug("getVideoID", service, url);
  try {
    url = new URL(url);
  } catch (e) {
    console.error(chalk.red(`Invalid URL: ${url}. Have you forgotten https?`));
    return false;
  }

  switch (service) {
    case "custom":
      return url.href;
    case "piped":
    case "invidious":
    case "youtube":
      if (url.hostname === "youtu.be") {
        url.search = `?v=${url.pathname.replace("/", "")}`;
        url.pathname = "/watch";
      }

      return (
        url.pathname.match(/(?:watch|embed|shorts)\/([^/]+)/)?.[1] ||
        url.searchParams.get("v")
      );
    case "vk":
      if (url.pathname.match(/^\/video-?[0-9]{8,9}_[0-9]{9}$/)) {
        return url.pathname.match(/^\/video-?[0-9]{8,9}_[0-9]{9}$/)[0].slice(1);
      } else if (url.searchParams.get("z")) {
        return url.searchParams.get("z").split("/")[0];
      } else if (url.searchParams.get("oid") && url.searchParams.get("id")) {
        return `video-${Math.abs(
          url.searchParams.get("oid"),
        )}_${url.searchParams.get("id")}`;
      } else {
        return false;
      }
    case "nine_gag":
    case "9gag":
    case "gag":
      return url.pathname.match(/gag\/([^/]+)/)?.[1];
    case "twitch":
      // clips.twitch.tv unsupported

      if (
        /^player\.twitch\.tv$/.test(url.hostname) &&
        url.searchParams.get("video")
      ) {
        return `videos/${url.searchParams.get("video")}`;
      } else if (url.pathname.match(/([^/]+)\/(?:clip)\/([^/]+)/)) {
        return url.pathname.match(/([^/]+)\/(?:clip)\/([^/]+)/)[0];
      } else {
        return url.pathname.match(/(?:videos)\/([^/]+)/)?.[0];
      }
    case "proxytok":
    case "tiktok":
      return url.pathname.match(/([^/]+)\/video\/([^/]+)/)?.[0];
    case "vimeo":
      return (
        url.pathname.match(/[^/]+\/[^/]+$/)?.[0] ||
        url.pathname.match(/[^/]+$/)?.[0]
      );
    case "xvideos":
      return url.pathname.match(/[^/]+\/[^/]+$/)?.[0];
    case "pornhub":
      return (
        url.searchParams.get("viewkey") ||
        url.pathname.match(/embed\/([^/]+)/)?.[1]
      );
    case "twitter":
      return url.pathname.match(/status\/([^/]+)/)?.[1];
    case "udemy":
      return url.pathname;
    case "rumble":
      return url.pathname;
    case "facebook":
      // ...watch?v=XXX
      // CHANNEL_ID/videos/VIDEO_ID/
      // returning "Видео недоступно для перевода"

      // fb.watch/YYY
      // returning "Возникла ошибка, попробуйте позже"
      if (url.searchParams.get("v")) {
        return url.searchParams.get("v");
      }

      return false;
    case "rutube":
      return url.pathname.match(/(?:video|embed)\/([^/]+)/)?.[1];
    case "coub":
      return url.pathname.match(/view\/([^/]+)/)?.[1];
    case "bilibili": {
      const bvid = url.searchParams.get("bvid");
      if (bvid) {
        return bvid;
      } else {
        let vid = url.pathname.match(/video\/([^/]+)/)?.[1];
        if (vid && url.search && url.searchParams.get("p") !== null) {
          vid += `/?p=${url.searchParams.get("p")}`;
        }
        return vid;
      }
    }
    case "mail_ru":
      if (url.pathname.startsWith("/v/") || url.pathname.startsWith("/mail/")) {
        return url.pathname;
      }
      return false;
    case "bitchute":
      return url.pathname.match(/video\/([^/]+)/)?.[1];
    case "coursera":
      // ! LINK SHOULD BE LIKE THIS https://www.coursera.org/learn/learning-how-to-learn/lecture/75EsZ
      // return url.pathname.match(/lecture\/([^/]+)\/([^/]+)/)?.[1]; // <--- COURSE PREVIEW
      return url.pathname.match(/learn\/([^/]+)\/lecture\/([^/]+)/)?.[0]; // <--- COURSE PASSING (IF YOU LOGINED TO COURSERA)
    case "eporner":
      // ! LINK SHOULD BE LIKE THIS eporner.com/video-XXXXXXXXX/isdfsd-dfjsdfjsdf-dsfsdf-dsfsda-dsad-ddsd
      return url.pathname.match(/video-([^/]+)\/([^/]+)/)?.[0];
    case "peertube":
      return url.pathname.match(/\/w\/([^/]+)/)?.[0];
    case "dailymotion": {
      return url.pathname;
    }
    case "trovo": {
      if (!url.pathname.startsWith("/s/")) {
        return false;
      }

      const vid = url.searchParams.get("vid");
      if (!vid) {
        return false;
      }

      const path = url.pathname.match(/([^/]+)\/([\d]+)/)?.[0];
      if (!path) {
        return false;
      }

      return `${path}?vid=${vid}`;
    }
    case "yandexdisk":
      return url.pathname.match(/\/i\/([^/]+)/)?.[1];
    case "coursehunter": {
      const videoId = url.pathname.match(/\/course\/([^/]+)/)?.[1];
      if (!videoId) {
        return [false, 0];
      }

      return [videoId, Number(url.searchParams.get("lesson") ?? 1)];
    }
    case "ok.ru": {
      return url.pathname.match(/\/video\/(\d+)/)?.[0];
    }
    case "googledrive":
      return url.pathname.match(/\/file\/d\/([^/]+)/)?.[1];
    default:
      return false;
  }
}
