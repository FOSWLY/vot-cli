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

const HELP_USAGE = "vot-cli [options] <link> [link2] [link3] ...";

const HELP_OPTION_DESCRIPTION_COLUMN = 42;

const HELP_OPTIONS = [
  {
    flags: ["-h", "--help"],
    description: "Show help (You're here)",
  },
  {
    flags: ["-v", "--version"],
    description: "Show script version",
  },
  {
    flags: ["-o", "--out", "--outdir=(path)"],
    description: "Set the directory to download",
  },
  {
    flags: ["--outfile=(name)"],
    description: "Set the file name to download",
  },
  {
    flags: ["--lang=(lang)"],
    description: `Set the source video language (default: ${config.defaultLang})`,
    formattedDescription: `Set the source video language (default: ${bold(config.defaultLang)})`,
  },
  {
    flags: ["--reslang=(lang)"],
    description: `Set the audio track or subs language (default: ${config.defaultResLang})`,
    formattedDescription: `Set the audio track or subs language (default: ${bold(config.defaultResLang)})`,
  },
  {
    flags: ["--proxy=(url)"],
    description:
      "Set proxy in format ([<PROTOCOL>://]<USERNAME>:<PASSWORD>@<HOST>[:<port>])",
  },
  {
    flags: ["--worker-host=(url)"],
    description:
      "Set vot-worker host ([<PROTOCOL>://]<HOST>[:<port>][/<PREFIX>])",
  },
  {
    flags: ["--vot-host=(url)"],
    description:
      "Set vot-backend host ([<PROTOCOL>://]<HOST>[:<port>][/<PREFIX>])",
  },
  {
    flags: ["--subs", "--subtitles"],
    description: "Get subtitles instead of audio if exists",
  },
  {
    flags: ["--subs-format=(format)"],
    description: `Set the format for subtitles (default: ${config.defaultSubsFormat}. Doesn't work in preview)`,
    formattedDescription: `Set the format for subtitles (default: ${bold(config.defaultSubsFormat)}. Doesn't work in preview)`,
  },
  {
    flags: ["--preview"],
    description: "Get download link without downloading",
  },
  {
    flags: ["--lively-voice"],
    description:
      "Use lively voices for available videos (required auth | only en -> ru)",
    formattedDescription: `Use lively voices for available videos (${setHeader("required auth")} | only ${bold("en")} -> ${bold("ru")})`,
  },
  {
    flags: ["--api-token"],
    description: "Set the Yandex Oauth API token to use lively voices",
  },
  {
    flags: ["--no-visual"],
    description:
      "Write result to stdout/stderr without progress info (1 line = 1 link)",
  },
  {
    flags: ["--json"],
    description: "Write result to stdout/stderr as JSON without progress info",
  },
];

const HELP_OPTIONS_MESSAGE = HELP_OPTIONS.map((option) => {
  const { flags } = option;
  const rawFlags = flags.join(", ");
  const formattedFlags = flags.map(setOption).join(", ");
  const padding = " ".repeat(
    Math.max(2, HELP_OPTION_DESCRIPTION_COLUMN - rawFlags.length),
  );

  return `  ${formattedFlags}${padding}${option.formattedDescription ?? option.description}`;
}).join("\n");

const JSON_HELP_OPTIONS = HELP_OPTIONS.map(({ flags, description }) => ({
  flags,
  description,
}));

const HELP_MESSAGE = `vot-cli is a tool for downloading subtitles or translating videos using vot.js.

${setHeader("Usage")}:
  ${HELP_USAGE}

${setHeader("Options")}:
${HELP_OPTIONS_MESSAGE}

${setList("Request langs", availableLangs)}

${setList("Response langs", availableTTS)}

${setList("Subtitles types", subtitlesFormats)}
`;

function sendHelpMessage(json?: boolean) {
  if (json) {
    return console.log(
      JSON.stringify({
        usage: HELP_USAGE,
        options: JSON_HELP_OPTIONS,
        requestLangs: availableLangs,
        responseLangs: availableTTS,
        subtitlesTypes: subtitlesFormats,
      }),
    );
  }

  return console.log(HELP_MESSAGE);
}

function sendCLIVersion(json?: boolean) {
  if (json) {
    return console.log(
      JSON.stringify({
        version: config.version,
        runtime: CURRENT_RUNTIME,
      }),
    );
  }

  return console.log(`vot-cli ${config.version} (${CURRENT_RUNTIME})`);
}

export { sendCLIVersion, sendHelpMessage };
