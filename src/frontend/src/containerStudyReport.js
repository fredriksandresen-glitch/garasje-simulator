import { jsPDF } from "jspdf";

const page = { width: 297, height: 210, margin: 12 };
const colors = {
  ink: [24, 40, 47],
  muted: [92, 111, 116],
  line: [205, 216, 217],
  paper: [246, 249, 248],
  dark: [12, 24, 29],
  teal: [35, 157, 137],
  cyan: [71, 161, 193],
  amber: [220, 151, 56],
  red: [199, 82, 64],
  green: [48, 142, 103],
  white: [255, 255, 255]
};

const roofHeightSeries = [3, 4, 5, 6, 7, 8, 10, 12, 14];
const wallClearanceSeries = [0.2, 0.5, 1, 1.5];
const containerGapSeries = [0.1, 0.25, 0.5, 1];

function formatNumber(value, decimals = 0) {
  if (!Number.isFinite(value)) return "Ikke oppgitt";
  return new Intl.NumberFormat("nb-NO", { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(value);
}

function formatMeters(value, decimals = 3) {
  return Number.isFinite(value) ? `${formatNumber(value, decimals)} m` : "Ikke oppgitt";
}

function formatMillimeters(value, signed = false) {
  if (!Number.isFinite(value)) return "Ikke oppgitt";
  const millimeters = Math.round(value * 1000);
  return `${signed && millimeters >= 0 ? "+" : ""}${formatNumber(millimeters)} mm`;
}

function clampNumber(value, fallback, minimum = 0) {
  return Number.isFinite(Number(value)) ? Math.max(minimum, Number(value)) : fallback;
}

function normalizeSettings(settings) {
  return {
    warehouseLength: clampNumber(settings.warehouseLength, 34, 1),
    warehouseWidth: clampNumber(settings.warehouseWidth, 16.85, 1),
    roofHeight: clampNumber(settings.roofHeight, 6, 1),
    wallClearance: clampNumber(settings.wallClearance, 0.5),
    containerGap: clampNumber(settings.containerGap, 0.25),
    reserveAisle: settings.reserveAisle === true,
    aisleSideClearance: clampNumber(settings.aisleSideClearance, 0.5),
    topClearance: clampNumber(settings.topClearance, 0.2)
  };
}

function getAisleWidth(container, settings) {
  return settings.reserveAisle ? container.width + settings.aisleSideClearance * 2 : 0;
}

function getCertifiedStackLimit(container) {
  return Number.isFinite(container.maxCertifiedStackHeight) ? container.maxCertifiedStackHeight : Infinity;
}

function getStackCount(container, roofHeight, topClearance) {
  const geometric = Math.max(0, Math.floor((roofHeight - topClearance) / container.height));
  return Math.min(geometric, getCertifiedStackLimit(container));
}

function getWarehouseLayout(container, settings) {
  const aisleWidth = getAisleWidth(container, settings);
  const usableLength = Math.max(0, settings.warehouseLength - settings.wallClearance * 2);
  const usableWidth = Math.max(0, settings.warehouseWidth - settings.wallClearance * 2 - aisleWidth);
  const countOrientation = (itemLength, itemWidth, orientation) => {
    const cols = Math.max(0, Math.floor((usableLength + settings.containerGap) / (itemLength + settings.containerGap)));
    const rows = Math.max(0, Math.floor((usableWidth + settings.containerGap) / (itemWidth + settings.containerGap)));
    return { orientation, cols, rows, count: cols * rows, itemLength, itemWidth, usableLength, usableWidth, aisleWidth };
  };
  const straight = countOrientation(container.length, container.width, "standard");
  const rotated = countOrientation(container.width, container.length, "90 grader");
  return rotated.count > straight.count ? rotated : straight;
}

function getStatusColor(status) {
  if (status === "pass") return colors.green;
  if (status === "warn") return colors.amber;
  return colors.red;
}

function setText(doc, size = 9, color = colors.ink, style = "normal") {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
}

function addPageTitle(doc, title, subtitle) {
  doc.setFillColor(...colors.dark);
  doc.rect(0, 0, page.width, 27, "F");
  setText(doc, 17, colors.white, "bold");
  doc.text(title, page.margin, 12);
  setText(doc, 8, [166, 196, 196]);
  doc.text(subtitle, page.margin, 19);
}

function addFooters(doc, sourceLabel) {
  const pages = doc.getNumberOfPages();
  for (let index = 1; index <= pages; index += 1) {
    doc.setPage(index);
    doc.setDrawColor(...colors.line);
    doc.line(page.margin, 199, page.width - page.margin, 199);
    setText(doc, 7, colors.muted);
    doc.text("Lagerbygg III - Containerstudie", page.margin, 204);
    doc.text(sourceLabel, page.width / 2, 204, { align: "center" });
    doc.text(`Side ${index} av ${pages}`, page.width - page.margin, 204, { align: "right" });
  }
}

function drawMetricCard(doc, x, y, width, label, value, note = "") {
  doc.setFillColor(...colors.paper);
  doc.setDrawColor(...colors.line);
  doc.roundedRect(x, y, width, 25, 2, 2, "FD");
  setText(doc, 7, colors.muted, "bold");
  doc.text(label.toUpperCase(), x + 4, y + 6);
  const valueText = String(value);
  let valueSize = 14;
  setText(doc, valueSize, colors.ink, "bold");
  while (valueSize > 8 && doc.getTextWidth(valueText) > width - 8) {
    valueSize -= 0.5;
    setText(doc, valueSize, colors.ink, "bold");
  }
  doc.text(valueText, x + 4, y + 14);
  if (note) {
    setText(doc, 6.5, colors.muted);
    doc.text(doc.splitTextToSize(note, width - 8).slice(0, 2), x + 4, y + 19);
  }
}

function captureCanvas(visualElement) {
  const canvas = visualElement?.querySelector?.("canvas");
  if (!canvas || canvas.width === 0 || canvas.height === 0) return null;
  try {
    return canvas.toDataURL("image/png", 1);
  } catch {
    return null;
  }
}

function drawWarehousePlan(doc, x, y, width, height, container, settings, layout) {
  doc.setFillColor(231, 237, 235);
  doc.setDrawColor(93, 112, 106);
  doc.roundedRect(x, y, width, height, 2, 2, "FD");

  const innerX = x + (settings.wallClearance / settings.warehouseLength) * width;
  const innerY = y + (settings.wallClearance / settings.warehouseWidth) * height;
  const innerW = Math.max(1, width - ((settings.wallClearance * 2) / settings.warehouseLength) * width);
  const innerH = Math.max(1, height - ((settings.wallClearance * 2) / settings.warehouseWidth) * height);
  const aisleWidth = getAisleWidth(container, settings);
  const aisleH = Math.min(innerH * 0.7, (aisleWidth / settings.warehouseWidth) * height);
  const aisleY = innerY + (innerH - aisleH) / 2;

  if (aisleWidth > 0) {
    doc.setFillColor(255, 249, 226);
    doc.rect(innerX, aisleY, innerW, aisleH, "F");
    setText(doc, 6.5, [131, 101, 34], "bold");
    doc.text(`Kjøregang ${formatMeters(aisleWidth, 3)}`, innerX + innerW / 2, aisleY + aisleH / 2 + 1, { align: "center" });
  }

  const availableBandHeight = Math.max(0, innerH - aisleH);
  const topBandHeight = aisleWidth > 0 ? availableBandHeight / 2 : availableBandHeight;
  const bottomBandHeight = aisleWidth > 0 ? availableBandHeight / 2 : 0;
  const topRows = aisleWidth > 0 ? Math.ceil(layout.rows / 2) : layout.rows;
  const bottomRows = aisleWidth > 0 ? Math.max(0, layout.rows - topRows) : 0;
  const cellW = layout.cols > 0 ? innerW / layout.cols : innerW;
  const maxDraw = 180;
  let drawn = 0;

  const drawBank = (rows, bankY, bankHeight) => {
    const cellH = rows > 0 ? bankHeight / rows : bankHeight;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < layout.cols && drawn < maxDraw; col += 1) {
        const padX = Math.min(0.8, cellW * 0.12);
        const padY = Math.min(0.8, cellH * 0.12);
        doc.setFillColor(102, 177, 169);
        doc.setDrawColor(42, 104, 99);
        doc.roundedRect(innerX + col * cellW + padX, bankY + row * cellH + padY, Math.max(0.6, cellW - padX * 2), Math.max(0.6, cellH - padY * 2), 0.5, 0.5, "FD");
        drawn += 1;
      }
    }
  };

  drawBank(topRows, innerY, topBandHeight);
  drawBank(bottomRows, aisleY + aisleH, bottomBandHeight);
  setText(doc, 6.5, colors.muted);
  doc.text(`L ${formatMeters(settings.warehouseLength, 1)}`, x + width / 2, y + height + 4, { align: "center" });
  doc.text(`B ${formatMeters(settings.warehouseWidth, 1)}`, x - 2, y + height / 2, { angle: 90, align: "center" });
}

