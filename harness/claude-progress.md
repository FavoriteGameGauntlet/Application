# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-14 system-parameters-data-format

- Done in code, by the user's answers (the client checks by type and bounds before sending; the odd-number rule of the wheel parameter stays on the client): the system parameters follow `system_parameters.yaml` 0.5.1. A parameter carries `code` (the key in the paths), `name`, `description`, `type` (`int` or `bool`), `minValue` and `maxValue`. The screen has no table of texts any more: title and description come from the backend, a `bool` is a switch, the bounds are shown next to the default, the reason a value does not fit is under the field and the save button is off until it fits. `utils/systemParameter.ts` holds the check and the bounds text.
- The user found the first card layouts unclear, so the design was made as a mockup by a separate agent in the app's design system (Artifact «Системные параметры», option C, edited by the user) and then coded: a table of three columns (parameter with its description and the «изменено» badge; value with «по умолчанию: …» under it when it is changed; a pencil and a reset button), and the edit in `FormDialog` (a number line with the allowed range under it and the reason in red, or a switch for `bool`). The range is shown only in the dialog.
- The workflow «mockup first, by an agent, in the design system, user looks before the code» is now in `AGENTS.md` («Design work»).
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run, so the screen was not looked at, and no request to the backend was made (the list needs a session).
- Not verified by me: that the codes are the old names (the odd-number rule is keyed by `MinimumAvailableWheelEffectsForRoll`; with another code it silently does not apply), the look of the cards, and the 422 answer of the backend.
- The feature stays `in_progress` until the user has looked at the screen.

## 2026-11-13 catalog-to-admin-panel

- Done in code, by the user's answers: the player keeps the read-only «Каталог» screen (main sidebar, tab cycle and route unchanged), the admin gets an own screen at `/admin/catalog`, first in the «Каталоги» group of the admin sidebar. The two screens are separate; only the table is shared (`components/CatalogTable.vue`, `components/catalogTable.ts`). Editing, deleted entries, the «у игроков» counters and the unit in the journal live only on the admin screen, so the admin sees on the main screen the same as a player. `CatalogEntryDialog` moved to `views/Admin/components`.
- Both screens read the same endpoints; the admin adds `…/removed` and the writes. Whether the backend closes those to non-admins was not checked against the documentation.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run, so neither screen was looked at.
- Not verified by me: the look and the behaviour of both screens (tabs, search, row opening, edit and delete in the admin one).
- Found, not changed: the player's `catalogEntries` in `api-facade/http/resources.ts` counts the holders of every entry (a request per member), though the player screen does not show them.
- The feature stays `in_progress` until the user has looked at the screens.

## 2026-11-12 recent-events-redesign removed

- By the user's word the feature `recent-events-redesign` is deleted from the list: it is done inside the mockup, where all the tables are changed. No code was touched.
- Checked by the user (said in chat: «Предыдущую фичу я проверил»), so `remove-after-form-notices` is done and moved to the archive.
- Not committed by the user's word. The branch `recent-events-redesign` was created from `master` before this word and has no commits.

## 2026-11-12 remove-after-form-notices

- Done in code, by the user's answers (the grey paragraphs under the screens and the hints under the fields of the windows, both deleted outright): the `.note` and `.card__note` paragraphs are gone from the admin exchanges, members, rewards and wheel screens, the spin cost card, the exchanges of the player, the manual change form, the list of players, the shared points and the completed games, with their styles and the two computed texts of the wheel and manual screens. The hints under the fields are gone from the catalogue, party, member, admin exchange and admin wheel windows. The `note` field type of `FormDialog` was used only by the perk ability window, so it is removed with it (also from `ARCHITECTURE.md`).
- Kept on purpose: toasts, hints of the options in the menus, the red reasons why a form cannot be filled yet and the empty pick list of the use window (`hint` of `FormField` stays for them), empty-state texts, «Не меньше 8 символов.» in the login form, the card hints of the system parameters (the feature `system-parameters-data-format` owns them) and the two lines of the wheel screen. Say so if any of them should go too.
- The rules that the captions carried are written down as the features `rules-ui-*` (priorities 16 to 22), each with the removed texts and ideas for the interface, by the user's word that they are done in other features.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. The app was not run, so the screens and windows were not looked at.
- Not verified by me: the look of the screens without the captions (spacing at the bottom of the screens, the window layouts without the hints).
- Checked by the user (said in chat: «windows-player уже проверен»), so `windows-player` is done and moved to the archive. `remove-after-form-notices` stays `in_progress` until the user has looked at the screens.

## 2026-11-12 window-icon

- Done in code: the template icons in `src-tauri/icons/` are replaced by the FGG symbol (`fgg-symbol-square` of the design system) on a white rounded plate, because the navy symbol alone vanishes on a dark taskbar. The source is `src-tauri/icons/source/icon.svg` (the C2PA metadata of the original is cut). The set is generated with `npx tauri icon` from a 1024 px render of it; the `android/`, `ios/` and `64x64.png` it also makes are deleted, `bundle.icon` in `tauri.conf.json` is unchanged.
- Verified: `bash harness/scripts/init.sh` and `cargo check` in `src-tauri/` pass; `icon.png` was looked at.
- Wayland (the user runs Fedora KDE) ignores the window icon of the app, so `tauri dev` showed a fallback icon. With `GDK_BACKEND=x11` the window first showed the old rings, because the icons are embedded at compile time and `cargo` kept the old build; `cargo clean -p fgg` fixed it. A white screen under X11 went away with `WEBKIT_DISABLE_DMABUF_RENDERER=1`.
- Not verified by me: the app was not run by me, and the Windows build (`icon.ico`, the installer) was not seen. The plate color (white) was my choice, the mockup has none.
- Checked by the user (said in chat: «Всё работает»), so `window-icon` is done and moved to the archive.

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
