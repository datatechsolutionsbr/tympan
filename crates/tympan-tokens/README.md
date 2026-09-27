# tympan-tokens

Tympan's design tokens for Rust: every theme as a typed enum (the built-in
presets, then the print styles), `Mode` and `Density`, the preset token
values, and the built stylesheets and custom-element bundle embedded
(`assets`) for a server to mount.

`generated/` is copied from the JavaScript build by `tools/rust/sync.mjs`
(`npm run build`, then `node tools/rust/sync.mjs`); CI runs it with
`--check`. No Node is needed to build the crate. FSL-1.1-ALv2.