function drawBarChart(doc, x, y, width, height, title, data, color = colors.teal, suffix = "") {
  setText(doc, 9, colors.ink, "bold");
  doc.text(title, x, y);
  const chartY = y + 6;
  const chartH = height - 12;
  const maxValue = Math.max(1, ...data.map((item) => item.value));
  const gap = 3;
  const barWidth = Math.max(4, (width - gap * (data.length - 1)) / data.length);
  doc.setDrawColor(...colors.line);
  doc.line(x, chartY + chartH, x + width, chartY + chartH);
  data.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * (chartH - 11);
    const barX = x + index * (barWidth + gap);
    doc.setFillColor(...color);
    doc.roundedRect(barX, chartY + chartH - barHeight, barWidth, barHeight, 1, 1, "F");
    setText(doc, 7, colors.ink, "bold");
    doc.text(`${item.value}${suffix}`, barX + barWidth / 2, chartY + chartH - barHeight - 2, { align: "center" });
    setText(doc, 6.5, colors.muted);
    doc.text(String(item.label), barX + barWidth / 2, chartY + chartH + 4, { align: "center" });
  });
}

function drawOpeningDiagram(doc, x, y, width, height, openingWidth, openingHeight, itemWidth, itemHeight, status) {
  const availableW = Math.max(openingWidth || itemWidth, itemWidth, 0.1);
  const availableH = Math.max(openingHeight || itemHeight, itemHeight, 0.1);
  const scale = Math.min((width - 4) / availableW, (height - 4) / availableH);
  const openingW = (openingWidth || availableW) * scale;
  const openingH = (openingHeight || availableH) * scale;
  const itemW = itemWidth * scale;
  const itemH = itemHeight * scale;
  const centerX = x + width / 2;
  const bottomY = y + height - 2;

  doc.setDrawColor(...colors.amber);
  doc.setLineWidth(0.7);
  doc.rect(centerX - openingW / 2, bottomY - openingH, openingW, openingH);
  doc.setFillColor(...getStatusColor(status));
  doc.setDrawColor(...getStatusColor(status));
  doc.setGState(new doc.GState({ opacity: 0.32 }));
  doc.rect(centerX - itemW / 2, bottomY - itemH, itemW, itemH, "FD");
  doc.setGState(new doc.GState({ opacity: 1 }));
  doc.setLineWidth(0.2);
}

