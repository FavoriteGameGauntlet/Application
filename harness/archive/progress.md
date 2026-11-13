# Progress log archive

## 2026-11-12 remove-after-form-notices

- Done in code, by the user's answers (the grey paragraphs under the screens and the hints under the fields of the windows, both deleted outright): the `.note` and `.card__note` paragraphs are gone from the admin exchanges, members, rewards and wheel screens, the spin cost card, the exchanges of the player, the manual change form, the list of players, the shared points and the completed games, with their styles and the two computed texts of the wheel and manual screens. The hints under the fields are gone from the catalogue, party, member, admin exchange and admin wheel windows. The `note` field type of `FormDialog` was used only by the perk ability window, so it is removed with it (also from `ARCHITECTURE.md`).
- Kept on purpose: toasts, hints of the options in the menus, the red reasons why a form cannot be filled yet and the empty pick list of the use window (`hint` of `FormField` stays for them), empty-state texts, «Не меньше 8 символов.» in the login form, the card hints of the system parameters (the feature `system-parameters-data-format` owns them) and the two lines of the wheel screen. Say so if any of them should go too.
- The rules that the captions carried are written down as the features `rules-ui-*` (priorities 16 to 22), each with the removed texts and ideas for the interface, by the user's word that they are done in other features.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run, so the screens and windows were not looked at.
- Not verified by me: the look of the screens without the captions (spacing at the bottom of the screens, the window layouts without the hints).
- Checked by the user (said in chat: «windows-player уже проверен»), so `windows-player` is done and moved to the archive. `remove-after-form-notices` stays `in_progress` until the user has looked at the screens.

## 2026-11-12 window-icon

- Done in code: the template icons in `src-tauri/icons/` are replaced by the FGG symbol (`fgg-symbol-square` of the design system) on a white rounded plate, because the navy symbol alone vanishes on a dark taskbar. The source is `src-tauri/icons/source/icon.svg` (the C2PA metadata of the original is cut). The set is generated with `npx tauri icon` from a 1024 px render of it; the `android/`, `ios/` and `64x64.png` it also makes are deleted, `bundle.icon` in `tauri.conf.json` is unchanged.
- Verified: `bash harness/scripts/init.sh` and `cargo check` in `src-tauri/` pass; `icon.png` was looked at.
- Wayland (the user runs Fedora KDE) ignores the window icon of the app, so `tauri dev` showed a fallback icon. With `GDK_BACKEND=x11` the window first showed the old rings, because the icons are embedded at compile time and `cargo` kept the old build; `cargo clean -p fgg` fixed it. A white screen under X11 went away with `WEBKIT_DISABLE_DMABUF_RENDERER=1`.
- Not verified by me: the app was not run by me, and the Windows build (`icon.ico`, the installer) was not seen. The plate color (white) was my choice, the mockup has none.
- Checked by the user (said in chat: «Всё работает»), so `window-icon` is done and moved to the archive.

## 2026-11-12 screens-wheel-members

- Done in code: the groups of the wheel are pill tabs above the table instead of the mockup's chips, by the user's word (a chip is for information, not for controls; the pencil inside a chip also overflowed its round shape). The pencil of the selected group and «+ Группа» stand beside the tabs, the name is edited in a field in their place (Enter and Esc, the delete button inside the edit mode). A game is added by a row at the end of the table; a member is added by a login row above the table with the error under the field; the same field filters the table, so the separate search of the members is gone (by the user's word, as in the list of wanted games). The windows of a group, of a new game and of a new member are gone. A new member gets the least used palette color, it is changed in the edit window.
- The backend takes only a name for a game (`wheel.yaml`), so by the user's word the description of a game is removed: no field in the game window, no text in the row. The game window only renames.
- Found and fixed: adding a member answers `USER_LOGIN_NOT_FOUND` (`parties.yaml`), the code in the store and in the contract comment said `USER_NOT_FOUND`. `MEMBER_ALREADY_EXISTS` also comes for a member who left, so the text under the field says to bring them back in the table.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run and nothing was rendered; the error codes were read from the documentation, the live backend was not called.
- Not verified by me: the app was not run. The group meta line (count of items, «не повторять») is no longer shown next to the group name.
- Also in this branch, `wishlist-rename-text`: every text with «вишлист» now says «список желаемого» (the words are declined where the sentence needs it), and the admin facade shows the system wheel group, which the backend names in English, as «Список желаемого». Names in the code stay. The mockup still says «вишлист» and was not changed.
- Checked by the user (said in chat: «Я проверил, всё работает»), so `screens-wheel-members` and `wishlist-rename-text` are done and moved to the archive.

## 2026-11-12 wishlist-undo-toast

- Done in code: the «Удалить игру?» window is gone, «Удалить» removes the game at once and the usual toast says «Игра убрана из списка желаемого и с колеса». By the user's word the toast has no «Вернуть» button and no timer bar, and there is no delayed deletion; the shared toast is unchanged. Removed games are shown by the «Показать удалённые» switch next to «Добавить игру» in the wishlist tab (only the current user's), in the same table and in the format the catalogue, the exchanges and the members already use: the row is dimmed (`cell--dead`), has the badge «удалена», and a restore button (`rotate-ccw`, «Вернуть») instead of the edit and delete ones. The restore puts the entry back, rereads both lists and shows a toast; a refusal shows the usual error toast. Two earlier versions (a tab of the games screen, then a window opened by a button) were rolled back: the user said another tab does not fit, the removed games belong to the wishlist, and there already is a format for it.
- Backend, by `games.yaml`: `DELETE` only hides an entry (its name stays taken), `GET .../wishlist/removed` lists the hidden ones (not those whose game was started), `POST .../wishlist/{id}/restore` brings one back with the old name, date and author (404 `WISHLIST_GAME_NOT_FOUND`, 409 `GAME_ALREADY_PICKED`). `Api.wishlist` got `listRemoved` and `restore`. The spec files are at `/scalar/api/specification/<name>.yaml`, the Scalar page itself is JS-rendered.
- The user asked why a restore button stands on games that can't be restored, and fixed the backend (`games.yaml` 0.20.0 to 0.21.0): `GET .../wishlist/removed` now also lists the entries whose game was started, each with `removalKind` (`removed` can be restored, `started` can't). By the user's word the switch shows all of them: a `removed` entry has the badge «удалена» and the restore button, a `started` one has the badge «начата» and no button. `Api.wishlist.listRemoved` returns `RemovedWishlistEntry[]` (`WishlistEntry` plus `removalKind`).
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The contract was compared with `games.yaml` 0.21.0; the live backend was not called.
- Not verified by me: the app was not run, so the removal, the toast, the switch, the dimmed rows and the restore were not looked at. The mockup (a canvas of 67 files) was not opened.
- Checked by the user (said in chat: «я всё проверил»), so `wishlist-undo-toast` is done and moved to the archive.

