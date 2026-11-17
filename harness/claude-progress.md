# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-17 auth-password-eye

- By the user's answers (the native eye vanished in some cases; our own button; on registration one eye state for both fields, an eye in each) and the mockup https://claude.ai/artifact/799PxQ7gyhLpvGPkvp1KHY: `UiInput` with `type="password"` shows an eye button (`eye` / `eye-off`, Lucide 0.460, added to `assets/icons`) and hides `::-ms-reveal`. The shown state is the `revealed` model, so `AuthView` binds one ref to all its password fields. `type` became a prop of `UiInput`. The box highlight follows `input:focus` (`:has`), so keyboard focus on the eye rings only the button; a mouse click keeps the caret in the field.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `AuthView` in Chromium: the eye toggles the login password, on the registration tab either eye toggles both fields, Tab reaches the eye, Enter toggles it without submitting. Not checked: the app itself on WebView2 and WebKitGTK.

## 2026-11-17 save-buttons-without-text

- By the user's correction of the note: a form button keeps only its verb, because the dialog title names the object. «Создать пати», «Создать обмен» and the four «Создать <kind>» of the catalogue form became «Создать», «Добавить пункт» of the wheel entry form «Добавить», «Удалить из пати» of the member removal «Удалить» (the default of `ConfirmDialog`). «Сохранить» and «Отмена» stay.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. Not checked: the app itself.

## 2026-11-16 ux-color-picker

- By the user's answers and the approved mockup (https://claude.ai/artifact/G1XdUSsbPCDvjw1F2kLEVw, frames 1–4 after the user tried the always-open frame 5, with a square square): `ColorPicker` keeps the 12 palette circles; a 13th «Свой цвет» circle (a hue wheel, or the custom color once picked) opens a `UiPopover` under the swatch with a 214px saturation/brightness square and a hue slider (pointer and arrow keys, Shift for 10%). The swatch and the hex field stay under the circles. A wrong hex shows «Цвет в формате #rrggbb» at the field and `FormDialog` keeps «Сохранить» off, so the toasts of `AdminMembersView` and `PartiesView` are gone. The circles have Russian names for screen readers. The user merged player-color-form into this feature and asked to drop its entry.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `FormDialog` and a color field in Chromium: the «Свой цвет» circle opens the popover under the hex row, the square is 214x214, a drag and a hue click change the hex, the arrow keys move the handles without leaving them, Escape and a click outside close the popover and keep the dialog, «#12zz» disables save, « #22B07D » selects «Зелёный» and saves `#22b07d`. Not checked: the app itself, dark theme, WebKitGTK.

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
