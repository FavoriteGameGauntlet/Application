# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-11 windows-player

- Verified: `bash harness/scripts/init.sh` passes; prettier ran on the changed files. FormDialog with the new `pick` and `rating` fields was server-rendered in Node through a temporary copy (deleted): rows, radio, avatars, the «N из limit» count, the red hint and the rating cells rendered as intended.
- Not verified: the app was not run, so the use, spin payment and review windows were not looked at. The `change` event (the parent rebuilds the sections from the values) was checked by reading the code only.
- Next step: the user looks at the three windows; then set `windows-player` to done with "Checked by the user".
- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
