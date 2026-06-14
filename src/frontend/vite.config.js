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

function addIso15Container() {
  return {
    name: "add-iso15-container",
    transform(code, id) {
      if (id.endsWith("src/main.jsx") && !code.includes("iso15:")) {
        return code.replace("  iso10hh: {\n", `${iso15Main}  iso10hh: {\n`);
      }

      if (id.endsWith("src/visual-overlay.js") && !code.includes("iso15:")) {
        return code
          .replace("  iso10hh: { label: \"10 HH\"", `${iso15Overlay}  iso10hh: { label: \"10 HH\"`)
          .replace(
            "  if (text.includes(\"10\")) return WASTE_VIZ_CONTAINERS.iso10;",
            "  if (text.includes(\"15\")) return WASTE_VIZ_CONTAINERS.iso15;\n  if (text.includes(\"10\")) return WASTE_VIZ_CONTAINERS.iso10;"
          );
      }

      return null;
    }
  };
}

export default defineConfig({
  plugins: [addIso15Container()],
  server: {
    host: "0.0.0.0"
  },
  preview: {
    host: "0.0.0.0"
  }
});