function addSummaryPage(doc, data, imageData) {
  const { container, selectedLoad, selectedResult, settings } = data;
  addPageTitle(doc, `${container.label} - kapasitetsrapport`, "Valgt container, 3D-simulering og nøkkeltall");

  doc.setFillColor(...colors.dark);
  doc.roundedRect(12, 34, 170, 91, 3, 3, "F");
  if (imageData) {
    doc.addImage(imageData, "PNG", 14, 36, 166, 87, undefined, "FAST");
  } else {
    setText(doc, 11, [166, 196, 196], "bold");
    doc.text("3D-bildet var ikke klart ved eksport", 97, 78, { align: "center" });
    setText(doc, 8, [126, 157, 159]);
    doc.text("Vent til 3D-visningen er lastet og generer rapporten på nytt.", 97, 86, { align: "center" });
  }

  const status = !selectedResult.compatible ? "PASSER IKKE" : selectedResult.accessBlocked ? "INNLASTING MÅ VERIFISERES" : "PASSER";
  const statusColor = !selectedResult.compatible ? colors.red : selectedResult.accessBlocked ? colors.amber : colors.green;
  doc.setFillColor(...statusColor);
  doc.roundedRect(188, 34, 97, 13, 2, 2, "F");
  setText(doc, 9, colors.white, "bold");
  doc.text(status, 236.5, 42.5, { align: "center" });

  setText(doc, 8, colors.muted, "bold");
  doc.text("VALGT LAST", 188, 57);
  setText(doc, 15, colors.ink, "bold");
  doc.text(selectedLoad.label, 188, 65);
  setText(doc, 8, colors.muted);
  doc.text(selectedLoad.dimensions, 188, 71);
  doc.text(`Orientering: ${selectedResult.selectedOrientation === "rotated" ? "90 grader" : "standard"}`, 188, 77);
  doc.text(`Avstand mellom kolli: ${formatMeters(data.spacing, 2)}`, 188, 83);

  drawMetricCard(doc, 188, 91, 47, "Antall på gulv", selectedResult.count, `${selectedResult.rows} x ${selectedResult.cols}`);
  drawMetricCard(doc, 238, 91, 47, "Høydeklaring", formatMillimeters(selectedResult.heightClearanceTop), "over ett kolli");

  setText(doc, 11, colors.ink, "bold");
  doc.text("Containerdata", 12, 136);
  const cards = [
    ["Utvendig", `${formatMeters(container.length)} x ${formatMeters(container.width)} x ${formatMeters(container.height)}`],
    ["Innvendig", `${formatMeters(container.usableLength)} x ${formatMeters(container.usableWidth)} x ${formatMeters(container.usableHeight)}`],
    ["Toppåpning", Number.isFinite(container.topOpeningWidth) ? `${formatMeters(container.topOpeningLength)} x ${formatMeters(container.topOpeningWidth)}` : "Ikke oppgitt"],
    ["Frontåpning", Number.isFinite(container.doorOpeningWidth) ? `${formatMeters(container.doorOpeningWidth)} x ${formatMeters(container.doorOpeningHeight)}` : "Ikke oppgitt"]
  ];
  cards.forEach(([label, value], index) => drawMetricCard(doc, 12 + index * 68.5, 142, 65.5, label, value, index < 2 ? "L x B x H" : index === 2 ? "L x B" : "B x H"));

  const stackCount = getStackCount(container, settings.roofHeight, settings.topClearance);
  setText(doc, 8, colors.muted);
  const aisleSummary = settings.reserveAisle
    ? `kjøregang ${formatMeters(getAisleWidth(container, settings), 3)} (${formatMeters(container.width, 3)} + 2 x ${formatMeters(settings.aisleSideClearance, 2)})`
    : "kjøregang ikke reservert";
  doc.text(doc.splitTextToSize(`Lagerforutsetning: ${formatMeters(settings.warehouseLength, 1)} x ${formatMeters(settings.warehouseWidth, 1)}, tak ${formatMeters(settings.roofHeight, 1)}, veggavstand ${formatMeters(settings.wallClearance, 2)}, containermellomrom ${formatMeters(settings.containerGap, 2)}, ${aisleSummary}.`, 273), 12, 175);
  doc.text(`Ved valgt takhøyde: ${stackCount} containere i høyden${Number.isFinite(container.maxCertifiedStackHeight) ? `, begrenset til sertifisert maksimum ${container.maxCertifiedStackHeight}` : ""}.`, 12, 184);
  setText(doc, 7, colors.muted);
  doc.text(doc.splitTextToSize("Rapporten er en dimensjons- og kapasitetsstudie. Faktisk stabling, gulvlast, brannkrav, truckadkomst, sikring, løfteredskap og operasjonelle toleranser må prosjekteres og verifiseres separat.", 273), 12, 190);
}