## 2026-11-12 release-0.7.0

- Bumped the version to 0.7.0 with `npm version 0.7.0 --no-git-tag-version` (package.json, package-lock.json, tauri.conf.json, Cargo.toml, Cargo.lock). The tag `v0.7.0` is created on `master` after the merge, and the release is not a prerelease. The branch also carries the `AGENTS.md` release pointer and the new `harness/PLAYBOOK.md`.
- Verified: `bash harness/scripts/init.sh` and `cargo check` in `src-tauri/` pass. The app was not run.

## 2026-11-12 release-0.6.0

- Bumped the version to 0.6.0 with `npm version 0.6.0 --no-git-tag-version` (package.json, package-lock.json, tauri.conf.json, Cargo.toml, Cargo.lock). The tag `v0.6.0` is created on `master` after the merge, and the release is not a prerelease.
- Verified: `bash harness/scripts/init.sh` and `cargo check` in `src-tauri/` pass. The app was not run.

## 2026-11-11 item-transfer

- Done in code: the entry kind `user-item-transfer` (contract, rows, text of the entry, journal event `item_transferred` with `receiverLogin` shown as «Щит → bob»), the slots and the use window for a transfer («Кому передать», «Что передать: …», the holder never among the targets), the row in the catalogue form («Передаёт», a positive amount). The entry facade now sends and reads `kind` instead of the `userItem` flag, which the documentation no longer has.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. `useSlots`, `needsTargets`, `needsUseForm` and `allowedTargets` were run in Node for a give and a take transfer (slots per target, owner and receiver as expected, holder dropped from the targets). The contract was compared with `items.yaml`, `perks.yaml` and `history.yaml` of the API documentation; the live backend was not called.
- Not verified: the app was not run. The use window with a transfer, the catalogue form row and the journal text were not looked at. The `kind` sent for the old `user-item` entry and the new one was not tried against the backend.
- Checked by the user (said in chat: «Всё работает»), so `item-transfer` is done and moved to the archive. The direction of a transfer is set by the entry in the catalogue («Владелец» gives, «Цель» hands to the owner); the player does not choose it at the use.
- Open: a target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.

## 2026-11-11 windows-player

- The user tried the use window on their own item. Fixed: one copy named twice in `userItemIds`, an old inventory of another player, slots with a single copy that were hidden, unclear hints. The copy that is being used stays excluded from every slot (the user's rule; the specs are silent). Copying now asks for a player first, players with no copy to take or copy are shown disabled, and the sections are ordered «На кого», takes, copies. Checked: `init.sh` passes; `UseDialog` was server-rendered in Node for one case without targets. Not checked: the flow with targets and the player to copy from, in the real app.
- The backend has no transfer of an item between players; it is the feature `item-transfer`.

- Verified: `bash harness/scripts/init.sh` passes; prettier ran on the changed files. FormDialog with the new `pick` and `rating` fields was server-rendered in Node through a temporary copy (deleted): rows, radio, avatars, the «N из limit» count, the red hint and the rating cells rendered as intended.
- Not verified: the app was not run, so the use, spin payment and review windows were not looked at. The `change` event (the parent rebuilds the sections from the values) was checked by reading the code only.
- Next step: the user looks at the three windows; then set `windows-player` to done with "Checked by the user".
- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
