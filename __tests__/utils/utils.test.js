import { jsonToSrt } from "../../src/utils/utils.js";

describe("utils", () => {
  it("convert YandexSubtitles json to srt", () => {
    const jsonYS = [
      { text: "Привет", startMs: 2222.0, durationMs: 3610.0 },
      { text: "мир", startMs: 26050.0, durationMs: 970.0 },
    ];

    const expectedSRT = `1
00:00:02,222 --> 00:00:05,832
Привет

2
00:00:26,050 --> 00:00:27,020
мир`;

    expect(jsonToSrt(jsonYS)).toBe(expectedSRT);
  });
});
