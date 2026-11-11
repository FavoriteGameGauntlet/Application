#!/usr/bin/env bash
# Standard startup and verification path. Run it from the repo root before
# starting new work and before declaring a feature done. Stops at the first
# failure and never rewrites files.
set -euo pipefail

echo "==> eslint"
npm run lint

echo "==> vue-tsc"
npx vue-tsc --noEmit

echo "OK: eslint and vue-tsc passed"
