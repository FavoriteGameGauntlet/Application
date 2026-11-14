# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-14 table-users

- Done in code, by the user's answers (the row gets the «⋯» menu with «Открыть профиль»; the chips show counts through an optional `count` in `ui/UiChoiceChips`; the hint under the table is left out): the members table follows the artboard «Участники». Search by name and login, status chips with counts over the whole party, the note on the sort, the played time as «Ч ч ММ м» with a bar of the share of the leader, a chevron at the end. The status tones follow the mockup (paused is `info`, offline `neutral`), so the player profile changes too.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run, so the screen was not looked at.
- The feature stays `in_progress` until the user has looked at the screen.

## 2026-11-14 catalog-admin-drawer

- Done in code, by the user's answers (the tabs show counts, so the store reads all four kinds at once; the shared points keep the column «Всего у игроков» as in the mockup, it shows the party balance): the admin catalog follows the artboard «Каталог: правка (админ)». A row shows the name with the description, the changes as tags (three at most and «+N»; the point types show their unit forms), the properties as pills and the holders. The actions are in the shared `ui/UiRowMenu` («⋯» on hover and on a right click); a click on the row opens `CatalogEntryDrawer` with `CatalogEntryCard` and the «Для админа» block. `CatalogTable.vue` is removed, the catalog screen no longer uses `AdminListHeader`. `ellipsis.svg` is taken from lucide-static 0.460.0, like the other icons.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run, so the screen was not looked at.
- The feature stays `in_progress` until the user has looked at the screen.

## 2026-11-14 catalog-player-card

- The user asked for every screen of the canvas «Каталог: просмотр и админка» (https://claude.ai/artifact/MoHKATGRjRXi6fEFcoXjmn). By the user's answers: many small PRs, one per screen (the old `tables-more-informative` is split into the `catalog-*` and `table-*` features); the rule captions under the tables of the mockup are not brought back (they stay in the `rules-ui-*` features); the admin wheel follows the mockup (groups as a side list).
- Done in code: the player «Каталог» is a list with search and the full card of the open entry (`components/CatalogEntryCard.vue`, meant to be reused by the admin drawer). The item condition texts moved from `CatalogEntryDialog` to `utils/itemCondition.ts` because the card shows them too. The mockup icons «package», «zap», «eye» have no file in `assets/icons`, so the card uses «gift», «clock» and «lock».
- Verified: `bash harness/scripts/init.sh` passes (run on node 22 with `--engine-strict=false` for `npm ci`; the project asks for node 24), prettier on the changed files. The app was not run, so the screen was not looked at.
- The feature stays `in_progress` until the user has looked at the screen.

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
