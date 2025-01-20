import config from "../config";
import { SchemaItem, SchemaValue, SchemaValues } from "../types/args";
import {
  validateLang,
  validateSubsFormat,
  validateTTSLang,
} from "../utils/validators";

export const schemaObj: SchemaItem[] = [
  {
    type: "boolean",
    default: false,
    aliases: "preview",
  },
  {
    // set subs format
    type: "string",
    default: config.defaultSubsFormat,
    aliases: "subs-format",
    validator: validateSubsFormat,
    validatorType: "SubtitleFormat",
  },
  {
    // enable subs
    type: "boolean",
    aliases: ["subs", "subtitles"],
  },
  {
    // view version
    type: "boolean",
    short: "v",
    aliases: "version",
  },
  {
    // view help
    type: "boolean",
    short: "h",
    aliases: "help",
  },
  {
    // proxy string
    type: "string",
    aliases: "proxy",
  },
  {
    // worker-host string
    type: "string",
    aliases: "worker-host",
  },
  {
    // vot-host string
    type: "string",
    default: config.defaultVOTHost,
    aliases: "vot-host",
  },
  {
    // response lang
    type: "string",
    default: config.defaultResLang,
    aliases: "reslang",
    validator: validateTTSLang,
    validatorType: "ResponseLang",
  },
  {
    // request lang
    type: "string",
    default: config.defaultLang,
    aliases: "lang",
    validator: validateLang,
    validatorType: "RequestLang",
  },
  {
    type: "boolean",
    aliases: "old-model",
    default: false,
  },
  {
    type: "boolean",
    aliases: "no-visual",
    default: false,
  },
  {
    // output filename
    type: "string",
    aliases: "outfile",
  },
  {
    // output dir
    type: "string",
    short: "o",
    aliases: ["out", "outdir"],
  },
];

export const getSchemaOpts = (schemaItem: SchemaItem) => {
  return Object.fromEntries(
    Object.entries(schemaItem).filter(
      ([key, val]) => key !== "aliases" && val != undefined,
    ),
  ) as SchemaValue;
};

export const schema = schemaObj.reduce((result, item) => {
  if (!Array.isArray(item.aliases)) {
    result[item.aliases] = getSchemaOpts(item);
    return result;
  }

  const schemaItems = item.aliases.reduce(
    (arr, val) => ({ ...arr, [val]: getSchemaOpts(item) }),
    {},
  );
  return { ...result, ...schemaItems };
}, {} as SchemaValues);
