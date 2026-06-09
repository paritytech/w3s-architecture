#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPOS_CSV="$ROOT_DIR/repos.csv"
DEST_DIR="$ROOT_DIR/reference-repos"
JOBS="${JOBS:-8}"

mkdir -p "$DEST_DIR"

normalize_github_url() {
  local url="$1"
  url="${url%%#*}"
  url="${url%/}"

  if [[ "$url" =~ ^https://github\.com/([^/]+)/([^/]+)(/.*)?$ ]]; then
    printf 'https://github.com/%s/%s\n' "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}"
    return
  fi

  printf '%s\n' "$url"
}

clone_or_fetch() {
  local repo_name="$1"
  local raw_url="$2"
  local url
  local dest

  url="$(normalize_github_url "$raw_url")"
  dest="$DEST_DIR/$repo_name"

  if [[ -d "$dest/.git" ]]; then
    printf 'Fetching %s\n' "$repo_name"
    git -C "$dest" fetch --all --prune
  elif [[ -e "$dest" ]]; then
    printf 'Skipping %s: %s exists but is not a git repo\n' "$repo_name" "$dest" >&2
    return 1
  else
    printf 'Cloning %s from %s\n' "$repo_name" "$url"
    git clone "$url" "$dest"
  fi
}

export ROOT_DIR DEST_DIR
export -f normalize_github_url clone_or_fetch

awk -F ',' '
  NR == 1 { next }
  NF >= 3 && !seen[$2]++ { print $2 "\t" $3 }
' "$REPOS_CSV" |
  xargs -P "$JOBS" -n 2 bash -c 'clone_or_fetch "$1" "$2"' _
