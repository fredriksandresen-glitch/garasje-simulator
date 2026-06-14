import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  Boxes,
  Gauge,
  HelpCircle,
  Layers,
  Package,
  Ruler,
  Scale,
  Settings2,
  Shield,
  Warehouse
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
    length: 2.99,
    width: 2.44,
    height: 2.4,
    usableLength: 2.78,
    usableWidth: 2.35,
    usableHeight: 2.18,
    tare: 1300
  },
  iso10hh: {
    label: "10' half-height",
    length: 2.99,
    width: 2.44,
    height: 0.99,
    usableLength: 2.78,
    usableWidth: 2.35,
    usableHeight: 0.88,
    tare: 1150
  }
};

const separatorWidth = 0.5;
const rooms = [
  { key: "lager1", label: "Lager 1", x: 0, width: 16.85, baseLength: 24.115, usableLength: 22.015, obstructionArea: 4.85 * 1.8 },
  { key: "lager2", label: "Lager 2", x: 16.85 + separatorWidth, width: 16.85, usableLength: 29, extendedLength: 34, obstructionArea: 5.15 * 6.985 }
];

function App() {
  const [heightLimit, setHeightLimit] = useState(6.3);
  const [stackLimit, setStackLimit] = useState(4);
  const [wallClearance, setWallClearance] = useState(0.5);
  const [doorClearance, setDoorClearance] = useState(0.9);
  const [aisleGap, setAisleGap] = useState(0.8);
  const [useLager2Extension, setUseLager2Extension] = useState(true);
  const [includeMarkedAreas, setIncludeMarkedAreas] = useState(false);
  const [containerType, setContainerType] = useState("iso20");
  const [containerGrossLimit, setContainerGrossLimit] = useState(24000);
  const [containerDoseLimit, setContainerDoseLimit] = useState(2);
  const [trailerLimit, setTrailerLimit] = useState(30000);
  const [selectedSteelVariant, setSelectedSteelVariant] = useState("steel1");
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

  const model = useMemo(() => {
    const container = containerTypes[containerType];
    const footprint = { length: container.length + aisleGap, width: container.width + aisleGap };
    const levels = Math.max(1, Math.min(stackLimit, Math.floor(heightLimit / container.height)));
    const planWidth = 16.85 * 2 + separatorWidth;
    const planLength = useLager2Extension ? 34 : 29;

    const roomModels = rooms.map((room) => {
      const storageLength = room.key === "lager2" && useLager2Extension ? room.extendedLength : room.usableLength;
      const displayLength = room.key === "lager1" ? room.baseLength : storageLength;
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
        totalSlots: floorSlots * levels,
        effectiveArea: clearWidth * clearLength - (includeMarkedAreas ? 0 : room.obstructionArea),
        leftPct: (room.x / planWidth) * 100,
        topPct: ((planLength - displayLength) / planLength) * 100,
        widthPct: (room.width / planWidth) * 100,
        heightPct: (displayLength / planLength) * 100
      };
    });

    const totalContainerSlots = roomModels.reduce((sum, room) => sum + room.totalSlots, 0);
    const totalFootprintArea = roomModels.reduce((sum, room) => sum + room.effectiveArea, 0);
    const shareTotal = drumShare + steelShare + kokilleSharePct;
    const totalNeed = existingDrumEq + annualDrumEq * years;
    const weights = { drum210: drumWeight, steel1: steelWeight, steel2: steelWeight, steel3: steelWeight, steel4: steelWeight, kokille: kokilleWeight };
    const doses = { drum210: drumDose, steel1: steelDose, steel2: steelDose, steel3: steelDose, steel4: steelDose, kokille: kokilleDose };
    const packLimits = { drum: drumPackLimit, steel: steelPackLimit, kokille: kokillePackLimit };

    const loadRows = Object.entries(loadTypes).map(([key, load]) => {
      const packageWeight = weights[key];
      const packageDose = doses[key];
      const fit = getFit(container, load.size);
      const packingLimited = fit.compatible ? packLimits[load.packKey] : 0;
      const weightLimited = Math.max(0, Math.floor((containerGrossLimit - container.tare) / Math.max(1, packageWeight)));
      const doseLimited = Math.max(0, Math.floor(containerDoseLimit / Math.max(0.01, packageDose)));
      const perContainer = Math.max(0, Math.min(packingLimited, weightLimited, doseLimited));
      const limiting = getLimitingConstraint({ fit, packingLimited, weightLimited, doseLimited, perContainer });
      const share =
        load.shareKey === "drum" ? drumShare / 100 :
        load.shareKey === "kokille" ? kokilleSharePct / 100 :
        key === selectedSteelVariant ? steelShare / 100 : 0;
      const requestedDrumEq = totalNeed * share;
      const packagesNeeded = requestedDrumEq / load.drumEq;
      const containersNeeded = packagesNeeded === 0 ? 0 : perContainer > 0 ? Math.ceil(packagesNeeded / perContainer) : Infinity;
      const loadedWeight = container.tare + perContainer * packageWeight;
      const loadedDose = perContainer * packageDose;
      const containersPerTrailer = Math.max(1, Math.floor(trailerLimit / Math.max(1, loadedWeight)));
      return {
        key,
        ...load,
        selected: key === selectedSteelVariant || load.shareKey !== "steel",
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
        loadedWeight,
        loadedDose,
        containersPerTrailer,
        capacityDrumEq: totalContainerSlots * perContainer * load.drumEq
      };
    });

    const scenarioRows = loadRows.filter((row) => row.requestedDrumEq > 0);
    const requiredContainers = scenarioRows.reduce((sum, row) => sum + row.containersNeeded, 0);
    const limitingCounts = scenarioRows.reduce((counts, row) => {
      counts[row.limiting.key] = (counts[row.limiting.key] || 0) + 1;
      return counts;
    }, {});
    const dominantLimit = Object.entries(limitingCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "none";

    return {
      container,
      levels,
      planWidth,
      planLength,
      roomModels,
      totalContainerSlots,
      totalFootprintArea,
      totalNeed,
      shareTotal,
      loadRows,
      scenarioRows,
      requiredContainers,
      dominantLimit,
      mixedCoverage: totalContainerSlots / Math.max(1, requiredContainers)
    };
  }, [
    heightLimit,
    stackLimit,
    wallClearance,
    doorClearance,
    aisleGap,
    useLager2Extension,
    includeMarkedAreas,
    containerType,
    containerGrossLimit,
    containerDoseLimit,
    trailerLimit,
    selectedSteelVariant,
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

  const warnings = buildWarnings({ model, stackLimit, drumWeight, steelWeight });

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
              Scenario dekning
              <span className="info-dot" tabIndex="0">
                <HelpCircle size={15} />
                <span className="tooltip">Viser beregnede containerplasser delt på antall containere som trengs for valgt avfallsmiks. 100% betyr at scenarioet akkurat får plass.</span>
              </span>
            </div>
            <div className="score-value"><Gauge size={20} /><span>{Math.round(model.mixedCoverage * 100)}%</span></div>
          </div>
        </header>

        <section className="summary-grid">
          <SummaryCard icon={<Warehouse />} label="Lagerkapasitet" value={model.totalContainerSlots} unit="containerplasser" />
          <SummaryCard icon={<Boxes />} label="Blandet behov" value={model.requiredContainers} unit="containere" />
          <SummaryCard icon={<Package />} label="Scenario" value={model.totalNeed} unit="drum eq." />
          <SummaryCard icon={<Layers />} label="Stablehøyde" value={model.levels} unit="nivåer" />
        </section>

        <div className="workspace">
          <aside className="controls" aria-label="Simuleringsparametere">
            <PanelTitle icon={<Settings2 />} title="Bygg og logistikk" />
            <Slider label="Fri stablehøyde" value={heightLimit} min={4.5} max={7.5} step={0.1} unit="m" onChange={setHeightLimit} />
            <Slider label="Maks nivåer" value={stackLimit} min={1} max={5} step={1} unit="stk" onChange={setStackLimit} />
            <Slider label="Avstand til personsluser/dører" value={doorClearance} min={0.3} max={2} step={0.1} unit="m" onChange={setDoorClearance} />
            <Slider label="Gang/luft mellom containere" value={aisleGap} min={0.1} max={2.5} step={0.1} unit="m" onChange={setAisleGap} />
            <Slider label="Veggklarering" value={wallClearance} min={0} max={1.5} step={0.1} unit="m" onChange={setWallClearance} />
            <Toggle label="Ta med rosa felt i Lager 2" checked={useLager2Extension} onChange={setUseLager2Extension} />
            <Toggle label="Ta med gule slusefelt som lagerareal" checked={includeMarkedAreas} onChange={setIncludeMarkedAreas} />

            <PanelTitle icon={<Shield />} title="Container og grenser" />
            <Segmented options={containerTypes} value={containerType} onChange={setContainerType} />
            <Slider label="Maks container bruttovekt" value={containerGrossLimit} min={3000} max={30000} step={500} unit="kg" onChange={setContainerGrossLimit} />
            <Slider label="Maks trailerlast" value={trailerLimit} min={8000} max={50000} step={1000} unit="kg" onChange={setTrailerLimit} />
            <Slider label="Maks dose per container" value={containerDoseLimit} min={0.2} max={10} step={0.1} unit="mSv/h" onChange={setContainerDoseLimit} />
            <div className="container-note">
              Innvendig nyttemål: {model.container.usableLength.toFixed(2)} x {model.container.usableWidth.toFixed(2)} x {model.container.usableHeight.toFixed(2)} m
            </div>

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
            <Slider label="Andel kokiller" value={kokilleSharePct} min={0} max={100} step={1} unit="%" onChange={setKokilleSharePct} />
            <div className={model.shareTotal === 100 ? "derived" : "derived warning-text"}>Sum andeler: {model.shareTotal.toFixed(0)}%</div>

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
                  <span><strong>{row.label}</strong><small>{row.dimensions}{row.selected ? " · med i scenario" : ""}</small></span>
                  <span>{row.fit.compatible ? "Ja" : "Nei"}<small>{row.fit.reason}</small></span>
                  <span><Badge type={row.limiting.key}>{row.limiting.label}</Badge><small>{row.limiting.hint}</small></span>
                  <span>{row.perContainer} stk<small>Vekt {row.weightLimited} · dose {row.doseLimited} · mønster {row.packingLimited}</small></span>
                  <span>{formatNumber(row.loadedWeight)} kg / {row.containersPerTrailer} cont.<small>{formatNumber(row.loadedDose)} mSv/h · behov {formatNumber(row.containersNeeded)} cont.</small></span>
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
        <div className={`${markedClass} blocked-l2`}>Forrom / sluse<br />5.15 x 6.99 m<br />{markedStatus}</div>
        {useLager2Extension && <div className="extension-label">Rosa felt lagt til som tilgjengelig Lager 2-areal</div>}
      </div>
      <div className="plan-legend"><span><i className="legend-storage" />Lagerareal</span><span><i className="legend-blocked" />Gule felt</span><span><i className="legend-extension" />Utvidet areal</span></div>
    </div>
  );
}

function PlanRoom({ room, model }) {
  const cells = Math.min(96, room.floorSlots);
  return (
    <article className={`plan-room ${room.key}`} style={{ left: `${room.leftPct}%`, top: `${room.topPct}%`, width: `${room.widthPct}%`, height: `${room.heightPct}%` }}>
      <div className="plan-room-header"><strong>{room.label}</strong><span>{room.width.toFixed(2)} x {room.displayLength.toFixed(2)} m</span></div>
      <div className="storage-zone">
        {Array.from({ length: cells }).map((_, index) => <span key={index} className="container-cell">{model.levels}</span>)}
      </div>
      <div className="plan-room-footer">{room.totalSlots} plasser · {room.rows} rader x {room.cols} lengder</div>
    </article>
  );
}

function ConstraintPanel({ model }) {
  return (
    <section className="constraint-panel" aria-label="Dimensjonerende begrensninger">
      <div className="constraint-card main-limit">
        <span>Dimensjonerende scenario</span>
        <strong>{model.mixedCoverage >= 1 ? "Lageret dekker behovet" : "Lagerplass er begrensningen"}</strong>
        <small>{formatNumber(model.totalContainerSlots)} containerplasser mot {formatNumber(model.requiredContainers)} nødvendige containere.</small>
      </div>
      {model.scenarioRows.map((row) => (
        <div className="constraint-card" key={row.key}>
          <span>{row.label}</span>
          <strong>{row.limiting.label}</strong>
          <small>{row.perContainer} stk/container · {row.limiting.hint}</small>
        </div>
      ))}
    </section>
  );
}

function getFit(container, size) {
  const uprightFits = size.height <= container.usableHeight;
  const footprintFits =
    (size.length <= container.usableLength && size.width <= container.usableWidth) ||
    (size.width <= container.usableLength && size.length <= container.usableWidth);

  if (uprightFits && footprintFits) return { compatible: true, reason: "Mål innenfor nyttig innvendig volum" };
  if (!uprightFits && !footprintFits) return { compatible: false, reason: "For høy og for stort fotavtrykk" };
  if (!uprightFits) return { compatible: false, reason: "For høy for valgt container" };
  return { compatible: false, reason: "Fotavtrykk passer ikke i valgt container" };
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

function buildWarnings({ model, stackLimit, drumWeight, steelWeight }) {
  const warnings = [];
  if (model.mixedCoverage < 1) warnings.push({ level: "critical", text: `Blandet scenario mangler ca. ${formatNumber(model.requiredContainers - model.totalContainerSlots)} containerplasser.` });
  if (stackLimit > 4) warnings.push({ level: "warn", text: "5 i høyden er kun testmodus. Nederste kasse/container må kontrolleres for trykkbelastning." });
  if (drumWeight > 330) warnings.push({ level: "critical", text: "Tønnevekt overstiger 330 kg UN-/spesifikasjonsgrensen fra rapporten." });
  if (steelWeight > 2500) warnings.push({ level: "warn", text: "Stålkassevekt overstiger 2500 kg truckgrense. Alternativ løftemetode må vurderes." });
  if (steelWeight > 3000) warnings.push({ level: "critical", text: "Stålkassevekt overstiger antatt 3000 kg stålkassegrense." });
  if (model.shareTotal !== 100) warnings.push({ level: "warn", text: `Avfallsmiksen summerer til ${model.shareTotal.toFixed(0)}%. Juster 210L, stålkasser og kokiller til 100%.` });
  for (const row of model.scenarioRows) {
    if (row.perContainer === 0) warnings.push({ level: "critical", text: `${row.label} kan ikke pakkes med gjeldende container, mål, vekt- eller dosegrense.` });
    else if (row.packageDose > 2) warnings.push({ level: "warn", text: `${row.label} har dose over 2 mSv/h per kolli og bør håndteres særskilt.` });
  }
  if (warnings.length === 0) warnings.push({ level: "ok", text: "Ingen åpenbare brudd med gjeldende simuleringsgrenser." });
  return warnings;
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
function Segmented({ options, value, onChange }) { return <div className="segments">{Object.entries(options).map(([key, option]) => <button key={key} className={value === key ? "active" : ""} onClick={() => onChange(key)} type="button">{option.label}</button>)}</div>; }
function formatNumber(value) { if (!Number.isFinite(value)) return "∞"; return new Intl.NumberFormat("nb-NO", { maximumFractionDigits: value < 10 ? 1 : 0 }).format(value); }

createRoot(document.getElementById("root")).render(<App />);