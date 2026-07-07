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

**vot-cli** - это инструмент для перевода видео или загрузки субтитров с помощью [vot.js][votjs-link].

Данный скрипт позволит вам:

- Загрузить перевод видео или получить на него ссылку
- Загрузить субтитры к видео в формате SRT, VTT или JSON или получить на них ссылку
- Получить ссылку на готовый файл без скачивания (режим preview)
- Использовать живые голоса для перевода (en -> ru)
- Выводить результат в JSON или в виде plain-ссылок (без прогресса)
- Обрабатывать несколько ссылок за один запуск

> [!WARNING]
> Скрипт создан исключительно в исследовательских целях и не предназначен для коммерческого использования. Все права на оригинальное программное обеспечение принадлежат их правообладателям.

## Параметры

<details>
<summary>Нажмите чтобы раскрыть</summary>

- **-h**, **--help**: показать помощь по использованию
- **-v**, **--version**: показать версию скрипта
- **-o**, **--out**, **--outdir=(path)**: установить путь для сохранения
- **--outfile=(name)**: установить имя файла для сохранения
- **--lang=(lang)**: установить язык исходного видео (см. [вики][supported-langs-wiki], чтобы узнать какие языки поддерживаются). По умолчанию: `en`
- **--reslang=(lang)**: установить язык звуковой дорожки или субтитров (см. [вики][supported-langs-wiki], чтобы узнать какие языки поддерживаются). По умолчанию: `ru`
- **--proxy=(url)**: установить HTTP или HTTPS прокси в формате `[<PROTOCOL>://]<USERNAME>:<PASSWORD>@<HOST>[:<port>]`
- **--worker-host=(url)**: установить свой [vot-worker][vot-worker-link] в формате `[<PROTOCOL>://]<HOST>[:<port>][/<PREFIX>]`
- **--vot-host=(url)**: установить свой [vot-backend][vot-backend-link] сервер в формате `[<PROTOCOL>://]<HOST>[:<port>][/<PREFIX>]`
- **--subs**: получить субтитры вместо аудио, если существуют
- **--subs-format=(format)**: установить формат для субтитров (`json`, `srt`, `vtt`. Не работает с `--preview`)
- **--preview**: получить ссылку на загрузку файла, без выполнения загрузки
- **--lively-voice**: использовать живые голоса для доступных видео (только `en` -> `ru`)
- **--api-token**: установить Yandex OAuth API токен для использования живых голосов. Токен можно получить через [отладочную ссылку](https://yandex.ru/dev/id/doc/ru/tokens/debug-token)
- **--no-visual**: выводить результат в stdout/stderr без информации о прогрессе (1 линия = 1 ссылка)
- **--json**: выводить результат в stdout/stderr в формате JSON без информации о прогрессе
- **--no-title**: использовать ID видео в имени файла, без попытки получить название видео

</details>

## Примеры использования

<details>
<summary>Нажмите чтобы раскрыть</summary>

- `vot-cli [options] <link> [link2] [link3] ...` - общий пример
- `vot-cli <link>` - получить перевод аудио по ссылке
- `vot-cli --help` - показать помощь по командам
- `vot-cli --version` - показать версию утилиты
- `vot-cli --json [options] <link>` - получить результат в формате JSON
- `vot-cli --outdir=<path> <link>` - получить перевод аудио по ссылке и сохранить его по указаному пути
- `vot-cli --outdir=<path> --reslang=en <link>` - получить перевод аудио на английский и сохранить его по указаному пути
- `vot-cli --subs --outdir=<path> --reslang=en <link>` - получить английские субтитры к видео и сохранить их по указанному пути
- `vot-cli --outdir="." "https://www.youtube.com/watch?v=X98VPQCE_WI" "https://www.youtube.com/watch?v=djr8j-4fS3A&t=900s"` - пример с реальными данными

</details>

### Примеры JSON-вывода

Для README все примеры были отдельно отформатированы, чтобы их было проще читать. В реальном выводе JSON будет в одну линию, а некоторые списки могут быть длиннее.

<details>
<summary>Успешное выполнение</summary>

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
<summary>Ошибка обработки</summary>

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
<summary>Версия</summary>

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
<summary>Помощь</summary>

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

## Установка

Выберите наиболее удобный для себя способ установки `vot-cli`.

### Готовые исполняемые файлы

Если не хочется устанавливать [Node.js][nodejs-link] или [Bun][bun-link], можно просто скачать готовую сборку с [GitHub Releases][gh-releases].

Выберите архив для своей операционной системы и архитектуры:

### Linux

Распакуйте архив, сделайте файл исполняемым и переместите его в директорию, которая находится в `PATH`:

```bash
tar -xzf vot-linux-x64.tar.gz
chmod +x vot-linux-x64
sudo mv vot-linux-x64 /usr/local/bin/vot-cli
vot-cli --version
```

### macOS

Скачайте `vot-darwin-x64.tar.gz` или `vot-darwin-arm64.tar.gz` (в зависимости от вашего Mac) и выполните те же команды, заменив имя файла.

### Windows

Скачайте `vot-windows-x64.exe.zip`, распакуйте `vot-windows-x64.exe`, при желании переименуйте его в `vot-cli.exe`

Чтобы сделать его доступным из любого места, добавьте папку с ним в переменную окружения `PATH`.

### С помощью NPM/Bun (Кросс-платформенная)

Этот вариант подходит, если у вас уже установлен [Bun.sh][bun-link] или [Node.js 22+][nodejs-link].

1. Установите [Bun.sh][bun-link] или [Node.js][nodejs-link].
2. Установите `vot-cli` глобально:

Установка для Bun:

```bash
bun install -g vot-cli
```

Установка для Node:

```bash
npm install -g vot-cli
```

## Сборка для NPM

1. Установите [Bun.sh][bun-link]
2. Установите зависимости:

```bash
bun install
```

1. Соберите vot-cli:

```bash
bun run build:bun
```

## Сборка бинарников

1. Установите [Bun.sh][bun-link]
2. Установите зависимости:

```bash
bun install
```

3. Запустите сборку:

```bash
bun run compile
```

Если при сборке, используя ОС Windows, вы получили ошибку `Failed to move cross-compiled bun binary into cache directory`, используйте WSL или перенесите папку с исходным кодом на Диск С

#### Локальное тестирование с помощью команды `vot-cli`:

1. Свяжите директорию:

```bash
bun link
```

2. Готово, теперь, вы можете использовать vot-cli в вашем терминале

## 📁 Полезные ссылки

1. Версия для браузера: [Ссылка][vot-ext-link]
2. Скрипт для скачивания видео с встроенным переводом (надстройка над vot-cli):

   | OS      | Оболочка     | Автор        | Ссылка                  |
   | ------- | ------------ | ------------ | ----------------------- |
   | Windows | PowerShell   | Dragoy       | [Ссылка][vot-cli-ps]    |
   | Unix    | Fish         | Musickiller  | [Ссылка][vot-cli-fish]  |
   | Linux   | Bash         | s-n-alexeyev | [Ссылка][vot-cli-bash]  |
   | Cloud   | Google Colab | alex2844     | [Ссылка][vot-cli-colab] |

## ✨ Опциональные возможности

### Использование yt-dlp для названий видео

Для получения читаемых названий видео в именах выходных файлов vot-cli может использовать [yt-dlp](https://github.com/yt-dlp/yt-dlp).

Если yt-dlp не найден в системе, в именах файлов будет использоваться ID видео (`X98VPQCE_WI.mp3` вместо названия).

Вы можете отключить это поведение флагом `--no-title`.

## ❗ Примечание

1. Оборачивайте ссылки в кавычки, чтобы избежать ошибок при работе
2. Для записи в системный раздел (например на "Диск C" в Windows) необходимы права администратора
3. yt-dlp используется опционально для получения названий видео (см. раздел "Опциональные возможности")

![example btn](https://github.com/FOSWLY/vot-cli/blob/main/img/example.png "example")
