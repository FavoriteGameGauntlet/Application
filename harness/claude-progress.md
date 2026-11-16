# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-16 home-tiles-scroll-uses

- By the user's answers (uses in this PR, the card always right of the row) and the approved feed style: the home tiles «Мои очки», «Предметы», «Перки», «Эффекты» (also on the player profile) take the height the grid gives them (`contain: size`, at least 320px for the four) and their rows scroll in `UiScrollArea`. The points tile no longer cuts its list (`useFitCount` is gone, it had no other user). Items show the uses left of all their copies as «N из M» (`groupItems` sums them), active perks «N из M», effects keep the time left.
- Hovering a row shows its catalogue card right of the row; the feed keeps it left. `CatalogHoverCard` (new) wraps `UiPopover` (`side: 'left' | 'right'`, `passive`: the pointer goes through to the rows under it) and `CatalogEntryCard`. `resourcesStore.catalogEntryOf(kind, id)` finds the entry (a point type from the loaded types) and reads the catalogue of a kind on its first call; the feed uses it too. `Effect.effectId` (the catalogue id, `effectId` of `UserEffect` in the API documentation) is new in the contract for the effect card.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `ResourceTiles` and `PlayerEvents` on fake data in Chromium at 720 (light) and 1080 (dark): the page stays the window height, the points tile with 10 types scrolls at 720, the cards of a point type and an effect open right of the row. Not checked: the app itself, the real backend.

## 2026-11-16 home-recent-events

- By the user's answers to the plan and the approved mockup (https://claude.ai/artifact/5HXVn5NnaGGgDzb9YHtFVk): the «Недавние события» card on the home screen and the player profile takes the height its grid column gets and never stretches the page (`contain: size`, at least 240px); the header stays and the list scrolls. The feed still reads the last 24 hours from now (the user: the last day, not the current day), fixed when the feed restarts, and loads the next page by `nextCursor` when the list is 200px from its end, when it is shorter than the card or when the card grows. A refresh after an action replaces the shown events without blinking empty. Placeholder rows show while a page loads, «Больше событий за сутки нет» at the end.
- The scrollbar lives in the new `UiScrollArea` (`::-webkit-scrollbar` only: `scrollbar-color` or `scrollbar-width` would switch it off in Chromium 121+), so the home tiles can take it next.
- Hovering an event about an item, perk or effect shows its `CatalogEntryCard` in a `UiPopover` left of the row (`side: 'left'`, new, kept inside the window). `source.id` is taken as the catalogue id: the API documentation names the item, perk or effect and calls a held copy a «copy» elsewhere; it does not say so outright. The catalogue of a kind is read once, when the first event about it shows; an entity missing from the player catalogue (deleted) gets no card. `journalStore.fetch` returns the page now.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed files. A temporary vite page (not committed) with the real `PlayerEvents` against a fake API of 47 events in Chromium at 720 and 1080 px, light and dark: the page stays the window height, the feed asks for 3 pages while scrolled to the end, the end caption shows, the card opens left of a hovered item row, the scrollbar is thin. Not checked: the app itself, the real backend, WebKitGTK.

## 2026-11-16 popover-zoom

- The «⋯» menus, selects, pick chips and date ranges (`UiPopover`) drifted right and down at 110 and 125 %: the interface scale is a CSS `zoom` of the root, and in Chromium `getBoundingClientRect` answers in screen pixels while `left` and `top` of the `fixed` panel are layout units and get the zoom again. `UiPopover` now divides the anchor rectangle by the ratio of the body rectangle to the body size and takes the window size from the body (which fills the window), so the placement works whichever unit the engine answers in. The panel stays teleported and `fixed`, so it still escapes the dialogs.
- Verified: `bash harness/scripts/init.sh` passes, prettier on the changed file. A temporary vite page (not committed) with the real `UiPopover` in Chromium at html zoom 0.9, 1, 1.1 and 1.25: the panel starts at the anchor's left edge, right under it, opens upwards near the bottom and keeps 8px from the right edge. Not checked: the app itself (WebView2 on Windows, WebKitGTK on Linux).

## Open

- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
- A target condition (`target_*`) with a transfer to `self` is still refused by the catalogue form, because the documentation names only `chosen` entries.
