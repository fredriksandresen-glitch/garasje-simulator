import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  Boxes,
  Gauge,
  HelpCircle,
  Layers,
  Minus,
  Package,
  Plus,
  Ruler,
  RotateCw,
  Scale,
  Settings2,
  Shield,
  Warehouse,
  X
} from "lucide-react";
import "./styles.css";

const Container3DScene = lazy(() => import("./Container3DView.jsx"));

const loadTypes = {
  drum210: {
    label: "210L tønner",
    shortLabel: "210L",
    dimensions: "Ø610 x H877 mm",
    size: { length: 0.61, width: 0.61, height: 0.877 },
    drumEq: 1,
    defaultWeight: 330,
    defaultDose: 0.12,
    packKey: "drum",
    shareKey: "drum"
  },
  steel1: {
    label: "Stålkasse variant 1",
    shortLabel: "V1",
    dimensions: "2.8 x 1.35 x 1.1 m",
    size: { length: 2.8, width: 1.35, height: 1.1 },
    drumEq: 6,
    defaultWeight: 3000,
    defaultDose: 0.35,
    packKey: "steel",
    shareKey: "steel"
  },
  steel2: {
    label: "Stålkasse variant 2",
    shortLabel: "V2",
    dimensions: "2.1 x 1.35 x 1.1 m",
    size: { length: 2.1, width: 1.35, height: 1.1 },
    drumEq: 5,
    defaultWeight: 3000,
    defaultDose: 0.35,
    packKey: "steel",
    shareKey: "steel"
  },
  steel3: {
    label: "Stålkasse variant 3",
    shortLabel: "V3",
    dimensions: "2.1 x 2.7 x 1.1 m",
    size: { length: 2.1, width: 2.7, height: 1.1 },
    drumEq: 8,
    defaultWeight: 3000,
    defaultDose: 0.35,
    packKey: "steel",
    shareKey: "steel"
  },
  steel4: {
    label: "Stålkasse variant 4",
    shortLabel: "V4",
    dimensions: "2.4 x 2.1 x 1.1 m",
    size: { length: 2.4, width: 2.1, height: 1.1 },
    drumEq: 7,
    defaultWeight: 3000,
    defaultDose: 0.35,
    packKey: "steel",
    shareKey: "steel"
  },
  kokille: {
    label: "Kokille",
    shortLabel: "Kokille",
    dimensions: "1.2 x 0.8 x 0.9 m",
    size: { length: 1.2, width: 0.8, height: 0.9 },
    drumEq: 2,
    defaultWeight: 1800,
    defaultDose: 0.8,
    packKey: "kokille",
    shareKey: "kokille"
  }
};

const steelVariantOptions = Object.fromEntries(
  Object.entries(loadTypes)
    .filter(([key]) => key.startsWith("steel"))
    .map(([key, load]) => [key, { label: load.shortLabel }])
);

const containerTypes = {
  iso20: {
    label: "20' ISO",
    shortLabel: "20' ISO",
    length: 6.058,
    width: 2.438,
    height: 2.591,
    usableLength: 5.867,
    usableWidth: 2.350,
    usableHeight: 2.390,
    tare: 2200
  },
  iso10: {
    label: "10' ISO",
    shortLabel: "10' ISO",
    length: 2.991,
    width: 2.438,
    height: 2.591,
    usableLength: 2.831,
    usableWidth: 2.350,
    usableHeight: 2.390,
    tare: 1300
  },
  algeco10htbk2: {
    label: "10' Hard Top BK2",
    shortLabel: "10' HT BK2",
    length: 3.029,
    width: 2.438,
    height: 2.591,
    usableLength: 2.900,
    usableWidth: 2.350,
    usableHeight: 2.251,
    tare: 1350,
    topOpeningWidth: 2.230,
    payloadEstimateMin: 8000,
    payloadEstimateMax: 10000,
    roofIntrusions: [
      { side: "left", width: 0.100, drop: 0.065, offsetFromWall: 0 },
      { side: "right", width: 0.100, drop: 0.065, offsetFromWall: 0 }
    ],
    notes: "Foreløpig modell basert på leverandørtegning. Payload og detaljer må verifiseres mot fabrikkdata."
  },
  hardtop10hhbk2: {
    label: "10' HH Hard Top BK2",
    shortLabel: "10' HH BK2",
    length: 3.029,
    width: 2.438,
    height: 1.450,
    usableLength: 2.900,
    usableWidth: 2.350,
    usableHeight: 1.2225,
    tare: 1350,
    topOpeningWidth: 2.230,
    topOpeningLength: null,
    payloadEstimateMin: 8000,
    payloadEstimateMax: 10000,
    hardTop: true,
    bk2: true,
    roofIntrusions: [
      { side: "left", inwardDepth: 0.100, verticalDrop: 0.065, openingInsetApprox: 0.060, lipDetailApprox: 0.086 },
      { side: "right", inwardDepth: 0.100, verticalDrop: 0.065, openingInsetApprox: 0.060, lipDetailApprox: 0.086 }
    ],
    notes: "Foreløpig modell basert på leverandørtegning. Toppåpningslengde, payload og detaljer må verifiseres mot fabrikkdata."
  },
  hardtop10hh: {
    label: "10' HH Hard Top",
    shortLabel: "10' HH HT",
    length: 2.991,
    width: 2.438,
    height: 1.450,
    usableLength: 2.831,
    usableWidth: 2.350,
    usableHeight: 1.223,
    tare: 1300,
    maxGross: 10000,
    payload: 8700,
    topOpeningLength: 2.713,
    topOpeningWidth: 2.230,
    doorOpeningWidth: 2.340,
    doorOpeningHeight: 0.850,
    hardTop: true,
    halfHeight: true,
    drawingBased: true,
    roofProfile: "hardtop10hh",
    roofIntrusions: [
      { side: "left", inwardDepth: 0.100, verticalDrop: 0.065, openingInsetApprox: 0.060, lipDetailApprox: 0.086, lowerBoxDepth: 0.065 },
      { side: "right", inwardDepth: 0.100, verticalDrop: 0.065, openingInsetApprox: 0.060, lipDetailApprox: 0.086, lowerBoxDepth: 0.065 }
    ],
    notes: "Basert på leverandørens 10ft Half Height Container with hard top GA drawing. Endelige data må verifiseres mot leverandør."
  },
  iso15: {
    label: "15' spesial",
    shortLabel: "15' spesial",
    length: 4.572,
    width: 2.438,
    height: 2.591,
    usableLength: 4.380,
    usableWidth: 2.350,
    usableHeight: 2.390,
    tare: 1700
  },
  iso15hh: {
    label: "15' half-height spesial",
    shortLabel: "15' HH",
    length: 4.572,
    width: 2.438,
    height: 0.990,
    usableLength: 4.380,
    usableWidth: 2.350,
    usableHeight: 0.880,
    tare: 1400
  },
  iso10hh: {
    label: "10' half-height",
    shortLabel: "10' HH",
    length: 2.991,
    width: 2.438,
    height: 0.990,
    usableLength: 2.831,
    usableWidth: 2.350,
    usableHeight: 0.880,
    tare: 1150
  }
};

const containerFamilyOptions = {
  iso10: { label: "10' lengde", regularKey: "iso10", halfKey: "iso10hh" },
  iso15: { label: "15' lengde", regularKey: "iso15", halfKey: "iso15hh" },
  iso20: { label: "20' lengde", regularKey: "iso20", halfKey: null }
};

const optionalConstraints = {
  grossWeight: { label: "Maks bruttovekt per container" },
  dose: { label: "Maks dose per container" },
  trailer: { label: "Maks trailerlast" },
  drumPacking: { label: "Maks 210L per container" },
  steelPacking: { label: "Maks stålkasser per container" },
  kokillePacking: { label: "Maks kokiller per container" }
};

const separatorWidth = 0.5;
const settingsStoragePrefix = "lagerbygg-iii:v1:";

function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const savedValue = window.localStorage.getItem(`${settingsStoragePrefix}${key}`);
      return savedValue === null ? initialValue : JSON.parse(savedValue);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(`${settingsStoragePrefix}${key}`, JSON.stringify(value));
    } catch {
      // Simulatoren skal fortsatt fungere dersom nettleseren blokkerer lokal lagring.
    }
  }, [key, value]);

  return [value, setValue];
}

const rooms = [
  {
    key: "lager1",
    label: "Lager 1",
    x: 0,
    width: 16.85,
    baseLength: 24.115,
    usableLength: 22.015,
    obstructions: [
      { key: "personsluse1", label: "Personsluse 1", x: 16.85 - 4.85, y: 24.115 - 1.8, width: 4.85, length: 1.8, type: "yellow" }
    ]
  },
  {
    key: "lager2",
    label: "Lager 2",
    x: 16.85 + separatorWidth,
    width: 16.85,
    usableLength: 29,
    extendedLength: 34,
    obstructions: [
      { key: "forrom-sluse", label: "Forrom / sluse", x: 0, y: 34 - 11.985, width: 5.15, length: 11.985, type: "yellow" }
    ],
    extension: { key: "rosa-felt", label: "Rosa felt", x: 0, y: 29, width: 16.85, length: 5, type: "pink" }
  }
];

function rectanglesOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.length &&
    a.y + a.length > b.y
  );
}

function rectangleIntersectionArea(a, b) {
  const overlapWidth = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const overlapLength = Math.max(0, Math.min(a.y + a.length, b.y + b.length) - Math.max(a.y, b.y));
  return overlapWidth * overlapLength;
}

