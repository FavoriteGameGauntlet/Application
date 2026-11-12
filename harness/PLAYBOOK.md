# Playbook

Procedures that are not part of every session. Read a section only when the user asks for that procedure.

## Releasing a version

Ask the user for the version before starting. A new feature means a minor bump (0.5.0 to 0.6.0), fixes only mean a patch bump. The user also decides whether the release is a prerelease; the last releases were not.

1. Branch from an up-to-date `master` (`release-<version>`, no slashes).
2. `npm version <x> --no-git-tag-version`. The `--no-git-tag-version` flag matters: the tag goes on `master` after the merge, not on the branch. The script syncs `tauri.conf.json`, `Cargo.toml` and `Cargo.lock`. Never edit the version by hand.
3. Run `bash harness/scripts/init.sh` and `cargo check` in `src-tauri/`. Add a short entry to `harness/claude-progress.md`.
4. Commit (`Bump the version to <x>`), push, open the PR following "Pull requests" in `AGENTS.md`.
5. Merge only on the user's word: `gh pr merge <N> --merge`, so the history keeps a merge commit. Then `git checkout master && git pull`.
6. Tag `v<x>` on that `master` and push it: `git tag v<x> && git push origin v<x>`. Create tags only when the user asked for a release.
7. `.github/workflows/release.yml` builds Windows (NSIS) and Linux (AppImage) on the tag. Find the run with `gh run list --workflow=release.yml --limit 1` and wait for it with `gh run watch <id> --exit-status`.
8. The workflow creates the release as a prerelease with one sentence about installing. When the build succeeds, replace the description and clear the flag: `gh release edit v<x> --prerelease=false --latest --notes-file <file>`. Leave `--prerelease=false` out if the user wants a prerelease.
9. Check the result with `gh release view v<x> --json isPrerelease,assets,body`. The assets are the `_x64-setup.exe`, the `.AppImage`, their `.sig` files and `latest.json` (used by the auto-updater).

### Release description

Write it in Russian for players and administrators, who have not seen the mockups or the code. Name what changes for them (screens, buttons, rules), not components, props or API fields. Take the content from the merged PRs since the previous tag (`git log <previous tag>..master`) and add nothing that did not ship.

Structure, as in popular repositories:

```
<One sentence: what the release is about.>

## Новые возможности
- **Name**: what the player or the admin can do now.

## Улучшения
- **Name**: what became clearer or easier.

## Исправления
- What was broken and no longer is.

Для установки на Windows скачайте только файл `_x64-setup.exe`, на Linux только файл `.AppImage`. Остальные не трогайте, они используются для автообновления.
```

A change goes into one section only. Drop a section that has no items. Follow `antislop:antislop-copywriting` (no em dashes, no filler). Keep the installation sentence at the end of every release.
