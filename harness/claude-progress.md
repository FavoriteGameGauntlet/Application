# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-17 release-0.9.0

- Version raised to 0.9.0 with `npm version 0.9.0 --no-git-tag-version` (package.json, package-lock.json, tauri.conf.json, Cargo.toml, Cargo.lock).
- Verified: `bash harness/scripts/init.sh` passes. Not checked: `cargo check` (the cloud container has no GTK dev libraries); the release build on the tag compiles Rust.

## 2026-11-17 rules-ui-rewards-cost

- By the user's answers (1b, 2a, 3b, 4 nothing; «не надо никаких подсказок»): the save toast of a reward card says only «Награды сохранены». The server reads the reward when the timer or the game ends, so a running timer or game gets the new one; the old «Действуют на следующие …» was wrong, and the comment of `admin.rewards.save` is corrected. The spin cost line of the admin wheel group starts «Применение стоит» and lost its grey note. No link to the timer length; nothing for the copy choice (the payment covers the whole cost, the player picks only which copy).
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `AdminSpinCost` and `AdminRewardsView` and a mocked API in Chromium: the cost line reads «Применение стоит 5 билетов, Свиток переброса» with no note. Not checked: the app itself.

## 2026-11-17 rules-ui-members

- By the user's answers (1a, 2a, 3b): the member window of the user themself shows «Админ пати» as a disabled switch with «Снять админа с себя нельзя» on hover (`FormField.disabledReason`, for `check`). When the last admin removes themself, the confirmation adds «Админом станет <login>.» (the current member who joined first, as the server picks) or «В пати не останется админа.» when `AdminSuccessionEnabled` is off; the parameters are read at that moment. No hover text on what an admin may do. The empty name and the hex error were already in the interface.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `AdminMembersView` and a mocked API in Chromium: the own switch is disabled with the title, another member's is not; removing self as the last admin names the earliest joined current member (a member who left is skipped), removing another member keeps the old text, with the parameter off the text says the party stays without an admin. Not checked: the app itself, the hover tooltip over the disabled switch in WebView2 and WebKitGTK.

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
