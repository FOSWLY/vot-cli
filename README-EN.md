## [FOSWLY] VOT-CLI

Русская версия: [Link](https://github.com/FOSWLY/vot-cli/blob/main/README.md)

A small script that allows you to download an audio translation from Yandex via the terminal.

## 📖 Using

### Usage examples:

- `vot-cli [options] [args] <link> [link2] [link3] ...` — general example
- `vot-cli <link>` — get the audio translation from the link
- `vot-cli --help` — show help by commands
- `vot-cli --version` — show script version
- `vot-cli --output=<path> <link>` — get the audio translation from the link and save it to the specified path
- `vot-cli --output=<path> --reslang=en <link>` — get the audio translation into English and save it in the specified path
- `vot-cli --subs --output=<path> --lang=en <link>` — get English subtitles for the video and save them in the specified path
- `vot-cli --output="." "https://www.youtube.com/watch?v=X98VPQCE_WI" "https://www.youtube.com/watch?v=djr8j-4fS3A&t=900s"` - example with real data

### Arguments:

- `--output` — set the path to save the audio translation file
- `--output-file` — set the file name to download (requires specifying a dir to download in "--output" argument)
- `--lang` — set the source video language (look [wiki](https://github.com/FOSWLY/vot-cli/wiki/%5BEN%5D-Supported-langs), to find out which languages are supported)
- `--reslang` — set the language of the received audio file (look [wiki](https://github.com/FOSWLY/vot-cli/wiki/%5BEN%5D-Supported-langs), to find out which languages are supported)
- `--proxy` — set HTTP or HTTPS proxy in the format `[<PROTOCOL>://]<USERNAME>:<PASSWORD>@<HOST>[:<port>]`

### Options:

- `-h`, `--help` — Show help
- `-v`, `--version` — Show script version
- `--subs`, `--subtitles` — Get video subtitles instead of audio (the subtitle language for saving is taken from `--reslang`)
- `--subs-srt`, `--subtitles-srt` — Get video subtitles in `.srt` format instead of audio

## 💻 Installation

1. Install NodeJS 18+
2. Install vot-cli globally:

```bash
npm install -g vot-cli
```

## ⚙️ Installation for development

1. Install NodeJS 18+
2. Download and unpack the archive from vot-cli
3. Install dependencies:

```bash
npm i
```

4. After successful installation of the modules, run the command

```bash
npm link
```

5. That's it, now you can use vot-cli in your terminal

## 📁 Useful links

1. Browser version: [Link](https://github.com/ilyhalight/voice-over-translation)
2. Script for downloading videos with built-in translation (add-on over vot-cli):
   | OS | Shell | Author | Link |
   | --- | --- | --- | --- |
   | Windows | PowerShell | Dragoy | [Link](https://github.com/FOSWLY/vot-cli/tree/main/scripts)
   | Unix | Fish | Musickiller | [Link](https://gitlab.com/musickiller/fishy-voice-over/)
   | Linux | Bash | s-n-alexeyev | [Link](https://github.com/s-n-alexeyev/yvt)
   | Cloud | Google Colab | alex2844 | [Link](https://github.com/alex2844/youtube-translate)

## ❗ Note

1. Wrap links in quotation marks in order to avoid errors
2. To write to the system partition (for example, to "Disk C" in Windows), administrator rights are required

![example btn](https://github.com/FOSWLY/vot-cli/blob/main/img/example.png "example")
