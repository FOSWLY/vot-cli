import {
  sitesInvidious,
  sitesPiped,
  sitesProxyTok,
  sitesPeertube,
} from "./alternativeUrls.js";

const sites = () => {
  return [
    {
      host: "tiktok",
      url: "https://www.tiktok.com/",
      match: /^www.tiktok.com$/,
    },
    {
      host: "youtube",
      url: "https://youtu.be/",
      match: /^((www.|m.)?youtube(-nocookie)?.com)|(youtu.be)$/,
    },
    {
      host: "twitch",
      url: "https://twitch.tv/",
      match: /^(m.|www.|player.)?twitch.tv$/,
    },
    {
      host: "xvideos",
      url: "https://www.xvideos.com/",
      match: /^www.xvideos.com$/,
    },
    {
      host: "pornhub",
      url: "https://rt.pornhub.com/view_video.php?viewkey=",
      match: /^[a-z]+.pornhub.com$/,
    },
    {
      host: "vk",
      url: "https://vk.com/video?z=",
      match: /^(www.|m.)?vk.(com|ru)$/,
    },
    {
      host: "ok.ru",
      url: "https://ok.ru/",
      match: /^ok.ru$/,
    },
    {
      host: "vimeo",
      url: "https://vimeo.com/",
      match: /^(player.)?vimeo.com$/,
    },
    {
      host: "nine_gag",
      url: "https://9gag.com/gag/",
      match: /^9gag.com$/,
    },
    {
      host: "coub",
      url: "https://coub.com/view/",
      match: /^coub.com$/,
    },
    {
      host: "bitchute",
      url: "https://www.bitchute.com/video/",
      match: /^(www.)?bitchute.com$/,
    },
    {
      host: "rutube",
      url: "https://rutube.ru/video/",
      match: /^rutube.ru$/,
    },
    {
      host: "bilibili",
      url: "https://www.bilibili.com/video/",
      match: /^(www|m).bilibili.com$/,
    },
    {
      host: "twitter",
      url: "https://twitter.com/i/status/",
      match: /^twitter.com$/,
    },
    {
      host: "mail_ru",
      url: "https://my.mail.ru/",
      match: /^my.mail.ru$/,
    },
    {
      // ONLY IF YOU LOGINED TO COURSERA /learn/NAME/lecture/XXXX
      host: "coursera",
      url: "https://www.coursera.org/",
      match: /^coursera.org$/,
    },
    {
      // ONLY IF YOU LOGINED TO UDEMY /course/NAME/learn/lecture/XXXX
      host: "udemy",
      url: "https://www.udemy.com/",
      match: /^udemy.com$/,
    },
    {
      // Sites host Invidious. I tested the performance only on invidious.kevin.rocks, yewtu.be and inv.vern.cc
      host: "invidious",
      url: "https://youtu.be/",
      match: sitesInvidious,
    },
    {
      // Sites host Piped. I tested the performance only on piped.video
      host: "piped",
      url: "https://youtu.be/",
      match: sitesPiped,
    },
    {
      // Sites host ProxyTok. I tested the performance only on proxitok.pabloferreiro.es
      host: "piped",
      url: "https://www.tiktok.com/",
      match: sitesProxyTok,
    },
    {
      host: "rumble",
      url: "https://rumble.com", // <-- there should be no slash because we take the whole pathname
      match: /^rumble.com$/,
    },
    {
      host: "eporner",
      url: "https://www.eporner.com/",
      match: /^(www.)?eporner.com$/,
    },
    {
      host: "peertube",
      url: "https://tube.shanti.cafe", // This is a stub. The present value is set using window.location.origin. Check "src/index.js:videoObserver.onVideoAdded.addListener" to get more info
      match: sitesPeertube,
    },
    {
      host: "dailymotion",
      url: "https://www.dailymotion.com/video/", // This is a stub. The present value is set using window.location.origin. Check "src/index.js:videoObserver.onVideoAdded.addListener" to get more info
      match: /^(www.)?dailymotion.com$/,
    },
    {
      host: "trovo",
      url: "https://trovo.live/s/",
      match: /^trovo.live$/,
    },
    {
      host: "yandexdisk",
      url: "https://disk.yandex.ru/i/",
      match: /^disk.yandex.ru|yadi.sk$/,
    },
    {
      host: "coursehunter",
      url: "https://coursehunter.net/course/",
      match: /^coursehunter.net$/,
    },
    {
      host: "googledrive",
      url: "https://drive.google.com/file/d/",
      match: /^drive.google.com$/,
      selector: ".html5-video-container",
    },
  ];
};

export default sites();
