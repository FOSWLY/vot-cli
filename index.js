#!/usr/bin/env node
import chalk from 'chalk';
import parseArgs from 'minimist';
import validate from './validator.js';
import getVideoId from './getVideoID.js';
import translateVideo from './getTranslate.js';
import fs from 'fs';
import { DownloaderHelper } from 'node-downloader-helper';
import loading from 'loading-cli'
const argv = parseArgs(process.argv.slice(2));

const argLinks = argv._;

const version = '1.0.3'
const siteTranslates = {
  "youtube": "https://youtu.be/",
  "twitch": "https://www.twitch.tv/videos/",
  "xvideos": "https://www.xvideos.com/",
  "vk": "https://vk.com/video/",
  "pornhub": "https://www.pornhub.com/view_video.php?viewkey=",
  "vimeo": "https://vimeo.com/",
  "9gag": "https://9gag.com/gag/",
  "twitter": "https://twitter.com/i/status/",
  "mail.ru": 'https://my.mail.ru/v/'
};


const translateAndDownload = (service, url) => {
  const videoId = getVideoId(service, url);
  if (!videoId) {
    return console.error(chalk.red("Invalid link"));
  }

  const finalURL = `${siteTranslates[service]}${videoId}`;
  if (!finalURL) {
    return console.error(chalk.red("Unknown link"));
  }

  translateVideo(finalURL, (success, urlOrError) => {
    if (success) {
      console.log('\n' +
        chalk.green("Video translated successfully!") +
        ' Your link: ' + chalk.blueBright(`${urlOrError}`)
      );

      if (!urlOrError) {
        return console.error(chalk.red("Invalid file link"));
      }

      if (argv.output && urlOrError) {
          download(urlOrError, argv.output, `(ID: ${videoId})`);
      }

      return;
    }

    if (urlOrError === "The translation will take a few minutes") {
      console.log('Waiting for translation...');
      setTimeout(() => {
          translateAndDownload(service, url);
      }, 30_000)
    }
    else {
      console.error(chalk.red(urlOrError));
    }
  });
};

const download = (url, dir, msg = null) => {
    if (!url) {
      return console.error(chalk.red("Invalid link"));
    }
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir);
      } catch {
        return console.error(chalk.red("Invalid directory"));
      }
    }
    const dl = new DownloaderHelper(url, dir);
    const load = loading({
      'text': `Downloading ${msg || ''}: 0%`,
      'color': 'yellow'
    }).start();

    dl.on('end', () => {
      load.color = 'green';
      load.text = `Download ${msg || ''} completed!\n`;
      load.stop()
      console.log(chalk.green(`Download ${msg || ''} completed!`));
    });

    dl.on('error', (err) => {
      load.color = 'red';
      load.text = `Downloading error: ${err.message}`
      console.error(chalk.red(`\nDownloading error: ${err.message}`));
      load.stop()
      // IDK why but sometimes it throws an error
      // Error: read ECONNRESET
      // at TLSWrap.onStreamRead (node:internal/stream_base_commons:217:20)
    });

    dl.on('progress.throttled', (stats) => {
      load.text = `Downloading ${msg || ''}: ${stats.progress.toFixed(1)}%`;
    });
    dl.start().catch(err => console.error(chalk.red(`Failed to download ${msg} (read the comment in the code)`)));
}


argLinks.forEach((url) => {
  const service = validate(url);
  if (service === "unknown") {
    return console.error(chalk.red("Unknown link"));
  }

  translateAndDownload(service, url);
});

if (argLinks.length === 0) {
  if (argv.help) {
    console.log("Usage: vot-cli <link> [options] [link2] [link3] ...\n\nOptions:\n  --help — Show help\n  --version — Show version\n  --output — Set the directory to download");
  } else if (argv.version) {
    console.log(`vot-cli ${version}`);
  } else {
    console.error(chalk.red("No links provided"));
  }
}
