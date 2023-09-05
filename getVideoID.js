function getVideoId (service, url) {
    switch (service) {
      case "youtube":
        if (url.includes("watch")) {
            return url.split("v=")[1];
        } else if (url.includes("embed/")) {
            return url.split("embed/")[1];
        }
      case "vk":
        if (/^(https:\/\/|http:\/\/)?(www.|m.)?vk.(com|ru)\/video-?[0-9]{8,9}_[0-9]{9}/.test(url)) {
          return url.split('/').pop().split('?')[0];
        } else {
          return url.includes('z=') ? url.split('z=')[1].split('%2')[0] : false; // Убираем мусор в конце параметра
        }
      case "9gag" || "gag":
        if (url.includes("/gag/")) {
          return url.split('/gag/')[1];
        }
        return false
      case "twitch":
        if (/^(https:\/\/|http:\/\/)?(www.|m.)twitch.tv\/videos\/.*/.test(url)) { // Если используется мобильная версия сайта (m.twitch.tv)
          return url.split('/videos/')[1];
        } else if (/^(https:\/\/|http:\/\/)?player.twitch.tv\/videos\/.*/.test(url)) {
          return url.split("video=")[1];
        }
        return false;
      case "tiktok":
        if (url.includes("/video/")) {
          return url.split('/video/')[1];
        }
        return false;
      case "vimeo":
        return url.split('vimeo.com/')[1];
      case "xvideos":
        return url.split('xvideos.com/')[1].split('/')[0];
      case "pornhub":
        if (url.includes('view_video.php')) {
          return url.split('viewkey=')[1];
        } else if (url.includes('embed/')) {
          return url.split('embed/')[1];
        }
        return false;
      case "twitter":
        if (url.includes("/status/")) {
          const urlArray = url.split('/');
          return urlArray[urlArray.length - 1];
        }
      case "mail.ru":
        if (url.pathname.includes('/v/')) {
          const urlArray = url.pathname.split('/v/');
          return urlArray[urlArray.length - 1];
        }
      default:
        return false;
    }
  };

  
export default getVideoId;
