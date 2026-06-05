# W3S Architecture

🔗 **[View the interactive Open Sourcing Map →](https://paritytech.github.io/w3s-architecture/open-source-map.html)**

This repo tracks the W3S open sourcing map and the related repository list used to inspect/reference project sources.

## Map Workflow

The map source of truth is `open-source-map.html`, served via GitHub Pages at the link above. The SVG/PNG exports are generated on demand, not committed: keeping them out of git avoids merge conflicts between concurrent PRs.

When you edit the map, update the `LAYERS` array in `open-source-map.html`. To preview the exports locally, regenerate them (output lands in `assets/`, which is git-ignored):

```sh
bash scripts/generate.sh
```

The PR workflow regenerates the exports from both `main` and the PR branch, comments whether the map changed, and uploads the before/after assets as a downloadable artifact.

The live HTML page also renders a resizable Mega Doc viewer from the same `LAYERS` data. Items with Markdown `deployDoc` links are loaded into one scrollable document pane, each item section can be collapsed, missing docs render as placeholder sections, and `"NA"` docs are omitted from the pane. The generated SVG/PNG exports only include the map.

## Adding Map Items

Add lanes or items in the `LAYERS` array in `open-source-map.html`.

Item fields:

- `name`: display name on the board.
- `repo`: GitHub URL, or `null` when there is no repo yet.
- `w3f`: set to `true` for internally deployed items. Internal items render as muted grey cards.
- `deployDoc`: link to the deployment document when one exists. Use `"NA"` when a deploy doc is intentionally not applicable.
- `openSource`: set to `true` when the repo is public/open source, or `false` when it is private or there is no repo yet.

Items without `deployDoc` get the red `!` missing deploy doc badge. Items with `deployDoc: "NA"` do not get the badge, but still link to their repo. Items with `openSource: false` get the yellow `!` not-open-source badge. Items with `openSource: true` and any `deployDoc` value, including `"NA"`, get the green check badge. Items with `repo: null` get the `no repo` label.

## Repository List

`repos.csv` tracks repo name/URL pairs used by the clone script. It has three columns:

```csv
name,repo_name,url
```

When adding a new repo-backed map item, also add it to `repos.csv`.

## Scripts

`scripts/generate.sh` regenerates both open sourcing map exports from `open-source-map.html`.

`scripts/clone_all.sh` clones the unique repositories from `repos.csv` into `./reference-repos` over HTTPS, in parallel. `reference-repos/` is ignored by git.

```sh
bash scripts/clone_all.sh
JOBS=16 bash scripts/clone_all.sh
```

`scripts/utils/generate-svg.js` is the SVG generator used by `scripts/generate.sh`; normally call `scripts/generate.sh` instead of running it directly.
