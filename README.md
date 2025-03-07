<h1 align="center">
  VOT-CLI

[![GitHub Actions](https://github.com/FOSWLY/vot-cli/actions/workflows/build.yml/badge.svg)](https://github.com/FOSWLY/vot-cli/actions/workflows/build.yml)
[![en](https://img.shields.io/badge/lang-English%20%F0%9F%87%AC%F0%9F%87%A7-white)](README-EN.md)
[![ru](https://img.shields.io/badge/%D1%8F%D0%B7%D1%8B%D0%BA-%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9%20%F0%9F%87%B7%F0%9F%87%BA-white)](README.md)

</h1>

**vot-cli** - это инструмент для загрузки субтитров или перевода видео с помощью [vot.js](https://github.com/FOSWLY/vot.js).

Данный скрипт позволит вам:

- Загрузить перевод видео или получить на него ссылку
- Загрузить субтитры к видео в нужном формате или получить на них ссылку
- Использовать старую/новую модель перевода

> [!WARNING]
> Скрипт создан исключительно в исследовательских целях и не предназначен для коммерческого использования. Все права на оригинальное программное обеспечение принадлежат их правообладателям.

## Параметры

<details>
<summary>Нажмите чтобы раскрыть</summary>

- **-h**, **--help**: показать помощь по использованию
- **-v**, **--version**: показать версию скрипта
- **-o**, **--out**, **--outdir=(path)**: установить путь для сохранения
- **--outfile=(name)**: установить имя файла для сохранения
- **--lang=(lang)**: установить язык исходного видео (см. [вики](https://github.com/FOSWLY/vot-cli/wiki/%5BRU%5D-Supported-langs), чтобы узнать какие языки поддерживаются). По умолчанию: `en`
- **--reslang=(lang)**: установить язык звуковой дорожки или субтитров (см. [вики](https://github.com/FOSWLY/vot-cli/wiki/%5BRU%5D-Supported-langs), чтобы узнать какие языки поддерживаются). По умолчанию: `ru`
- **--proxy=(url)**: установить HTTP или HTTPS прокси в формате `[<PROTOCOL>://]<USERNAME>:<PASSWORD>@<HOST>[:<port>]`
- **--worker-host=(url)**: установить свой [vot-worker](https://github.com/FOSWLY/vot-worker) в формате `[<PROTOCOL>://]<HOST>[:<port>][/<PREFIX>]`
- **--vot-host=(url)**: установить свой [vot-backend](https://github.com/FOSWLY/vot-backend) сервер в формате `[<PROTOCOL>://]<HOST>[:<port>][/<PREFIX>]`
- **--subs**: получить субтитры вместо аудио, если существуют
- **--subs-format=(format)**: установить формат для субтитров (`json`, `srt`, `vtt`. Не работает с `--preview`)
- **--preview**: получить ссылку на загрузку файла, без выполнения загрузки
- **--old-model**: использовать модель со старыми голосами для всех видео
- **--no-visual**: выводить результат в stdout/stderr без информации о прогрессе (1 линия = 1 ссылка) (совместимо с `--preview`)

</details>

## Примеры использования

<details>
<summary>Нажмите чтобы раскрыть</summary>

- `vot-cli [options] <link> [link2] [link3] ...` - общий пример
- `vot-cli <link>` - получить перевод аудио по ссылке
- `vot-cli --help` - показать помощь по командам
- `vot-cli --version` - показать версию утилиты
- `vot-cli --output=<path> <link>` - получить перевод аудио по ссылке и сохранить его по указаному пути
- `vot-cli --output=<path> --reslang=en <link>` - получить перевод аудио на английский и сохранить его по указаному пути
- `vot-cli --subs --output=<path> --lang=en <link>` - получить английские субтитры к видео и сохранить их по указанному пути
- `vot-cli --output="." "https://www.youtube.com/watch?v=X98VPQCE_WI" "https://www.youtube.com/watch?v=djr8j-4fS3A&t=900s"` - пример с реальными данными

</details>

## Установка

На данный момент существует несколько вариантов установки утилиты.

### Готовые исполняемые файлы

Этот вариант установки будет предпочтительнее для тех, кто не хочет разбираться с установкой Node.js или Bun.sh, а так же для тех, кто хочет, чтобы утилита работала немного быстрее.

Вы также можете загрузить программу со [страницы релизов на GitHub](https://github.com/FOSWLY/vot-cli/releases) в виде архива для вашей ОС.

### С помощью NPM/Bun (Кросс-платформенная)

1. Установите Bun или Node 18.3+
2. Установите vot-cli глобально:

Установка для Bun:

```bash
bun install -g vot-cli
```

Установка для Node:

```bash
npm install -g vot-cli
```

## Сборка для NPM

1. Установите Bun
2. Установите зависимости:

```bash
bun install
```

1. Соберите vot-cli:

```bash
bun run build:bun
```

## Сборка бинарников

1. Установите Bun
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

1. Версия для браузера: [Ссылка](https://github.com/ilyhalight/voice-over-translation)
2. Скрипт для скачивания видео с встроенным переводом (надстройка над vot-cli):
   | OS | Оболочка | Автор | Ссылка |
   | --- | --- | --- | --- |
   | Windows | PowerShell | Dragoy | [Ссылка](https://github.com/FOSWLY/vot-cli/tree/main/scripts/shells)
   | Unix | Fish | Musickiller | [Ссылка](https://gitlab.com/musickiller/fishy-voice-over/)
   | Linux | Bash | s-n-alexeyev | [Ссылка](https://github.com/s-n-alexeyev/yvt)

## ❗ Примечание

1. Оборачивайте ссылки в кавычки, дабы избежать ошибок
2. Для записи в системный раздел (например на "Диск C" в Windows) необходимы права администратора

![example btn](https://github.com/FOSWLY/vot-cli/blob/main/img/example.png "example")