function buildRoomSlotGrid({ room, storageLength, containerPlacement, wallClearance, doorClearance, aisleGap, includeMarkedAreas }) {
  const footprint = { length: containerPlacement.length + aisleGap, width: containerPlacement.width + aisleGap };
  const clearWidth = Math.max(0, room.width - wallClearance * 2);
  const clearLength = Math.max(0, storageLength - doorClearance);
  const cols = Math.max(0, Math.floor(clearLength / footprint.length));
  const rows = Math.max(0, Math.floor(clearWidth / footprint.width));
  const slots = [];

  for (let col = 0; col < cols; col += 1) {
    for (let row = 0; row < rows; row += 1) {
      const rectangle = {
        x: wallClearance + row * footprint.width,
        y: wallClearance + col * footprint.length,
        width: containerPlacement.width,
        length: containerPlacement.length
      };
      const blockedBy = (room.obstructions || []).find((obstruction) => rectanglesOverlap(rectangle, obstruction)) || null;
      slots.push({
        key: `${room.key}-${col}-${row}`,
        ...rectangle,
        blockedBy,
        blocked: !includeMarkedAreas && Boolean(blockedBy)
      });
    }
  }

  const clearArea = { x: wallClearance, y: wallClearance, width: clearWidth, length: clearLength };
  const obstructedArea = includeMarkedAreas
    ? 0
    : (room.obstructions || []).reduce((sum, obstruction) => sum + rectangleIntersectionArea(clearArea, obstruction), 0);

  return { slots, cols, rows, clearWidth, clearLength, effectiveArea: Math.max(0, clearWidth * clearLength - obstructedArea) };
}

