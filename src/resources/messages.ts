import { underline, bold } from "yoctocolors";
import {
  availableLangs,
  availableTTS,
  subtitlesFormats,
} from "@vot.js/shared/consts";

import config from "../config";

const setHeader = (text: string) => bold(underline(text));

const setOption = (text: string) => bold(text);

const setList = (header: string, items: readonly unknown[]) =>
  `${setHeader(header)}:\n  ${items.join(", ")}`;

const CURRENT_RUNTIME =
  typeof navigator !== "undefined" ? navigator.userAgent : "unknown";

const HELP_MESSAGE = `vot-cli is a tool for downloading subtitles or translating videos using vot.js.

${setHeader("Usage")}:
  vot-cli [options] <link> [link2] [link3] ...

${setHeader("Options")}:
  ${setOption("-h")}, ${setOption("--help")}                    Show help (You're here)
  ${setOption("-v")}, ${setOption("--version")}                 Show script version
  ${setOption("-o")}, ${setOption("--out")}, ${setOption("--outdir")}=(path)    Set the directory to download
  ${setOption("--outfile")}=(name)              Set the file name to download
  ${setOption("--lang")}=(lang)                 Set the source video language (default: ${bold(config.defaultLang)})
  ${setOption("--reslang")}=(lang)              Set the audio track or subs language (default: ${bold(config.defaultResLang)})
  ${setOption("--proxy")}=(url)                 Set proxy in format ([<PROTOCOL>://]<USERNAME>:<PASSWORD>@<HOST>[:<port>])
  ${setOption("--worker-host")}=(url)           Set vot-worker host ([<PROTOCOL>://]<HOST>[:<port>][/<PREFIX>])
  ${setOption("--vot-host")}=(url)              Set vot-backend host ([<PROTOCOL>://]<HOST>[:<port>][/<PREFIX>])
  ${setOption("--subs")}, ${setOption("--subtitles")}           Get subtitles instead of audio if exists
  ${setOption("--subs-format")}=(format)        Set the format for subtitles (default: ${bold(config.defaultSubsFormat)}. Doesn't work in preview)
  ${setOption("--preview")}                     Get download link without downloading
  ${setOption("--lively-voice")}                Use lively voices for available videos (${setHeader("required auth")} | only ${bold("en")} -> ${bold("ru")})
  ${setOption("--api-token")}                   Set the Yandex Oauth API token to use lively voices
  ${setOption("--no-visual")}                   Write result to stdout/stderr without progress info (1 line = 1 link)

${setList("Request langs", availableLangs)}

${setList("Response langs", availableTTS)}

${setList("Subtitles types", subtitlesFormats)}
`;

function sendHelpMessage() {
  return console.log(HELP_MESSAGE);
}

function sendCLIVersion() {
  return console.log(`vot-cli ${config.version} (${CURRENT_RUNTIME})`);
}

export { sendCLIVersion, sendHelpMessage };
