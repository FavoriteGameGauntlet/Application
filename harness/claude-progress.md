# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-17 rules-ui-members

- By the user's answers (1a, 2a, 3b): the member window of the user themself shows «Админ пати» as a disabled switch with «Снять админа с себя нельзя» on hover (`FormField.disabledReason`, for `check`). When the last admin removes themself, the confirmation adds «Админом станет <login>.» (the current member who joined first, as the server picks) or «В пати не останется админа.» when `AdminSuccessionEnabled` is off; the parameters are read at that moment. No hover text on what an admin may do. The empty name and the hex error were already in the interface.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `AdminMembersView` and a mocked API in Chromium: the own switch is disabled with the title, another member's is not; removing self as the last admin names the earliest joined current member (a member who left is skipped), removing another member keeps the old text, with the parameter off the text says the party stays without an admin. Not checked: the app itself, the hover tooltip over the disabled switch in WebView2 and WebKitGTK.

## 2026-11-17 item-entry-form-special-actions

- By the user's answers (all recommended options, special actions not coloured) and the mockup https://claude.ai/artifact/V54ZDUwLv523SQTH9qciTv: in the item-entry rows «Действие» has a second group «Предмет, выбранный игроком» with «Копирует», «Удаляет», «Передаёт»; such a row shows «Выбирает игрок» instead of the resource picker, and a transfer picks «Владелец → цели» or «Цель → владельцу» in «Кто». The resource list lost «Предмет на выбор» and «Передать выбранный предмет». The entry texts say «скопировать … выбранный предмет» and «удалить … выбранный предмет», and the catalogue card and table leave these rows uncoloured (`itemEntryTone`).
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `RowsEditor` at the dialog content width (564px) in Chromium: switching actions gives `user-item` +/−, `user-item-transfer` and back to a catalogue resource with the first point type, a typed minus is dropped, the transfer direction sets `who`, «Цель → владельцу» is not cut. Not checked: the app itself.

## 2026-11-17 auth-password-eye

- By the user's answers (the native eye vanished in some cases; our own button; on registration one eye state for both fields, an eye in each) and the mockup https://claude.ai/artifact/799PxQ7gyhLpvGPkvp1KHY: `UiInput` with `type="password"` shows an eye button (`eye` / `eye-off`, Lucide 0.460, added to `assets/icons`) and hides `::-ms-reveal`. The shown state is the `revealed` model, so `AuthView` binds one ref to all its password fields. `type` became a prop of `UiInput`. The box highlight follows `input:focus` (`:has`), so keyboard focus on the eye rings only the button; a mouse click keeps the caret in the field.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `AuthView` in Chromium: the eye toggles the login password, on the registration tab either eye toggles both fields, Tab reaches the eye, Enter toggles it without submitting. Not checked: the app itself on WebView2 and WebKitGTK.

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
