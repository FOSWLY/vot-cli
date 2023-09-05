import chalk from "chalk";
import { debug } from "../config/config.js";

export default {
  debug: (...args) => {
    if (!debug) return;

    console.debug(chalk.gray(...args));
  },
};
