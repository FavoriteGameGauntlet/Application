# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-14 no-dot-separators

- Done in code, by the user's answers (facts a line or a badge each; the journal source split into a kind and a name): no screen joins facts with « · » any more. The journal source is `journalSourceParts` (`utils/journalSource.ts`) shown by `JournalSourceLabel`, in the event feed, the history tab, the manual fix card and the item history of the resources panel; `Effect.source` and `ResourceHistoryRow.source` are the raw `JournalSource` (the latter with `correctsEntryId`). Parties and catalogue rows give a fact a line, the points table head lost the «у тебя N» and place chips (the user's word: the side list and the own row already show both), the wheel group shows «не повторять» as a badge, the completed games note and the review dialog subtitle are lines (`UiDialog` and `FormDialog` take `subtitle` as a string or an array), the party toast text uses line breaks (`UiToast` keeps them). The rule is in `AGENTS.md`, «Code conventions».
- The «вручную» badge is gone from the history rows and from the fix card of the manual screen, with `isManualEntry` (the kind line already says «ручное изменение» or «исправление»); the source filter option is «ручное изменение» now (the user's words).
- The history filter «Ресурс» picks a kind (очки, предметы, перки, эффекты) instead of a single point type (the user's word: a list of single entities would be hundreds of options); the query sends `resource[kind]` without an id. Not checked against the API documentation.
- The admin catalogue column «Единицы в журнале» shows the three forms of a unit as three tags (1, 2–4, 5 and more) instead of one tag joined by « / » (the user's word: they did not fit). No other joined line with «/» or «|» is left in the UI.
- The unit tags of the admin catalogue carry the prefixes «1: », «2-4: », «5+: » and stand a line apiece; the column «Границы и старт» is «Параметры» now (the name is my choice, the user gave none) with the facts «Граница: …» (or «нет») and «Старт: …».
- The admin catalogue columns are fixed: the name takes the rest, the second column is 240px, the third 200px, the holders 92px (my sizes, the user gave none); on the points tabs the facts of «Параметры» are a line apiece too. The facts of an item are «Использований: N», «Применение: …» and «Условие: …», a line apiece (the prefix words are mine); perks and effects keep their facts as they were. An entry with no changes shows a dash in the changes column in the caption font (it was «Очки не меняет» in the page font, bigger than the rest). A long change text wraps inside its tag (the user's screenshot of the items tab: it ran over the next column).
- The «⋯» menu of a row follows the theme (the user: it was dark in the light theme): the card surface with the text, hover and separator tokens, so the red «Удалить» is readable too. `UiPopover` keeps its `floating` surface, nothing uses it now.
- The rows of the points table in Resources no longer open the profile on a click (the user's word); the «⋯» menu is the only way there.
- The members table lost the «>» arrow and its column (the user's word: the row click and the «⋯» menu already open the profile).
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files, no « · » left in `src/`. The app was not run, so no layout was looked at; rows of the lists are taller now.
- The feature stays `in_progress` until the user has looked at the screens. No PR yet, by the user's word: the branch also holds `points-diff-column-title`.

## 2026-11-14 points-diff-column-title

- Done in code, by the user's answer: the last column of the points table in Resources is «Разница со мной» instead of «К тебе» (the value is the player's points minus the own). The column is 140px instead of 96px: the head is uppercase and does not wrap, so the longer title would run into «Значение ↓».
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run, so the head was not looked at.
- The feature stays `in_progress` until the user has looked at the table. The session had no network: `git pull` on `master` failed, the branch was made from the local `master`.

## 2026-11-14 table-admin-members

- Done in code, by the user's answers (the shared `AdminListHeader` gets a slot for the screen's filters, the exchanges screen puts its switch there; «Добавить» opens a dialog with the login and the color, a refusal is shown under the login field through `FormField.error`): the admin members screen follows the artboard «Админ: участники и права». Search and the chips «Все», «Админы», «Игроки», «Вышли» with counts (admins and players count current members), the count in the header is «N в пати». A row has the avatar, the login and «ты», the party name or a grey «Показывается логин», «с» the joined date and «вышел» the left date under it, the role and `ui/UiRowMenu` («Изменить», «Удалить из пати», or «Вернуть в пати» for one who left). State words and colors stay as before, the caption under the table is left out.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run, so the screen was not looked at.
- The feature stays `in_progress` until the user has looked at the screen.

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
