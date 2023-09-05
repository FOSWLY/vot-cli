/**
 * Checks the correctness of the entered link
 * @param {string} link - link to check
 */
function validate(site) {
  if (/^(https:\/\/|http:\/\/)?(www.|m.)?youtube(-nocookie)?.com\/(embed|watch).*/.test(site)) {
    return 'youtube';
  } else if (/^(https:\/\/|http:\/\/)?(www.|m.|player.)?twitch.tv\/videos\/.*/.test(site)) {
    return 'twitch';
  } else if (/^(https:\/\/|http:\/\/)?(www.)?xvideos.com\/video.*/.test(site)) {
    return 'xvideos';
  } else if (/^(https:\/\/|http:\/\/)?(www.|m.)?vk.(com|ru)\/.*/.test(site)) {
    return 'vk';
  } else if (/^(https:\/\/|http:\/\/)?rt.pornhub.com\/view_video\.php\?viewkey=.*/.test(site)) {
    return 'pornhub';
  } else if (/^(https:\/\/|http:\/\/)?9gag.com\/gag\/*/.test(site)) {
    return '9gag';
  } else if (/^(https:\/\/|http:\/\/)?vimeo.com\/*/.test(site)) {
    return 'vimeo';
  } else if (/^(https:\/\/|http:\/\/)?twitter.com\/*/.test(site)) {
    return 'twitter';
  } else if (site.includes('mail.ru')) {
    return 'mail.ru';
  }
  return 'unknown';
}

export default validate;