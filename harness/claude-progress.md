# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-19 single-choice-entries

- By the user's answers (1 А, 2 А, 3 А): a change has `applyMode` `all | any | one` in place of `shouldApplyToAll` (FavoriteGameGauntlet/Server#221, FavoriteGameGauntlet/Database#74, merged). The admin segment reads «Все / Несколько / Одна»; the use, exchange and wheel entries windows pick through `UiPickList`, a radio list for `one`; an exchange with `nothing_to_pick` says «В обмене не из чего выбрать.». `utils/applyMode.ts` holds the labels and the pick rules.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `SpinEntriesDialog` and `FormDialog` in Chromium. Not checked: the app itself, against the backend.

## 2026-11-19 rules-ui-parties-window

- By the user's answers (dates: А; color: the avatar replaces the square, no other preview): the dates field labels its days «Первый день» and «Последний день»; the color picker shows the avatar with the login in place of the swatch beside the hex field, in the party window and the member window.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `FormDialog` in Chromium. Not checked: the app itself, against the backend.

## 2026-11-19 rules-ui-player-screens

- By the user's answers (the manual form from a page stays for admins; the review title reads the party setting): players list rows open the profile with a chevron in place of «⋯»; «Общие очки» has no entry to the manual form and no row menus (the user's word: no button for anybody); the review window title is «Отзыв для всей пати» / «Отзыв для админов» from `GameReviewsVisibleToMembers` (system parameters are now `api.parameters` and `parametersStore`, readable by members); the fix form shows «Исходная запись» as a quiet card and applies with «Добавить исправление»; the rows column reads «Сейчас → станет». Fixed on the way (the user's report): the free manual form went back to «Обмены» after applying or cancelling; it returns to the empty admin screen.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real views and a mocked API in Chromium: see the evidence in `harness/archive/features-done.json`. Not checked: the app itself, against the backend.

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
