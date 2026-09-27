//! SSR parity: every generated binding renders exactly the markup its
//! element's definition specifies (see `parity/generated.rs`, written by
//! `tools/elements/generate.mjs`, and `tests/fixtures`).

mod common;

#[rustfmt::skip]
#[path = "parity/generated.rs"]
mod generated;
