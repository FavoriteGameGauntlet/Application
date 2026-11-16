# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-16 ux-color-picker

- By the user's answers and the approved mockup (https://claude.ai/artifact/G1XdUSsbPCDvjw1F2kLEVw, frames 1–4 after the user tried the always-open frame 5, with a square square): `ColorPicker` keeps the 12 palette circles; a 13th «Свой цвет» circle (a hue wheel, or the custom color once picked) opens a `UiPopover` under the swatch with a 214px saturation/brightness square and a hue slider (pointer and arrow keys, Shift for 10%). The swatch and the hex field stay under the circles. A wrong hex shows «Цвет в формате #rrggbb» at the field and `FormDialog` keeps «Сохранить» off, so the toasts of `AdminMembersView` and `PartiesView` are gone. The circles have Russian names for screen readers. The user merged player-color-form into this feature and asked to drop its entry.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `FormDialog` and a color field in Chromium: the «Свой цвет» circle opens the popover under the hex row, the square is 214x214, a drag and a hue click change the hex, the arrow keys move the handles without leaving them, Escape and a click outside close the popover and keep the dialog, «#12zz» disables save, « #22B07D » selects «Зелёный» and saves `#22b07d`. Not checked: the app itself, dark theme, WebKitGTK.

## 2026-11-16 start-on-home

- By the user: the app always starts on the home screen. `initialPathGuard` and `StoreKey.InitialRoute` are gone, the router starts at `/`. By the user's answer, `partyGuard` (after `authGuard`) sends every screen but the login and the party list to the party list while no party is chosen (`parties.isSelected`, new in `Api`, reads the stored choice; logging out clears it). An old `initialRoute` value stays in the users' store file unread.
- The party list is one screen whether it opens after the login or from the season name in the top bar; only the highlight of the chosen party differs (there is none right after a login).
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real router and guards, the store and `isSelected` faked: `/` with no login went to the login, logged in without a party to the party list, with a party to the home screen. Checked by the user in the app.

## 2026-11-16 home-tiles-scroll-uses

- By the user's answers (uses in this PR, the card always right of the row) and the approved feed style: the home tiles «Мои очки», «Предметы», «Перки», «Эффекты» (also on the player profile) take the height the grid gives them (`contain: size`, at least 320px for the four) and their rows scroll in `UiScrollArea`. The points tile no longer cuts its list (`useFitCount` is gone, it had no other user). Items show the uses left of all their copies as «N из M» (`groupItems` sums them), active perks «N из M», effects keep the time left.
- Hovering a row shows its catalogue card right of the row; the feed keeps it left. `CatalogHoverCard` (new) wraps `UiPopover` (`side: 'left' | 'right'`, `passive`: the pointer goes through to the rows under it) and `CatalogEntryCard`. `resourcesStore.catalogEntryOf(kind, id)` finds the entry (a point type from the loaded types) and reads the catalogue of a kind on its first call; the feed uses it too. `Effect.effectId` (the catalogue id, `effectId` of `UserEffect` in the API documentation) is new in the contract for the effect card. By the user's word, a change row of a feed event opens the card of its resource on hover (events about points name no entity in their source, the row names the point type); leaving the row goes back to the card of the event, if any. The rows of the feed and the tiles keep the arrow cursor (the user). `CatalogEntryCard` is a size container: below 480px (the hover card, the admin drawer) the three-box rows «Значения» and «Как писать в журнале» become one column of «label, value» rows (the user's screenshot: «часов территорий» ran over its box).
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `ResourceTiles` and `PlayerEvents` on fake data in Chromium at 720 (light) and 1080 (dark): the page stays the window height, the points tile with 10 types scrolls at 720, the cards of a point type and an effect open right of the row. Not checked: the app itself, the real backend.

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
