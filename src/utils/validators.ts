import {
  availableLangs,
  availableTTS,
  subtitlesFormats,
} from "@vot.js/shared/consts";

import config from "../config";
import { RequestLang, ResponseLang } from "@vot.js/shared/types/data";
import { SubtitleFormat } from "@vot.js/shared/types/subs";

export function validateByArray<
  T = unknown,
  I extends readonly unknown[] = readonly string[],
  K = string,
>(array: I, value: T, defaultValue: K): NonNullable<T> | K {
  return typeof value !== "string" || !array.includes(value)
    ? defaultValue
    : value;
}

export const validateLang = (value: RequestLang | undefined): RequestLang =>
  validateByArray<RequestLang | undefined, typeof availableLangs, RequestLang>(
    availableLangs,
    value,
    config.defaultLang,
  );
export const validateTTSLang = (
  value: ResponseLang | undefined,
): ResponseLang =>
  validateByArray<ResponseLang | undefined, typeof availableTTS, ResponseLang>(
    availableTTS,
    value,
    config.defaultResLang,
  );
export const validateSubsFormat = (
  value: SubtitleFormat | undefined,
): SubtitleFormat =>
  validateByArray<
    SubtitleFormat | undefined,
    typeof subtitlesFormats,
    SubtitleFormat
  >(subtitlesFormats, value, config.defaultSubsFormat);
