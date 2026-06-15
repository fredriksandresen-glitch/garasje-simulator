import { defineConfig } from "vite";

const iso15Main = `  iso15: {
    label: "15' ISO",
    length: 4.55,
    width: 2.33,
    height: 2.4,
    usableLength: 4.35,
    usableWidth: 2.24,
    usableHeight: 2.18,
    tare: 1750
  },
`;

const iso15Overlay = `  iso15: { label: "15 ISO", length: 4.55, width: 2.33, height: 2.4, usableLength: 4.35, usableWidth: 2.24 },
`;

const fitHelpers = `function getFootprintFit(container, size) {
  const orientations = [
    { length: size.length, width: size.width },
    { length: size.width, width: size.length }
  ];

  return orientations.reduce((best, orientation) => {
    const cols = Math.floor(container.usableWidth / orientation.width);
    const rows = Math.floor(container.usableLength / orientation.length);
    const count = Math.max(0, cols * rows);
    return count > best.count ? { ...orientation, cols, rows, count } : best;
  }, { length: size.length, width: size.width, cols: 0, rows: 0, count: 0 });
}

function getFit(container, size) {
  const uprightFits = size.height <= container.usableHeight;
  const footprint = getFootprintFit(container, size);

  if (uprightFits && footprint.count > 0) return { compatible: true, physicalCount: footprint.count, footprint, reason: "Mål innenfor nyttig innvendig volum" };
  if (!uprightFits && footprint.count === 0) return { compatible: false, physicalCount: 0, footprint, reason: "For høy og for stort fotavtrykk" };
  if (!uprightFits) return { compatible: false, physicalCount: 0, footprint, reason: "For høy for valgt container" };
  return { compatible: false, physicalCount: 0, footprint, reason: "Fotavtrykk passer ikke i valgt container" };
}
`;

function lagerbyggFixes() {
  return {
    name: "lagerbygg-simulator-fixes",
    transform(code, id) {
      if (id.endsWith("src/main.jsx")) {
        let next = code;
        if (!next.includes("iso15:")) {
          next = next.replace("  iso10hh: {\n", `${iso15Main}  iso10hh: {\n`);
        }
        next = next.replace(
          "      const packingLimited = fit.compatible ? packLimits[load.packKey] : 0;",
          "      const packingLimited = fit.compatible ? Math.min(packLimits[load.packKey], fit.physicalCount) : 0;"
        );
        next = next.replace(
          "        <div className={`${markedClass} blocked-l2`}>Forrom / sluse<br />5.15 x 6.99 m<br />{markedStatus}</div>\n        {useLager2Extension && <div className=\"extension-label\">Rosa felt lagt til som tilgjengelig Lager 2-areal</div>}",
          "        <div className={`${markedClass} blocked-l2`}>Forrom / sluse<br />5.15 x 6.99 m<br />{markedStatus}</div>\n        {useLager2Extension && <div className=\"extension-label\">Rosa felt<br />17.15 x 5.00 m<br />inkludert</div>}"
        );
        next = next.replace(/function getFit\(container, size\) \{[\s\S]*?\n\}\n\nfunction getLimitingConstraint/, `${fitHelpers}\nfunction getLimitingConstraint`);
        return next;
      }

      if (id.endsWith("src/visual-overlay.js")) {
        let next = code;
        if (!next.includes("iso15:")) {
          next = next
            .replace("  iso10hh: { label: \"10 HH\"", `${iso15Overlay}  iso10hh: { label: \"10 HH\"`)
            .replace(
              "  if (text.includes(\"10\")) return WASTE_VIZ_CONTAINERS.iso10;",
              "  if (text.includes(\"15\")) return WASTE_VIZ_CONTAINERS.iso15;\n  if (text.includes(\"10\")) return WASTE_VIZ_CONTAINERS.iso10;"
            );
        }
        return next;
      }

      return null;
    }
  };
}

export default defineConfig({
  plugins: [lagerbyggFixes()],
  server: {
    host: "0.0.0.0"
  },
  preview: {
    host: "0.0.0.0"
  }
});