function add3DExamplesPage(doc, data, selectedImage, previewImages) {
  doc.addPage();
  addPageTitle(doc, "3D-eksempler fra containerstudien", "Valgt last og representative eksempler som passer eller krever verifisering");
  const selectedStatus = !data.selectedResult.compatible ? "fail" : data.selectedResult.accessBlocked ? "warn" : "pass";
  const examples = [
    {
      label: data.selectedLoad.label,
      status: selectedStatus,
      statusLabel: selectedStatus === "pass" ? "Passer" : selectedStatus === "warn" ? "Innlasting må verifiseres" : "Passer ikke",
      result: data.selectedResult,
      imageData: selectedImage,
      selected: true
    },
    ...previewImages
  ].slice(0, 3);

  examples.forEach((example, index) => {
    const x = 12 + index * 92;
    const y = 37;
    doc.setFillColor(...colors.paper);
    doc.setDrawColor(...colors.line);
    doc.roundedRect(x, y, 88, 135, 2.5, 2.5, "FD");
    doc.setFillColor(...getStatusColor(example.status));
    doc.roundedRect(x + 5, y + 5, 30, 8, 1, 1, "F");
    setText(doc, 6.2, colors.white, "bold");
    doc.text(example.selected ? "VALGT" : example.status === "pass" ? "PASSER" : example.status === "warn" ? "VERIFISER" : "PASSER IKKE", x + 20, y + 10.5, { align: "center" });
    setText(doc, 9, colors.ink, "bold");
    doc.text(doc.splitTextToSize(example.label, 45).slice(0, 2), x + 39, y + 9);

    doc.setFillColor(...colors.dark);
    doc.roundedRect(x + 5, y + 19, 78, 70, 2, 2, "F");
    if (example.imageData) {
      doc.addImage(example.imageData, "PNG", x + 7, y + 21, 74, 66, undefined, "FAST");
    } else {
      setText(doc, 7, [166, 196, 196], "bold");
      doc.text("3D-bilde ikke klart", x + 44, y + 55, { align: "center" });
    }

    setText(doc, 9, getStatusColor(example.status), "bold");
    doc.text(example.statusLabel, x + 5, y + 99);
    setText(doc, 7, colors.muted);
    doc.text(`Antall på gulv: ${example.result.count}`, x + 5, y + 107);
    doc.text(`Orientering: ${example.result.selectedOrientation === "rotated" ? "90 grader" : "standard"}`, x + 5, y + 113);
    doc.text(`Klaring over: ${formatMillimeters(example.result.heightClearanceTop)}`, x + 5, y + 119);
    const opening = example.result.verifiedAccess?.label || (example.result.accessBlocked ? "ingen åpning passer" : "åpning må verifiseres");
    doc.text(doc.splitTextToSize(`Innlasting: ${opening}`, 77).slice(0, 2), x + 5, y + 125);
  });

  setText(doc, 8, colors.ink, "bold");
  doc.text("Slik leses 3D-bildene", 12, 184);
  setText(doc, 7, colors.muted);
  doc.text(doc.splitTextToSize("Containeren vises transparent. Lasten er plassert med simulatorens valgte orientering, og hard-top-profilene vises i taksonen. Grønn status betyr at minst én registrert åpning kan brukes. Gul status betyr at lasten passer innvendig, men registrerte åpninger eller praktisk innføring må verifiseres.", 250), 12, 190);
}

