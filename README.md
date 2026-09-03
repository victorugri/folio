<div align="center">

<img src="src-tauri/icons/128x128.png" width="88" height="88" alt="">

# Folio

**A small, quiet EPUB reader for the desktop.**

Open a book, read it, and pick it up where you left off — on Windows, macOS and Linux.
Your library never leaves your machine.

[![CI](https://github.com/victorugri/folio/actions/workflows/ci.yml/badge.svg)](https://github.com/victorugri/folio/actions/workflows/ci.yml)
[![Latest release](https://img.shields.io/github/v/release/victorugri/folio?label=release)](https://github.com/victorugri/folio/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

---

## Download

No need to build anything — grab an installer from the
**[latest release](https://github.com/victorugri/folio/releases/latest)**:

| Platform | File |
| --- | --- |
| Windows | `Folio_<version>_x64-setup.exe` (or the `.msi`) |
| macOS (Apple Silicon) | `Folio_<version>_aarch64.dmg` |
| macOS (Intel) | `Folio_<version>_x64.dmg` |
| Linux | `.deb`, `.rpm`, or the portable `.AppImage` |

Windows and macOS builds are not code-signed, so the OS will warn about an unknown
publisher on first launch — this is expected for a project that doesn't pay for a
signing certificate. On Windows, choose **More info → Run anyway**; on macOS,
right-click the app and choose **Open**.

If you'd rather build it yourself, see [Running it locally](#running-it-locally) below.

## Screenshots

> Not in the repository yet. Drop `library.png`, `reader.png` and `settings.png` into
> `docs/screenshots/` and uncomment the block below.

<!--
| Library | Reader | Settings |
| --- | --- | --- |
| ![The library grid](docs/screenshots/library.png) | ![Reading a book](docs/screenshots/reader.png) | ![Reading settings](docs/screenshots/settings.png) |
-->

## What it does

- **Open any `.epub`** through the native file dialog.
- **Paginated reading** with on-screen arrows, `←`/`→` and `PageUp`/`PageDown`.
- **Table of contents** in a side panel that highlights the chapter you are in.
- **Your position is remembered**, per book, as an EPUB CFI — close the app, come back
  next week, and the book opens on the same page.
- **A library** of everything you have opened, with covers pulled out of the files
  themselves and how far through each book you are.
- **Reading settings**: light, sepia and dark themes; serif or sans; text size from
  80% to 200%. The window and the book are always on the same theme.
- **Progress** through the whole book, in the footer.

Everything is stored locally in plain files. There is no account, no telemetry and no
network access — the app never makes a request.

## What it does not do (yet)

Deliberately out of scope for the first version, but the architecture leaves room for
each of them:

- Cloud sync
- Highlights and annotations
- Full-text search inside a book
- Formats other than EPUB (MOBI, PDF)

## Stack

| | |
| --- | --- |
| Shell | [Tauri 2](https://tauri.app) — Rust, with the operating system's own WebView |
| UI | React 19 + TypeScript, built by Vite 7 |
| EPUB engine | [epub.js](https://github.com/futurepress/epub.js) 0.3 |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 |

## Running it locally

### Prerequisites

- **[Node.js](https://nodejs.org) 20.19+** (22+ recommended)
- **[Rust](https://www.rust-lang.org/tools/install) 1.77.2+** via `rustup`
- Platform build tools:

  <details>
  <summary><b>Windows</b></summary>

  - [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
    with the *Desktop development with C++* workload
  - WebView2 — already present on Windows 10 (recent builds) and Windows 11
  </details>

  <details>
  <summary><b>macOS</b></summary>

  ```bash
  xcode-select --install
  ```
  </details>

  <details>
  <summary><b>Linux (Debian / Ubuntu)</b></summary>

  ```bash
  sudo apt update
  sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
    libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev patchelf
  ```

  Other distributions are covered in the
  [Tauri prerequisites](https://tauri.app/start/prerequisites/).
  </details>

### Run

```bash
npm install
npm run tauri dev
```

The first run compiles the Rust side and takes a few minutes. After that it is fast,
and the frontend hot-reloads.

You can also run **only the frontend**, in an ordinary browser, without Rust:

```bash
npm run dev
```

The app detects that it is not inside Tauri and falls back to a browser implementation
of the file dialog and storage (see [Architecture](#architecture)). Everything works
except re-opening a book from the library, since browsers have no durable file paths.

## Building

```bash
npm run tauri build
```

Installers land in `src-tauri/target/release/bundle/`:

| Platform | Output |
| --- | --- |
| Windows | `msi/Folio_0.1.0_x64_en-US.msi`, `nsis/Folio_0.1.0_x64-setup.exe` |
| macOS | `dmg/Folio_0.1.0_aarch64.dmg`, `macos/Folio.app` |
| Linux | `deb/Folio_0.1.0_amd64.deb`, `appimage/Folio_0.1.0_amd64.AppImage`, `rpm/` |

Each platform must be built on itself — there is no cross-compilation. To skip
packaging and only check that everything compiles:

```bash
npm run tauri build -- --no-bundle
```

Add `--target aarch64-apple-darwin` or `--target x86_64-apple-darwin` on macOS to pick
an architecture, or `--target universal-apple-darwin` for both in one binary.

## Project layout

```
src/
├─ components/          Presentation only, no epub.js
│  ├─ library/          LibraryView, BookCard, EmptyLibrary
│  ├─ reader/           ReaderView, ReaderToolbar, PageControls, ReadingProgress
│  ├─ settings/         SettingsMenu, SettingsPanel
│  ├─ toc/              TocSidebar
│  └─ ui/               Button, IconButton, SegmentedControl, icons
├─ hooks/               React lifecycle glue: rendition, keyboard, progress, theme
├─ services/
│  ├─ epub/             Parsing, covers, CFI ↔ percentage, theming, teardown
│  ├─ storage/          The on-disk format: library index, settings
│  └─ platform/         Tauri ⇄ browser adapter
├─ store/               Zustand: reader, library, settings, panel visibility
└─ types/               Shared shapes

src-tauri/
├─ src/commands.rs      Reading a user-picked file, outside the fs plugin's scope
├─ capabilities/        What the window is allowed to do
└─ tauri.conf.json      Window, bundle and security configuration
```

## Architecture

Three decisions are worth knowing before changing anything.

### The platform adapter

`services/platform` is the only place that knows whether the app is running inside
Tauri. It exposes one interface — pick a file, read a book, read and write JSON and
blobs — with a Tauri implementation and a browser one.

That is what makes `npm run dev` useful without a Rust toolchain, and it keeps every
service above it testable against a fake instead of a mocked IPC bridge.

### Book files are read by a Rust command, not the `fs` plugin

The `fs` plugin's scope is limited to the app data directory. Books live anywhere on
disk, and widening the scope to `**` to reach them would hand the frontend the whole
filesystem. Instead `read_file_bytes` reads exactly the one path the user picked in the
native dialog, and returns raw bytes over IPC rather than a JSON array of numbers.

### epub.js needs careful handling

epub.js 0.3.93 is stable but unmaintained, and three of its behaviours shape this code:

1. **A `Rendition` leaks a hook onto its `Book`.** The constructor registers
   `injectIdentifier` on `book.spine.hooks.content`; `destroy()` never removes it, so a
   book that outlives its rendition throws on every later section load. Folio therefore
   never destroys a rendition without destroying its book in the same breath, and the
   rendition hook deliberately has no cleanup — see `services/epub/lifecycle.ts`.
2. **Neither theming route works.** `registerCss()` stores the sheet where the
   re-injection hook does not look at it, so a theme vanishes on the next chapter;
   `registerRules()` appends duplicates on every change. `services/epub/renditionTheme.ts`
   owns a single `<style>` element per section instead.
3. **Its work queue runs on `requestAnimationFrame`.** Nothing renders while the window
   is hidden. That is correct behaviour, but it surprises you in a headless test.

### Where your data lives

| Platform | Path |
| --- | --- |
| Windows | `%APPDATA%\com.folio.reader\` |
| macOS | `~/Library/Application Support/com.folio.reader/` |
| Linux | `~/.local/share/com.folio.reader/` |

```
library.json      every book you have opened, with its saved position
settings.json     theme, typeface, text size
covers/           cover images pulled out of each EPUB
locations/        cached CFI-to-percentage index, one file per book
```

A book is identified by the SHA-256 of its bytes, not by its path — move the file and
it keeps its place in the library. Deleting the directory resets the app; no book file
is ever modified or moved.

## Contributing

Issues and pull requests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE).

Folio bundles [epub.js](https://github.com/futurepress/epub.js) (BSD-2-Clause) and is
built on [Tauri](https://tauri.app) (MIT / Apache-2.0).
