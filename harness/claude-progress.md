# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-12 screens-wheel-members

- Done in code: the groups of the wheel are pill tabs above the table instead of the mockup's chips, by the user's word (a chip is for information, not for controls; the pencil inside a chip also overflowed its round shape). The pencil of the selected group and «+ Группа» stand beside the tabs, the name is edited in a field in their place (Enter and Esc, the delete button inside the edit mode). A game is added by a row at the end of the table; a member is added by a login row above the table with the error under the field. The windows of a group, of a new game and of a new member are gone. A new member gets the least used palette color, it is changed in the edit window.
- The backend takes only a name for a game (`wheel.yaml`), so by the user's word the description of a game is removed: no field in the game window, no text in the row. The game window only renames.
- Found and fixed: adding a member answers `USER_LOGIN_NOT_FOUND` (`parties.yaml`), the code in the store and in the contract comment said `USER_NOT_FOUND`. `MEMBER_ALREADY_EXISTS` also comes for a member who left, so the text under the field says to bring them back in the table.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run and nothing was rendered; the error codes were read from the documentation, the live backend was not called.
- Not verified: the tabs, the editing of a group name, the add rows and the error under the field were not looked at. The group meta line (count of items, «не повторять») is no longer shown next to the group name.
- Next step: the user looks at the wheel and the members screens; then set `screens-wheel-members` to done with "Checked by the user".

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