function addWarehousePage(doc, data) {
  doc.addPage();
  addPageTitle(doc, "Lagerplassering og avstandsfølsomhet", "Valgte parametere og grafisk kapasitetsstudie");
  const layout = getWarehouseLayout(data.container, data.settings);
  const stackCount = getStackCount(data.container, data.settings.roofHeight, data.settings.topClearance);
  drawWarehousePlan(doc, 14, 38, 145, 92, data.container, data.settings, layout);

  drawMetricCard(doc, 170, 38, 54, "Containere på gulv", layout.count, `${layout.cols} x ${layout.rows}, ${layout.orientation}`);
  drawMetricCard(doc, 229, 38, 54, "I høyden", stackCount, `tak ${formatMeters(data.settings.roofHeight, 1)}`);
  drawMetricCard(doc, 170, 68, 54, "Totale plasser", layout.count * stackCount, "gulv x høyde");
  drawMetricCard(doc, 229, 68, 54, "Reservert gang", data.settings.reserveAisle ? formatMeters(layout.aisleWidth, 3) : "Ingen", data.settings.reserveAisle ? `B container + 2 x ${formatMeters(data.settings.aisleSideClearance, 2)}` : "hele bredden disponibel");
  drawMetricCard(doc, 170, 98, 54, "Fra vegg", formatMeters(data.settings.wallClearance, 2), "på alle sider");
  drawMetricCard(doc, 229, 98, 54, "Mellomrom", formatMeters(data.settings.containerGap, 2), "mellom containere");

  const wallData = wallClearanceSeries.map((clearance) => ({
    label: `${formatNumber(clearance, 1)} m`,
    value: getWarehouseLayout(data.container, { ...data.settings, wallClearance: clearance }).count
  }));
  const gapData = containerGapSeries.map((gap) => ({
    label: `${formatNumber(gap, 2)} m`,
    value: getWarehouseLayout(data.container, { ...data.settings, containerGap: gap }).count
  }));
  drawBarChart(doc, 14, 145, 126, 43, "Containere på gulv ved ulik veggavstand", wallData, colors.cyan);
  drawBarChart(doc, 158, 145, 125, 43, "Containere på gulv ved ulik avstand mellom containere", gapData, colors.teal);
}

