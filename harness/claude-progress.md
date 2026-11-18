# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-18 rules-ui-wheel-admin

- By the user's answers: the group switch reads «Не повторять применённое»; the server applies it to games too (FavoriteGameGauntlet/Server#218, merge it first). The item window has «Все / На выбор» in the head of «Когда выпал» in place of the «Игрок выбирает, что применить» switch; with no rows it is off and shows its value. «Остальное игрок вносит сам» became «Потом ручное изменение». Nothing for «выпавшая игра становится текущей» and the Enter of the add-row.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `AdminWheelView` and mocked stores in Chromium: an item with `shouldApplyToAll` false opens on «На выбор», an item with no rows shows «Все» disabled, adding a row enables the segment. Not checked: the app itself, saving against the backend.

## 2026-11-17 release-0.9.0

- Version raised to 0.9.0 with `npm version 0.9.0 --no-git-tag-version` (package.json, package-lock.json, tauri.conf.json, Cargo.toml, Cargo.lock).
- Verified: `bash harness/scripts/init.sh` passes. Not checked: `cargo check` (the cloud container has no GTK dev libraries); the release build on the tag compiles Rust.

## 2026-11-17 rules-ui-rewards-cost

- By the user's answers (1b, 2a, 3b, 4 nothing; «не надо никаких подсказок»): the save toast of a reward card says only «Награды сохранены». The server reads the reward when the timer or the game ends, so a running timer or game gets the new one; the old «Действуют на следующие …» was wrong, and the comment of `admin.rewards.save` is corrected. The spin cost line of the admin wheel group starts «Применение стоит» and lost its grey note. No link to the timer length; nothing for the copy choice (the payment covers the whole cost, the player picks only which copy).
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `AdminSpinCost` and `AdminRewardsView` and a mocked API in Chromium: the cost line reads «Применение стоит 5 билетов, Свиток переброса» with no note. Not checked: the app itself.

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
