## [FOSWLY] VOT-CLI

English version: [Link](https://github.com/FOSWLY/vot-cli/blob/main/README-EN.md)

Небольшой скрипт, позволяющий скачать перевод аудио перевод от Яндекса через терминал.

## 📖 Использование

### Примеры использования:

- `vot-cli [options] [args] <link> [link2] [link3] ...` — общий пример
- `vot-cli <link>` — получить перевод аудио по ссылке
- `vot-cli --help` — показать помощь по командам
- `vot-cli --version` — показать версию скрипта
- `vot-cli --output=<path> <link>` — получить перевод аудио по ссылке и сохранить его по указаному пути
- `vot-cli --output=<path> --reslang=en <link>` — получить перевод аудио на английский и сохранить его по указаному пути
- `vot-cli --subs --output=<path> --lang=en <link>` — получить английские субтитры к видео и сохранить их по указанному пути
- `vot-cli --output="." "https://www.youtube.com/watch?v=X98VPQCE_WI" "https://www.youtube.com/watch?v=djr8j-4fS3A&t=900s"` - пример с реальными данными

### Аргументы:

- `--output` — установить путь сохранения аудио файла перевода
- `--output-file` — установить имя файла для сохранения (требует указания пути сохранения аудио файла перевода в аргументе "--output")
- `--lang` — установить язык исходного видео (см. [вики](https://github.com/FOSWLY/vot-cli/wiki/%5BRU%5D-Supported-langs), чтобы узнать какие языки поддерживаются)
- `--reslang` — установить язык полученного аудио файла (см. [вики](https://github.com/FOSWLY/vot-cli/wiki/%5BRU%5D-Supported-langs), чтобы узнать какие языки поддерживаются)
- `--proxy` — установить HTTP или HTTPS прокси в формате `[<PROTOCOL>://]<USERNAME>:<PASSWORD>@<HOST>[:<port>]`

### Опции:

- `-h`, `--help` — показать помощь по использованию
- `-v`, `--version` — показать версию скрипта
- `--subs`, `--subtitles` — получить субтитры к видео вместо аудио (язык субтитров для сохранения берется из `--reslang`)
- `--subs-srt`, `--subtitles-srt` — получить субтитры в формате `.srt` к видео вместо аудио

## 💻 Установка

1. Установите NodeJS 18+
2. Установите vot-cli глобально:

```bash
npm install -g vot-cli
```

## ⚙️ Установка для разработки

1. Установите NodeJS 18+
2. Скачайте и распакуйте архив с vot-cli
3. Установите зависимости:

```bash
npm i
```

4. После успешной установки модулей выполнить команду

```bash
npm link
```

5. Готово, теперь, вы можете использовать vot-cli в вашем терминале

## 📁 Полезные ссылки

1. Версия для браузера: [Ссылка](https://github.com/ilyhalight/voice-over-translation)
2. Скрипт для скачивания видео с встроенным переводом (надстройка над vot-cli):
   | OS | Оболочка | Автор | Ссылка |
   | --- | --- | --- | --- |
   | Windows | PowerShell | Dragoy | [Ссылка](https://github.com/FOSWLY/vot-cli/tree/main/scripts)
   | Unix | Fish | Musickiller | [Ссылка](https://gitlab.com/musickiller/fishy-voice-over/)
   | Linux | Bash | s-n-alexeyev | [Ссылка](https://github.com/s-n-alexeyev/yvt)
   | Cloud | Google Colab | alex2844 | [Ссылка](https://github.com/alex2844/youtube-translate)
3. Скрипт для скачивания видео со встроенными субтитрами (надстройка над vot-cli): [Cсылка](./scripts/)

## ❗ Примечание

1. Оборачивайте ссылки в кавычки, дабы избежать ошибок
2. Для записи в системный раздел (например на "Диск C" в Windows) необходимы права администратора

![example btn](https://github.com/FOSWLY/vot-cli/blob/main/img/example.png "example")
