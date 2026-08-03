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
  const formatted = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
    .format(Math.abs(value))
    .replace(/[\u00a0\u202f]/g, " ");
  return value < 0 ? `-${formatted}` : formatted;
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
    doorClearance: clampNumber(settings.doorClearance, 0.9),
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

function getStackingTestLoad(container) {
  if (Number.isFinite(container.stackingTestLoad)) return container.stackingTestLoad;
  if (Number.isFinite(container.stackingTestLoadPerPost)) return container.stackingTestLoadPerPost;
  return null;
}

function getLoadedStackScreening(container, row, settings) {
  const roofLimit = getStackCount(container, settings.roofHeight, settings.topClearance);
  const certifiedLimit = getCertifiedStackLimit(container);
  const testLoad = getStackingTestLoad(container);
  const loadedGrossWeight = row.loadedGrossWeight || (container.tare || 0) + row.practicalCount * row.load.defaultWeight;
  const testLoadLimit = Number.isFinite(testLoad) && loadedGrossWeight > 0
    ? Math.max(1, 1 + Math.floor(testLoad / loadedGrossWeight))
    : Infinity;
  const screenedStackHeight = Math.max(0, Math.min(roofLimit, certifiedLimit, testLoadLimit));
  const limits = [
    ["takhøyde", roofLimit],
    ["sertifisert maksimum", certifiedLimit],
    ["stacking-test screening", testLoadLimit]
  ].filter(([, value]) => Number.isFinite(value));
  const governing = limits.sort((a, b) => a[1] - b[1])[0]?.[0] || "takhøyde";
  return { roofLimit, certifiedLimit, testLoadLimit, screenedStackHeight, governing, loadedGrossWeight };
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

function drawArchitecturalPlan(doc, x, y, width, height, data, scenario) {
  const planWidth = data.warehouseAnalysis.planWidth;
  const planLength = data.warehouseAnalysis.planLength;
  const legendHeight = 13;
  const scale = Math.min(width / planWidth, (height - legendHeight) / planLength);
  const drawingWidth = planWidth * scale;
  const drawingHeight = planLength * scale;
  const planX = x + (width - drawingWidth) / 2;
  const planY = y;
  const toX = (value) => planX + value * scale;
  const toY = (value, length = 0) => planY + (planLength - value - length) * scale;

  doc.setFillColor(242, 239, 231);
  doc.setDrawColor(156, 167, 159);
  doc.roundedRect(planX, planY, drawingWidth, drawingHeight, 1.5, 1.5, "FD");
  doc.setFillColor(118, 128, 120);
  doc.rect(toX(16.85), planY, 0.5 * scale, drawingHeight, "F");

  scenario.roomModels.forEach((room) => {
    const roomX = toX(room.x);
    const roomY = toY(0, room.displayLength);
    const roomWidth = room.width * scale;
    const roomHeight = room.displayLength * scale;
    doc.setFillColor(248, 249, 246);
    doc.setDrawColor(85, 105, 93);
    doc.rect(roomX, roomY, roomWidth, roomHeight, "FD");

    if (room.extension) {
      const extensionY = toY(room.extension.y, room.extension.length);
      doc.setFillColor(245, 195, 234);
      doc.setDrawColor(177, 54, 157);
      doc.setLineDashPattern([1, 0.8], 0);
      doc.rect(toX(room.x + room.extension.x), extensionY, room.extension.width * scale, room.extension.length * scale, "FD");
      doc.setLineDashPattern([], 0);
      setText(doc, 4.8, [115, 32, 101], "bold");
      doc.text(`Rosa felt - ${room.useLager2Extension ? "inkludert" : "fratrukket"}`, toX(room.x + room.extension.width / 2), extensionY + 4, { align: "center" });
    }

    (room.obstructions || []).forEach((obstruction) => {
      const obstructionX = toX(room.x + obstruction.x);
      const obstructionY = toY(obstruction.y, obstruction.length);
      doc.setFillColor(246, 242, 183);
      doc.setDrawColor(154, 133, 24);
      doc.setLineDashPattern([1, 0.8], 0);
      doc.rect(obstructionX, obstructionY, obstruction.width * scale, obstruction.length * scale, "FD");
      doc.setLineDashPattern([], 0);
      setText(doc, 4.2, [72, 70, 13], "bold");
      const obstructionLabel = `${obstruction.label} - ${room.includeMarkedAreas ? "inkludert" : "fratrukket"}`;
      doc.text(doc.splitTextToSize(obstructionLabel, Math.max(10, obstruction.width * scale - 2)).slice(0, 2), obstructionX + obstruction.width * scale / 2, obstructionY + 3, { align: "center" });
    });

    if (room.transportAisle) {
      const aisleX = toX(room.x + room.transportAisle.x);
      const aisleY = toY(room.transportAisle.y, room.transportAisle.length);
      const aisleWidth = room.transportAisle.width * scale;
      const aisleHeight = room.transportAisle.length * scale;
      doc.setFillColor(222, 239, 248);
      doc.setDrawColor(62, 112, 145);
      doc.setLineDashPattern([1.2, 0.8], 0);
      doc.rect(aisleX, aisleY, aisleWidth, aisleHeight, "FD");
      doc.setLineDashPattern([], 0);
      setText(doc, 4.6, [36, 77, 104], "bold");
      doc.text(`Kjøregang ${formatMeters(room.transportAisle.width, 3)}`, aisleX + aisleWidth / 2, aisleY + aisleHeight / 2, { angle: 90, align: "center" });
    }

    room.geometricSlots.forEach((slot) => {
      const slotX = toX(room.x + slot.x);
      const slotY = toY(slot.y, slot.length);
      const slotWidth = slot.width * scale;
      const slotHeight = slot.length * scale;
      doc.setFillColor(...(slot.blocked ? [246, 223, 143] : [231, 238, 233]));
      doc.setDrawColor(...(slot.blocked ? [166, 82, 67] : [70, 92, 80]));
      doc.roundedRect(slotX, slotY, slotWidth, slotHeight, 0.45, 0.45, "FD");
      if (!slot.blocked) {
        const loadColor = data.selectedLoad.shareKey === "drum" ? colors.amber : data.selectedLoad.shareKey === "kokille" ? [105, 168, 107] : [47, 111, 169];
        doc.setFillColor(...loadColor);
        doc.setDrawColor(...loadColor);
        if (data.selectedLoad.shareKey === "drum") {
          doc.circle(slotX + slotWidth / 2, slotY + slotHeight * 0.58, Math.min(slotWidth, slotHeight) * 0.14, "F");
        } else {
          doc.rect(slotX + slotWidth * 0.28, slotY + slotHeight * 0.34, slotWidth * 0.44, slotHeight * 0.42, "F");
        }
      }
      setText(doc, Math.max(3.2, Math.min(4.4, slotWidth * 0.55)), [35, 52, 43], "bold");
      doc.text(slot.blocked ? "Blokkert" : data.container.shortLabel, slotX + 0.6, slotY + 3.2);
    });

    doc.setGState(new doc.GState({ opacity: 0.86 }));
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(roomX + 1, roomY + 1, 20, 5.5, 0.8, 0.8, "F");
    doc.roundedRect(roomX + roomWidth - 47, roomY + 1, 46, 5.5, 0.8, 0.8, "F");
    doc.roundedRect(roomX + 1, roomY + 7, 59, 4.5, 0.8, 0.8, "F");
    doc.setGState(new doc.GState({ opacity: 1 }));
    setText(doc, 6.2, [28, 45, 35], "bold");
    doc.text(room.label, roomX + 2, roomY + 6);
    doc.text(`B ${room.width.toFixed(3)} x L ${room.displayLength.toFixed(3)} m`, roomX + roomWidth - 2, roomY + 6, { align: "right" });
    setText(doc, 4.8, [72, 86, 77], "bold");
    doc.text(`${room.grossSlots} brutto - ${room.blockedSlots.length} blokkert = ${room.floorSlots} gulvplasser`, roomX + 2, roomY + 11);

    if (room.extension) {
      const extensionY = toY(room.extension.y, room.extension.length);
      setText(doc, 4.6, [115, 32, 101], "bold");
      doc.text(`Rosa felt - ${room.useLager2Extension ? "inkludert" : "fratrukket"}`, toX(room.x + room.extension.width / 2), extensionY + 14, { align: "center" });
    }
    (room.obstructions || []).forEach((obstruction) => {
      const obstructionY = toY(obstruction.y, obstruction.length);
      const labelY = room.key === "lager1" ? roomY - 1.5 : obstructionY + 14;
      setText(doc, 4.4, [72, 70, 13], "bold");
      doc.text(`${obstruction.label} - ${room.includeMarkedAreas ? "inkludert" : "fratrukket"}`, toX(room.x + obstruction.x + obstruction.width / 2), labelY, { align: "center" });
    });
  });

  setText(doc, 5, colors.muted, "bold");
  doc.text("16 850 mm", toX(8.425), planY + drawingHeight + 4, { align: "center" });
  doc.text("500", toX(17.1), planY + drawingHeight + 4, { align: "center" });
  doc.text("16 850 mm", toX(25.775), planY + drawingHeight + 4, { align: "center" });
  doc.text("Innvendig lagerbredde 34 200 mm", planX + drawingWidth / 2, planY + drawingHeight + 8, { align: "center" });

  const legendY = planY + drawingHeight + 11;
  const legend = [
    ["Container", [231, 238, 233]],
    ["Valgt last", data.selectedLoad.shareKey === "drum" ? colors.amber : data.selectedLoad.shareKey === "kokille" ? [105, 168, 107] : [47, 111, 169]],
    ["Slusefelt", [246, 242, 183]],
    ["Kjøregang", [222, 239, 248]],
    ["Rosa felt", [245, 195, 234]]
  ];
  legend.forEach(([label, color], index) => {
    const legendX = planX + index * (drawingWidth / legend.length);
    doc.setFillColor(...color);
    doc.setDrawColor(...colors.line);
    doc.rect(legendX, legendY - 2.5, 3.5, 2.5, "FD");
    setText(doc, 4.4, colors.muted, "bold");
    doc.text(label, legendX + 4.5, legendY - 0.4);
  });
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

function drawGroupedBarChart(doc, x, y, width, height, title, data, series) {
  setText(doc, 9, colors.ink, "bold");
  doc.text(title, x, y);
  const legendY = y + 5;
  series.forEach((item, index) => {
    const legendX = x + index * 47;
    doc.setFillColor(...item.color);
    doc.rect(legendX, legendY, 4, 2.5, "F");
    setText(doc, 5.8, colors.muted, "bold");
    doc.text(item.label, legendX + 6, legendY + 2.3);
  });

  const chartY = y + 12;
  const chartH = height - 19;
  const maxValue = Math.max(1, ...data.flatMap((item) => series.map((entry) => item[entry.key] || 0)));
  const groupGap = 5;
  const groupWidth = (width - groupGap * (data.length - 1)) / data.length;
  const innerGap = 1.5;
  const barWidth = Math.max(4, (groupWidth - innerGap * (series.length - 1)) / series.length);
  doc.setDrawColor(...colors.line);
  doc.line(x, chartY + chartH, x + width, chartY + chartH);

  data.forEach((item, dataIndex) => {
    const groupX = x + dataIndex * (groupWidth + groupGap);
    series.forEach((entry, seriesIndex) => {
      const value = item[entry.key] || 0;
      const barHeight = (value / maxValue) * (chartH - 10);
      const barX = groupX + seriesIndex * (barWidth + innerGap);
      doc.setFillColor(...entry.color);
      doc.roundedRect(barX, chartY + chartH - barHeight, barWidth, barHeight, 0.8, 0.8, "F");
      setText(doc, 6.2, colors.ink, "bold");
      doc.text(String(value), barX + barWidth / 2, chartY + chartH - barHeight - 1.5, { align: "center" });
    });
    setText(doc, 6.2, colors.muted);
    doc.text(String(item.label), groupX + groupWidth / 2, chartY + chartH + 4, { align: "center" });
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
  doc.text(doc.splitTextToSize(`Lagerforutsetning: arkitektmodell B 34,200 x maks L 34,000 m, tak ${formatMeters(settings.roofHeight, 1)}, veggavstand ${formatMeters(settings.wallClearance, 2)}, avstand til sluser/dører ${formatMeters(settings.doorClearance, 2)}, containermellomrom ${formatMeters(settings.containerGap, 2)}, ${aisleSummary}.`, 273), 12, 175);
  doc.text(`Ved valgt takhøyde: ${stackCount} containere i høyden${Number.isFinite(container.maxCertifiedStackHeight) ? `; registrert sertifisert maksimum er ${container.maxCertifiedStackHeight}` : ""}.`, 12, 184);
  setText(doc, 7, colors.muted);
  doc.text(doc.splitTextToSize("Rapporten er en dimensjons- og kapasitetsstudie. Faktisk stabling, gulvlast, brannkrav, truckadkomst, sikring, løfteredskap og operasjonelle toleranser må prosjekteres og verifiseres separat.", 273), 12, 190);
}

function addAll3DExamplesPages(doc, data, selectedImage, previewImages) {
  const selectedStatus = !data.selectedResult.compatible ? "fail" : data.selectedResult.accessBlocked ? "warn" : "pass";
  const examples = [
    {
      key: "selected",
      label: data.selectedLoad.label,
      status: selectedStatus,
      statusLabel: selectedStatus === "pass" ? "Passer" : selectedStatus === "warn" ? "Innlasting må verifiseres" : "Passer ikke",
      result: data.selectedResult,
      imageData: selectedImage,
      selected: true
    },
    ...previewImages
  ].filter((example, index, rows) => rows.findIndex((candidate) => candidate.label === example.label) === index);
  const pageCount = Math.ceil(examples.length / 3);

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    doc.addPage();
    addPageTitle(
      doc,
      `3D-eksempler fra containerstudien ${pageIndex + 1}/${pageCount}`,
      "Alle registrerte lasttyper vist med faktisk pakkematematikk, orientering og innlastingsstatus"
    );
    const pageExamples = examples.slice(pageIndex * 3, pageIndex * 3 + 3);
    pageExamples.forEach((example, index) => {
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
    doc.text(doc.splitTextToSize("Containeren vises transparent. Lasten er plassert med simulatorens beregnede orientering. Grønn betyr at en registrert åpning kan brukes. Gul betyr at lasten passer innvendig, men åpning eller praktisk innføring må verifiseres. Rød betyr geometrisk konflikt.", 250), 12, 190);
  }
}

function addWarehouseScenarioPage(doc, data, scenario, index) {
  doc.addPage();
  addPageTitle(doc, `Lagerkapittel ${index + 1}/3 - ${scenario.label}`, scenario.subtitle);
  drawArchitecturalPlan(doc, 12, 34, 158, 158, data, scenario);
  const stackCount = getStackCount(data.container, data.settings.roofHeight, data.settings.topClearance);
  drawMetricCard(doc, 178, 37, 50, "Gulvplasser", scenario.totalFloorSlots, `${scenario.totalGrossSlots} brutto - ${scenario.totalBlockedSlots} blokkert`);
  drawMetricCard(doc, 233, 37, 50, "Effektivt areal", `${formatNumber(scenario.totalEffectiveArea, 0)} m2`, "etter felt og kjøregang");
  drawMetricCard(doc, 178, 67, 50, "I høyden", stackCount, `tak ${formatMeters(data.settings.roofHeight, 1)}`);
  drawMetricCard(doc, 233, 67, 50, "Total kapasitet", scenario.totalFloorSlots * stackCount, "gulvplasser x høyde");

  setText(doc, 10, colors.ink, "bold");
  doc.text("Romfordeling", 178, 105);
  scenario.roomModels.forEach((room, roomIndex) => {
    const rowY = 111 + roomIndex * 20;
    doc.setFillColor(...colors.paper);
    doc.setDrawColor(...colors.line);
    doc.roundedRect(178, rowY, 105, 16, 1.5, 1.5, "FD");
    setText(doc, 8, colors.ink, "bold");
    doc.text(room.label, 182, rowY + 6);
    doc.text(`${room.floorSlots} gulvplasser`, 279, rowY + 6, { align: "right" });
    setText(doc, 6.3, colors.muted);
    doc.text(`${room.grossSlots} brutto - ${room.blockedSlots.length} blokkert - ${formatNumber(room.effectiveArea, 0)} m2`, 182, rowY + 12);
  });

  setText(doc, 8, colors.ink, "bold");
  doc.text("Plasseringsforutsetninger", 178, 157);
  setText(doc, 6.5, colors.muted);
  const aisleText = data.settings.reserveAisle
    ? `Sentrert kjøregang ${formatMeters(scenario.transportAisleWidth, 3)} i hvert lager.`
    : "Ingen kjøregang reservert.";
  doc.text(doc.splitTextToSize(`Orientering: ${scenario.containerPlacement.orientation === "rotated" ? "90 grader" : "standard"}. Veggklarering ${formatMeters(data.settings.wallClearance, 2)}, avstand til sluser/dører ${formatMeters(data.settings.doorClearance, 2)} og ${formatMeters(data.settings.containerGap, 2)} mellom containere. ${aisleText}`, 102), 178, 164);
  setText(doc, 6.2, colors.muted);
  doc.text(doc.splitTextToSize("Planen bruker samme rommål, slusegeometri, rosa felt, målsetting og slot-logikk som simulatorens arkitektbaserte plassmodell. Lastsymbolene viser valgt lasttype, ikke en bestilt mengde.", 102), 178, 184);
}

function addWarehouseComparisonPage(doc, data) {
  doc.addPage();
  addPageTitle(doc, "Lagerkapittel - sammenligning og følsomhet", "Kapasitet med og uten rosa felt/slusefelt, samt virkningen av klaringer");
  const scenarios = data.warehouseAnalysis.scenarios;
  scenarios.forEach((scenario, index) => {
    const x = 14 + index * 91;
    drawMetricCard(doc, x, 38, 85, scenario.label, `${scenario.totalFloorSlots} gulvplasser`, `${formatNumber(scenario.totalEffectiveArea, 0)} m2 - ${scenario.totalBlockedSlots} blokkert`);
  });

  drawBarChart(doc, 14, 78, 126, 48, "Gulvplasser ved ulik veggklarering", data.warehouseAnalysis.wallClearanceSeries, colors.cyan);
  drawBarChart(doc, 158, 78, 125, 48, "Gulvplasser ved ulik containeravstand", data.warehouseAnalysis.containerGapSeries, colors.teal);

  setText(doc, 10, colors.ink, "bold");
  doc.text("Hva alternativene betyr", 14, 143);
  const notes = [
    ["Basisareal", "Lager 2 stopper ved 29,000 m. Rosa utvidelse og alle gule slusefelt er fratrukket."],
    ["Rosa felt inkludert", "Lager 2 forlenges til 34,000 m. Forrom/sluse og personsluse er fortsatt fratrukket."],
    ["Alle markerte felt", "Rosa felt og gule slusefelt behandles som tilgjengelig lagerareal. Operativ godkjenning kreves."]
  ];
  notes.forEach(([title, body], index) => {
    const x = 14 + index * 91;
    doc.setFillColor(...colors.paper);
    doc.setDrawColor(...colors.line);
    doc.roundedRect(x, 150, 85, 34, 2, 2, "FD");
    setText(doc, 8, colors.ink, "bold");
    doc.text(title, x + 4, 158);
    setText(doc, 6.4, colors.muted);
    doc.text(doc.splitTextToSize(body, 77), x + 4, 165);
  });
}

function addAisleCapacityPage(doc, data) {
  doc.addPage();
  addPageTitle(doc, "Kapasitetsdiagrammer - avstander og kjøregang", "Antall gulvplasser i arkitektmodellen med rosa felt inkludert og slusefeltene fratrukket");
  const comparisonSeries = [
    { key: "withoutAisle", label: "Uten kjøregang", color: colors.teal },
    { key: "withAisle", label: "Med kjøregang", color: colors.cyan }
  ];
  const gapData = data.warehouseAnalysis.containerGapAisleComparison || [];
  const wallData = data.warehouseAnalysis.wallClearanceAisleComparison || [];
  drawGroupedBarChart(doc, 14, 39, 126, 66, "Containeravstand", gapData, comparisonSeries);
  drawGroupedBarChart(doc, 158, 39, 125, 66, "Avstand fra vegg", wallData, comparisonSeries);

  const selectedGap = gapData.reduce((nearest, item) => (
    !nearest || Math.abs(item.gap - data.settings.containerGap) < Math.abs(nearest.gap - data.settings.containerGap) ? item : nearest
  ), null);
  drawMetricCard(doc, 14, 112, 61, "Valgt containeravstand", formatMeters(data.settings.containerGap, 2), "diagrammet viser nærmeste punkt");
  drawMetricCard(doc, 79, 112, 61, "Kapasitet uten gang", selectedGap?.withoutAisle ?? "-", "gulvplasser ved nærmeste punkt");
  drawMetricCard(doc, 158, 112, 61, "Kapasitet med gang", selectedGap?.withAisle ?? "-", "gulvplasser ved nærmeste punkt");
  drawMetricCard(doc, 223, 112, 60, "Kjøregangsbredde", formatMeters(data.container.width + data.settings.aisleSideClearance * 2, 3), "containerbredde + slingring");

  const drawComparisonTable = (x, title, rows, labelTitle) => {
    setText(doc, 8.5, colors.ink, "bold");
    doc.text(title, x, 148);
    const columns = [
      [labelTitle, x + 3],
      ["Uten", x + 43],
      ["Med", x + 68],
      ["Tap", x + 91],
      ["Tap %", x + 111]
    ];
    doc.setFillColor(...colors.dark);
    doc.roundedRect(x, 152, 126, 9, 1, 1, "F");
    columns.forEach(([label, columnX]) => {
      setText(doc, 6.1, colors.white, "bold");
      doc.text(label, columnX, 158);
    });
    rows.forEach((row, index) => {
      const y = 162 + index * 8;
      const loss = row.withoutAisle - row.withAisle;
      const lossPercent = row.withoutAisle > 0 ? (loss / row.withoutAisle) * 100 : 0;
      doc.setFillColor(...(index % 2 === 0 ? [247, 250, 249] : [239, 245, 243]));
      doc.setDrawColor(...colors.line);
      doc.rect(x, y, 126, 7, "FD");
      setText(doc, 6.2, colors.ink, index === 0 ? "bold" : "normal");
      doc.text(row.label, x + 3, y + 4.8);
      doc.text(String(row.withoutAisle), x + 47, y + 4.8, { align: "right" });
      doc.text(String(row.withAisle), x + 72, y + 4.8, { align: "right" });
      doc.text(String(loss), x + 96, y + 4.8, { align: "right" });
      doc.text(`${formatNumber(lossPercent, 0)} %`, x + 123, y + 4.8, { align: "right" });
    });
  };
  drawComparisonTable(14, "Tallgrunnlag - containeravstand", gapData, "Avstand");
  drawComparisonTable(158, "Tallgrunnlag - veggavstand", wallData, "Avstand");
}

function addStackingPage(doc, data) {
  doc.addPage();
  addPageTitle(doc, "Stabling av lastede containere", "Takhøyde, leverandørgrense, lastet bruttovekt og stacking-test screening");
  const stackData = roofHeightSeries.map((roofHeight) => ({
    label: `${roofHeight} m`,
    value: getStackCount(data.container, roofHeight, data.settings.topClearance)
  }));
  drawBarChart(doc, 14, 39, 155, 55, "Antall containere i høyden ved ulik takhøyde", stackData, colors.teal);

  const selectedStackCount = getStackCount(data.container, data.settings.roofHeight, data.settings.topClearance);
  drawMetricCard(doc, 178, 39, 50, "Valgt takhøyde", formatMeters(data.settings.roofHeight, 1), `toppklaring ${formatMeters(data.settings.topClearance, 2)}`);
  drawMetricCard(doc, 233, 39, 50, "Geometrisk stabel", `${selectedStackCount} høy`, "før lastspesifikk screening");
  drawMetricCard(doc, 178, 69, 50, "Max gross", Number.isFinite(data.container.maxGross) ? `${formatNumber(data.container.maxGross)} kg` : "Ikke oppgitt", "per container");
  drawMetricCard(doc, 233, 69, 50, "Stacking test load", Number.isFinite(getStackingTestLoad(data.container)) ? `${formatNumber(getStackingTestLoad(data.container))} kg` : "Ikke oppgitt", "leverandørens testverdi");

  const columns = [
    ["Last", 14],
    ["Stk/cont.", 73],
    ["Payload", 101],
    ["Bruttovekt", 133],
    ["Tak", 170],
    ["Test-screen", 195],
    ["Resultat", 232]
  ];
  doc.setFillColor(...colors.dark);
  doc.roundedRect(12, 104, 273, 11, 1.5, 1.5, "F");
  columns.forEach(([label, x]) => {
    setText(doc, 6.6, colors.white, "bold");
    doc.text(label, x + 2, 111);
  });

  data.loadRows.forEach((row, index) => {
    const y = 117 + index * 11.5;
    const stack = getLoadedStackScreening(data.container, row, data.settings);
    doc.setFillColor(...(index % 2 === 0 ? [247, 250, 249] : [239, 245, 243]));
    doc.setDrawColor(...colors.line);
    doc.rect(12, y, 273, 10, "FD");
    setText(doc, 6.5, colors.ink, "bold");
    doc.text(row.load.shortLabel || row.load.label, 16, y + 6.5);
    doc.text(`${row.practicalCount}`, 76, y + 6.5);
    doc.text(`${formatNumber(row.loadedPayloadWeight)} kg`, 103, y + 6.5);
    doc.text(`${formatNumber(stack.loadedGrossWeight)} kg`, 135, y + 6.5);
    doc.text(`${stack.roofLimit} høy`, 172, y + 6.5);
    doc.text(Number.isFinite(stack.testLoadLimit) ? `${stack.testLoadLimit} høy` : "-", 198, y + 6.5);
    doc.setTextColor(...(stack.screenedStackHeight > 0 ? colors.green : colors.red));
    doc.text(`${stack.screenedStackHeight} høy`, 234, y + 6.5);
    setText(doc, 5.5, colors.muted);
    doc.text(stack.governing, 252, y + 6.5);
  });

  setText(doc, 6.2, colors.muted);
  doc.text(doc.splitTextToSize("Test-screening er en konservativ sammenligning der stacking-testlasten behandles som samlet last over nederste container: 1 + gulv(testlast / lastet bruttovekt), deretter begrenset av takhøyde og registrert sertifisert maksimum. Dette er ikke en godkjenning av operativ stabling. Underlag, hjørnebeslag, lastfordeling, seismikk, brann og leverandørens stablingsinstruks må verifiseres.", 270), 14, 190);
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

function addLoadWeightAnalysisPage(doc, data) {
  doc.addPage();
  addPageTitle(doc, "Last- og vektanalyse per container", "Geometrisk kapasitet, nyttelast, lastet bruttovekt og tilgjengelig vektmargin");
  drawMetricCard(doc, 14, 37, 62, "Tare weight", Number.isFinite(data.container.tare) ? `${formatNumber(data.container.tare)} kg` : "Ikke oppgitt", "tom container");
  drawMetricCard(doc, 82, 37, 62, "Max payload", Number.isFinite(data.container.payload) ? `${formatNumber(data.container.payload)} kg` : "Ikke oppgitt", "last i container");
  drawMetricCard(doc, 150, 37, 62, "Max gross", Number.isFinite(data.container.maxGross) ? `${formatNumber(data.container.maxGross)} kg` : "Ikke oppgitt", "tare + payload");
  drawMetricCard(doc, 218, 37, 65, "Stacking test load", Number.isFinite(getStackingTestLoad(data.container)) ? `${formatNumber(getStackingTestLoad(data.container))} kg` : "Ikke oppgitt", "testverdi, ikke payload");

  const columns = [
    ["Last", 14],
    ["Geometri", 70],
    ["Praktisk", 99],
    ["kg/stk", 128],
    ["Payload brukt", 156],
    ["Bruttovekt", 194],
    ["Utnyttelse", 229],
    ["Maks kg/stk*", 258]
  ];
  doc.setFillColor(...colors.dark);
  doc.roundedRect(12, 72, 273, 12, 1.5, 1.5, "F");
  columns.forEach(([label, x]) => {
    setText(doc, 6.2, colors.white, "bold");
    doc.text(label, x + 1, 80);
  });

  data.loadRows.forEach((row, index) => {
    const y = 86 + index * 16;
    doc.setFillColor(...(index % 2 === 0 ? [247, 250, 249] : [239, 245, 243]));
    doc.setDrawColor(...colors.line);
    doc.rect(12, y, 273, 14, "FD");
    setText(doc, 7, colors.ink, "bold");
    doc.text(row.load.label, 15, y + 6);
    setText(doc, 5.8, colors.muted);
    doc.text(row.load.dimensions, 15, y + 11);
    const values = [
      [`${row.geometricCount}`, 72],
      [`${row.practicalCount}`, 101],
      [`${formatNumber(row.load.defaultWeight)}`, 130],
      [`${formatNumber(row.loadedPayloadWeight)} kg`, 158],
      [`${formatNumber(row.loadedGrossWeight)} kg`, 196],
      [Number.isFinite(row.payloadUtilization) ? `${formatNumber(row.payloadUtilization, 0)} %` : "-", 231],
      [Number.isFinite(row.maxUnitWeightAtGeometricCount) ? `${formatNumber(row.maxUnitWeightAtGeometricCount)} kg` : "-", 260]
    ];
    values.forEach(([value, x]) => {
      setText(doc, 6.8, colors.ink, "bold");
      doc.text(value, x, y + 8);
    });
  });

  setText(doc, 6.3, colors.muted);
  doc.text(doc.splitTextToSize("* Maks kg/stk er containerens registrerte payload delt på geometrisk antall. Praktisk antall er laveste verdi av geometrisk kapasitet og payloadgrense. Tabellen bruker simulatorens standardvekter; faktisk lastvekt, punktlast, tyngdepunkt og gulvkapasitet skal dokumenteres separat.", 270), 14, 188);
}

function addDrumWeightAnalysisPage(doc, data) {
  const drumRow = data.loadRows.find((row) => row.key === "drum210");
  if (!drumRow) return;
  doc.addPage();
  addPageTitle(doc, "210L tønner - antall og vekt", "Hvor mange tønner som kan lastes ved ulike vekter per tønne");
  const weights = [200, 250, 300, 330, 400, 500, 600, 720, 800, 1000];
  const rows = weights.map((unitWeight) => {
    const payloadLimit = Number.isFinite(data.container.payload) ? Math.floor(data.container.payload / unitWeight) : drumRow.geometricCount;
    const count = Math.max(0, Math.min(drumRow.geometricCount, payloadLimit));
    const payloadWeight = count * unitWeight;
    return {
      label: `${unitWeight} kg`,
      value: count,
      unitWeight,
      payloadLimit,
      count,
      payloadWeight,
      grossWeight: (data.container.tare || 0) + payloadWeight,
      utilization: Number.isFinite(data.container.payload) && data.container.payload > 0 ? payloadWeight / data.container.payload * 100 : null
    };
  });
  drawBarChart(doc, 14, 39, 166, 58, "Antall tønner ved ulik vekt per tønne", rows, colors.amber);
  drawMetricCard(doc, 190, 39, 43, "Geometrisk", drumRow.geometricCount, `${drumRow.result.count}/lag x ${drumRow.verticalLayers} lag`);
  drawMetricCard(doc, 238, 39, 45, "Ved 330 kg", drumRow.practicalCount, `${formatNumber(drumRow.loadedPayloadWeight)} kg payload`);
  drawMetricCard(doc, 190, 69, 43, "Maks snittvekt", Number.isFinite(drumRow.maxUnitWeightAtGeometricCount) ? `${formatNumber(drumRow.maxUnitWeightAtGeometricCount)} kg` : "-", "for fullt geometrisk antall");
  drawMetricCard(doc, 238, 69, 45, "Bruttovekt", `${formatNumber(drumRow.loadedGrossWeight)} kg`, "ved standardvekt 330 kg");

  const columns = [["kg/tønne", 15], ["Geometrisk", 57], ["Payloadgrense", 98], ["Praktisk antall", 145], ["Payload brukt", 190], ["Bruttovekt", 231], ["Utnyttelse", 263]];
  doc.setFillColor(...colors.dark);
  doc.roundedRect(12, 108, 273, 10, 1.5, 1.5, "F");
  columns.forEach(([label, x]) => {
    setText(doc, 6.1, colors.white, "bold");
    doc.text(label, x, 115);
  });
  rows.forEach((row, index) => {
    const y = 120 + index * 6.2;
    doc.setFillColor(...(row.unitWeight === 330 ? [255, 245, 220] : index % 2 === 0 ? [247, 250, 249] : [239, 245, 243]));
    doc.setDrawColor(...colors.line);
    doc.rect(12, y, 273, 5.5, "FD");
    const values = [row.unitWeight, drumRow.geometricCount, row.payloadLimit, row.count, `${formatNumber(row.payloadWeight)} kg`, `${formatNumber(row.grossWeight)} kg`, Number.isFinite(row.utilization) ? `${formatNumber(row.utilization, 0)} %` : "-"];
    const positions = [16, 60, 101, 149, 192, 233, 266];
    values.forEach((value, valueIndex) => {
      setText(doc, 5.8, colors.ink, row.unitWeight === 330 ? "bold" : "normal");
      doc.text(String(value), positions[valueIndex], y + 3.8);
    });
  });

  setText(doc, 6.2, colors.muted);
  doc.text(doc.splitTextToSize("Analysen forutsetter stående 210L tønner, simulatorens kolliavstand og jevn lastfordeling. Den kontrollerer antall og totalvekt, men ikke tønnenes stablingsstyrke, pall, festemidler, lokalt gulvtrykk eller håndteringsutstyr.", 270), 14, 190);
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
    ["Containerstabling", "Antall i høyden styres av takhøyde, sertifisert maksimum og en tydelig merket screening av lastet bruttovekt mot stacking-testlast. Screeningen er ikke en operativ godkjenning."],
    ["Lagerplassering", "Tre arkitektalternativer viser rosa felt og slusefelt inkludert eller fratrukket. Veggavstand, dørklarering, containeravstand og valgfri kjøregang inngår i slot-beregningen. Brannskiller, porter og truckvending må detaljprosjekteres."]
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
  addAll3DExamplesPages(doc, data, imageData, previewImages);
  (data.warehouseAnalysis?.scenarios || []).forEach((scenario, index) => addWarehouseScenarioPage(doc, data, scenario, index));
  if (data.warehouseAnalysis?.scenarios?.length) addWarehouseComparisonPage(doc, data);
  if (data.warehouseAnalysis?.containerGapAisleComparison?.length) addAisleCapacityPage(doc, data);
  addStackingPage(doc, data);
  addLoadMatrixPage(doc, data);
  addLoadWeightAnalysisPage(doc, data);
  addDrumWeightAnalysisPage(doc, data);
  addLoadVisualsPage(doc, data);
  addMethodPage(doc, data);
  addFooters(doc, input.container.specification || "Simulatorberegning");

  const date = new Date().toISOString().slice(0, 10);
  const fileName = `containerstudie-${safeFileName(input.container.shortLabel || input.container.label)}-${date}.pdf`;
  const downloadUrl = URL.createObjectURL(doc.output("blob"));
  doc.save(fileName);
  return { fileName, pages: doc.getNumberOfPages(), downloadUrl };
}
