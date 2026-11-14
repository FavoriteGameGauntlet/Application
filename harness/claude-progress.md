# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-14 table-shared-points

- Done in code, by the user's answers (the «⋯» menu has «Изменить вручную» for admins, which opens the empty free manual form, and is disabled for players; a type without one or both bounds shows the bounds as text instead of the bar): the shared points tab follows the artboard «Ресурсы: общие очки». The row has the name and the wrapped description, a bar from the lower to the upper bound with the bounds under it, the value and the unit in its plural form. The tab «Общие очки» shows the number of types. The caption under the table is left out.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run, so the screen was not looked at. Dependencies were installed with `npm ci --engine-strict=false` on Node 22 (the repo asks for Node 24).
- The feature stays `in_progress` until the user has looked at the screen.

## 2026-11-14 table-points

- Done in code, by the user's answers (the whole player × type table comes in one call, the per-type ranking call is removed; the row menu has «Открыть профиль»): the points tab follows the artboard «Ресурсы: очки». On the left the types with search, the user's value and place; on the right the type name, the bounds and «у тебя N · K-е место», the ranking with place (equal values share it), share of the leader, value and difference to the user. The caption about hidden types is left out. The tab reloads the table on `journalStore.revision`.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run, so the screen was not looked at.
- The feature stays `in_progress` until the user has looked at the screen.

## 2026-11-14 table-wishlist

- Done in code, by the user's answers (the add field and the search are two fields, as in the mockup; the other players' lists use the same table with the «⋯» button disabled): the wishlist table follows the artboard «Игры: вишлист». `WishlistTab` serves both tabs (`mine` for the own list, `UserWishlistTab.vue` is removed): the add field on top, a bar with the count, the search and «Показать удалённые» (own list only), columns «Игра», «Добавлена» (short day), «Кто добавил» (avatar, login, «ты»). «Переименовать» and «Удалить» are in `ui/UiRowMenu`, the rename stays in the row; a removed row has «Вернуть», a started one a disabled button. `UiRowMenu` got `disabled`. The author is still optional in the contract and shows «—» when missing: Scalar was not reachable from the session.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run, so the screen was not looked at.
- The feature stays `in_progress` until the user has looked at the screen.

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
