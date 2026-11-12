# Progress log

Newest entry on top. Record only what was actually verified.

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

## 2026-11-12 screens-wheel-members

- Done in code: the groups of the wheel are pill tabs above the table instead of the mockup's chips, by the user's word (a chip is for information, not for controls; the pencil inside a chip also overflowed its round shape). The pencil of the selected group and «+ Группа» stand beside the tabs, the name is edited in a field in their place (Enter and Esc, the delete button inside the edit mode). A game is added by a row at the end of the table; a member is added by a login row above the table with the error under the field; the same field filters the table, so the separate search of the members is gone (by the user's word, as in the list of wanted games). The windows of a group, of a new game and of a new member are gone. A new member gets the least used palette color, it is changed in the edit window.
- The backend takes only a name for a game (`wheel.yaml`), so by the user's word the description of a game is removed: no field in the game window, no text in the row. The game window only renames.
- Found and fixed: adding a member answers `USER_LOGIN_NOT_FOUND` (`parties.yaml`), the code in the store and in the contract comment said `USER_NOT_FOUND`. `MEMBER_ALREADY_EXISTS` also comes for a member who left, so the text under the field says to bring them back in the table.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run and nothing was rendered; the error codes were read from the documentation, the live backend was not called.
- Not verified by me: the app was not run. The group meta line (count of items, «не повторять») is no longer shown next to the group name.
- Also in this branch, `wishlist-rename-text`: every text with «вишлист» now says «список желаемого» (the words are declined where the sentence needs it), and the admin facade shows the system wheel group, which the backend names in English, as «Список желаемого». Names in the code stay. The mockup still says «вишлист» and was not changed.
- Checked by the user (said in chat: «Я проверил, всё работает»), so `screens-wheel-members` and `wishlist-rename-text` are done and moved to the archive.

## Open

- `windows-player` is still `in_progress`: the user has not yet looked at the use, spin payment and review windows (details in `harness/archive/progress-2026-11-11.md`).
- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
