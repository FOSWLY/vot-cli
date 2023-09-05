import {
  sitesInvidious,
  sitesPiped,
  sitesProxyTok,
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
      match: /^(www.|m.)?youtube(-nocookie)?.com$/,
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
  ];
};

export default sites();
