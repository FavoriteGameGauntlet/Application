# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-18 rules-ui-catalog-dialog

- By the user's answers (1 А, 3 Б, 2: triggers exist on the server): a new point type takes its scope from the page (`shared` prop), the select is gone; «Цель» of the rows editor and the catalogue card reads «Выбранный игрок»; the «Игрок выбирает, что применить» checks of the item and the new perk ability are `aside` segments «Все / На выбор» on their rows, off with no rows. Charges stay as they are; trigger editing is the next feature `perk-charge-triggers`.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `CatalogEntryDialog` and a mocked store in Chromium: see the evidence in `harness/archive/features-done.json`. Not checked: the app itself, against the backend.

## 2026-11-18 rules-ui-exchanges

- By the user's answers: the server takes the items, perks and effects of an exchange from the copies the player picks and greys out a card nobody can pay (FavoriteGameGauntlet/Server#219, merged). The player card dashes a pill only where the server refuses (points below the type's minimum, missing copies, effects, perk). The exchange always opens the shared `PaymentDialog` with every item, perk and effect row to pick (`isPicked`, the user's word «окно всегда должно открываться»; the wheel now does the same, the user's answer) (moved from the wheel with `utils/payment.ts`, `Payment`, `CostRef`). The admin window has «Все / На выбор» in the head of each side (`FormField.aside` on `rows`) in place of the switches; the table badge reads «на выбор». «Панель админа» opens the panel on an empty screen (`RouteName.Admin`, the user's ask) instead of «Обмены». Fixed on the way: payment options matched an effect by the copy id; a perk given in an exchange showed as gained.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `ExchangesView` and `AdminExchangesView` and a mocked API in Chromium: dashed «5 золота (2)» with a minimum of 0, plain «3 славы» without one; picking 2 of 3 copies sends `payment.items` [50, 52]; with exactly 2 copies for a cost of 2 the window opens with «Заплатить» off until both are checked; the admin segments open on the stored value and stay off until a row is added. Not checked: the app itself, against the backend, the always-open window of the wheel and the empty admin screen in a browser.

## 2026-11-18 rules-ui-wheel-admin

- By the user's answers: the group switch reads «Не повторять применённое»; the server applies it to games too (FavoriteGameGauntlet/Server#218, merge it first). The item window has «Все / На выбор» in the head of «Когда выпал» in place of the «Игрок выбирает, что применить» switch; with no rows it is off and shows its value. «Остальное игрок вносит сам» became «Потом ручное изменение». Nothing for «выпавшая игра становится текущей» and the Enter of the add-row.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `AdminWheelView` and mocked stores in Chromium: an item with `shouldApplyToAll` false opens on «На выбор», an item with no rows shows «Все» disabled, adding a row enables the segment. Not checked: the app itself, saving against the backend.

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