function App() {
  const [planningMode, setPlanningMode] = usePersistentState("planningMode", "scenario");
  const [heightLimit, setHeightLimit] = usePersistentState("heightLimit", 6.3);
  const [stackLimit, setStackLimit] = usePersistentState("stackLimit", 4);
  const [halfHeightStackLimit, setHalfHeightStackLimit] = usePersistentState("halfHeightStackLimit", 6);
  const [wallClearance, setWallClearance] = usePersistentState("wallClearance", 0.5);
  const [doorClearance, setDoorClearance] = usePersistentState("doorClearance", 0.9);
  const [aisleGap, setAisleGap] = usePersistentState("aisleGap", 0.8);
  const [useLager2Extension, setUseLager2Extension] = usePersistentState("useLager2Extension", true);
  const [includeMarkedAreas, setIncludeMarkedAreas] = usePersistentState("includeMarkedAreas", false);
  const [containerType, setContainerType] = usePersistentState("containerType", "iso15");
  const [rotateContainers, setRotateContainers] = usePersistentState("rotateContainers", false);
  const [containerGrossLimit, setContainerGrossLimit] = usePersistentState("containerGrossLimit", 24000);
  const [containerDoseLimit, setContainerDoseLimit] = usePersistentState("containerDoseLimit", 2);
  const [trailerLimit, setTrailerLimit] = usePersistentState("trailerLimit", 30000);
  const [selectedSteelVariant, setSelectedSteelVariant] = usePersistentState("selectedSteelVariant", "steel1");
  const [rotateSteelBoxes, setRotateSteelBoxes] = usePersistentState("rotateSteelBoxes", false);
  const [optimizeSteelOrientation, setOptimizeSteelOrientation] = usePersistentState("optimizeSteelOrientation", true);
  const [drumPackLimit, setDrumPackLimit] = usePersistentState("drumPackLimit", 12);
  const [steelPackLimit, setSteelPackLimit] = usePersistentState("steelPackLimit", 1);
  const [kokillePackLimit, setKokillePackLimit] = usePersistentState("kokillePackLimit", 4);
  const [existingDrumEq, setExistingDrumEq] = usePersistentState("existingDrumEq", 582);
  const [annualDrumEq, setAnnualDrumEq] = usePersistentState("annualDrumEq", 200);
  const [years, setYears] = usePersistentState("years", 19);
  const [drumShare, setDrumShare] = usePersistentState("drumShare", 68);
  const [steelShare, setSteelShare] = usePersistentState("steelShare", 31);
  const [kokilleSharePct, setKokilleSharePct] = usePersistentState("kokilleSharePct", 1);
  const [drumWeight, setDrumWeight] = usePersistentState("drumWeight", 330);
  const [steelWeight, setSteelWeight] = usePersistentState("steelWeight", 3000);
  const [kokilleWeight, setKokilleWeight] = usePersistentState("kokilleWeight", 1800);
  const [drumDose, setDrumDose] = usePersistentState("drumDose", 0.12);
  const [steelDose, setSteelDose] = usePersistentState("steelDose", 0.35);
  const [kokilleDose, setKokilleDose] = usePersistentState("kokilleDose", 0.8);
  const [customLoads, setCustomLoads] = usePersistentState("customLoads", { drum210: 0, steel1: 100, steel2: 20, steel3: 0, steel4: 0, kokille: 0 });
  const [activeConstraints, setActiveConstraints] = usePersistentState("activeConstraints", []);
  const [showConstraintMenu, setShowConstraintMenu] = useState(false);

  const model = useMemo(() => {
    const containerFamily = containerFamilyOptions[containerType];
    const container = containerTypes[containerFamily.regularKey];
    const halfContainer = containerFamily.halfKey ? containerTypes[containerFamily.halfKey] : null;
    const containerPlacement = rotateContainers
      ? { length: container.width, width: container.length }
      : { length: container.length, width: container.width };
    const maxLevelsForHeight = Math.max(1, Math.floor(heightLimit / container.height));
    const levels = Math.max(1, Math.min(stackLimit, maxLevelsForHeight));
    const maxHalfLevelsForHeight = halfContainer ? Math.max(1, Math.floor(heightLimit / halfContainer.height)) : 0;
    const halfLevels = halfContainer ? Math.max(1, Math.min(halfHeightStackLimit, maxHalfLevelsForHeight)) : 0;
    const planWidth = 16.85 * 2 + separatorWidth;
    const planLength = 34;

    const roomModels = rooms.map((room) => {
      const storageLength = room.key === "lager2" && useLager2Extension ? room.extendedLength : room.usableLength;
      const displayLength = room.key === "lager1" ? room.baseLength : room.extendedLength;
      const grid = buildRoomSlotGrid({ room, storageLength, containerPlacement, wallClearance, doorClearance, aisleGap, includeMarkedAreas });
      const blockedSlots = grid.slots.filter((slot) => slot.blocked);
      const availableSlots = grid.slots.filter((slot) => !slot.blocked);
      const floorSlots = availableSlots.length;
      return {
        ...room,
        storageLength,
        displayLength,
        cols: grid.cols,
        rows: grid.rows,
        geometricSlots: grid.slots,
        grossSlots: grid.slots.length,
        blockedSlots,
        availableSlots,
        floorSlots,
        totalSlots: floorSlots,
        wallClearance,
        doorClearance,
        includeMarkedAreas,
        useLager2Extension,
        effectiveArea: grid.effectiveArea,
        leftPct: (room.x / planWidth) * 100,
        topPct: ((planLength - displayLength) / planLength) * 100,
        widthPct: (room.width / planWidth) * 100,
        heightPct: (displayLength / planLength) * 100
      };
    });

    const totalFloorSlots = roomModels.reduce((sum, room) => sum + room.floorSlots, 0);
    const totalFootprintArea = roomModels.reduce((sum, room) => sum + room.effectiveArea, 0);
    const shareTotal = drumShare + steelShare + kokilleSharePct;
    const scenarioNeed = existingDrumEq + annualDrumEq * years;
    const customNeed = Object.entries(customLoads).reduce((sum, [key, quantity]) => sum + quantity * loadTypes[key].drumEq, 0);
    const totalNeed = planningMode === "custom" ? customNeed : scenarioNeed;
    const weights = { drum210: drumWeight, steel1: steelWeight, steel2: steelWeight, steel3: steelWeight, steel4: steelWeight, kokille: kokilleWeight };
    const doses = { drum210: drumDose, steel1: steelDose, steel2: steelDose, steel3: steelDose, steel4: steelDose, kokille: kokilleDose };
    const packLimits = { drum: drumPackLimit, steel: steelPackLimit, kokille: kokillePackLimit };

    const loadRows = Object.entries(loadTypes).map(([key, load]) => {
      const packageWeight = weights[key];
      const packageDose = doses[key];
      const orientationMode = load.shareKey === "steel"
        ? optimizeSteelOrientation ? "auto" : rotateSteelBoxes ? "rotated" : "straight"
        : "auto";
      const evaluateOption = (candidate, heightKind, stackLevels) => {
        const fit = getFit(candidate, load.size, orientationMode);
        const physicalPackLimit = Number.isFinite(fit.physicalCount) ? fit.physicalCount : packLimits[load.packKey];
        const packingConstraintKey = `${load.packKey}Packing`;
        const usePackingLimit = planningMode === "scenario" || activeConstraints.includes(packingConstraintKey);
        const useWeightLimit = planningMode === "scenario" || activeConstraints.includes("grossWeight");
        const useDoseLimit = planningMode === "scenario" || activeConstraints.includes("dose");
        const packingLimited = fit.compatible ? Math.min(usePackingLimit ? packLimits[load.packKey] : physicalPackLimit, physicalPackLimit) : 0;
        const weightLimited = useWeightLimit
          ? Math.max(0, Math.floor((containerGrossLimit - candidate.tare) / Math.max(1, packageWeight)))
          : Infinity;
        const doseLimited = useDoseLimit
          ? Math.max(0, Math.floor(containerDoseLimit / Math.max(0.01, packageDose)))
          : Infinity;
        const perContainer = Math.max(0, Math.min(packingLimited, weightLimited, doseLimited));
        let limiting = getLimitingConstraint({ fit, packingLimited, weightLimited, doseLimited, perContainer });
        if (planningMode === "custom" && !usePackingLimit && limiting.key === "packing") {
          limiting = { key: "packing", label: "Fysisk kapasitet", hint: "Bestemt av innvendige mål og orientering" };
        }
        const packageVolume = load.size.length * load.size.width * load.size.height;
        const usableVolume = candidate.usableLength * candidate.usableWidth * candidate.usableHeight;
        return {
          container: candidate,
          heightKind,
          stackLevels,
          fit,
          packingLimited,
          weightLimited,
          doseLimited,
          perContainer,
          limiting,
          floorEfficiency: perContainer * stackLevels * load.drumEq,
          volumeEfficiency: usableVolume > 0 ? (perContainer * packageVolume) / usableVolume : 0
        };
      };
      const options = [evaluateOption(container, "regular", levels)];
      if (halfContainer) options.push(evaluateOption(halfContainer, "half", halfLevels));
      const selectedOption = options.sort((a, b) =>
        b.floorEfficiency - a.floorEfficiency || b.volumeEfficiency - a.volumeEfficiency
      )[0];
      const { fit, packingLimited, weightLimited, doseLimited, perContainer, limiting } = selectedOption;
      const share = planningMode === "custom" ? 0 :
        load.shareKey === "drum" ? drumShare / 100 :
        load.shareKey === "kokille" ? kokilleSharePct / 100 :
        key === selectedSteelVariant ? steelShare / 100 : 0;
      const packagesNeeded = planningMode === "custom" ? customLoads[key] : (totalNeed * share) / load.drumEq;
      const requestedDrumEq = packagesNeeded * load.drumEq;
      const containersNeeded = packagesNeeded === 0 ? 0 : perContainer > 0 ? Math.ceil(packagesNeeded / perContainer) : Infinity;
      const floorSlotsNeeded = containersNeeded === 0 ? 0 : Number.isFinite(containersNeeded) ? Math.ceil(containersNeeded / selectedOption.stackLevels) : Infinity;
      const loadedWeight = selectedOption.container.tare + perContainer * packageWeight;
      const loadedDose = perContainer * packageDose;
      const useTrailerLimit = planningMode === "scenario" || activeConstraints.includes("trailer");
      const containersPerTrailer = useTrailerLimit ? Math.max(0, Math.floor(trailerLimit / Math.max(1, loadedWeight))) : null;
      return {
        key,
        ...load,
        selected: planningMode === "custom" ? packagesNeeded > 0 : key === selectedSteelVariant || load.shareKey !== "steel",
        packageWeight,
        packageDose,
        fit,
        packingLimited,
        weightLimited,
        doseLimited,
        perContainer,
        limiting,
        requestedDrumEq,
        packagesNeeded,
        containersNeeded,
        floorSlotsNeeded,
        containerChoice: selectedOption.container,
        heightKind: selectedOption.heightKind,
        stackLevels: selectedOption.stackLevels,
        floorEfficiency: selectedOption.floorEfficiency,
        volumeEfficiency: selectedOption.volumeEfficiency,
        loadedWeight,
        loadedDose,
        containersPerTrailer,
        capacityDrumEq: totalFloorSlots * selectedOption.floorEfficiency
      };
    });

    const scenarioRows = loadRows.filter((row) => row.requestedDrumEq > 0);
    const requiredContainers = scenarioRows.reduce((sum, row) => sum + row.containersNeeded, 0);
    const requiredFloorSlots = scenarioRows.reduce((sum, row) => sum + row.floorSlotsNeeded, 0);
    const visualQueue = buildFloorStackQueue(scenarioRows, totalFloorSlots);
    let visualOffset = 0;
    const visualRoomModels = roomModels.map((room) => {
      const { slots, nextOffset } = buildRoomVisualSlots({
        room,
        container,
        containerRotated: rotateContainers,
        visualQueue,
        offset: visualOffset
      });
      visualOffset = nextOffset;
      return { ...room, visualSlots: slots };
    });
    const limitingCounts = scenarioRows.reduce((counts, row) => {
      counts[row.limiting.key] = (counts[row.limiting.key] || 0) + 1;
      return counts;
    }, {});
    const dominantLimit = Object.entries(limitingCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "none";

    return {
      planningMode,
      container,
      halfContainer,
      containerPlacement,
      containerRotated: rotateContainers,
      levels,
      halfLevels,
      maxLevelsForHeight,
      maxHalfLevelsForHeight,
      planWidth,
      planLength,
      roomModels: visualRoomModels,
      totalContainerSlots: totalFloorSlots,
      totalFloorSlots,
      totalFootprintArea,
      totalNeed,
      shareTotal,
      loadRows,
      scenarioRows,
      requiredContainers,
      requiredFloorSlots,
      dominantLimit,
      mixedCoverage: totalFloorSlots / Math.max(1, requiredFloorSlots)
    };
  }, [
    heightLimit,
    stackLimit,
    halfHeightStackLimit,
    planningMode,
    customLoads,
    activeConstraints,
    wallClearance,
    doorClearance,
    aisleGap,
    useLager2Extension,
    includeMarkedAreas,
    containerType,
    rotateContainers,
    containerGrossLimit,
    containerDoseLimit,
    trailerLimit,
    selectedSteelVariant,
    rotateSteelBoxes,
    optimizeSteelOrientation,
    drumPackLimit,
    steelPackLimit,
    kokillePackLimit,
    existingDrumEq,
    annualDrumEq,
    years,
    drumShare,
    steelShare,
    kokilleSharePct,
    drumWeight,
    steelWeight,
    kokilleWeight,
    drumDose,
    steelDose,
    kokilleDose
  ]);

  const warnings = buildWarnings({ model, planningMode, stackLimit, halfHeightStackLimit, drumWeight, steelWeight });
  const activeFamily = containerFamilyOptions[containerType];
  const activeContainer = containerTypes[activeFamily.regularKey];
  const activeHalfContainer = activeFamily.halfKey ? containerTypes[activeFamily.halfKey] : null;
  const maxStackLevel = Math.max(1, Math.floor(heightLimit / activeContainer.height));
  const maxHalfStackLevel = activeHalfContainer ? Math.max(1, Math.floor(heightLimit / activeHalfContainer.height)) : 0;
  const regularStackCount = Math.max(1, Math.floor(heightLimit / activeContainer.height));
  const halfHeightStackCount = activeHalfContainer ? Math.max(1, Math.floor(heightLimit / activeHalfContainer.height)) : 0;
  const clampedStackLimit = Math.min(stackLimit, maxStackLevel);
  const clampedHalfHeightStackLimit = activeHalfContainer ? Math.min(halfHeightStackLimit, maxHalfStackLevel) : 0;
  const selectedSteel = loadTypes[selectedSteelVariant];
  const selectedSteelRow = model.loadRows.find((row) => row.key === selectedSteelVariant);
  const selectedSteelContainer = selectedSteelRow?.containerChoice || activeContainer;
  const standardSteelFit = getFit(selectedSteelContainer, selectedSteel.size, "straight");
  const rotatedSteelFit = getFit(selectedSteelContainer, selectedSteel.size, "rotated");
  const activeSteelRows = model.loadRows.filter((row) =>
    row.shareKey === "steel" && (planningMode === "scenario" ? row.key === selectedSteelVariant : customLoads[row.key] > 0)
  );
  const customPackageCount = Object.values(customLoads).reduce((sum, quantity) => sum + quantity, 0);
  const setCustomLoad = (key, value) => setCustomLoads((current) => ({ ...current, [key]: Math.max(0, Math.round(value)) }));
  const addConstraint = (key) => {
    setActiveConstraints((current) => current.includes(key) ? current : [...current, key]);
    setShowConstraintMenu(false);
  };
  const removeConstraint = (key) => setActiveConstraints((current) => current.filter((item) => item !== key));
  const setManualSteelRotation = (value) => {
    setOptimizeSteelOrientation(false);
    setRotateSteelBoxes(value);
  };

  return (
    <main className="app-shell">
      <section className="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">Lagerbygg III</p>
            <h1>Radioaktivt avfall: lager- og containersimulator</h1>
          </div>
          {planningMode !== "study" && <div className={model.mixedCoverage >= 1 ? "score good" : "score warn"}>
            <div className="score-label">
              {planningMode === "custom" ? "Lastdekning" : "Scenario dekning"}
              <span className="info-dot" tabIndex="0">
                <HelpCircle size={15} />
                <span className="tooltip">Viser beregnede gulvplasser delt på nødvendige gulvplasser etter stabling. 100% betyr at scenarioet akkurat får plass.</span>
              </span>
            </div>
            <div className="score-value"><Gauge size={20} /><span>{Math.round(model.mixedCoverage * 100)}%</span></div>
          </div>}
        </header>

        <nav className="mode-tabs" aria-label="Planleggingsmodus">
          <button type="button" className={planningMode === "scenario" ? "active" : ""} onClick={() => setPlanningMode("scenario")}>Scenario</button>
          <button type="button" className={planningMode === "custom" ? "active" : ""} onClick={() => setPlanningMode("custom")}>Fri lastkombinasjon</button>
          <button type="button" className={planningMode === "study" ? "active" : ""} onClick={() => setPlanningMode("study")}>Containerstudie</button>
        </nav>

        {planningMode === "study" ? <ContainerStudy /> : <>
        <section className="summary-grid">
          <SummaryCard icon={<Warehouse />} label="Lagerkapasitet" value={model.totalFloorSlots} unit="gulvplasser" />
          <SummaryCard icon={<Boxes />} label="Blandet behov" value={model.requiredFloorSlots} unit="gulvplasser" />
          <SummaryCard icon={<Package />} label={planningMode === "custom" ? "Valgt last" : "Scenario"} value={planningMode === "custom" ? customPackageCount : model.totalNeed} unit={planningMode === "custom" ? "kolli" : "drum eq."} />
          <SummaryCard icon={<Layers />} label="Stablehøyde" value={model.levels} unit="nivåer" />
        </section>

        <div className="workspace">
          <aside className="controls" aria-label="Simuleringsparametere">
            <PanelTitle icon={<Settings2 />} title="Bygg og logistikk" />
            <Slider label="Fri stablehøyde" value={heightLimit} min={4.5} max={10} step={0.1} unit="m" onChange={setHeightLimit} />
            <div className="container-note">
              Ved {formatNumber(heightLimit)} m fri høyde: {regularStackCount} normale containere{activeHalfContainer ? ` eller ${halfHeightStackCount} half-height-containere` : ""} i høyden.
            </div>
            <Slider label="Maks nivåer, normal høyde" value={clampedStackLimit} min={1} max={maxStackLevel} step={1} unit="stk" onChange={setStackLimit} />
            {activeHalfContainer ? (
              <Slider label="Maks nivåer, half-height" value={clampedHalfHeightStackLimit} min={1} max={maxHalfStackLevel} step={1} unit="stk" onChange={setHalfHeightStackLimit} />
            ) : (
              <div className="container-note">20' half-height er ikke aktivert fordi verifiserte dimensjonsdata mangler.</div>
            )}
            <Slider label="Avstand til personsluser/dører" value={doorClearance} min={0.3} max={2} step={0.1} unit="m" onChange={setDoorClearance} />
            <Slider label="Gang/luft mellom containere" value={aisleGap} min={0.1} max={2.5} step={0.1} unit="m" onChange={setAisleGap} />
            <Slider label="Veggklarering" value={wallClearance} min={0} max={1.5} step={0.1} unit="m" onChange={setWallClearance} />
            <Toggle label="Ta med rosa felt i Lager 2" checked={useLager2Extension} onChange={setUseLager2Extension} />
            <Toggle label="Ta med gule slusefelt som lagerareal" checked={includeMarkedAreas} onChange={setIncludeMarkedAreas} />

            <PanelTitle icon={<Shield />} title="Container og grenser" />
            <Segmented options={containerFamilyOptions} value={containerType} onChange={(nextType) => {
              const nextFamily = containerFamilyOptions[nextType];
              const nextRegular = containerTypes[nextFamily.regularKey];
              const nextHalf = nextFamily.halfKey ? containerTypes[nextFamily.halfKey] : null;
              const nextMax = Math.max(1, Math.floor(heightLimit / nextRegular.height));
              setContainerType(nextType);
              setStackLimit((current) => Math.min(current, nextMax));
              if (nextHalf) {
                const nextHalfMax = Math.max(1, Math.floor(heightLimit / nextHalf.height));
                setHalfHeightStackLimit((current) => Math.min(current, nextHalfMax));
              }
            }} />
            <div className="container-note">
              Én valgt lengde betyr ett kranhode. Simulatoren velger automatisk normal eller half-height for hver avfallstype etter kapasitet per gulvplass.
            </div>
            <Toggle label="Roter containere 90° i lageret" checked={rotateContainers} onChange={setRotateContainers} />
            {planningMode === "scenario" && <>
              <Slider label="Maks container bruttovekt" value={containerGrossLimit} min={3000} max={30000} step={500} unit="kg" onChange={setContainerGrossLimit} />
              <Slider label="Maks trailerlast" value={trailerLimit} min={8000} max={50000} step={1000} unit="kg" onChange={setTrailerLimit} />
              <Slider label="Maks dose per container" value={containerDoseLimit} min={0.2} max={10} step={0.1} unit="mSv/h" onChange={setContainerDoseLimit} />
            </>}
            <div className="container-note">
              <div><strong>Normal:</strong> utvendig {model.container.length.toFixed(2)} × {model.container.width.toFixed(2)} × {model.container.height.toFixed(2)} m · innvendig {model.container.usableLength.toFixed(2)} × {model.container.usableWidth.toFixed(2)} × {model.container.usableHeight.toFixed(2)} m</div>
              {model.halfContainer && <div><strong>Half-height:</strong> utvendig {model.halfContainer.length.toFixed(2)} × {model.halfContainer.width.toFixed(2)} × {model.halfContainer.height.toFixed(2)} m · innvendig {model.halfContainer.usableLength.toFixed(2)} × {model.halfContainer.usableWidth.toFixed(2)} × {model.halfContainer.usableHeight.toFixed(2)} m</div>}
              <div>Plassert fotavtrykk: {model.containerPlacement.length.toFixed(2)} × {model.containerPlacement.width.toFixed(2)} m ({model.containerRotated ? "90°" : "standard"})</div>
            </div>

            {planningMode === "scenario" ? <>
              <PanelTitle icon={<Package />} title="Pakkemønster" />
              <Slider label="Maks 210L per container" value={drumPackLimit} min={1} max={24} step={1} unit="stk" onChange={setDrumPackLimit} />
              <Slider label="Maks stålkasser per container" value={steelPackLimit} min={1} max={4} step={1} unit="stk" onChange={setSteelPackLimit} />
              <Slider label="Maks kokiller per container" value={kokillePackLimit} min={1} max={8} step={1} unit="stk" onChange={setKokillePackLimit} />

              <PanelTitle icon={<Ruler />} title="Behovsscenario" />
              <Slider label="Eksisterende beholdning" value={existingDrumEq} min={0} max={1500} step={10} unit="drum eq." onChange={setExistingDrumEq} />
              <Slider label="Årlig tilvekst" value={annualDrumEq} min={50} max={300} step={5} unit="drum eq." onChange={setAnnualDrumEq} />
              <Slider label="År" value={years} min={5} max={25} step={1} unit="år" onChange={setYears} />
              <Slider label="Andel 210L" value={drumShare} min={0} max={100} step={1} unit="%" onChange={setDrumShare} />
              <Slider label="Andel stålkasser" value={steelShare} min={0} max={100} step={1} unit="%" onChange={setSteelShare} />
              <Segmented options={steelVariantOptions} value={selectedSteelVariant} onChange={setSelectedSteelVariant} />
              <button className={`optimize-button ${optimizeSteelOrientation ? "active" : ""}`} type="button" onClick={() => setOptimizeSteelOrientation(true)}><RotateCw size={17} />Optimaliser stålkasser i valgt container</button>
              <Toggle label="Bruk 90° manuelt" checked={!optimizeSteelOrientation && rotateSteelBoxes} onChange={setManualSteelRotation} />
              <div className="container-note">
                Fysisk kapasitet for {selectedSteel.shortLabel} i {selectedSteelContainer.shortLabel}: standard {standardSteelFit.physicalCount} stk · 90° {rotatedSteelFit.physicalCount} stk. {optimizeSteelOrientation ? `Valgt automatisk: ${selectedSteelRow?.fit.orientation === "rotated" ? "90°" : "standard"}.` : `Valgt manuelt: ${rotateSteelBoxes ? "90°" : "standard"}.`} Maksgrense: {steelPackLimit} stk.
              </div>
              <Slider label="Andel kokiller" value={kokilleSharePct} min={0} max={100} step={1} unit="%" onChange={setKokilleSharePct} />
              <div className={model.shareTotal === 100 ? "derived" : "derived warning-text"}>Sum andeler: {model.shareTotal.toFixed(0)}%</div>
            </> : <>
              <PanelTitle icon={<Package />} title="Legg til last" />
              <div className="load-builder">
                {Object.entries(loadTypes).map(([key, load]) => (
                  <QuantityControl key={key} label={load.label} detail={load.dimensions} value={customLoads[key]} onChange={(value) => setCustomLoad(key, value)} />
                ))}
              </div>
              <button className={`optimize-button ${optimizeSteelOrientation ? "active" : ""}`} type="button" onClick={() => setOptimizeSteelOrientation(true)}><RotateCw size={17} />Optimaliser stålkasser i valgt container</button>
              <Toggle label="Bruk 90° manuelt" checked={!optimizeSteelOrientation && rotateSteelBoxes} onChange={setManualSteelRotation} />
              <div className="container-note">
                {optimizeSteelOrientation
                  ? activeSteelRows.length > 0
                    ? activeSteelRows.map((row) => `${row.shortLabel} i ${row.containerChoice.shortLabel}: ${row.fit.orientation === "rotated" ? "90°" : "standard"}, ${row.fit.physicalCount} stk`).join(" · ")
                    : "Legg til en stålkassevariant. Simulatoren tester standard og 90° og velger retningen med flest plasser."
                  : `Manuell retning brukes for alle stålkasser: ${rotateSteelBoxes ? "90°" : "standard"}.`}
              </div>

              <PanelTitle icon={<Shield />} title="Valgte begrensninger" />
              <div className="constraint-builder">
                {activeConstraints.length === 0 && <div className="container-note">Ingen valgfrie begrensninger er lagt til. Fysiske mål og fri stablehøyde gjelder fortsatt.</div>}
                {activeConstraints.map((key) => (
                  <ActiveConstraint key={key} constraintKey={key} onRemove={() => removeConstraint(key)} values={{ containerGrossLimit, containerDoseLimit, trailerLimit, drumPackLimit, steelPackLimit, kokillePackLimit }} setters={{ setContainerGrossLimit, setContainerDoseLimit, setTrailerLimit, setDrumPackLimit, setSteelPackLimit, setKokillePackLimit }} />
                ))}
                <button className="add-constraint" type="button" onClick={() => setShowConstraintMenu((current) => !current)}><Plus size={17} />Legg til begrensning</button>
                {showConstraintMenu && <div className="constraint-menu">
                  {Object.entries(optionalConstraints).filter(([key]) => !activeConstraints.includes(key)).map(([key, item]) => <button type="button" key={key} onClick={() => addConstraint(key)}>{item.label}</button>)}
                </div>}
              </div>
            </>}

            <PanelTitle icon={<Scale />} title="Lastdata" />
            <Slider label="Tønnevekt" value={drumWeight} min={50} max={700} step={5} unit="kg" onChange={setDrumWeight} />
            <Slider label="Stålkassevekt" value={steelWeight} min={500} max={4000} step={25} unit="kg" onChange={setSteelWeight} />
            <Slider label="Kokillevekt" value={kokilleWeight} min={200} max={5000} step={50} unit="kg" onChange={setKokilleWeight} />
            <Slider label="Dose per tønne" value={drumDose} min={0.01} max={3} step={0.01} unit="mSv/h" onChange={setDrumDose} />
            <Slider label="Dose per stålkasse" value={steelDose} min={0.01} max={8} step={0.05} unit="mSv/h" onChange={setSteelDose} />
            <Slider label="Dose per kokille" value={kokilleDose} min={0.01} max={8} step={0.05} unit="mSv/h" onChange={setKokilleDose} />
          </aside>

          <section className="stage" aria-label="Lageroversikt">
            <div className="stage-header">
              <div>
                <h2>Arkitektbasert plassmodell</h2>
                <p>Felles målestokk: total bredde {model.planWidth.toFixed(2)} m, visningslengde {model.planLength.toFixed(2)} m, stablehøyde {formatNumber(model.levels * model.container.height)} m.</p>
              </div>
              <div className="capacity-pill">{formatNumber(model.totalFootprintArea)} m² effektivt areal</div>
            </div>
            <ArchitecturalPlan model={model} includeMarkedAreas={includeMarkedAreas} useLager2Extension={useLager2Extension} />
            <ConstraintPanel model={model} />
            <div className="results-table">
              <div className="table-row table-head">
                <span>Lasttype</span>
                <span>Passer i valgt container</span>
                <span>Begrensning</span>
                <span>Per container</span>
                <span>Last / trailer</span>
              </div>
              {model.loadRows.map((row) => (
                <div className={`table-row ${row.fit.compatible ? "" : "incompatible"} ${row.selected ? "selected-row" : ""}`} key={row.key}>
                  <span><strong>{row.label}</strong><small>{row.dimensions}{row.selected ? (planningMode === "custom" ? " · lagt til" : " · med i scenario") : ""} · valgt {row.containerChoice.shortLabel}</small></span>
                  <span>{row.fit.compatible ? "Ja" : "Nei"}<small>{row.fit.reason}</small></span>
                  <span><Badge type={row.limiting.key}>{row.limiting.label}</Badge><small>{row.limiting.hint}</small></span>
                  <span>{row.perContainer} stk<small>Vekt {formatLimit(row.weightLimited)} · dose {formatLimit(row.doseLimited)} · mønster {row.packingLimited} · {row.stackLevels} nivåer</small></span>
                  <span>{formatNumber(row.loadedWeight)} kg{row.containersPerTrailer === null ? "" : ` / ${row.containersPerTrailer} cont.`}<small>{formatNumber(row.loadedDose)} mSv/h · behov {formatNumber(row.containersNeeded)} cont.</small></span>
                </div>
              ))}
            </div>
            <section className="warnings" aria-label="Begrensninger">{warnings.map((warning) => <div className={`warning ${warning.level}`} key={warning.text}><AlertTriangle size={17} /><span>{warning.text}</span></div>)}</section>
          </section>
        </div>
        </>}
      </section>
    </main>
  );
}

const studyContainerOptions = {
  iso10: containerTypes.iso10,
  algeco10htbk2: containerTypes.algeco10htbk2,
  iso10hh: containerTypes.iso10hh,
  hardtop10hh: containerTypes.hardtop10hh,
  hardtop10hhbk2: containerTypes.hardtop10hhbk2,
  iso15: containerTypes.iso15,
  iso15hh: containerTypes.iso15hh,
  iso20: containerTypes.iso20
};

const customStudyContainerDefaults = {
  usableLength: 4.38,
  usableWidth: 2.35,
  usableHeight: 2.39
};

const studyOrientationOptions = {
  auto: { label: "Auto" },
  straight: { label: "Standard" },
  rotated: { label: "90° rotert" }
};

function normalizeStudyDimension(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : fallback;
}

function buildCustomStudyContainer(customContainer) {
  const usableLength = normalizeStudyDimension(customContainer.usableLength, customStudyContainerDefaults.usableLength);
  const usableWidth = normalizeStudyDimension(customContainer.usableWidth, customStudyContainerDefaults.usableWidth);
  const usableHeight = normalizeStudyDimension(customContainer.usableHeight, customStudyContainerDefaults.usableHeight);

  return {
    label: "Egendefinert container",
    shortLabel: "Custom",
    length: usableLength,
    width: usableWidth,
    height: usableHeight,
    usableLength,
    usableWidth,
    usableHeight,
    tare: 0
  };
}

function evaluatePackingOrientation(container, load, orientation, spacing) {
  const itemLength = orientation === "rotated" ? load.size.width : load.size.length;
  const itemWidth = orientation === "rotated" ? load.size.length : load.size.width;
  const itemHeight = load.size.height;
  const rows = Math.max(0, Math.floor((container.usableLength + spacing) / (itemLength + spacing)));
  const cols = Math.max(0, Math.floor((container.usableWidth + spacing) / (itemWidth + spacing)));
  const heightFits = itemHeight <= container.usableHeight;
  const count = heightFits ? rows * cols : 0;
  const usedLength = rows > 0 ? rows * itemLength + Math.max(0, rows - 1) * spacing : itemLength;
  const usedWidth = cols > 0 ? cols * itemWidth + Math.max(0, cols - 1) * spacing : itemWidth;
  const clearanceLength = container.usableLength - usedLength;
  const clearanceWidth = container.usableWidth - usedWidth;
  const clearanceHeight = container.usableHeight - itemHeight;

  return {
    orientation,
    itemLength,
    itemWidth,
    itemHeight,
    rows,
    cols,
    count,
    usedLength,
    usedWidth,
    usedHeight: itemHeight,
    clearanceLength,
    clearanceWidth,
    clearanceHeight,
    practicalMargin: Math.min(clearanceLength, clearanceWidth)
  };
}

function getPackingStudy(container, load, orientationMode = "auto", spacing = 0.05) {
  const candidates = (orientationMode === "auto" ? ["straight", "rotated"] : [orientationMode])
    .map((orientation) => evaluatePackingOrientation(container, load, orientation, spacing));
  const selected = candidates.reduce((best, candidate) => {
    if (!best || candidate.count > best.count) return candidate;
    if (candidate.count < best.count) return best;
    if (candidate.practicalMargin > best.practicalMargin) return candidate;
    return best;
  }, null);
  const heightFails = selected.itemHeight > container.usableHeight;
  const lengthFails = selected.itemLength > container.usableLength;
  const widthFails = selected.itemWidth > container.usableWidth;
  const failures = [heightFails && "høyde", lengthFails && "lengde", widthFails && "bredde"].filter(Boolean);
  const compatible = selected.count > 0;
  const floorArea = container.usableLength * container.usableWidth;
  const volume = floorArea * container.usableHeight;
  const loadFloorArea = selected.count * selected.itemLength * selected.itemWidth;
  const loadVolume = loadFloorArea * selected.itemHeight;

  return {
    compatible,
    selectedOrientation: selected.orientation,
    cols: selected.cols,
    rows: selected.rows,
    count: selected.count,
    usedLength: selected.usedLength,
    usedWidth: selected.usedWidth,
    usedHeight: selected.usedHeight,
    clearanceLength: selected.clearanceLength,
    clearanceWidth: selected.clearanceWidth,
    clearanceHeight: selected.clearanceHeight,
    lengthClearancePerSide: selected.clearanceLength / 2,
    widthClearancePerSide: selected.clearanceWidth / 2,
    heightClearanceTop: selected.clearanceHeight,
    itemLength: selected.itemLength,
    itemWidth: selected.itemWidth,
    floorAreaUtilization: compatible ? (loadFloorArea / floorArea) * 100 : 0,
    volumeUtilization: compatible ? (loadVolume / volume) * 100 : 0,
    criticalClearance: compatible ? Math.min(selected.clearanceLength, selected.clearanceWidth, selected.clearanceHeight) : Math.min(selected.clearanceLength, selected.clearanceWidth, selected.clearanceHeight),
    reason: compatible ? "Lasten passer innenfor containerens innvendige mål." : `Passer ikke på grunn av ${failures.length ? failures.join(" og ") : "tilgjengelig pakkeflate"}.`
  };
}

function ContainerStudy() {
  const [studyContainerKey, setStudyContainerKey] = usePersistentState("studyContainer", "iso10");
  const [customStudyContainer, setCustomStudyContainer] = usePersistentState("customStudyContainer", customStudyContainerDefaults);
  const [studyLoadKey, setStudyLoadKey] = usePersistentState("studyLoad", "steel1");
  const [studyOrientation, setStudyOrientation] = usePersistentState("studyOrientation", "auto");
  const [studySpacing, setStudySpacing] = usePersistentState("studySpacing", 0.05);
  const customContainer = useMemo(() => buildCustomStudyContainer(customStudyContainer), [customStudyContainer]);
  const container = studyContainerKey === "custom" ? customContainer : studyContainerOptions[studyContainerKey] || containerTypes.iso10;
  const load = loadTypes[studyLoadKey] || loadTypes.steel1;
  const result = useMemo(() => getPackingStudy(container, load, studyOrientation, studySpacing), [container, load, studyOrientation, studySpacing]);
  const isTight = result.compatible && result.criticalClearance < 0.05;
  const updateCustomDimension = (field, value) => setCustomStudyContainer((current) => ({ ...current, [field]: value }));

  return (
    <section className="container-study dark-study">
      <div className="study-heading">
        <div><p className="eyebrow">Ren pakkestudie</p><h2>Last i container</h2><p>Innvendige containermål, kollimål og praktiske klaringer – helt uavhengig av lagerbygget.</p></div>
        <div className={`study-status ${result.compatible ? "fits" : "fails"}`}>{result.compatible ? "Passer" : "Passer ikke"}</div>
      </div>

      <div className="study-layout">
        <aside className="study-controls">
          <label className="study-field"><span>Container</span><select value={studyContainerKey} onChange={(event) => setStudyContainerKey(event.target.value)}><option value="custom">Egendefinert container</option>{Object.entries(studyContainerOptions).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label>
          {studyContainerKey === "custom" && <div className="study-custom-container" aria-label="Egendefinerte innvendige containermål">
            <span>Innvendige mål</span>
            <label><small>Lengde (m)</small><input type="number" min="0.1" step="0.001" value={customStudyContainer.usableLength} onChange={(event) => updateCustomDimension("usableLength", event.target.value)} /></label>
            <label><small>Bredde (m)</small><input type="number" min="0.1" step="0.001" value={customStudyContainer.usableWidth} onChange={(event) => updateCustomDimension("usableWidth", event.target.value)} /></label>
            <label><small>Høyde (m)</small><input type="number" min="0.1" step="0.001" value={customStudyContainer.usableHeight} onChange={(event) => updateCustomDimension("usableHeight", event.target.value)} /></label>
          </div>}
          <label className="study-field"><span>Lasttype</span><select value={studyLoadKey} onChange={(event) => setStudyLoadKey(event.target.value)}>{Object.entries(loadTypes).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label>
          <div className="study-field"><span>Orientering</span><div className="study-segments">{Object.entries(studyOrientationOptions).map(([key, item]) => <button type="button" key={key} className={studyOrientation === key ? "active" : ""} onClick={() => setStudyOrientation(key)}>{item.label}</button>)}</div></div>
          <label className="study-field study-slider"><span><span>Avstand mellom kolli</span><strong>{studySpacing.toFixed(2)} m</strong></span><input type="range" min="0" max="0.5" step="0.01" value={studySpacing} onChange={(event) => setStudySpacing(Number(event.target.value))} /></label>
          <div className="study-dimensions">
            <span>Utvendig container</span><strong>L {container.length.toFixed(3)} × B {container.width.toFixed(3)} × H {container.height.toFixed(3)} m</strong>
            <span>Innvendig container</span><strong>L {container.usableLength.toFixed(3)} × B {container.usableWidth.toFixed(3)} × H {container.usableHeight.toFixed(3)} m</strong>
            {(container.topOpeningLength || container.topOpeningWidth) && <><span>Top opening</span><strong>{container.topOpeningLength ? `L ${container.topOpeningLength.toFixed(3)} × ` : ""}B {container.topOpeningWidth.toFixed(3)} m</strong></>}
            {(container.doorOpeningWidth || container.doorOpeningHeight) && <><span>Døråpning</span><strong>B {container.doorOpeningWidth.toFixed(3)} × H {container.doorOpeningHeight.toFixed(3)} m</strong></>}
            {(container.tare || container.payload || container.maxGross) && <><span>Vektdata</span><strong>{container.tare ? `Tare ca. ${formatNumber(container.tare)} kg` : ""}{container.payload ? ` · Payload ca. ${formatNumber(container.payload)} kg` : ""}{container.maxGross ? ` · Max gross ca. ${formatNumber(container.maxGross)} kg` : ""}</strong></>}
            {container.topOpeningWidth && <><span>Hard-top geometri</span><strong>{container.hardTop ? "Toppinnbygginger er vist i 3D med toppramme, lip, nedheng og skrå støtte." : "Innvendig mål gjelder gulv-/pakkemål. Topprammer i taksone er vist i 3D."}</strong></>}
            {container.notes && <><span>Merknad</span><strong>{container.notes}</strong></>}
            <span>Lastmål</span><strong>L {load.size.length.toFixed(3)} × B {load.size.width.toFixed(3)} × H {load.size.height.toFixed(3)} m</strong>
          </div>
        </aside>

        <div className="study-visual-panel">
          <Container3DView container={container} load={load} result={result} spacing={studySpacing} />
          <div className="study-axis"><span>L {container.usableLength.toFixed(3)} m</span><span>B {container.usableWidth.toFixed(3)} m</span><span>H {container.usableHeight.toFixed(3)} m</span></div>
        </div>
      </div>

      <div className="study-results">
        <article><span>Antall</span><strong>{result.count} stk</strong><small>{result.rows} rader × {result.cols} kolonner</small></article>
        <article><span>Valgt orientering</span><strong>{result.selectedOrientation === "rotated" ? "90° rotert" : "Standard"}</strong><small>{studyOrientation === "auto" ? "valgt automatisk" : "valgt manuelt"}</small></article>
        <article><span>Gulvareal</span><strong>{(result.count * result.itemLength * result.itemWidth).toFixed(2)} m²</strong><small>{result.floorAreaUtilization.toFixed(1)} % utnyttelse</small></article>
        <article><span>Volumutnyttelse</span><strong>{result.volumeUtilization.toFixed(1)} %</strong><small>av innvendig volum</small></article>
        <article className={isTight ? "tight" : ""}><span>Kritisk minste klaring</span><strong>{formatStudyMeasure(result.criticalClearance)}</strong><small>{result.compatible ? "total restklaring" : "negativ verdi betyr konflikt"}</small></article>
      </div>

      <ClearancePanel result={result} isTight={isTight} />
    </section>
  );
}

function Container3DView({ container, load, result, spacing }) {
  const resetKey = `${container.usableLength}-${container.usableHeight}-${load.packKey}-${result.selectedOrientation}`;

  return (
    <div className={`study-webgl ${result.compatible ? "" : "incompatible"}`}>
      <ThreeErrorBoundary resetKey={resetKey}>
        <Suspense fallback={<div className="study-webgl-fallback">Laster 3D-visning …</div>}>
          <Container3DScene container={container} load={load} result={result} spacing={spacing} />
        </Suspense>
      </ThreeErrorBoundary>
      <div className="study-view-hint">Dra for å rotere · rull for å zoome · høyreklikk for å panorere</div>
      {!result.compatible && <div className="study-no-fit"><AlertTriangle size={26} /><strong>Passer ikke</strong><span>{result.reason}</span></div>}
    </div>
  );
}

class ThreeErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidUpdate(previousProps) { if (this.state.failed && previousProps.resetKey !== this.props.resetKey) this.setState({ failed: false }); }
  render() { return this.state.failed ? <div className="study-webgl-fallback">3D-visning kunne ikke lastes. Klaringsdataene under er fortsatt gyldige.</div> : this.props.children; }
}

function ClearancePanel({ result, isTight }) {
  return <section className={`clearance-panel ${!result.compatible ? "incompatible" : ""}`}><div><h3>Klaringer</h3><p>{result.reason}</p></div>{result.compatible && <div className="clearance-grid"><ClearanceValue label="Lengde total" value={result.clearanceLength} /><ClearanceValue label="Lengde per ende" value={result.lengthClearancePerSide} /><ClearanceValue label="Bredde total" value={result.clearanceWidth} /><ClearanceValue label="Bredde per side" value={result.widthClearancePerSide} /><ClearanceValue label="Høyde over last" value={result.heightClearanceTop} /></div>}{isTight && <div className="tight-warning"><AlertTriangle size={18} />Trang klaring – må verifiseres mot faktisk container og innlastingsmetode.</div>}</section>;
}

function ClearanceValue({ label, value }) { return <div className={value < 0.05 ? "tight" : ""}><span>{label}</span><strong>{formatStudyMeasure(value)}</strong></div>; }
function formatStudyMeasure(value) { return `${value.toFixed(3)} m / ${Math.round(value * 1000)} mm`; }

function ArchitecturalPlan({ model, includeMarkedAreas, useLager2Extension }) {
  return (
    <div className="plan-shell">
      <div className="plan-canvas" style={{ aspectRatio: `${model.planWidth} / ${model.planLength}` }}>
        <div className="dimension dimension-width">16 850 mm + 500 mm + 16 850 mm</div>
        <div className="dimension dimension-height">Lager 2: {model.planLength.toFixed(0)} m</div>
        {model.roomModels.map((room) => <PlanRoom key={room.key} room={room} model={model} />)}
        <div className="separator" style={{ left: `${(16.85 / model.planWidth) * 100}%`, width: `${(separatorWidth / model.planWidth) * 100}%` }} />
      </div>
      <div className="plan-legend">
        <span><i className="legend-storage" />Lagerareal</span>
        <span><i className="legend-container" />Container</span>
        <span><i className="legend-drum" />Tønner</span>
        <span><i className="legend-steel" />Stålkasser</span>
        <span><i className="legend-kokille" />Kokiller</span>
        <span><i className="legend-blocked" />Gule felt</span>
        <span><i className="legend-extension" />Utvidet areal</span>
      </div>
    </div>
  );
}

function PlanRoom({ room, model }) {
  return (
    <article className={`plan-room ${room.key}`} style={{ left: `${room.leftPct}%`, top: `${room.topPct}%`, width: `${room.widthPct}%`, height: `${room.heightPct}%` }}>
      <div className="plan-room-header"><strong>{room.label}</strong><span>{room.width.toFixed(2)} x {room.displayLength.toFixed(2)} m</span></div>
      <div
        className="clearance-frame"
        style={{
          left: `${(room.wallClearance / room.width) * 100}%`,
          right: `${(room.wallClearance / room.width) * 100}%`,
          top: `${(room.doorClearance / room.displayLength) * 100}%`,
          bottom: `${(room.wallClearance / room.displayLength) * 100}%`
        }}
      />
      {(room.obstructions || []).map((obstruction) => (
        <div
          className={`room-obstruction ${room.includeMarkedAreas ? "included" : "excluded"}`}
          key={obstruction.key}
          style={{
            left: `${(obstruction.x / room.width) * 100}%`,
            top: `${((room.displayLength - obstruction.y - obstruction.length) / room.displayLength) * 100}%`,
            width: `${(obstruction.width / room.width) * 100}%`,
            height: `${(obstruction.length / room.displayLength) * 100}%`
          }}
        >
          {obstruction.label}<br />{obstruction.width.toFixed(2)} x {obstruction.length.toFixed(2)} m<br />{room.includeMarkedAreas ? "inkludert" : "fratrukket"}
        </div>
      ))}
      {room.extension && (
        <div
          className={`room-extension ${room.useLager2Extension ? "included" : "excluded"}`}
          style={{
            left: `${(room.extension.x / room.width) * 100}%`,
            top: `${((room.displayLength - room.extension.y - room.extension.length) / room.displayLength) * 100}%`,
            width: `${(room.extension.width / room.width) * 100}%`,
            height: `${(room.extension.length / room.displayLength) * 100}%`
          }}
        >
          {room.extension.label}<br />{room.useLager2Extension ? "inkludert" : "fratrukket"}
        </div>
      )}
      <div className="container-layer">
        {room.visualSlots.map((slot) => <ContainerFootprint key={slot.key} model={model} slot={slot} />)}
      </div>
      <div className="plan-room-footer">{room.grossSlots} brutto · {room.blockedSlots.length} blokkert = {room.floorSlots} gulvplasser</div>
    </article>
  );
}

function ContainerFootprint({ model, slot }) {
  const load = slot.load;
  const renderedContainer = load?.containerChoice || model.container;
  const loadClass = load ? `load-${load.shareKey}` : "load-empty";
  const containerClass = renderedContainer.height < 1.2 ? "half-height" : renderedContainer.length < 4 ? "iso10" : "iso20";
  return (
    <div
      className={`container-footprint ${containerClass} ${loadClass} ${slot.blocked ? "slot-blocked" : ""} ${slot.mixed ? "mixed-stack" : ""}`}
      style={{ left: `${slot.leftPct}%`, top: `${slot.topPct}%`, width: `${slot.widthPct}%`, height: `${slot.heightPct}%` }}
      title={slot.title}
    >
      <div className="container-label">
        <span>{slot.blocked ? "Blokkert plass" : `${renderedContainer.label}${model.containerRotated ? " · 90°" : ""}`}</span>
        {slot.stackCount > 1 && <strong>x{slot.stackCount}</strong>}
      </div>
      {slot.blocked ? <span className="empty-label">blokkeres av slusefelt</span> : load ? (
        <div className="payload-layer">
          {Array.from({ length: Math.min(slot.packageCount ?? load.perContainer, 24) }).map((_, index) => (
            <span
              key={`${slot.key}-load-${index}`}
              className={`payload-symbol ${load.shareKey} ${load.key}`}
              title={`${load.shortLabel}: ${load.dimensions}${load.shareKey === "steel" ? ` · ${load.fit.orientation === "rotated" ? "90° rotert" : "standardretning"}` : ""}`}
              style={getPayloadStyle({ load, container: renderedContainer, containerRotated: model.containerRotated, index })}
            >
              {load.shareKey === "steel" ? load.shortLabel : null}
            </span>
          ))}
        </div>
      ) : <span className="empty-label">ledig</span>}
    </div>
  );
}

function ConstraintPanel({ model }) {
  return (
    <section className="constraint-panel" aria-label="Dimensjonerende begrensninger">
      <div className="constraint-card main-limit">
        <span>{model.planningMode === "custom" ? "Valgt lastkombinasjon" : "Dimensjonerende scenario"}</span>
        <strong>{model.mixedCoverage >= 1 ? "Lageret dekker behovet" : "Lagerplass er begrensningen"}</strong>
        <small>{formatNumber(model.totalFloorSlots)} gulvplasser mot {formatNumber(model.requiredFloorSlots)} nødvendige gulvplasser etter stabling.</small>
      </div>
      {model.scenarioRows.map((row) => (
        <div className="constraint-card" key={row.key}>
          <span>{row.label}</span>
          <strong>{row.limiting.label}</strong>
          <small>{row.containerChoice.shortLabel} · {row.perContainer} stk/container · {row.stackLevels} nivåer · {row.limiting.hint}</small>
        </div>
      ))}
    </section>
  );
}

function getFootprintFit(container, size, orientationMode = "auto") {
  const orientations = [
    { length: size.length, width: size.width, orientation: "straight" },
    { length: size.width, width: size.length, orientation: "rotated" }
  ];
  const candidates = orientationMode === "auto"
    ? orientations
    : orientations.filter((orientation) => orientation.orientation === orientationMode);

  return candidates.reduce((best, orientation) => {
    const cols = Math.floor(container.usableWidth / orientation.width);
    const rows = Math.floor(container.usableLength / orientation.length);
    const count = Math.max(0, cols * rows);
    return count > best.count ? { ...orientation, cols, rows, count } : best;
  }, { length: size.length, width: size.width, orientation: "straight", cols: 0, rows: 0, count: 0 });
}

function getFit(container, size, orientationMode = "auto") {
  const uprightFits = size.height <= container.usableHeight;
  const footprint = getFootprintFit(container, size, orientationMode);
  const orientationText = footprint.orientation === "rotated" ? "90° rotert" : "standardretning";

  if (uprightFits && footprint.count > 0) {
    return {
      compatible: true,
      physicalCount: footprint.count,
      orientation: footprint.orientation,
      footprint,
      reason: `Mål passer i ${orientationText}`
    };
  }
  if (!uprightFits && footprint.count === 0) return { compatible: false, physicalCount: 0, footprint, reason: "For høy og for stort fotavtrykk" };
  if (!uprightFits) return { compatible: false, physicalCount: 0, footprint, reason: "For høy for valgt container" };
  return { compatible: false, physicalCount: 0, footprint, reason: "Fotavtrykk passer ikke i valgt container" };
}

function buildFloorStackQueue(scenarioRows, totalFloorSlots) {
  const queue = [];
  for (const row of scenarioRows) {
    if (!Number.isFinite(row.containersNeeded) || row.perContainer <= 0) continue;
    let remaining = row.containersNeeded;
    let remainingPackages = Math.ceil(row.packagesNeeded);
    while (remaining > 0 && queue.length < totalFloorSlots) {
      const stackCount = Math.min(row.stackLevels, remaining);
      const packageCount = Math.min(row.perContainer, remainingPackages);
      queue.push({ load: row, stackCount, packageCount });
      remaining -= stackCount;
      remainingPackages = Math.max(0, remainingPackages - row.perContainer * stackCount);
    }
    if (queue.length >= totalFloorSlots) break;
  }
  return queue;
}

function buildRoomVisualSlots({ room, container, containerRotated, visualQueue, offset }) {
  const slots = [];
  let nextOffset = offset;
  for (const geometricSlot of room.geometricSlots) {
    const stack = geometricSlot.blocked ? null : visualQueue[nextOffset] || null;
    if (!geometricSlot.blocked) nextOffset += 1;
    const load = stack?.load || null;
    const topMeters = room.displayLength - geometricSlot.y - geometricSlot.length;
    slots.push({
      ...geometricSlot,
      load,
      stackCount: stack?.stackCount || 0,
      packageCount: stack?.packageCount || 0,
      mixed: false,
      leftPct: (geometricSlot.x / room.width) * 100,
      topPct: (Math.max(0, topMeters) / room.displayLength) * 100,
      widthPct: (geometricSlot.width / room.width) * 100,
      heightPct: (geometricSlot.length / room.displayLength) * 100,
      title: geometricSlot.blocked
        ? `${container.label}: blokkeres av ${geometricSlot.blockedBy.label.toLowerCase()}`
        : load
          ? `${load.containerChoice.label}${containerRotated ? " · 90° i lageret" : ""}: ${stack.packageCount} ${load.label.toLowerCase()} i vist container, ${stack.stackCount} nivå(er)`
          : `${container.label}${containerRotated ? " · 90° i lageret" : ""}: ledig plass`
    });
  }
  return { slots, nextOffset };
}

function getPayloadStyle({ load, container, containerRotated, index }) {
  const footprint = load.fit.footprint || {
    width: load.size.width,
    length: load.size.length,
    cols: 1
  };
  const viewWidth = containerRotated ? container.usableLength : container.usableWidth;
  const viewLength = containerRotated ? container.usableWidth : container.usableLength;
  const itemWidth = containerRotated ? load.size.length : load.size.width;
  const itemLength = containerRotated ? load.size.width : load.size.length;
  const footprintWidth = containerRotated ? footprint.length : footprint.width;
  const footprintLength = containerRotated ? footprint.width : footprint.length;
  const widthPct = (itemWidth / viewWidth) * 100;
  const heightPct = (itemLength / viewLength) * 100;
  const cellWidthPct = (footprintWidth / viewWidth) * 100;
  const cellHeightPct = (footprintLength / viewLength) * 100;
  const cols = Math.max(1, footprint.cols);
  const originalColumn = index % cols;
  const originalRow = Math.floor(index / cols);
  const column = containerRotated ? originalRow : originalColumn;
  const row = containerRotated ? originalColumn : originalRow;
  const centerX = column * cellWidthPct + cellWidthPct / 2;
  const centerY = row * cellHeightPct + cellHeightPct / 2;
  const left = centerX - widthPct / 2;
  const top = centerY - heightPct / 2;
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `calc(${widthPct}% - 2px)`,
    height: `calc(${heightPct}% - 2px)`,
    transform: footprint.orientation === "rotated" ? "rotate(90deg)" : "none",
    transformOrigin: "center"
  };
}

function getLimitingConstraint({ fit, packingLimited, weightLimited, doseLimited, perContainer }) {
  if (!fit.compatible) {
    return { key: "fit", label: "Mål passer ikke", hint: "Bytt container eller lastvariant" };
  }

  const candidates = [
    { key: "packing", label: "Pakkemønster", value: packingLimited, hint: "Endre maks stk per container" },
    { key: "weight", label: "Vekt pr container", value: weightLimited, hint: "Endre bruttovekt eller kollivekt" },
    { key: "dose", label: "Dose pr container", value: doseLimited, hint: "Endre dosegrense eller kollidose" }
  ];
  const limiting = candidates.find((candidate) => candidate.value === perContainer) || candidates[0];
  return limiting;
}

function buildWarnings({ model, planningMode, stackLimit, halfHeightStackLimit, drumWeight, steelWeight }) {
  const warnings = [];
  if (model.mixedCoverage < 1) warnings.push({ level: "critical", text: `Blandet scenario mangler ca. ${formatNumber(model.requiredFloorSlots - model.totalFloorSlots)} gulvplasser etter stabling.` });
  if (stackLimit > 4) warnings.push({ level: "warn", text: "5 i høyden er kun testmodus. Nederste kasse/container må kontrolleres for trykkbelastning." });
  if (halfHeightStackLimit > 6) warnings.push({ level: "warn", text: "Mer enn 6 half-height-containere i høyden er testmodus. Stablelast og løfteoperasjon må verifiseres." });
  if (drumWeight > 330) warnings.push({ level: "critical", text: "Tønnevekt overstiger 330 kg UN-/spesifikasjonsgrensen fra rapporten." });
  if (steelWeight > 2500) warnings.push({ level: "warn", text: "Stålkassevekt overstiger 2500 kg truckgrense. Alternativ løftemetode må vurderes." });
  if (steelWeight > 3000) warnings.push({ level: "critical", text: "Stålkassevekt overstiger antatt 3000 kg stålkassegrense." });
  if (planningMode === "scenario" && model.shareTotal !== 100) warnings.push({ level: "warn", text: `Avfallsmiksen summerer til ${model.shareTotal.toFixed(0)}%. Juster 210L, stålkasser og kokiller til 100%.` });
  for (const row of model.scenarioRows) {
    if (row.perContainer === 0) warnings.push({ level: "critical", text: `${row.label} kan ikke pakkes med gjeldende container, mål, vekt- eller dosegrense.` });
    else if (row.packageDose > 2) warnings.push({ level: "warn", text: `${row.label} har dose over 2 mSv/h per kolli og bør håndteres særskilt.` });
    if (row.key === "drum210" && row.heightKind === "half") warnings.push({ level: "warn", text: "210L-tønne i half-height har bare ca. 3 mm nominell høydeklaring. Toleranser og innlastingsmetode må verifiseres før løsningen regnes som gjennomførbar." });
  }
  if (warnings.length === 0) warnings.push({ level: "ok", text: "Ingen åpenbare brudd med gjeldende simuleringsgrenser." });
  return warnings;
}

function QuantityControl({ label, detail, value, onChange }) {
  return (
    <div className="quantity-control">
      <div><strong>{label}</strong><small>{detail}</small></div>
      <div className="quantity-stepper">
        <button type="button" title={`Fjern én ${label}`} onClick={() => onChange(value - 1)}><Minus size={16} /></button>
        <input type="number" min="0" step="1" value={value} aria-label={`Antall ${label}`} onChange={(event) => onChange(Number(event.target.value) || 0)} />
        <button type="button" title={`Legg til én ${label}`} onClick={() => onChange(value + 1)}><Plus size={16} /></button>
      </div>
    </div>
  );
}

function ActiveConstraint({ constraintKey, onRemove, values, setters }) {
  const controls = {
    grossWeight: <Slider label="Maks bruttovekt per container" value={values.containerGrossLimit} min={3000} max={30000} step={500} unit="kg" onChange={setters.setContainerGrossLimit} />,
    dose: <Slider label="Maks dose per container" value={values.containerDoseLimit} min={0.2} max={10} step={0.1} unit="mSv/h" onChange={setters.setContainerDoseLimit} />,
    trailer: <Slider label="Maks trailerlast" value={values.trailerLimit} min={8000} max={50000} step={1000} unit="kg" onChange={setters.setTrailerLimit} />,
    drumPacking: <Slider label="Maks 210L per container" value={values.drumPackLimit} min={1} max={24} step={1} unit="stk" onChange={setters.setDrumPackLimit} />,
    steelPacking: <Slider label="Maks stålkasser per container" value={values.steelPackLimit} min={1} max={4} step={1} unit="stk" onChange={setters.setSteelPackLimit} />,
    kokillePacking: <Slider label="Maks kokiller per container" value={values.kokillePackLimit} min={1} max={8} step={1} unit="stk" onChange={setters.setKokillePackLimit} />
  };
  return <div className="active-constraint"><button className="remove-constraint" type="button" title={`Fjern ${optionalConstraints[constraintKey].label}`} onClick={onRemove}><X size={15} /></button>{controls[constraintKey]}</div>;
}

function SummaryCard({ icon, label, value, unit }) {
  return <article className="summary-card">{React.cloneElement(icon, { size: 20 })}<span>{label}</span><strong>{formatNumber(value)}</strong><small>{unit}</small></article>;
}

function Badge({ type, children }) {
  return <strong className={`limit-badge ${type}`}>{children}</strong>;
}

function PanelTitle({ icon, title }) { return <div className="panel-title">{React.cloneElement(icon, { size: 18 })}<strong>{title}</strong></div>; }
function Slider({ label, value, min, max, step, unit, onChange }) { return <label className="field"><div className="field-label"><span>{label}</span><strong>{formatNumber(value)} {unit}</strong></div><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>; }
function Toggle({ label, checked, onChange }) { return <label className="toggle"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>; }
function Segmented({ options, value, onChange }) {
  return (
    <div className="segments">
      {Object.entries(options).map(([key, option]) => {
        const hasDimensions = typeof option.length === "number";
        const familyRegular = option.regularKey ? containerTypes[option.regularKey] : null;
        const familyHalf = option.halfKey ? containerTypes[option.halfKey] : null;
        const describeContainer = (container) => `utvendig ${container.length.toFixed(2)} x ${container.width.toFixed(2)} x ${container.height.toFixed(2)} m, innvendig ${container.usableLength.toFixed(2)} x ${container.usableWidth.toFixed(2)} x ${container.usableHeight.toFixed(2)} m`;
        const dimensionText = hasDimensions
          ? `Utvendige mål: ${option.length.toFixed(2)} x ${option.width.toFixed(2)} x ${option.height.toFixed(2)} m. Innvendig nyttemål: ${option.usableLength.toFixed(2)} x ${option.usableWidth.toFixed(2)} x ${option.usableHeight.toFixed(2)} m.`
          : familyRegular
            ? `Normal: ${describeContainer(familyRegular)}.${familyHalf ? ` Half-height: ${describeContainer(familyHalf)}.` : " Half-height er ikke aktivert."}`
            : "";
        return (
          <button
            key={key}
            className={value === key ? "active" : ""}
            onClick={() => onChange(key)}
            title={dimensionText}
            type="button"
          >
            <span>{option.shortLabel || option.label}</span>
            {(hasDimensions || familyRegular) && <small className="segment-info">{dimensionText}</small>}
          </button>
        );
      })}
    </div>
  );
}
function formatNumber(value) { if (!Number.isFinite(value)) return "∞"; return new Intl.NumberFormat("nb-NO", { maximumFractionDigits: value < 10 ? 1 : 0 }).format(value); }
function formatLimit(value) { return Number.isFinite(value) ? formatNumber(value) : "ikke aktiv"; }

createRoot(document.getElementById("root")).render(<App />);
