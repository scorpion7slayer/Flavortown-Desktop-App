# Security Backport

This vendored `phf_generator` 0.8.0 crate exists because `selectors` 0.24
still depends on the 0.8 PHF family through Tauri's HTML parsing stack.

Applied patch:

- GHSA-cq8v-f236-94qc
- Change: use `rand` 0.8.6 instead of the vulnerable 0.7 series.