function addStackingPage(doc, data) {
  doc.addPage();
  addPageTitle(doc, "Stabling og takhøyde", "Geometrisk kapasitet, sertifisert maksimum og samlet lastkapasitet");
  const stackData = roofHeightSeries.map((roofHeight) => ({
    label: `${roofHeight} m`,
    value: getStackCount(data.container, roofHeight, data.settings.topClearance)
  }));
  drawBarChart(doc, 14, 39, 176, 68, "Antall containere i høyden ved ulik takhøyde", stackData, colors.teal);

  const selectedStackCount = getStackCount(data.container, data.settings.roofHeight, data.settings.topClearance);
  drawMetricCard(doc, 201, 39, 82, "Valgt takhøyde", formatMeters(data.settings.roofHeight, 1), `toppklaring ${formatMeters(data.settings.topClearance, 2)}`);
  drawMetricCard(doc, 201, 70, 82, "Containerstabel", `${selectedStackCount} høy`, Number.isFinite(data.container.maxCertifiedStackHeight) ? `sertifisert maksimum ${data.container.maxCertifiedStackHeight}` : "ingen sertifisert grense registrert");

  setText(doc, 11, colors.ink, "bold");
  doc.text("Leverandørdata for stabling og vekt", 14, 123);
  const specs = [
    ["Max gross weight", Number.isFinite(data.container.maxGross) ? `${formatNumber(data.container.maxGross)} kg` : "Ikke oppgitt"],
    ["Tare weight", Number.isFinite(data.container.tare) ? `${formatNumber(data.container.tare)} kg` : "Ikke oppgitt"],
    ["Max payload", Number.isFinite(data.container.payload) ? `${formatNumber(data.container.payload)} kg` : "Ikke oppgitt"],
    ["Stacking test load", Number.isFinite(data.container.stackingTestLoadPerPost) ? `${formatNumber(data.container.stackingTestLoadPerPost)} kg/post` : "Ikke oppgitt"],
    ["Sertifisert stabling", Number.isFinite(data.container.maxCertifiedStackHeight) ? `${data.container.maxCertifiedStackHeight} høy` : "Ikke oppgitt"],
    ["Innvendig volum", Number.isFinite(data.container.insideCubicCapacity) ? `${formatNumber(data.container.insideCubicCapacity, 2)} m3` : "Ikke oppgitt"]
  ];
  specs.forEach(([label, value], index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    drawMetricCard(doc, 14 + col * 91, 130 + row * 30, 85, label, value);
  });

  setText(doc, 7, colors.muted);
  doc.text(doc.splitTextToSize("Stacking test load er en typeprøvingsverdi per hjørnestolpe og brukes ikke som en direkte gulv- eller nyttelastgrense. Rapporten begrenser derfor stabelen til leverandørens oppgitte 9-høy kontroll og valgt takhøyde. Endelig stabling krever kontroll av underlag, lastfordeling, hjørnebeslag og myndighetskrav.", 269), 14, 193);
}

