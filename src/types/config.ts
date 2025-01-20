import { RequestLang, ResponseLang } from "@vot.js/shared/types/data";
import { SubtitleFormat } from "@vot.js/shared/types/subs";

export type ConfigSchema = {
  version: string;
  defaultLang: RequestLang;
  defaultResLang: ResponseLang;
  defaultSubsFormat: SubtitleFormat;
  defaultVotHost: string;
};
