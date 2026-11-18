# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-18 rules-ui-exchanges

- By the user's answers: the server takes the items, perks and effects of an exchange from the copies the player picks and greys out a card nobody can pay (FavoriteGameGauntlet/Server#219, merged). The player card dashes a pill only where the server refuses (points below the type's minimum, missing copies, effects, perk). The exchange opens the shared `PaymentDialog` (moved from the wheel with `utils/payment.ts`, `Payment`, `CostRef`). The admin window has «Все / На выбор» in the head of each side (`FormField.aside` on `rows`) in place of the switches; the table badge reads «на выбор». Fixed on the way: payment options matched an effect by the copy id; a perk given in an exchange showed as gained.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `ExchangesView` and `AdminExchangesView` and a mocked API in Chromium: dashed «5 золота (2)» with a minimum of 0, plain «3 славы» without one; picking 2 of 3 copies sends `payment.items` [50, 52]; the admin segments open on the stored value and stay off until a row is added. Not checked: the app itself, against the backend.

## 2026-11-18 rules-ui-wheel-admin

- By the user's answers: the group switch reads «Не повторять применённое»; the server applies it to games too (FavoriteGameGauntlet/Server#218, merge it first). The item window has «Все / На выбор» in the head of «Когда выпал» in place of the «Игрок выбирает, что применить» switch; with no rows it is off and shows its value. «Остальное игрок вносит сам» became «Потом ручное изменение». Nothing for «выпавшая игра становится текущей» and the Enter of the add-row.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `AdminWheelView` and mocked stores in Chromium: an item with `shouldApplyToAll` false opens on «На выбор», an item with no rows shows «Все» disabled, adding a row enables the segment. Not checked: the app itself, saving against the backend.

## 2026-11-17 release-0.9.0

- Version raised to 0.9.0 with `npm version 0.9.0 --no-git-tag-version` (package.json, package-lock.json, tauri.conf.json, Cargo.toml, Cargo.lock).
- Verified: `bash harness/scripts/init.sh` passes. Not checked: `cargo check` (the cloud container has no GTK dev libraries); the release build on the tag compiles Rust.

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
