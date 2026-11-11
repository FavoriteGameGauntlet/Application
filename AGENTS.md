# Favorite Game Gauntlet (fgg-application)

Desktop client on Tauri 2 (Rust) + Vue 3 + TypeScript + Pinia. It talks to the backend over HTTP; there is no server code in this repository. The interface is in Russian.

Goal: leave the repository in a state the next session can continue from without guessing.

## Scope

Work only in `fgg-application`. Don't touch, inspect or propose changes to other repositories (for example `fgg-server`, `fgg-database`, `fgg-brand`) without an explicit command from the user. For backend details (endpoints, fields, error codes, authorization) use the API documentation: https://api.fgg-challenge.com/scalar. Don't guess them from neighbouring code and don't invent fields.

## Architecture

The structure of `src/`, the domain (parties, wheel, resources, journal, admin) and the cross-cutting flows (login, data loading, timer, HTTP layer, forms, styles) are described in [harness/ARCHITECTURE.md](harness/ARCHITECTURE.md). Read it before planning changes, before looking for answers in the code. If a change makes the document disagree with the code, update it.

## Starting work

1. Switch to `master`, update it (`git pull`) and create a new branch from it; work only there. Don't read the commit history.
2. Read `harness/claude-progress.md` for the latest verified state and the next step.
3. Read `harness/feature_list.json` and pick the unfinished feature with the lowest `priority`. Skip a feature whose only remaining step waits for the user and say so in the reply. If the user names a task themselves, work on it and add it to the list following "Required artifacts".
4. Run `bash harness/scripts/init.sh` (eslint, vue-tsc) from the repo root. It only checks and never rewrites files. If it fails, fix that first.

## Required artifacts

- `harness/feature_list.json`: source of truth for feature state.
- `harness/claude-progress.md`: session log and verified status.
- `harness/scripts/init.sh`: standard startup and verification path.

`harness/feature_list.json` format: `{"features": [{"id", "title", "priority", "status", "evidence"}]}`. `status` is `todo`, `in_progress` or `done`. `evidence` is empty until the feature is verified.

Status transitions: `todo` becomes `in_progress` when you start the feature (set it in the first commit of the branch). `in_progress` becomes `done` when the Definition of Done is met and the evidence is recorded. The agent does not run the app, so a check only the user can make counts once the user says in chat that they checked it; record that in `evidence` as "Checked by the user" and only then set `done`. Until then the feature stays `in_progress`.

`harness/archive/features-done.json` holds the full entries of done features and is not read at startup. When a feature is done, move its full entry there and leave in `feature_list.json` the `id`, a one-line `title`, the `priority`, `done` and an `evidence` like "Done <date>. Full record: harness/archive/features-done.json". Create the `archive/` folder with the first done feature. `claude-progress.md` keeps the three newest entries and any open blocker; older entries go to `harness/archive/progress-<date>.md`.

## Checks

The project has no tests. Before treating work as finished, run:

```bash
npm run lint            # eslint ./src
npx vue-tsc --noEmit    # types, .vue files included
npx prettier -w <files> # format only the changed files
```

`npm run build` = `vue-tsc --noEmit && vite build`. To check Rust, run `cargo check` in `src-tauri/`. Run the whole app (`npm run tauri dev`) only for changes in `src-tauri/` or window behaviour.

## Plan before edits

After the startup steps and before the first edit of any file, write a plan of changes in the reply and wait until the user has read it and answered. Until then only read, no edits.

- List what is added, changed and removed: screens, components, stores, `Api` methods, contract fields, routes, `StoreKey` keys. Then the verification steps. One line per item.
- Mark every item that the user did not name literally as "mine" and give the reason. Mark every removal. A working screen, field or method is removed only on the user's word.
- Put nothing into the plan "for compatibility".
- Name every helper, type or check that two or more sections use and put it where the concept it works on lives, not in one of its users for the other to call.
- If the plan has to change during the work (a new field, method or removal), stop, say what changes and why, and wait for an answer. A fix inside the plan needs no new answer.
- A one-line fix gets a one-line plan.

## Working rules

- One feature at a time.
- Written code does not make a feature complete; verification does.
- Stay within the feature's scope unless a blocker requires a narrow fix.
- Don't silently change the verification rules (`eslint.config.ts`, `tsconfig.json`, `.prettierrc`, "Checks", "Definition of Done").
- Prefer files in the repository to summaries in chat.
- After edits, format only the changed files, not the whole tree.
- Never commit to `master`; work in a branch. Branch names contain no slashes (`admin-free-manual-change`, not `feature/admin-free-manual-change`).
- Commit titles carry no issue or PR links.
- `AGENTS.md`, `CLAUDE.md` and the `harness/` files are tracked like the rest of the code: a change to them goes through a branch and a PR.
- Don't write anything about the project to the agent's memory. What a later session needs goes into this file or `harness/ARCHITECTURE.md`.
- Think in English; reply to the user in Russian.
- If a tool is missing from PATH or a daemon is not running, say so and stop. Don't search the system for it and don't start services yourself.
- **Options are ranked by design, not by diff size.** When the plan or a question offers alternatives, list them first and recommend the one that puts the code in its proper place, however large its diff. State what each option costs. A smaller diff is a cost to state, never the reason to recommend an option. Never drop the proper option only because it touches more files: that is a cheap change.