function addLoadMatrixPage(doc, data) {
  doc.addPage();
  addPageTitle(doc, "Lastkapasitet og innlastingskontroll", "Alle registrerte lasttyper mot valgt container");
  const columns = [
    ["Last", 14, 55],
    ["Geometri", 69, 31],
    ["Vektgrense", 100, 29],
    ["Praktisk", 129, 27],
    ["Høydeklaring", 156, 31],
    ["Toppåpning", 187, 42],
    ["Frontåpning", 229, 42]
  ];
  doc.setFillColor(...colors.dark);
  doc.roundedRect(12, 36, 273, 13, 2, 2, "F");
  columns.forEach(([label, x]) => {
    setText(doc, 7, colors.white, "bold");
    doc.text(label, x + 2, 44);
  });

  data.loadRows.forEach((row, index) => {
    const y = 51 + index * 23;
    doc.setFillColor(index % 2 === 0 ? 247 : 239, index % 2 === 0 ? 250 : 245, index % 2 === 0 ? 249 : 243);
    doc.setDrawColor(...colors.line);
    doc.roundedRect(12, y, 273, 20, 1.5, 1.5, "FD");
    doc.setFillColor(...getStatusColor(row.status));
    doc.rect(12, y, 2.5, 20, "F");

    setText(doc, 8, colors.ink, "bold");
    doc.text(row.load.label, 16, y + 7);
    setText(doc, 6.5, colors.muted);
    doc.text(row.load.dimensions, 16, y + 13);
    doc.text(`${formatNumber(row.load.defaultWeight)} kg/stk`, 16, y + 17);

    const topLabel = !row.result.topAccess.available ? "Ikke oppgitt" : row.result.topAccess.compatible ? "Passer" : row.result.topAccess.complete ? "Passer ikke" : "Ufullstendig";
    const frontLabel = !row.result.frontAccess.available ? "Ikke oppgitt" : row.result.frontAccess.compatible ? "Passer" : row.result.frontAccess.complete ? "Passer ikke" : "Ufullstendig";
    const cells = [
      [`${row.geometricCount} stk`, `${row.result.count}/lag x ${row.verticalLayers} lag`, 71],
      [row.weightLimitCount === null ? "-" : `${row.weightLimitCount} stk`, "payload", 102],
      [`${row.practicalCount} stk`, row.statusLabel, 131],
      [formatMillimeters(row.result.heightClearanceTop), "over kolli", 158],
      [topLabel, row.result.topAccess.available ? `${formatMillimeters(row.result.topAccess.lengthClearance, true)} L / ${formatMillimeters(row.result.topAccess.widthClearance, true)} B` : "", 189],
      [frontLabel, row.result.frontAccess.available ? `${formatMillimeters(row.result.frontAccess.widthClearance, true)} B / ${formatMillimeters(row.result.frontAccess.heightClearance, true)} H` : "", 231]
    ];
    cells.forEach(([value, note, x]) => {
      setText(doc, 7.5, colors.ink, "bold");
      doc.text(String(value), x, y + 8);
      setText(doc, 6, colors.muted);
      doc.text(doc.splitTextToSize(String(note), 37).slice(0, 2), x, y + 13);
    });
  });

  setText(doc, 8, colors.ink, "bold");
  doc.text("Tolkning", 14, 193);
  setText(doc, 6.5, colors.muted);
  doc.text("Praktisk antall = laveste verdi av geometrisk kapasitet og nyttelastgrense. Antall lag er en ren geometrisk kontroll; faktisk stabling av kolli krever verifisert bæreevne og sikring.", 45, 193);
}

function addLoadVisualsPage(doc, data) {
  doc.addPage();
  addPageTitle(doc, "Visuell passform for alle lasttyper", "Blå lastgeometri mot gul topp-/frontåpning; status følger lastmatrisen");
  data.loadRows.forEach((row, index) => {
    const col = index % 2;
    const gridRow = Math.floor(index / 2);
    const x = 12 + col * 139;
    const y = 34 + gridRow * 52;
    doc.setFillColor(...colors.paper);
    doc.setDrawColor(...colors.line);
    doc.roundedRect(x, y, 134, 47, 2, 2, "FD");
    doc.setFillColor(...getStatusColor(row.status));
    doc.roundedRect(x + 4, y + 4, 31, 8, 1, 1, "F");
    setText(doc, 6.5, colors.white, "bold");
    doc.text(row.status === "pass" ? "PASSER" : row.status === "warn" ? "VERIFISER" : "PASSER IKKE", x + 19.5, y + 9.5, { align: "center" });
    setText(doc, 9, colors.ink, "bold");
    doc.text(row.load.label, x + 39, y + 9.5);
    setText(doc, 6.5, colors.muted);
    doc.text(`${row.practicalCount} stk praktisk - ${row.result.selectedOrientation === "rotated" ? "90 grader" : "standard"}`, x + 39, y + 15);

    setText(doc, 6.5, colors.muted, "bold");
    doc.text("TOPP", x + 11, y + 21);
    drawOpeningDiagram(
      doc,
      x + 4,
      y + 23,
      55,
      20,
      data.container.topOpeningWidth || data.container.usableWidth,
      data.container.topOpeningLength || data.container.usableLength,
      row.result.itemWidth,
      row.result.itemLength,
      row.result.topAccess.compatible === false ? "fail" : row.status
    );
    setText(doc, 6.5, colors.muted, "bold");
    doc.text("FRONT", x + 75, y + 21);
    drawOpeningDiagram(
      doc,
      x + 66,
      y + 23,
      55,
      20,
      data.container.doorOpeningWidth || data.container.usableWidth,
      data.container.doorOpeningHeight || data.container.usableHeight,
      row.result.itemWidth,
      row.result.usedHeight,
      row.result.frontAccess.compatible === false ? "fail" : row.status
    );
  });
  setText(doc, 7, colors.muted);
  doc.text(doc.splitTextToSize("Gul ramme viser registrert åpning. Farget flate viser kolliets tverrsnitt/fotavtrykk i automatisk valgt orientering. Diagrammene er skalerte kontrollillustrasjoner og ikke produksjonstegninger.", 270), 13, 193);
}

