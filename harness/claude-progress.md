# Progress log

Newest entry on top. Record only what was actually verified.

## 2026-11-11 windows-player

- The user tried the use window on their own item. Fixed: one copy named twice in `userItemIds`, an old inventory of another player, slots with a single copy that were hidden, unclear hints. The copy that is being used stays excluded from every slot (the user's rule; the specs are silent). Copying now asks for a player first, players with no copy to take or copy are shown disabled, and the sections are ordered «На кого», takes, copies. Checked: `init.sh` passes; `UseDialog` was server-rendered in Node for one case without targets. Not checked: the flow with targets and the player to copy from, in the real app.
- The backend has no transfer of an item between players; it is the feature `item-transfer`.

- Verified: `bash harness/scripts/init.sh` passes; prettier ran on the changed files. FormDialog with the new `pick` and `rating` fields was server-rendered in Node through a temporary copy (deleted): rows, radio, avatars, the «N из limit» count, the red hint and the rating cells rendered as intended.
- Not verified: the app was not run, so the use, spin payment and review windows were not looked at. The `change` event (the parent rebuilds the sections from the values) was checked by reading the code only.
- Next step: the user looks at the three windows; then set `windows-player` to done with "Checked by the user".
- Found, not fixed: in `FormDialog.vue` the `immediate` watcher on `open` writes `chosenTab` before the line that declares it, so a form mounted already open throws. Every caller mounts it closed, so it never shows.
