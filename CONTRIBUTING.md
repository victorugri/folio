# Contributing to Folio

Thanks for taking the time. Folio is small on purpose, and the goal is to keep it that
way — a reader that opens a book and gets out of the way.

## Getting set up

Follow [Running it locally](README.md#running-it-locally) in the README for the
prerequisites, then:

```bash
npm install
npm run tauri dev
```

If you only need to touch the interface, `npm run dev` runs the frontend in a browser
with no Rust toolchain at all. See [the platform adapter](README.md#the-platform-adapter)
for what that changes.

## Before you open a pull request

```bash
npm run format        # Prettier, writes
npm run lint          # ESLint
npm run typecheck     # tsc, both projects
npm run build         # typecheck + production frontend build
```

And, when you have touched anything under `src-tauri/`:

```bash
cd src-tauri
cargo fmt
cargo clippy --all-targets -- -D warnings
```

CI runs all of the above on every push and pull request, plus a full Tauri build on
Windows, macOS and Linux.

## What we are looking for

Good first contributions:

- Bugs with a specific EPUB — attach the file, or a link to it, if you can share it
- Keyboard and screen-reader accessibility
- Making an existing feature behave better on one platform

Please **open an issue before building a large feature**. The four things listed under
[What it does not do (yet)](README.md#what-it-does-not-do-yet) are wanted eventually,
but each one needs a design discussion first — they touch the storage format, and
getting that wrong is expensive later.

Things that will probably be declined: new runtime dependencies where a few lines of
code would do, telemetry of any kind, and anything that sends a book or a reading
position off the machine.

## How the code is organised

The one rule worth stating: **components do not import epub.js.**

```
components/  →  hooks/  →  store/  →  services/
```

- `services/epub` is the only place that touches the epub.js API
- `services/storage` is the only place that knows the on-disk format
- `services/platform` is the only place that knows whether we are inside Tauri
- `store/` holds state; `hooks/` binds it to React's lifecycle
- `components/` renders, and nothing else

If a component needs something from epub.js, add it to a service and expose the
plain-data result. That is what keeps the reader testable and what will make a second
rendering engine possible if epub.js ever becomes untenable.

epub.js 0.3.93 has some sharp edges that this codebase works around deliberately;
they are documented in [Architecture](README.md#epubjs-needs-careful-handling) and in
comments at each site. Please read those before "simplifying" `lifecycle.ts`,
`useRendition.ts` or `renditionTheme.ts` — every one of those workarounds exists
because the obvious version is broken.

## Style

Formatting is Prettier's job and linting is ESLint's; neither is worth arguing about,
and both run in CI. Beyond that:

- TypeScript in strict mode. `any` needs a comment explaining why.
- Comments explain **why**, not what. A comment restating the code will be asked about
  in review; a comment recording a decision or a workaround is welcome.
- New user-facing strings are in English.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), in English:

```
feat(reader): remember the scroll position between chapters
fix(library): stop duplicate entries when a book is re-imported
docs: explain where the library index lives
chore(deps): bump vite to 7.2
```

Common scopes: `reader`, `library`, `toc`, `settings`, `progress`, `storage`,
`platform`, `tauri`. One logical change per commit — the body is the place to explain
the reasoning.

## Reporting a bug

Please include:

- Your operating system and version
- The Folio version (or the commit)
- What you expected, and what happened instead
- The EPUB that triggers it, if the bug is specific to a file
- Anything in the developer console (`Ctrl`/`Cmd` + `Shift` + `I` in a dev build)

## Licence

By contributing you agree that your work is released under the
[MIT licence](LICENSE) that covers the project.
