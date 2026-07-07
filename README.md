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
- Загрузить субтитры к видео в нужном формате или получить на них ссылку (не совместимо с кастомным форматом субтитров)
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
- **--no-visual**: выводить результат в stdout/stderr без информации о прогрессе (1 линия = 1 ссылка) (совместимо с `--preview`)

</details>

## Примеры использования

<details>
<summary>Нажмите чтобы раскрыть</summary>

- `vot-cli [options] <link> [link2] [link3] ...` - общий пример
- `vot-cli <link>` - получить перевод аудио по ссылке
- `vot-cli --help` - показать помощь по командам
- `vot-cli --version` - показать версию утилиты
- `vot-cli --outdir=<path> <link>` - получить перевод аудио по ссылке и сохранить его по указаному пути
- `vot-cli --outdir=<path> --reslang=en <link>` - получить перевод аудио на английский и сохранить его по указаному пути
- `vot-cli --subs --outdir=<path> --reslang=en <link>` - получить английские субтитры к видео и сохранить их по указанному пути
- `vot-cli --outdir="." "https://www.youtube.com/watch?v=X98VPQCE_WI" "https://www.youtube.com/watch?v=djr8j-4fS3A&t=900s"` - пример с реальными данными

</details>

## Установка

### Linux

- Ubuntu: [`ppa:toil/vot-cli`][ubuntu-ppa-link] (для Ubuntu 22.04+)

- Debian / Ubuntu: Загрузите `vot-cli-<arch>.deb` со страницы [Github Releases][gh-releases] и нажмите по файлу дважды (для Ubuntu 20.04+ и Debian 11+).

## Установка

На данный момент существует несколько вариантов установки утилиты.

### Готовые исполняемые файлы

Этот вариант установки будет предпочтительнее для тех, кто не хочет разбираться с установкой Node.js или Bun.sh, а так же для тех, кто хочет, чтобы утилита работала немного быстрее.

Вы также можете загрузить программу со [страницы релизов на GitHub][gh-releases] в виде архива для вашей ОС.

### С помощью NPM/Bun (Кросс-платформенная)

1. Установите [Bun.sh][bun-link] или [Node 18.18+][nodejs-link]
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

### Deb-файлы

1. После сборки бинарников установите зависимости для сборки deb-файлов:

```bash
sudo apt install devscripts build-essential debhelper
```

2. Запустите сборку deb-файлов:

```bash
./debian/build.sh
```

или, если хотите сразу опубликовать:

```bash
./debian/publish.sh
```

3. После завершения сборки, deb-файлы будут находиться в родительской директории (там, где находится папка `vot-cli`, а не в самой папке `vot-cli`)

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

## ❗ Примечание

1. Оборачивайте ссылки в кавычки, чтобы избежать ошибок при работе
2. Для записи в системный раздел (например на "Диск C" в Windows) необходимы права администратора

![example btn](https://github.com/FOSWLY/vot-cli/blob/main/img/example.png "example")
