# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-12 window-icon

- Done in code: the template icons in `src-tauri/icons/` are replaced by the FGG symbol (`fgg-symbol-square` of the design system) on a white rounded plate, because the navy symbol alone vanishes on a dark taskbar. The source is `src-tauri/icons/source/icon.svg` (the C2PA metadata of the original is cut). The set is generated with `npx tauri icon` from a 1024 px render of it; the `android/`, `ios/` and `64x64.png` it also makes are deleted, `bundle.icon` in `tauri.conf.json` is unchanged.
- Verified: `bash harness/scripts/init.sh` and `cargo check` in `src-tauri/` pass; `icon.png` was looked at.
- Wayland (the user runs Fedora KDE) ignores the window icon of the app, so `tauri dev` showed a fallback icon. With `GDK_BACKEND=x11` the window first showed the old rings, because the icons are embedded at compile time and `cargo` kept the old build; `cargo clean -p fgg` fixed it. A white screen under X11 went away with `WEBKIT_DISABLE_DMABUF_RENDERER=1`.
- Not verified by me: the app was not run by me, and the Windows build (`icon.ico`, the installer) was not seen. The plate color (white) was my choice, the mockup has none.
- Checked by the user (said in chat: «Всё работает»), so `window-icon` is done and moved to the archive.

## 2026-11-12 release-0.7.0

- Bumped the version to 0.7.0 with `npm version 0.7.0 --no-git-tag-version` (package.json, package-lock.json, tauri.conf.json, Cargo.toml, Cargo.lock). The tag `v0.7.0` is created on `master` after the merge, and the release is not a prerelease. The branch also carries the `AGENTS.md` release pointer and the new `harness/PLAYBOOK.md`.
- Verified: `bash harness/scripts/init.sh` and `cargo check` in `src-tauri/` pass. The app was not run.

## 2026-11-12 wishlist-undo-toast

- Done in code: the «Удалить игру?» window is gone, «Удалить» removes the game at once and the usual toast says «Игра убрана из списка желаемого и с колеса». By the user's word the toast has no «Вернуть» button and no timer bar, and there is no delayed deletion; the shared toast is unchanged. Removed games are shown by the «Показать удалённые» switch next to «Добавить игру» in the wishlist tab (only the current user's), in the same table and in the format the catalogue, the exchanges and the members already use: the row is dimmed (`cell--dead`), has the badge «удалена», and a restore button (`rotate-ccw`, «Вернуть») instead of the edit and delete ones. The restore puts the entry back, rereads both lists and shows a toast; a refusal shows the usual error toast. Two earlier versions (a tab of the games screen, then a window opened by a button) were rolled back: the user said another tab does not fit, the removed games belong to the wishlist, and there already is a format for it.
- Backend, by `games.yaml`: `DELETE` only hides an entry (its name stays taken), `GET .../wishlist/removed` lists the hidden ones (not those whose game was started), `POST .../wishlist/{id}/restore` brings one back with the old name, date and author (404 `WISHLIST_GAME_NOT_FOUND`, 409 `GAME_ALREADY_PICKED`). `Api.wishlist` got `listRemoved` and `restore`. The spec files are at `/scalar/api/specification/<name>.yaml`, the Scalar page itself is JS-rendered.
- The user asked why a restore button stands on games that can't be restored, and fixed the backend (`games.yaml` 0.20.0 to 0.21.0): `GET .../wishlist/removed` now also lists the entries whose game was started, each with `removalKind` (`removed` can be restored, `started` can't). By the user's word the switch shows all of them: a `removed` entry has the badge «удалена» and the restore button, a `started` one has the badge «начата» and no button. `Api.wishlist.listRemoved` returns `RemovedWishlistEntry[]` (`WishlistEntry` plus `removalKind`).
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The contract was compared with `games.yaml` 0.21.0; the live backend was not called.
- Not verified by me: the app was not run, so the removal, the toast, the switch, the dimmed rows and the restore were not looked at. The mockup (a canvas of 67 files) was not opened.
- Checked by the user (said in chat: «я всё проверил»), so `wishlist-undo-toast` is done and moved to the archive.

## Open

- `windows-player` is still `in_progress`: the user has not yet looked at the use, spin payment and review windows (details in `harness/archive/progress-2026-11-11.md`).
- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
