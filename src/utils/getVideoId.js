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
        /(?:watch|embed|live|shorts)\/([^/]+)/.exec(url.pathname)?.[1] ||
        url.searchParams.get("v")
      );
    case "vk":
      if (/^\/video-?[0-9]{8,9}_[0-9]{9}$/.exec(url.pathname)) {
        return /^\/video-?[0-9]{8,9}_[0-9]{9}$/.exec(url.pathname)[0].slice(1);
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
      return /gag\/([^/]+)/.exec(url.pathname)?.[1];
    case "twitch":
      // clips.twitch.tv unsupported

      if (
        /^player\.twitch\.tv$/.test(url.hostname) &&
        url.searchParams.get("video")
      ) {
        return `videos/${url.searchParams.get("video")}`;
      } else if (/([^/]+)\/(?:clip)\/([^/]+)/.exec(url.pathname)) {
        return /([^/]+)\/(?:clip)\/([^/]+)/.exec(url.pathname)[0];
      } else {
        return /(?:videos)\/([^/]+)/.exec(url.pathname)?.[0];
      }
    case "proxytok":
    case "tiktok":
      return /([^/]+)\/video\/([^/]+)/.exec(url.pathname)?.[0];
    case "vimeo":
      return (
        /[^/]+\/[^/]+$/.exec(url.pathname)?.[0] ||
        /[^/]+$/.exec(url.pathname)?.[0]
      );
    case "xvideos":
      return /[^/]+\/[^/]+$/.exec(url.pathname)?.[0];
    case "pornhub":
      return (
        url.searchParams.get("viewkey") ||
        /embed\/([^/]+)/.exec(url.pathname)?.[1]
      );
    case "twitter":
      return /status\/([^/]+)/.exec(url.pathname)?.[1];
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
      return /(?:video|embed)\/([^/]+)/.exec(url.pathname)?.[1];
    case "coub":
      return /view\/([^/]+)/.exec(url.pathname)?.[1];
    case "bilibili": {
      const bvid = url.searchParams.get("bvid");
      if (bvid) {
        return bvid;
      } else {
        let vid = /video\/([^/]+)/.exec(url.pathname)?.[1];
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
      return /video\/([^/]+)/.exec(url.pathname)?.[1];
    case "coursera":
      // ! LINK SHOULD BE LIKE THIS https://www.coursera.org/learn/learning-how-to-learn/lecture/75EsZ
      // return /lecture\/([^/]+)\/([^/]+)/.exec(url.pathname)?.[1]; // <--- COURSE PREVIEW
      return /learn\/([^/]+)\/lecture\/([^/]+)/.exec(url.pathname)?.[0]; // <--- COURSE PASSING (IF YOU LOGINED TO COURSERA)
    case "eporner":
      // ! LINK SHOULD BE LIKE THIS eporner.com/video-XXXXXXXXX/isdfsd-dfjsdfjsdf-dsfsdf-dsfsda-dsad-ddsd
      return /video-([^/]+)\/([^/]+)/.exec(url.pathname)?.[0];
    case "peertube":
      return /\/w\/([^/]+)/.exec(url.pathname)?.[0];
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

      const path = /([^/]+)\/([\d]+)/.exec(url.pathname)?.[0];
      if (!path) {
        return false;
      }

      return `${path}?vid=${vid}`;
    }
    case "yandexdisk":
      return /\/i\/([^/]+)/.exec(url.pathname)?.[1];
    case "coursehunter": {
      const videoId = /\/course\/([^/]+)/.exec(url.pathname)?.[1];
      if (!videoId) {
        return [false, 0];
      }

      return [videoId, Number(url.searchParams.get("lesson") ?? 1)];
    }
    case "ok.ru": {
      return /\/video\/(\d+)/.exec(url.pathname)?.[0];
    }
    case "googledrive":
      return /\/file\/d\/([^/]+)/.exec(url.pathname)?.[1];
    default:
      return false;
  }
}
