import type { RequestLang, ResponseLang } from "@vot.js/shared/types/data";
import type { SubtitleFormat } from "@vot.js/shared/types/subs";

export type ConfigSchema = {
  version: string;
  defaultLang: RequestLang;
  defaultResLang: ResponseLang;
  defaultSubsFormat: SubtitleFormat;
  defaultVOTHost: string;
};
