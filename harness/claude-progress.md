# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-20 perk-ability-edit

- By the user's answers (reset every holder as a new holder, no history record, no warning; rename the switch): the edit window of a perk is the same as the create window. «Активируемая способность» (was «Игрок применяет перк сам») on the «Перк» tab and the editable «Способность» tab with the saved values, triggers included. The ability goes to `PATCH` only when it differs from the saved one, so a rename does not reset the holders; a switch turned off sends `ability: null` (FavoriteGameGauntlet/Server#222, FavoriteGameGauntlet/Database#75, merged). The locked tab, the `locked` field type and the lock of `UiTabs` are gone with their only user.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. Not checked: the app itself, against the backend.

## 2026-11-20 catalog-wheel-entries

- By the user's answer («такую же как у админа, но без возможности редактирования»): the player catalogue has a «Колесо» tab with the layout of the admin wheel screen and no editing: «Пункты / Игры», the groups, the group card (the no-repeat switch is off for a player, the spin cost), the table of items with search and no row menu. The admin screen is built from the same shared components. `api.wheel.catalog(kind)` reads `/wheel/catalog/groups` and their rows, which any member may read, so the Server feature wheel-rows-for-members needs no change; `WheelCatalogGroup` (was `AdminWheelGroup`) carries `cost`, and the separate `admin.wheel.spinCost` read is gone.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with stubbed data in Chromium: the catalogue tab with both kinds, the admin screen and the cost window look as before. Not checked: the app itself, against the backend.
- On the user's word (2026-11-20): the catalogue tabs show no counts. Checked by eslint and vue-tsc only.

## 2026-11-19 timer-end-sound

- By the user's answers (1 Б, 2 А, 3 А, plus the user's own sound; played whole, stopped when the window gets focus): `timerSoundStore` plays the sound at the end of the timer; the user menu has «Звук таймера», listen, the file name with a reset and «Свой звук таймера». The file is copied by `src-tauri/src/timer_sound.rs` (up to 5 МБ) into the app data folder; `plugin-dialog` added, `media-src 'self' blob:` in the CSP.
- Verified: `bash harness/scripts/init.sh` passes, `cargo check` passes, prettier on the changed files. A temporary vite page (not committed) in Chromium: menu, listen and stop on focus, sound at the timer end, nothing with the switch off. Not checked: the app itself; the user checks the file window, a custom file and the sound in a minimized window.
- Added on the user's word (2026-11-20): the end of the session (the cookie lives a day) sends the user to the login with no error toast; `isSessionExpired` in `api-facade/sessionExpired.ts` is shared by the interceptor and `toast.error`. Checked by eslint and vue-tsc only.
- On the user's word (2026-11-20): the end sound repeats until the window gets focus; a window that is focused at the end hears it once. Checked in Chromium on a temporary vite page: hidden page loops, focus stops it.
- On the user's word and mockup (2026-11-20): the user menu has «Настройки» and «Выйти»; «Настройки пользователя» (`UserSettingsDialog`) holds theme, scale, the timer sound, «Повторять звук», «Остановка звука» (focus or the button) and the chosen sound card with an inline error. While the end sound rings, the timer form on the home screen and in mini mode is replaced with «Время вышло» and «Стоп» (same height as the timer). Checked in Chromium on a temporary vite page (screens and the stop modes); not in the app.

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
