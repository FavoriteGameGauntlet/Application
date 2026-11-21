# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-21 user-avatars

- A party admin selects an image by clicking the avatar in the member edit dialog. Hover and keyboard focus show the upload icon. A successful upload refreshes the member data used across the app. AGENTS.md links to DesignSystem and assigns window verification to the user.
- ESLint, vue-tsc and cargo check passed. Prettier formatted the changed files. Checked the request and response fields against Scalar Parties. The user checks the Tauri window and upload against the backend.

## 2026-11-20 perk-ability-edit

- By the user's answers (reset every holder as a new holder, no history record, no warning; rename the switch): the edit window of a perk is the same as the create window. «Активируемая способность» (was «Игрок применяет перк сам») on the «Перк» tab and the editable «Способность» tab with the saved values, triggers included. The ability goes to `PATCH` only when it differs from the saved one, so a rename does not reset the holders; a switch turned off sends `ability: null` (FavoriteGameGauntlet/Server#222, FavoriteGameGauntlet/Database#75, merged). The locked tab, the `locked` field type and the lock of `UiTabs` are gone with their only user.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. Not checked: the app itself, against the backend.

## 2026-11-20 catalog-wheel-entries

- By the user's answer («такую же как у админа, но без возможности редактирования»): the player catalogue has a «Колесо» tab with the layout of the admin wheel screen and no editing: «Пункты / Игры», the groups, the group card (the no-repeat switch is off for a player, the spin cost), the table of items with search and no row menu. The admin screen is built from the same shared components. `api.wheel.catalog(kind)` reads `/wheel/catalog/groups` and their rows, which any member may read, so the Server feature wheel-rows-for-members needs no change; `WheelCatalogGroup` (was `AdminWheelGroup`) carries `cost`, and the separate `admin.wheel.spinCost` read is gone.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with stubbed data in Chromium: the catalogue tab with both kinds, the admin screen and the cost window look as before. Not checked: the app itself, against the backend.
- On the user's word (2026-11-20): the catalogue tabs show no counts. Checked by eslint and vue-tsc only.

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
