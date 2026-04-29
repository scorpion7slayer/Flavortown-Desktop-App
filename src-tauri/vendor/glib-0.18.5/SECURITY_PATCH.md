# Security Backport

This vendored `glib` 0.18.5 crate exists because Tauri v2 still depends on
the GTK3 crate family (`gtk` 0.18), which cannot resolve `glib` 0.20 without
breaking Cargo's dependency graph.

Applied patch:

- GHSA-wrw7-89jp-8q8g / RUSTSEC-2024-0429
- Upstream PR: https://github.com/gtk-rs/gtk-rs-core/pull/1343
- Change: pass `&mut p` instead of `&p` in `VariantStrIter::impl_get`.
