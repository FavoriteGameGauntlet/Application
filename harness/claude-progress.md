# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-14 catalog-admin-drawer

- Done in code, by the user's answers (the tabs show counts, so the store reads all four kinds at once; the shared points keep the column «Всего у игроков» as in the mockup, it shows the party balance): the admin catalog follows the artboard «Каталог: правка (админ)». A row shows the name with the description, the changes as tags (three at most and «+N»; the point types show their unit forms), the properties as pills and the holders. The actions are in the shared `ui/UiRowMenu` («⋯» on hover and on a right click); a click on the row opens `CatalogEntryDrawer` with `CatalogEntryCard` and the «Для админа» block. `CatalogTable.vue` is removed, the catalog screen no longer uses `AdminListHeader`. `ellipsis.svg` is taken from lucide-static 0.460.0, like the other icons.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run, so the screen was not looked at.
- The feature stays `in_progress` until the user has looked at the screen.

## 2026-11-14 catalog-player-card

- The user asked for every screen of the canvas «Каталог: просмотр и админка» (https://claude.ai/artifact/MoHKATGRjRXi6fEFcoXjmn). By the user's answers: many small PRs, one per screen (the old `tables-more-informative` is split into the `catalog-*` and `table-*` features); the rule captions under the tables of the mockup are not brought back (they stay in the `rules-ui-*` features); the admin wheel follows the mockup (groups as a side list).
- Done in code: the player «Каталог» is a list with search and the full card of the open entry (`components/CatalogEntryCard.vue`, meant to be reused by the admin drawer). The item condition texts moved from `CatalogEntryDialog` to `utils/itemCondition.ts` because the card shows them too. The mockup icons «package», «zap», «eye» have no file in `assets/icons`, so the card uses «gift», «clock» and «lock».
- Verified: `bash harness/scripts/init.sh` passes (run on node 22 with `--engine-strict=false` for `npm ci`; the project asks for node 24), prettier on the changed files. The app was not run, so the screen was not looked at.
- The feature stays `in_progress` until the user has looked at the screen.

## 2026-11-14 system-parameters-data-format

- Done in code, by the user's answers (the client checks by type and bounds before sending; the odd-number rule of the wheel parameter stays on the client): the system parameters follow `system_parameters.yaml` 0.5.1. A parameter carries `code` (the key in the paths), `name`, `description`, `type` (`int` or `bool`), `minValue` and `maxValue`. The screen has no table of texts any more: title and description come from the backend, a `bool` is a switch, the bounds are shown next to the default, the reason a value does not fit is under the field and the save button is off until it fits. `utils/systemParameter.ts` holds the check and the bounds text.
- The user found the first card layouts unclear, so the design was made as a mockup by a separate agent in the app's design system (Artifact «Системные параметры», option C, edited by the user) and then coded: a table of three columns (parameter with its description and the «изменено» badge; value with «по умолчанию: …» under it when it is changed; a pencil and a reset button), and the edit in `FormDialog` (a number line with the allowed range under it and the reason in red, or a switch for `bool`). The range is shown only in the dialog.
- The workflow «mockup first, by an agent, in the design system, user looks before the code» is now in `AGENTS.md` («Design work»).
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run, so the screen was not looked at, and no request to the backend was made (the list needs a session).
- Not verified by me: that the codes are the old names (the odd-number rule is keyed by `MinimumAvailableWheelEffectsForRoll`; with another code it silently does not apply), the look of the cards, and the 422 answer of the backend.
- Checked by the user (said in chat: «Я посмотрел, всё в порядке»), so `system-parameters-data-format` is done and moved to the archive.

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
