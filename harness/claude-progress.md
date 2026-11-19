# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-19 timer-end-sound

- By the user's answers (1 Б, 2 А, 3 А, plus the user's own sound; played whole, stopped when the window gets focus): `timerSoundStore` plays the sound at the end of the timer; the user menu has «Звук таймера», listen, the file name with a reset and «Свой звук таймера». The file is copied by `src-tauri/src/timer_sound.rs` (up to 5 МБ) into the app data folder; `plugin-dialog` added, `media-src 'self' blob:` in the CSP.
- Verified: `bash harness/scripts/init.sh` passes, `cargo check` passes, prettier on the changed files. A temporary vite page (not committed) in Chromium: menu, listen and stop on focus, sound at the timer end, nothing with the switch off. Not checked: the app itself; the user checks the file window, a custom file and the sound in a minimized window.

## 2026-11-19 single-choice-entries

- By the user's answers (1 А, 2 А, 3 А): a change has `applyMode` `all | any | one` in place of `shouldApplyToAll` (FavoriteGameGauntlet/Server#221, FavoriteGameGauntlet/Database#74, merged). The admin segment reads «Все / Несколько / Одна»; the use, exchange and wheel entries windows pick through `UiPickList`, a radio list for `one`; an exchange with `nothing_to_pick` says «В обмене не из чего выбрать.». `utils/applyMode.ts` holds the labels and the pick rules.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `SpinEntriesDialog` and `FormDialog` in Chromium. Not checked: the app itself, against the backend.

## 2026-11-19 rules-ui-parties-window

- By the user's answers (dates: А; color: the avatar replaces the square, no other preview): the dates field labels its days «Первый день» and «Последний день»; the color picker shows the avatar with the login in place of the swatch beside the hex field, in the party window and the member window.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `FormDialog` in Chromium. Not checked: the app itself, against the backend.

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
