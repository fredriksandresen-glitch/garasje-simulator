import React, { useMemo, useState } from "react";
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
  Scale,
  Settings2,
  Shield,
  Warehouse,
  X
} from "lucide-react";
import "./styles.css";

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
    length: 6.06,
    width: 2.44,
    height: 2.4,
    usableLength: 5.9,
    usableWidth: 2.35,
    usableHeight: 2.18,
    tare: 2200
  },
  iso10: {
    label: "10' ISO",
    shortLabel: "10' ISO",
    length: 2.99,
    width: 2.44,
    height: 2.4,
    usableLength: 2.78,
    usableWidth: 2.35,
    usableHeight: 2.18,
    tare: 1300
  },
  iso15: {
    label: "15' ISO",
    shortLabel: "15' ISO",
    length: 4.55,
    width: 2.33,
    height: 2.4,
    usableLength: 4.35,
    usableWidth: 2.24,
    usableHeight: 2.18,
    tare: 1700
  },
  iso15hh: {
    label: "15' half-height",
    shortLabel: "15' HH",
    length: 4.55,
    width: 2.33,
    height: 0.99,
    usableLength: 4.35,
    usableWidth: 2.24,
    usableHeight: 0.88,
    tare: 1400
  },
  iso10hh: {
    label: "10' half-height",
    shortLabel: "10' HH",
    length: 2.99,
    width: 2.44,
    height: 0.99,
    usableLength: 2.78,
    usableWidth: 2.35,
    usableHeight: 0.88,
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
const rooms = [
  { key: "lager1", label: "Lager 1", x: 0, width: 16.85, baseLength: 24.115, usableLength: 22.015, obstructionArea: 4.85 * 1.8 },
  { key: "lager2", label: "Lager 2", x: 16.85 + separatorWidth, width: 16.85, usableLength: 29, extendedLength: 34, obstructionArea: 5.15 * 11.985 }
];

function App() {
  const [planningMode, setPlanningMode] = useState("scenario");
  const [heightLimit, setHeightLimit] = useState(6.3);
  const [stackLimit, setStackLimit] = useState(4);
  const [halfHeightStackLimit, setHalfHeightStackLimit] = useState(6);
  const [wallClearance, setWallClearance] = useState(0.5);
  const [doorClearance, setDoorClearance] = useState(0.9);
  const [aisleGap, setAisleGap] = useState(0.8);
  const [useLager2Extension, setUseLager2Extension] = useState(true);
  const [includeMarkedAreas, setIncludeMarkedAreas] = useState(false);
  const [containerType, setContainerType] = useState("iso15");
  const [rotateContainers, setRotateContainers] = useState(false);
  const [containerGrossLimit, setContainerGrossLimit] = useState(24000);
  const [containerDoseLimit, setContainerDoseLimit] = useState(2);
  const [trailerLimit, setTrailerLimit] = useState(30000);
  const [selectedSteelVariant, setSelectedSteelVariant] = useState("steel1");
  const [rotateSteelBoxes, setRotateSteelBoxes] = useState(false);
  const [drumPackLimit, setDrumPackLimit] = useState(12);
  const [steelPackLimit, setSteelPackLimit] = useState(1);
  const [kokillePackLimit, setKokillePackLimit] = useState(4);
  const [existingDrumEq, setExistingDrumEq] = useState(582);
  const [annualDrumEq, setAnnualDrumEq] = useState(200);
  const [years, setYears] = useState(19);
  const [drumShare, setDrumShare] = useState(68);
  const [steelShare, setSteelShare] = useState(31);
  const [kokilleSharePct, setKokilleSharePct] = useState(1);
  const [drumWeight, setDrumWeight] = useState(330);
  const [steelWeight, setSteelWeight] = useState(3000);
  const [kokilleWeight, setKokilleWeight] = useState(1800);
  const [drumDose, setDrumDose] = useState(0.12);
  const [steelDose, setSteelDose] = useState(0.35);
  const [kokilleDose, setKokilleDose] = useState(0.8);
  const [customLoads, setCustomLoads] = useState({ drum210: 0, steel1: 100, steel2: 20, steel3: 0, steel4: 0, kokille: 0 });
  const [activeConstraints, setActiveConstraints] = useState([]);
  const [showConstraintMenu, setShowConstraintMenu] = useState(false);

  const model = useMemo(() => {
    const containerFamily = containerFamilyOptions[containerType];
    const container = containerTypes[containerFamily.regularKey];
    const halfContainer = containerFamily.halfKey ? containerTypes[containerFamily.halfKey] : null;
    const containerPlacement = rotateContainers
      ? { length: container.width, width: container.length }
      : { length: container.length, width: container.width };
    const footprint = { length: containerPlacement.length + aisleGap, width: containerPlacement.width + aisleGap };
    const maxLevelsForHeight = Math.max(1, Math.floor(heightLimit / container.height));
    const levels = Math.max(1, Math.min(stackLimit, maxLevelsForHeight));
    const maxHalfLevelsForHeight = halfContainer ? Math.max(1, Math.floor(heightLimit / halfContainer.height)) : 0;
    const halfLevels = halfContainer ? Math.max(1, Math.min(halfHeightStackLimit, maxHalfLevelsForHeight)) : 0;
    const planWidth = 16.85 * 2 + separatorWidth;
    const planLength = 34;

    const roomModels = rooms.map((room) => {
      const storageLength = room.key === "lager2" && useLager2Extension ? room.extendedLength : room.usableLength;
      const displayLength = room.key === "lager1" ? room.baseLength : room.extendedLength;
      const clearWidth = Math.max(0, room.width - wallClearance * 2);
      const clearLength = Math.max(0, storageLength - doorClearance);
      const cols = Math.max(0, Math.floor(clearLength / footprint.length));
      const rows = Math.max(0, Math.floor(clearWidth / footprint.width));
      const obstructionSlots = includeMarkedAreas ? 0 : Math.ceil(room.obstructionArea / (footprint.length * footprint.width));
      const floorSlots = Math.max(0, cols * rows - obstructionSlots);
      return {
        ...room,
        storageLength,
        displayLength,
        cols,
        rows,
        floorSlots,
        totalSlots: floorSlots,
        wallClearance,
        doorClearance,
        effectiveArea: clearWidth * clearLength - (includeMarkedAreas ? 0 : room.obstructionArea),
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
      const orientationMode = load.shareKey === "steel" ? (rotateSteelBoxes ? "rotated" : "straight") : "auto";
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
        containerPlacement,
        containerRotated: rotateContainers,
        wallClearance,
        aisleGap,
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
  const standardSteelFit = getFit(activeContainer, selectedSteel.size, "straight");
  const rotatedSteelFit = getFit(activeContainer, selectedSteel.size, "rotated");
  const customPackageCount = Object.values(customLoads).reduce((sum, quantity) => sum + quantity, 0);
  const setCustomLoad = (key, value) => setCustomLoads((current) => ({ ...current, [key]: Math.max(0, Math.round(value)) }));
  const addConstraint = (key) => {
    setActiveConstraints((current) => current.includes(key) ? current : [...current, key]);
    setShowConstraintMenu(false);
  };
  const removeConstraint = (key) => setActiveConstraints((current) => current.filter((item) => item !== key));

  return (
    <main className="app-shell">
      <section className="dashboard">
        <header className="topbar">
          <div>
            <p className="eyebrow">Lagerbygg III</p>
            <h1>Radioaktivt avfall: lager- og containersimulator</h1>
          </div>
          <div className={model.mixedCoverage >= 1 ? "score good" : "score warn"}>
            <div className="score-label">
              {planningMode === "custom" ? "Lastdekning" : "Scenario dekning"}
              <span className="info-dot" tabIndex="0">
                <HelpCircle size={15} />
                <span className="tooltip">Viser beregnede gulvplasser delt på nødvendige gulvplasser etter stabling. 100% betyr at scenarioet akkurat får plass.</span>
              </span>
            </div>
            <div className="score-value"><Gauge size={20} /><span>{Math.round(model.mixedCoverage * 100)}%</span></div>
          </div>
        </header>

        <nav className="mode-tabs" aria-label="Planleggingsmodus">
          <button type="button" className={planningMode === "scenario" ? "active" : ""} onClick={() => setPlanningMode("scenario")}>Scenario</button>
          <button type="button" className={planningMode === "custom" ? "active" : ""} onClick={() => setPlanningMode("custom")}>Fri lastkombinasjon</button>
        </nav>

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
              <Toggle label="Roter stålkasser 90°" checked={rotateSteelBoxes} onChange={setRotateSteelBoxes} />
              <div className="container-note">
                Fysisk kapasitet for {selectedSteel.shortLabel}: standard {standardSteelFit.physicalCount} stk · 90° {rotatedSteelFit.physicalCount} stk. Valgt maksgrense: {steelPackLimit} stk.
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
              <Toggle label="Roter stålkasser 90°" checked={rotateSteelBoxes} onChange={setRotateSteelBoxes} />

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
      </section>
    </main>
  );
}

function ArchitecturalPlan({ model, includeMarkedAreas, useLager2Extension }) {
  const markedClass = includeMarkedAreas ? "blocked included" : "blocked excluded";
  const markedStatus = includeMarkedAreas ? "inkludert" : "fratrukket";
  return (
    <div className="plan-shell">
      <div className="plan-canvas" style={{ aspectRatio: `${model.planWidth} / ${model.planLength}` }}>
        <div className="dimension dimension-width">16 850 mm + 500 mm + 16 850 mm</div>
        <div className="dimension dimension-height">Lager 2: {model.planLength.toFixed(0)} m</div>
        {model.roomModels.map((room) => <PlanRoom key={room.key} room={room} model={model} />)}
        <div className="separator" style={{ left: `${(16.85 / model.planWidth) * 100}%`, width: `${(separatorWidth / model.planWidth) * 100}%` }} />
        <div className={`${markedClass} blocked-l1`}>Personsluse 1<br />4.85 x 1.8 m<br />{markedStatus}</div>
        <div className={`${markedClass} blocked-l2`}>Forrom / sluse<br />5.15 x 11.99 m<br />{markedStatus}</div>
        <div className={useLager2Extension ? "extension-label included" : "extension-label excluded"}>
          Rosa felt<br />17.15 x 5.00 m<br />{useLager2Extension ? "inkludert" : "fratrukket"}
        </div>
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
      <div className="container-layer">
        {room.visualSlots.map((slot) => <ContainerFootprint key={slot.key} model={model} slot={slot} />)}
      </div>
      <div className="plan-room-footer">{room.totalSlots} gulvplasser · {room.rows} rader x {room.cols} lengder</div>
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
      className={`container-footprint ${containerClass} ${loadClass} ${slot.mixed ? "mixed-stack" : ""}`}
      style={{ left: `${slot.leftPct}%`, top: `${slot.topPct}%`, width: `${slot.widthPct}%`, height: `${slot.heightPct}%` }}
      title={slot.title}
    >
      <div className="container-label">
        <span>{renderedContainer.label}{model.containerRotated ? " · 90°" : ""}</span>
        {slot.stackCount > 1 && <strong>x{slot.stackCount}</strong>}
      </div>
      {load ? (
        <div className="payload-layer">
          {Array.from({ length: Math.min(load.perContainer, 24) }).map((_, index) => (
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
    while (remaining > 0 && queue.length < totalFloorSlots) {
      const stackCount = Math.min(row.stackLevels, remaining);
      queue.push({ load: row, stackCount });
      remaining -= stackCount;
    }
    if (queue.length >= totalFloorSlots) break;
  }
  return queue;
}

function buildRoomVisualSlots({ room, container, containerPlacement, containerRotated, wallClearance, aisleGap, visualQueue, offset }) {
  const slots = [];
  let nextOffset = offset;
  for (let col = 0; col < room.cols; col += 1) {
    for (let row = 0; row < room.rows; row += 1) {
      if (slots.length >= room.floorSlots) break;
      const stack = visualQueue[nextOffset] || null;
      nextOffset += 1;
      const load = stack?.load || null;
      const xMeters = wallClearance + row * (containerPlacement.width + aisleGap);
      const yFromBottom = wallClearance + col * (containerPlacement.length + aisleGap);
      const topMeters = room.displayLength - yFromBottom - containerPlacement.length;
      slots.push({
        key: `${room.key}-${col}-${row}`,
        load,
        stackCount: stack?.stackCount || 0,
        mixed: false,
        leftPct: (xMeters / room.width) * 100,
        topPct: (Math.max(0, topMeters) / room.displayLength) * 100,
        widthPct: (containerPlacement.width / room.width) * 100,
        heightPct: (containerPlacement.length / room.displayLength) * 100,
        title: load
          ? `${load.containerChoice.label}${containerRotated ? " · 90° i lageret" : ""}: ${load.perContainer} ${load.label.toLowerCase()} per container, ${stack.stackCount} nivå(er)`
          : `${container.label}${containerRotated ? " · 90° i lageret" : ""}: ledig plass`
      });
    }
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
