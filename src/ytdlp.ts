import _YTDlpWrap from "yt-dlp-wrap-plus";

// workaround to fix `undefined is not a constructor (evaluating 'new YTDlpWrap')` in node build
const YTDlpWrap = ((_YTDlpWrap as unknown as { default: typeof _YTDlpWrap })
  .default ?? _YTDlpWrap) as typeof _YTDlpWrap;
export const ytdlp = new YTDlpWrap();
let ytDlpVersionPromise: Promise<string | null> | undefined;

export function getYtDlpVersion() {
  ytDlpVersionPromise ??= ytdlp
    .getVersion()
    .then((version) => version.trim())
    .catch(() => null);

  return ytDlpVersionPromise;
}
