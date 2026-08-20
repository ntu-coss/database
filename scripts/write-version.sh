#!/usr/bin/env bash
set -euo pipefail

version_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$version_root"

commit_count="$(git rev-list --count HEAD 2>/dev/null || true)"
commit_sha="$(git rev-parse --short=8 HEAD 2>/dev/null || true)"
commit_date="$(git show -s --format=%cs HEAD 2>/dev/null | tr -d '-' || true)"
commit_count="${commit_count:-0}"
commit_sha="${commit_sha:-unknown}"
commit_date="${commit_date:-unknown}"
dirty=false
if [[ -n "$(git status --porcelain 2>/dev/null || true)" ]]; then dirty=true; fi

version="1.0.${commit_count}"
if [[ "$dirty" == true || "$commit_count" == 0 ]]; then version="${version}-dev"; fi
display="${version} (${commit_date}.${commit_sha})"

printf '{\n  "version": "%s",\n  "display": "%s",\n  "commit": "%s",\n  "commitDate": "%s",\n  "dirty": %s\n}\n' \
  "$version" "$display" "$commit_sha" "$commit_date" "$dirty" > public/version.json
printf 'Build version: %s\n' "$display"