function addMethodPage(doc, data) {
  doc.addPage();
  addPageTitle(doc, "Forutsetninger og kontrollpunkter", "Hva rapporten beregner - og hva som må verifiseres før gjennomføring");
  const sections = [
    ["Pakkematematikk", "Standard og 90 graders orientering testes. Høyeste antall velges, med størst restmargin som sekundært kriterium. Kolliavstanden brukes mellom kolli i begge gulvretninger."],
    ["Last i høyden", "Antall lag beregnes geometrisk fra innvendig høyde og valgt kolliavstand. Rapporten bekrefter ikke at tønner, stålkasser eller kokiller tåler å stå oppå hverandre."],
    ["Vektkapasitet", "Praktisk antall begrenses av registrert payload og standardvekten for lasttypen. Punktlaster, tyngdepunkt og gulvkapasitet må kontrolleres separat."],
    ["Innlasting", "Toppåpning kontrolleres mot kolliets lengde og bredde. Frontåpning kontrolleres mot bredde og høyde. Løfteredskap, toleranser, innføringsvinkel og håndteringsmargin inngår ikke automatisk."],
    ["Containerstabling", "Antall i høyden styres av takhøyde minus toppklaring og begrenses til sertifisert maksimum når dette er oppgitt. Stacking test load brukes som dokumentasjonsdata, ikke som direkte lastformel."],
    ["Lagerplassering", "Lagerkapasiteten reserverer veggavstand og mellomrom mellom containere. Kjøregang er valgfri; når den brukes beregnes den som utvendig containerbredde pluss valgt slingringsmonn på begge sider. Søyler, brannskiller, rømningsveier, porter, truckvending og lokale hindringer må legges inn i detaljprosjektering."]
  ];
  sections.forEach(([title, body], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 14 + col * 137;
    const y = 38 + row * 45;
    doc.setFillColor(...colors.paper);
    doc.setDrawColor(...colors.line);
    doc.roundedRect(x, y, 132, 38, 2, 2, "FD");
    setText(doc, 9, colors.ink, "bold");
    doc.text(title, x + 5, y + 8);
    setText(doc, 7, colors.muted);
    doc.text(doc.splitTextToSize(body, 122), x + 5, y + 14);
  });

  setText(doc, 9, colors.ink, "bold");
  doc.text("Datagrunnlag", 14, 180);
  setText(doc, 7, colors.muted);
  doc.text(data.container.specification || data.container.notes || "Containerdata fra simulatorens registrerte datasett.", 14, 186);
  doc.text(`Rapport generert ${new Intl.DateTimeFormat("nb-NO", { dateStyle: "long", timeStyle: "short" }).format(new Date())}.`, 14, 192);
}

function safeFileName(label) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function generateContainerStudyPdf(input) {
  const settings = normalizeSettings(input.settings || {});
  const data = { ...input, settings };
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  doc.setProperties({
    title: `${input.container.label} - Containerstudie`,
    subject: "Lagerplassering, stabling, lastkapasitet og klaringer",
    author: "Lagerbygg III Simulator",
    creator: "Lagerbygg III Simulator"
  });
  const imageData = captureCanvas(input.visualElement);
  const previewImages = (input.previewElements || []).map((preview) => ({
    ...preview,
    imageData: captureCanvas(preview.element)
  }));

  addSummaryPage(doc, data, imageData);
  add3DExamplesPage(doc, data, imageData, previewImages);
  addWarehousePage(doc, data);
  addStackingPage(doc, data);
  addLoadMatrixPage(doc, data);
  addLoadVisualsPage(doc, data);
  addMethodPage(doc, data);
  addFooters(doc, input.container.specification || "Simulatorberegning");

  const date = new Date().toISOString().slice(0, 10);
  const fileName = `containerstudie-${safeFileName(input.container.shortLabel || input.container.label)}-${date}.pdf`;
  doc.save(fileName);
  return { fileName, pages: doc.getNumberOfPages() };
}
