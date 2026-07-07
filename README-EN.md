<!-- badges -->

[badge-actions]: https://github.com/FOSWLY/vot-cli/actions/workflows/build.yml/badge.svg
[badge-en]: https://img.shields.io/badge/lang-English%20%F0%9F%87%AC%F0%9F%87%A7-white
[badge-ru]: https://img.shields.io/badge/%D1%8F%D0%B7%D1%8B%D0%BA-%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9%20%F0%9F%87%B7%F0%9F%87%BA-white

<!-- github links -->

[gh-actions-script]: https://github.com/FOSWLY/vot-cli/actions/workflows/build.yml
[gh-readme-en]: README-EN.md
[gh-readme-ru]: README.md
[supported-langs-wiki]: (https://github.com/FOSWLY/vot-cli/wiki/%5BRU%5D-Supported-langs)
[gh-releases]: https://github.com/FOSWLY/vot-cli/releases

<!-- ecosystem -->

[votjs-link]: https://github.com/FOSWLY/vot.js
[vot-worker-link]: https://github.com/FOSWLY/vot-worker
[vot-backend-link]: https://github.com/FOSWLY/vot-backend
[vot-ext-link]: https://github.com/ilyhalight/voice-over-translation

<!-- vot-cli scripts -->

[vot-cli-ps]: https://github.com/FOSWLY/vot-cli/tree/main/scripts/shells
[vot-cli-fish]: https://gitlab.com/musickiller/fishy-voice-over
[vot-cli-bash]: https://github.com/s-n-alexeyev/yvt
[vot-cli-colab]: https://github.com/alex2844/youtube-translate

<!-- other -->

[nodejs-link]: https://nodejs.org
[bun-link]: https://bun.sh/
[ubuntu-ppa-link]: https://launchpad.net/~toil/+archive/ubuntu/vot-cli

<h1 align="center">
  VOT-CLI

[![GitHub Actions][badge-actions]][gh-actions-script]
[![en][badge-en]][gh-readme-en]
[![ru][badge-ru]][gh-readme-ru]

</h1>

**vot-cli** is a tool for translating videos or downloading subtitles using [vot.js][votjs-link].

This script lets you:

- Download a video translation or get a link to it
- Download video subtitles in SRT, VTT or JSON format or get a link to them
- Get a link to the finished file without downloading (preview mode)
- Use lively voices for translation (en -> ru)
- Output results in JSON or as plain links (without progress)
- Process multiple links in one run

> [!WARNING]
> This script is created solely for research purposes and is not intended for commercial use. All rights to the original software belong to their respective owners.

## Parameters

<details>
<summary>Click to expand</summary>

- **-h**, **--help**: show help
- **-v**, **--version**: show script version
- **-o**, **--out**, **--outdir=(path)**: set output directory
- **--outfile=(name)**: set output filename
- **--lang=(lang)**: set source video language (see [wiki][supported-langs-wiki] for supported languages). Default: `en`
- **--reslang=(lang)**: set audio track or subtitle language (see [wiki][supported-langs-wiki] for supported languages). Default: `ru`
- **--proxy=(url)**: set HTTP or HTTPS proxy in format `[<PROTOCOL>://]<USERNAME>:<PASSWORD>@<HOST>[:<port>]`
- **--worker-host=(url)**: set your own [vot-worker][vot-worker-link] in format `[<PROTOCOL>://]<HOST>[:<port>][/<PREFIX>]`
- **--vot-host=(url)**: set your own [vot-backend][vot-backend-link] server in format `[<PROTOCOL>://]<HOST>[:<port>][/<PREFIX>]`
- **--subs**: get subtitles instead of audio, if available
- **--subs-format=(format)**: set subtitle format (`json`, `srt`, `vtt`. Does not work with `--preview`)
- **--preview**: get a download link without downloading
- **--lively-voice**: use lively voices for available videos (only `en` -> `ru`)
- **--api-token**: set Yandex OAuth API token for using lively voices. You can get a token via the [debug link](https://yandex.ru/dev/id/doc/ru/tokens/debug-token)
- **--no-visual**: output result to stdout/stderr without progress info (1 line = 1 link)
- **--json**: output result to stdout/stderr as JSON without progress info
- **--no-title**: use video ID as filename, without attempting to get the video title

</details>

## Usage examples

<details>
<summary>Click to expand</summary>

- `vot-cli [options] <link> [link2] [link3] ...` - general example
- `vot-cli <link>` - get audio translation from a link
- `vot-cli --help` - show help
- `vot-cli --version` - show version
- `vot-cli --json [options] <link>` - get result as JSON
- `vot-cli --outdir=<path> <link>` - get audio translation and save it to the specified path
- `vot-cli --outdir=<path> --reslang=en <link>` - get audio translation in English and save it to the specified path
- `vot-cli --subs --outdir=<path> --reslang=en <link>` - get English subtitles and save them to the specified path
- `vot-cli --outdir="." "https://www.youtube.com/watch?v=X98VPQCE_WI" "https://www.youtube.com/watch?v=djr8j-4fS3A&t=900s"` - real data example

</details>

### JSON output examples

All examples in this README have been formatted separately for readability. In real output, JSON will be a single line, and some lists may be longer.

<details>
<summary>Successful execution</summary>

```bash
vot-cli --json ...
```

```json
{
  "ok": true,
  "summary": {
    "total": 1,
    "success": 1,
    "failed": 0
  },
  "results": [
    {
      "input": "https://www.youtube.com/watch?v=X98VPQCE_WI",
      "status": "success",
      "type": "audio",
      "videoId": "X98VPQCE_WI",
      "url": "https://example.com/audio.mp3",
      "outputPath": "C:\\downloads\\X98VPQCE_WI.mp3"
    }
  ]
}
```

</details>

<details>
<summary>Processing error</summary>

```bash
vot-cli --json ...
```

```json
{
  "ok": false,
  "summary": {
    "total": 1,
    "success": 0,
    "failed": 1
  },
  "results": [
    {
      "input": "not-a-url",
      "status": "failed",
      "type": "audio",
      "videoId": null,
      "url": null
    }
  ]
}
```

</details>

<details>
<summary>Version</summary>

```bash
vot-cli --version --json
```

```json
{
  "version": "2.0.0",
  "runtime": "Bun/1.3.14"
}
```

</details>

<details>
<summary>Help</summary>

```bash
vot-cli --help --json
```

```json
{
  "usage": "vot-cli [options] <link> [link2] [link3] ...",
  "options": [
    { "flags": ["-h", "--help"], "description": "Show help (You're here)" },
    {
      "flags": ["--json"],
      "description": "Write result to stdout/stderr as JSON without progress info"
    }
  ],
  "requestLangs": ["auto", "ru", "en"],
  "responseLangs": ["ru", "en", "kk"],
  "subtitlesTypes": ["srt", "vtt", "json"]
}
```

</details>

## Installation

Choose the most convenient way to install `vot-cli`.

### Pre-built binaries

If you don't want to install [Node.js][nodejs-link] or [Bun][bun-link], you can simply download a pre-built binary from [GitHub Releases][gh-releases].

Choose the archive for your operating system and architecture:

### Linux

Extract the archive, make the file executable, and move it to a directory in your `PATH`:

```bash
tar -xzf vot-linux-x64.tar.gz
chmod +x vot-linux-x64
sudo mv vot-linux-x64 /usr/local/bin/vot-cli
vot-cli --version
```

### macOS

Download `vot-darwin-x64.tar.gz` or `vot-darwin-arm64.tar.gz` (depending on your Mac) and run the same commands, replacing the filename.

### Windows

Download `vot-windows-x64.exe.zip`, extract `vot-windows-x64.exe`, optionally rename it to `vot-cli.exe`.

To make it accessible from anywhere, add its folder to the `PATH` environment variable.

### Via NPM/Bun (Cross-platform)

This option is suitable if you already have [Bun.sh][bun-link] or [Node.js 22+][nodejs-link] installed.

1. Install [Bun.sh][bun-link] or [Node.js][nodejs-link].
2. Install `vot-cli` globally:

Installation for Bun:

```bash
bun install -g vot-cli
```

Installation for Node:

```bash
npm install -g vot-cli
```

## Building for NPM

1. Install [Bun.sh][bun-link]
2. Install dependencies:

```bash
bun install
```

3. Build vot-cli:

```bash
bun run build:bun
```

## Building binaries

1. Install [Bun.sh][bun-link]
2. Install dependencies:

```bash
bun install
```

3. Run the build:

```bash
bun run compile
```

If you get `Failed to move cross-compiled bun binary into cache directory` on Windows, use WSL or move the source folder to the C: drive.

#### Local testing with the `vot-cli` command:

1. Link the directory:

```bash
bun link
```

2. Done, now you can use vot-cli in your terminal

## 📁 Useful links

1. Browser extension: [Link][vot-ext-link]
2. Scripts for downloading videos with built-in translation (add-ons for vot-cli):

   | OS      | Shell        | Author       | Link                  |
   | ------- | ------------ | ------------ | --------------------- |
   | Windows | PowerShell   | Dragoy       | [Link][vot-cli-ps]    |
   | Unix    | Fish         | Musickiller  | [Link][vot-cli-fish]  |
   | Linux   | Bash         | s-n-alexeyev | [Link][vot-cli-bash]  |
   | Cloud   | Google Colab | alex2844     | [Link][vot-cli-colab] |

## ✨ Optional features

### Using yt-dlp for video titles

vot-cli can use [yt-dlp](https://github.com/yt-dlp/yt-dlp) to get human-readable video titles for output filenames.

If yt-dlp is not found on the system, video IDs will be used as filenames (`X98VPQCE_WI.mp3` instead of the title).

You can disable this behavior with the `--no-title` flag.

## ❗ Notes

1. Wrap links in quotes to avoid errors
2. Writing to a system partition (e.g., "C: drive" on Windows) requires administrator privileges
3. yt-dlp is optionally used for fetching video titles (see the "Optional features" section)

![example btn](https://github.com/FOSWLY/vot-cli/blob/main/img/example.png "example")
