// Generates assets/deployment-map.svg from the LAYERS data embedded in deployment-map.html.
// Run: node scripts/utils/generate-svg.js
// To refresh both assets/deployment-map.svg and assets/deployment-map.png, run: scripts/generate.sh
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "../..");
const assetDir = path.join(rootDir, "assets");
const html = fs.readFileSync(path.join(rootDir, "deployment-map.html"), "utf8");
const m = html.match(/const LAYERS = ([\s\S]*?\];)/);
if (!m) throw new Error("Could not find LAYERS array in deployment-map.html");
const LAYERS = eval(m[1]);

// ---- palette ----
const C = {
  pink: "#e6007a", ink: "#0d0d12", paper: "#f5f5f7", card: "#ffffff",
  line: "#d9d9e0", muted: "#6b6b76", warn: "#b25b00", warnBg: "#fff4e3", gray: "#888888",
  noDoc: "#c1262d",
};

// ---- layout constants ----
const PAD = 40;
const HEADER_H = 96;
const COL_W = 270;
const CARD_W = 244;
const CARD_H = 56;
const CARD_GAP = 9;
const BADGE = 30;
const TITLE_Y = HEADER_H + 58;
const SUB_Y = HEADER_H + 77;
const CARDS_TOP = HEADER_H + 106; // y where first card starts
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const trunc = (s, max) => (s.length > max ? s.slice(0, max - 1) + "…" : s);

const maxCards = Math.max(...LAYERS.map((l) => l.items.length));
const boardW = PAD * 2 + LAYERS.length * COL_W;
const boardH = CARDS_TOP + maxCards * (CARD_H + CARD_GAP) + PAD;

const parts = [];
parts.push(
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
  `width="${boardW}" height="${boardH}" viewBox="0 0 ${boardW} ${boardH}" font-family="${FONT}">`
);

// background
parts.push(`<rect width="${boardW}" height="${boardH}" fill="${C.paper}"/>`);

// ---- header ----
parts.push(`<circle cx="${PAD + 7}" cy="${PAD + 4}" r="7" fill="${C.pink}"/>`);
parts.push(
  `<text x="${PAD + 24}" y="${PAD + 10}" font-size="22" font-weight="700" fill="${C.ink}" ` +
  `letter-spacing="-0.3">Polkadot Product Ecosystem Open Sourcing Map</text>`
);
// legend
const legendY = PAD + 40;
let lx = PAD + 24;
const legendItem = (fill, stroke, dash, text, bar) => {
  parts.push(
    `<rect x="${lx}" y="${legendY - 11}" width="26" height="14" rx="4" fill="${fill}" ` +
    `stroke="${stroke}" stroke-width="1.5"${dash ? ` stroke-dasharray="3 2"` : ""}/>`
  );
  if (bar) parts.push(`<rect x="${lx}" y="${legendY - 11}" width="3" height="14" fill="${C.gray}"/>`);
  parts.push(`<text x="${lx + 34}" y="${legendY}" font-size="12" fill="${C.muted}">${esc(text)}</text>`);
  lx += 44 + text.length * 6.4 + 26;
};
legendItem(C.card, C.line, false, "Repo + instructions available", false);
legendItem(C.warnBg, C.warn, true, "No repo yet — handoff gap", false);
const missingDocLegend = () => {
  parts.push(`<circle cx="${lx + 8}" cy="${legendY - 4}" r="8" fill="${C.noDoc}"/>`);
  parts.push(
    `<text x="${lx + 8}" y="${legendY}" text-anchor="middle" font-size="11" ` +
    `font-weight="800" fill="#fff">!</text>`
  );
  parts.push(`<text x="${lx + 26}" y="${legendY}" font-size="12" fill="${C.muted}">Missing deploy doc</text>`);
  lx += 26 + "Missing deploy doc".length * 6.4 + 26;
};
missingDocLegend();
legendItem(C.card, C.line, false, "Deployed internally", true);