## Code conventions

- Imports are relative (`../../stores/x`). The `@` alias is configured in Vite but not used in the code.
- Components use `<script setup lang="ts">`, with props through `defineProps` and destructuring.
- Show API errors through `useToastStore().error(e)`; the message comes from `body.message` of the response. Own messages to the user go through `toast.show(title, text, tone)`.
- Calendar logic and formatting use `@js-temporal/polyfill` (see `api-facade/http.ts`, `api-facade/http/games.ts`). Plain timestamps and the timer run on `Date.now()`, which is fine. Write new calendar logic with Temporal.
- UI texts and messages to the user are in Russian. Code comments and commit messages are in English; a comment explains why, not what the code does.
- `src/assets/` (icons, fonts) is excluded from the linter; don't edit it by hand.

## Git and release

- Changes reach `master` through a PR (merge commit `Merge pull request #N …`).
- Commit messages: English, imperative mood (`Add the free manual change to the admin sidebar`), no full stop in the title. A commit is a title and at most two lines of body; the diff already shows what changed.
- The version lives in three places: `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` (+ `Cargo.lock`). Change it only with `npm version <x>`: the `scripts/bump-version.mjs` script syncs the others and runs `cargo update -p fgg`. Don't edit the version by hand.
- `.github/workflows/release.yml` builds a release on a `v*` tag (Windows NSIS, Linux AppImage). Don't create or push tags without an explicit request.
- The auto-updater verifies a signature (`plugins.updater.pubkey` in `tauri.conf.json`). Don't touch the key or that block.

## Pull requests

- The description is written in English.
- Commits and PR descriptions are short. A PR consists of "What changed" (2 to 4 sentences), "Order" (only when the merge order matters: one sentence with the order that works, nothing about other orders), "What was checked" (one line per real check) and "Not checked". No story of how the work went, no repeated evidence, no function-by-function list. Load `antislop:antislop-copywriting` before writing a commit or a PR and follow it: no em dashes, filler or buzzwords. If a description passes about 250 words, cut it.
- Never write a bare `#123` for a PR of another repository: GitHub links it to issue 123 of the repository this PR is in. Write `FavoriteGameGauntlet/Server#123` or `FavoriteGameGauntlet/Database#123`. After `gh pr create` or `gh pr edit`, grep the body for `#` followed by a digit and check each hit. Commits carry no links at all.
- The description has a "What was checked" section and no test plan. It lists what the agent actually did and what came back: UI actions, visible results, backend responses. Write only checks that were really run, and say what was not checked.
- If a check needed a temporary change (a debug route, a patched value), say so and say that it is not in the PR.
- Never write "run `npm run lint`", "check that the checks pass" or "review the code" as a check. The linter and the types may be mentioned only as what they cover.

## Definition of Done

- The target behaviour is implemented.
- `bash harness/scripts/init.sh` passes.
- If `src-tauri/` changed: `cargo check` passes and the window behaviour was checked by running the app.
- If the change broke a rule written in `harness/ARCHITECTURE.md`, that file is updated. Most changes don't need it.
- If the `Api` contract changed: it is checked against the backend documentation, the implementation in `api-facade/http/` and every place that uses it are updated.
- Evidence is recorded in `harness/feature_list.json` or `harness/claude-progress.md`.
- The repository can still be started the standard way.

## End of session

1. Update `harness/claude-progress.md`.
2. Update `harness/feature_list.json`: the status and `evidence` of the feature.
3. Record unresolved risks and blockers.
4. Commit on a branch with a clear message once the work is in a safe state.
5. Push the branch and open a PR against `master` with `gh pr create`, following "Pull requests". Do it once the Definition of Done is met, so "What was checked" lists real checks. Report the PR link. Don't merge it.
6. Leave the repository in a state where `bash harness/scripts/init.sh` can be run immediately.

## Watch out

- `.env` and `src/constants/apiUrl.ts` hold the backend address; there must be no secrets in the repository. Don't read `.env` without need and don't copy its contents into replies or commits.
- Network access is restricted in two places: the CSP (`connect-src`) in `tauri.conf.json` and `ALLOWED_HOST` in `src-tauri/src/http.rs`; both currently allow only `https://api.fgg-challenge.com`. A new external address must be added to both.
- The `Api` contract must match the real backend. If you change `contracts.ts`, check it against the API documentation, check the implementation in `api-facade/http/` and every place that uses it, not only what `vue-tsc` highlights.
- `README.md` is the Tauri template, not a description of the project. Don't rely on it.
