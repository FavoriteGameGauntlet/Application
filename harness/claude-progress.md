# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-19 rules-ui-parties-window

- By the user's answers (dates: А; color: the avatar replaces the square, no other preview): the dates field labels its days «Первый день» and «Последний день»; the color picker shows the avatar with the login in place of the swatch beside the hex field, in the party window and the member window.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `FormDialog` in Chromium. Not checked: the app itself, against the backend.

## 2026-11-19 rules-ui-player-screens

- By the user's answers (the manual form from a page stays for admins; the review title reads the party setting): players list rows open the profile with a chevron in place of «⋯»; «Общие очки» has no entry to the manual form and no row menus (the user's word: no button for anybody); the review window title is «Отзыв для всей пати» / «Отзыв для админов» from `GameReviewsVisibleToMembers` (system parameters are now `api.parameters` and `parametersStore`, readable by members); the fix form shows «Исходная запись» as a quiet card and applies with «Добавить исправление»; the rows column reads «Сейчас → станет». Fixed on the way (the user's report): the free manual form went back to «Обмены» after applying or cancelling; it returns to the empty admin screen.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real views and a mocked API in Chromium: see the evidence in `harness/archive/features-done.json`. Not checked: the app itself, against the backend.

## 2026-11-18 rules-ui-catalog-dialog

- By the user's answers (1 А, 3 Б, 2: triggers exist on the server): a new point type takes its scope from the page (`shared` prop), the select is gone; «Цель» of the rows editor and the catalogue card reads «Выбранный игрок»; the «Игрок выбирает, что применить» checks of the item and the new perk ability are `aside` segments «Все / На выбор» on their rows, off with no rows. The ability tab of a new perk sets the charge triggers (`TriggersEditor`, field type `triggers`, labels in `utils/perkTrigger.ts`); the events of a perk's own uses and charges are not offered, since a trigger on them would refire itself on the server.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `CatalogEntryDialog` and a mocked store in Chromium: see the evidence in `harness/archive/features-done.json`. Not checked: the app itself, against the backend.

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
