import chalk from "chalk";

import sites from "../config/sites.js";
import logger from "./logger.js";

/**
 * Checks the correctness of the entered link
 * @param {string} link - link to check
 */
function validate(site) {
  let url;
  try {
    url = new URL(site);
  } catch (e) {
    console.error(chalk.red(`Invalid URL: ${site}. Have you forgotten https?`));
    return false;
  }

  return sites.find((s) => {
    const isMathes = (match) => {
      return (
        (match instanceof RegExp && match.test(url.hostname)) ||
        (typeof match === "string" && url.hostname.includes(match)) ||
        (typeof match === "function" && match(url))
      );
    };

    if (
      isMathes(s.match) ||
      (s.match instanceof Array &&
        s.match.some((e) => e.includes(url.hostname)))
    ) {
      logger.debug("validate", s.host, s.url);
      return s.host && s.url;
    }
    logger.debug("validate", false);
    return false;
  });
}

export default validate;
