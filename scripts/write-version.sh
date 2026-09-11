#!/usr/bin/env bash
set -euo pipefail

version_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$version_root"

commit_sha="$(git rev-parse --short=8 HEAD 2>/dev/null || true)"
commit_date="$(git show -s --format=%cs HEAD 2>/dev/null | tr -d '-' || true)"
commit_sha="${commit_sha:-unknown}"
commit_date="${commit_date:-unknown}"
version="$(tr -d '[:space:]' < VERSION)"
if [[ ! "$version" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]; then
  echo "錯誤：VERSION 必須是 major.minor.patch（目前：$version）" >&2
  exit 1
fi
dirty=false
if [[ -n "$(git status --porcelain 2>/dev/null || true)" ]]; then dirty=true; fi

build_version="$version"
if [[ "$dirty" == true ]]; then build_version="${build_version}-dev"; fi
display="${build_version} (${commit_date}.${commit_sha})"

printf '{\n  "version": "%s",\n  "display": "%s",\n  "commit": "%s",\n  "commitDate": "%s",\n  "dirty": %s\n}\n' \
  "$build_version" "$display" "$commit_sha" "$commit_date" "$dirty" > public/version.json
printf 'Build version: %s\n' "$display"
