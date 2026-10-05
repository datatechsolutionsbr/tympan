# @datatechsolutions/tympan-fonts-cjk

Optional font package for Tympan. The token stacks of
`@datatechsolutions/tympan-tokens` name the CJK Noto families (Noto Sans and
Noto Serif JP, SC, TC and KR, used by the `:lang(ja)`, `:lang(zh-*)` and
`:lang(ko)` rules), but `tympan-tokens` does not ship their files: together
they are about 41 MB of woff2. Without this package the browser falls back to
the system CJK faces (present on macOS and Windows). Install it when you want
the same CJK faces everywhere:

```sh
npm install @datatechsolutions/tympan-fonts-cjk
```

```ts
import '@datatechsolutions/tympan-fonts-cjk/fonts.css'
```

| Export | Contents |
|---|---|
| `@datatechsolutions/tympan-fonts-cjk/fonts.css` | `@font-face` rules (font-display swap, unicode-range slices, relative URLs) for the eight families |
| `@datatechsolutions/tympan-fonts-cjk/fonts/` | the woff2 files, their licences (`<family>/OFL.txt`) and `manifest.json` |

Each family is sliced by `unicode-range` (about 100 slices per family), so a
page downloads only the slices its text uses; installing the package costs
disk space, not page weight. Your bundler resolves the relative URLs in
`fonts.css` and emits the files it references.

The files come from Google Fonts, unmodified, and are licensed under the SIL
Open Font License 1.1 (see `LICENSE`, `THIRD_PARTY_NOTICES.md` and each
`fonts/<family>/OFL.txt`). They are fetched by
`packages/tokens/scripts/fetch-fonts.mjs` in the Tympan repository, which
fills this package and `tympan-tokens` in one run.
