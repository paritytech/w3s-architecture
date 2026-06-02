#!/usr/bin/env bash
set -euo pipefail

if [[ $# -gt 1 ]]; then
  echo "Usage: $0 [repo-root]" >&2
  exit 2
fi

if [[ $# -eq 1 ]]; then
  ROOT_DIR="$(cd "$1" && pwd)"
else
  ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi

SVG_PATH="$ROOT_DIR/deployment-map.svg"
PNG_PATH="$ROOT_DIR/deployment-map.png"
GENERATOR="$ROOT_DIR/scripts/utils/generate-svg.js"
LEGACY_GENERATOR="$ROOT_DIR/generate-svg.js"

if [[ ! -f "$GENERATOR" && -f "$LEGACY_GENERATOR" ]]; then
  GENERATOR="$LEGACY_GENERATOR"
fi

if [[ ! -f "$GENERATOR" ]]; then
  if [[ -f "$PNG_PATH" ]]; then
    echo "No SVG generator found in $ROOT_DIR; using existing deployment-map.png"
    exit 0
  fi

  echo "No SVG generator or deployment-map.png found in $ROOT_DIR" >&2
  exit 1
fi

(cd "$ROOT_DIR" && node "$GENERATOR")

TMP_SVG="$(mktemp "${TMPDIR:-/tmp}/deployment-map-no-links.XXXXXX.svg")"
trap 'rm -f "$TMP_SVG"' EXIT

node - "$SVG_PATH" "$TMP_SVG" <<'JS'
const fs = require("fs");

const [input, output] = process.argv.slice(2);
const svg = fs
  .readFileSync(input, "utf8")
  .replace(/<a\b[^>]*>/g, "")
  .replace(/<\/a>/g, "");

fs.writeFileSync(output, svg);
JS

if command -v rsvg-convert >/dev/null 2>&1; then
  rsvg-convert -f png -o "$PNG_PATH" "$TMP_SVG"
elif command -v magick >/dev/null 2>&1; then
  magick "$TMP_SVG" "$PNG_PATH"
elif command -v convert >/dev/null 2>&1; then
  convert "$TMP_SVG" "$PNG_PATH"
elif command -v sips >/dev/null 2>&1; then
  sips -s format png "$TMP_SVG" --out "$PNG_PATH" >/dev/null
else
  echo "No SVG-to-PNG renderer found. Install librsvg, ImageMagick, or use macOS sips." >&2
  exit 1
fi

echo "Wrote $PNG_PATH"
