# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-14 table-admin-members

- Done in code, by the user's answers (the shared `AdminListHeader` gets a slot for the screen's filters, the exchanges screen puts its switch there; «Добавить» opens a dialog with the login and the color, a refusal is shown under the login field through `FormField.error`): the admin members screen follows the artboard «Админ: участники и права». Search and the chips «Все», «Админы», «Игроки», «Вышли» with counts (admins and players count current members), the count in the header is «N в пати». A row has the avatar, the login and «ты», the party name or a grey «Показывается логин», «с» the joined date and «вышел» the left date under it, the role and `ui/UiRowMenu` («Изменить», «Удалить из пати», or «Вернуть в пати» for one who left). State words and colors stay as before, the caption under the table is left out.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run, so the screen was not looked at.
- The feature stays `in_progress` until the user has looked at the screen.

## 2026-11-14 table-admin-wheel

- Done in code, by the user's answers (the spin cost is edited in a dialog behind «Изменить цену»; the group is renamed in a field in place of its name; «Как применяется» keeps the words «вручную» and «на выбор», a plain entry shows nothing): the admin wheel screen follows the artboard «Админ: колесо». The groups are a list on the left with the count and «не повторять», the wishlist has a lock. The card of the group has «Не повторять выпавшее», rename, delete and the cost summary. The table shows the description under the name, the changes as green or red tags and the «⋯» menu («Изменить», «Удалить»). The unfolding of a row is gone, the caption under the table is left out.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run, so the screen was not looked at.
- The feature stays `in_progress` until the user has looked at the screen.

## 2026-11-14 table-admin-exchanges

- Done in code, by the user's answers (the shared `AdminListHeader` follows the artboard: title, count and «Добавить» on one line, search and «Показать удалённые» under it; the count is the number of shown rows): the admin exchanges screen follows the artboard «Админ: обмены». A row has the name, the «удалён» badge and the wrapped description, then both sides with «Отдаёт» / «Получает» labels, the «игрок выбирает» badge and the pills. The actions are in `ui/UiRowMenu` («Изменить», «Удалить», or «Вернуть» for a deleted one); it is never disabled here, since an admin always has an action. The caption under the table is left out.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run, so the screen was not looked at.
- The feature stays `in_progress` until the user has looked at the screen.

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