// ---- columns ----
LAYERS.forEach((layer, i) => {
  const colX = PAD + i * COL_W;
  const cx = colX + (COL_W - CARD_W) / 2; // card left edge

  // dashed separator (between columns)
  if (i < LAYERS.length - 1) {
    const sx = colX + COL_W;
    parts.push(
      `<line x1="${sx}" y1="${HEADER_H + 8}" x2="${sx}" y2="${boardH - PAD / 2}" ` +
      `stroke="${C.line}" stroke-width="1" stroke-dasharray="4 4"/>`
    );
  }

  // layer number badge
  const by = HEADER_H + 10;
  parts.push(`<rect x="${cx}" y="${by}" width="${BADGE}" height="${BADGE}" rx="8" fill="${C.ink}"/>`);
  parts.push(
    `<text x="${cx + BADGE / 2}" y="${by + BADGE / 2 + 5}" text-anchor="middle" ` +
    `font-size="14" font-weight="700" fill="#fff">${layer.num}</text>`
  );
  parts.push(
    `<text x="${cx}" y="${TITLE_Y}" font-size="14.5" font-weight="700" fill="${C.ink}" ` +
    `letter-spacing="-0.2">${esc(trunc(layer.title, 28))}</text>`
  );
  parts.push(
    `<text x="${cx}" y="${SUB_Y}" font-size="11.5" fill="${C.muted}">${esc(trunc(layer.sub, 39))}</text>`
  );

  // cards
  layer.items.forEach((it, j) => {
    const y = CARDS_TOP + j * (CARD_H + CARD_GAP);
    const hasRepo = !!it.repo;
    const isInt = !!it.w3f;
    const repoShort = hasRepo ? (it.repoLabel || it.repo.replace("https://github.com/", "")) : "";
    const deployDoc = it.deployDoc === "NA" ? "" : it.deployDoc;
    const clickTarget = deployDoc || it.repo;

    const open = clickTarget ? `<a xlink:href="${esc(clickTarget)}" href="${esc(clickTarget)}" target="_blank">` : "";
    const close = clickTarget ? `</a>` : "";

    const fill = hasRepo ? C.card : C.warnBg;
    const stroke = hasRepo ? C.line : C.warn;
    const dash = hasRepo ? "" : ` stroke-dasharray="4 3"`;

    parts.push(open);
    parts.push(
      `<rect x="${cx}" y="${y}" width="${CARD_W}" height="${CARD_H}" rx="9" fill="${fill}" ` +
      `stroke="${stroke}" stroke-width="1.5"${dash}/>`
    );
    if (isInt) parts.push(`<rect x="${cx}" y="${y}" width="3" height="${CARD_H}" rx="1.5" fill="${C.gray}"/>`);

    if (!it.deployDoc) {
      parts.push(`<circle cx="${cx + 1}" cy="${y + 1}" r="9" fill="${C.noDoc}" stroke="${C.paper}" stroke-width="2"/>`);
      parts.push(
        `<text x="${cx + 1}" y="${y + 5}" text-anchor="middle" font-size="12" ` +
        `font-weight="800" fill="#fff">!</text>`
      );
    }

    // tags
    const tags = [
      !hasRepo ? { text: "no repo", color: C.warn } : null,
      isInt ? { text: "internal", color: C.gray } : null,
    ].filter(Boolean);

    // name
    const nameColor = hasRepo ? C.ink : C.warn;
    const nameMax = hasRepo ? 30 : 32;
    parts.push(
      `<text x="${cx + 13}" y="${y + (hasRepo ? 22 : 23)}" font-size="13" font-weight="600" ` +
      `fill="${nameColor}" letter-spacing="-0.2">${esc(trunc(it.name, nameMax))}</text>`
    );

    // repo line
    if (hasRepo) {
      parts.push(
        `<text x="${cx + 13}" y="${y + 40}" font-size="10.5" font-family="${MONO}" ` +
        `fill="${C.muted}">${esc(trunc(repoShort, 36))}</text>`
      );
    }

    tags.forEach((tag, k) => {
      const tagW = tag.text.length * 6.2 + 12;
      const tagY = hasRepo ? y + 9 + k * 18 : y + CARD_H - 23 - (tags.length - 1 - k) * 18;
      parts.push(
        `<rect x="${cx + CARD_W - tagW - 11}" y="${tagY}" width="${tagW}" height="16" rx="5" fill="${tag.color}"/>`
      );
      parts.push(
        `<text x="${cx + CARD_W - tagW / 2 - 11}" y="${tagY + 11.5}" text-anchor="middle" ` +
        `font-size="9.5" font-weight="700" fill="#fff" letter-spacing="0.4">${esc(tag.text)}</text>`
      );
    });
    parts.push(close);
  });
});

parts.push(`</svg>`);

fs.mkdirSync(assetDir, { recursive: true });
fs.writeFileSync(path.join(assetDir, "deployment-map.svg"), parts.join("\n"));
console.log(`Wrote assets/deployment-map.svg (${boardW}×${boardH})`);
