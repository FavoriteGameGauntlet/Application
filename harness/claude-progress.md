# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-14 table-wishlist

- Done in code, by the user's answers (the add field and the search are two fields, as in the mockup; the other players' lists use the same table with the «⋯» button disabled): the wishlist table follows the artboard «Игры: вишлист». `WishlistTab` serves both tabs (`mine` for the own list, `UserWishlistTab.vue` is removed): the add field on top, a bar with the count, the search and «Показать удалённые» (own list only), columns «Игра», «Добавлена» (short day), «Кто добавил» (avatar, login, «ты»). «Переименовать» and «Удалить» are in `ui/UiRowMenu`, the rename stays in the row; a removed row has «Вернуть», a started one a disabled button. `UiRowMenu` got `disabled`. The author is still optional in the contract and shows «—» when missing: Scalar was not reachable from the session.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run, so the screen was not looked at.
- The feature stays `in_progress` until the user has looked at the screen.

## 2026-11-14 table-completed

- Done in code, by the user's answers (the four tabs and the player picker stay; the state words and tones stay as before; the total time and the average rating count the rows left after the search and the chips): the completed games table follows the artboard «Игры: пройденные». Search by name, state chips with counts, the review or «Отзыва пока нет» under the name, the period with short months and the number of days (`formatShortDay`, `daysBetween` in `utils/calendar.ts`), rating pips. «Отзыв» and «Оценить» moved into the `ui/UiRowMenu` of the row; another player's game without a rating has no menu.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run, so the screen was not looked at.
- The feature stays `in_progress` until the user has looked at the screen.

## 2026-11-14 table-users

- Done in code, by the user's answers (the row gets the «⋯» menu with «Открыть профиль»; the chips show counts through an optional `count` in `ui/UiChoiceChips`; the hint under the table is left out): the members table follows the artboard «Участники». Search by name and login, status chips with counts over the whole party, the note on the sort, the played time as «Ч ч ММ м» with a bar of the share of the leader, a chevron at the end. The status tones follow the mockup (paused is `info`, offline `neutral`), so the player profile changes too.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run, so the screen was not looked at.
- The feature stays `in_progress` until the user has looked at the screen.

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
