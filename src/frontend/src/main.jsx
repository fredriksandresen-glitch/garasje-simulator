import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AlertTriangle, Boxes, Gauge, HelpCircle, Layers, Package, Ruler, Scale, Settings2, Shield, Warehouse } from "lucide-react";
import "./styles.css";

const loadTypes = {
  drum210: { label: "210L tønner", dimensions: "Ø610 x H877 mm", drumEq: 1, defaultWeight: 330, defaultDose: 0.12, defaultPerContainer: 12 },
  steel1: { label: "Stålkasse V1", dimensions: "2.8 x 1.35 x 1.1 m", drumEq: 6, defaultWeight: 3000, defaultDose: 0.35, defaultPerContainer: 1 },
  kokille: { label: "Kokille", dimensions: "1.2 x 0.8 x 0.9 m", drumEq: 2, defaultWeight: 1800, defaultDose: 0.8, defaultPerContainer: 4 }
};

const containerTypes = {
  iso20: { label: "20' ISO", length: 6.06, width: 2.44, height: 2.4, tare: 2200 },
  iso10: { label: "10' ISO", length: 2.99, width: 2.44, height: 2.4, tare: 1300 },
  iso10hh: { label: "10' half-height", length: 2.99, width: 2.44, height: 0.99, tare: 1150 }
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
  const [subtractObstructions, setSubtractObstructions] = useState(true);
  const [containerType, setContainerType] = useState("iso20");
  const [containerGrossLimit, setContainerGrossLimit] = useState(24000);
  const [containerDoseLimit, setContainerDoseLimit] = useState(2);
  const [trailerLimit, setTrailerLimit] = useState(30000);
  const [existingDrumEq, setExistingDrumEq] = useState(582);
  const [annualDrumEq, setAnnualDrumEq] = useState(200);
  const [years, setYears] = useState(19);
  const [drumShare, setDrumShare] = useState(68);
  const [steelShare, setSteelShare] = useState(31);
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
      const obstructionSlots = subtractObstructions ? Math.ceil(room.obstructionArea / (footprint.length * footprint.width)) : 0;
      const floorSlots = Math.max(0, cols * rows - obstructionSlots);
      return {
        ...room,
        storageLength,
        displayLength,
        cols,
        rows,
        floorSlots,
        totalSlots: floorSlots * levels,
        effectiveArea: clearWidth * clearLength - (subtractObstructions ? room.obstructionArea : 0),
        leftPct: (room.x / planWidth) * 100,
        topPct: ((planLength - displayLength) / planLength) * 100,
        widthPct: (room.width / planWidth) * 100,
        heightPct: (displayLength / planLength) * 100
      };
    });

    const totalContainerSlots = roomModels.reduce((sum, room) => sum + room.totalSlots, 0);
    const totalFootprintArea = roomModels.reduce((sum, room) => sum + room.effectiveArea, 0);
    const kokilleShare = Math.max(0, 100 - drumShare - steelShare);
    const totalNeed = existingDrumEq + annualDrumEq * years;
    const weights = { drum210: drumWeight, steel1: steelWeight, kokille: kokilleWeight };
    const doses = { drum210: drumDose, steel1: steelDose, kokille: kokilleDose };
    const shares = { drum210: drumShare / 100, steel1: steelShare / 100, kokille: kokilleShare / 100 };

    const loadRows = Object.entries(loadTypes).map(([key, load]) => {
      const packageWeight = weights[key];
      const packageDose = doses[key];
      const weightLimited = Math.max(0, Math.floor((containerGrossLimit - container.tare) / Math.max(1, packageWeight)));
      const doseLimited = Math.max(0, Math.floor(containerDoseLimit / Math.max(0.01, packageDose)));
      const perContainer = Math.max(0, Math.min(load.defaultPerContainer, weightLimited, doseLimited));
      const requestedDrumEq = totalNeed * shares[key];
      const packagesNeeded = requestedDrumEq / load.drumEq;
      const containersNeeded = perContainer > 0 ? Math.ceil(packagesNeeded / perContainer) : Infinity;
      const loadedWeight = container.tare + perContainer * packageWeight;
      const containersPerTrailer = Math.max(1, Math.floor(trailerLimit / Math.max(1, loadedWeight)));
      return { key, ...load, packageWeight, packageDose, perContainer, requestedDrumEq, packagesNeeded, containersNeeded, loadedWeight, containersPerTrailer, capacityDrumEq: totalContainerSlots * perContainer * load.drumEq };
    });

    const requiredContainers = loadRows.reduce((sum, row) => sum + row.containersNeeded, 0);
    return { container, levels, planWidth, planLength, roomModels, totalContainerSlots, totalFootprintArea, totalNeed, kokilleShare, loadRows, requiredContainers, mixedCoverage: totalContainerSlots / Math.max(1, requiredContainers) };
  }, [heightLimit, stackLimit, wallClearance, doorClearance, aisleGap, useLager2Extension, subtractObstructions, containerType, containerGrossLimit, containerDoseLimit, trailerLimit, existingDrumEq, annualDrumEq, years, drumShare, steelShare, drumWeight, steelWeight, kokilleWeight, drumDose, steelDose, kokilleDose]);

  const warnings = buildWarnings({ model, stackLimit, drumWeight, steelWeight, drumShare, steelShare });

  return (
    <main className="app-shell">
      <section className="dashboard">
        <header className="topbar">
          <div><p className="eyebrow">Lagerbygg III</p><h1>Radioaktivt avfall: lager- og containersimulator</h1></div>
          <div className={model.mixedCoverage >= 1 ? "score good" : "score warn"}>
            <div className="score-label">Scenario dekning<span className="info-dot" tabIndex="0"><HelpCircle size={15} /><span className="tooltip">Viser beregnede containerplasser delt på antall containere som trengs for valgt avfallsmiks. 100% betyr at scenarioet akkurat får plass.</span></span></div>
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
            <Toggle label="Trekk fra sluser/markerte felt" checked={subtractObstructions} onChange={setSubtractObstructions} />
            <PanelTitle icon={<Shield />} title="Container og grenser" />
            <Segmented options={containerTypes} value={containerType} onChange={setContainerType} />
            <Slider label="Maks container bruttovekt" value={containerGrossLimit} min={3000} max={30000} step={500} unit="kg" onChange={setContainerGrossLimit} />
            <Slider label="Maks trailerlast" value={trailerLimit} min={8000} max={50000} step={1000} unit="kg" onChange={setTrailerLimit} />
            <Slider label="Maks dose per container" value={containerDoseLimit} min={0.2} max={10} step={0.1} unit="mSv/h" onChange={setContainerDoseLimit} />
            <PanelTitle icon={<Ruler />} title="Behovsscenario" />
            <Slider label="Eksisterende beholdning" value={existingDrumEq} min={0} max={1500} step={10} unit="drum eq." onChange={setExistingDrumEq} />
            <Slider label="Årlig tilvekst" value={annualDrumEq} min={50} max={300} step={5} unit="drum eq." onChange={setAnnualDrumEq} />
            <Slider label="År" value={years} min={5} max={25} step={1} unit="år" onChange={setYears} />
            <Slider label="Andel 210L" value={drumShare} min={0} max={100} step={1} unit="%" onChange={setDrumShare} />
            <Slider label="Andel stålkasser" value={steelShare} min={0} max={100} step={1} unit="%" onChange={setSteelShare} />
            <div className="derived">Kokille-andel: {model.kokilleShare.toFixed(0)}%</div>
            <PanelTitle icon={<Scale />} title="Lastdata" />
            <Slider label="Tønnevekt" value={drumWeight} min={50} max={700} step={5} unit="kg" onChange={setDrumWeight} />
            <Slider label="Stålkassevekt" value={steelWeight} min={500} max={4000} step={25} unit="kg" onChange={setSteelWeight} />
            <Slider label="Kokillevekt" value={kokilleWeight} min={200} max={5000} step={50} unit="kg" onChange={setKokilleWeight} />
            <Slider label="Dose per tønne" value={drumDose} min={0.01} max={3} step={0.01} unit="mSv/h" onChange={setDrumDose} />
            <Slider label="Dose per stålkasse" value={steelDose} min={0.01} max={8} step={0.05} unit="mSv/h" onChange={setSteelDose} />
            <Slider label="Dose per kokille" value={kokilleDose} min={0.01} max={8} step={0.05} unit="mSv/h" onChange={setKokilleDose} />
          </aside>

          <section className="stage" aria-label="Lageroversikt">
            <div className="stage-header"><div><h2>Arkitektbasert plassmodell</h2><p>Felles målestokk: total bredde {model.planWidth.toFixed(2)} m, visningslengde {model.planLength.toFixed(2)} m, stablehøyde {formatNumber(model.levels * model.container.height)} m.</p></div><div className="capacity-pill">{formatNumber(model.totalFootprintArea)} m² effektivt areal</div></div>
            <ArchitecturalPlan model={model} subtractObstructions={subtractObstructions} useLager2Extension={useLager2Extension} />
            <div className="results-table">
              <div className="table-row table-head"><span>Lasttype</span><span>Per container</span><span>Behov</span><span>Kapasitet hvis alene</span><span>Last / trailer</span></div>
              {model.loadRows.map((row) => <div className="table-row" key={row.key}><span><strong>{row.label}</strong><small>{row.dimensions}</small></span><span>{row.perContainer} stk</span><span>{formatNumber(row.containersNeeded)} cont.</span><span>{formatNumber(row.capacityDrumEq)} drum eq.</span><span>{formatNumber(row.loadedWeight)} kg / {row.containersPerTrailer} cont.</span></div>)}
            </div>
            <section className="warnings" aria-label="Begrensninger">{warnings.map((warning) => <div className={`warning ${warning.level}`} key={warning.text}><AlertTriangle size={17} /><span>{warning.text}</span></div>)}</section>
          </section>
        </div>
      </section>
    </main>
  );
}

function ArchitecturalPlan({ model, subtractObstructions, useLager2Extension }) {
  return <div className="plan-shell"><div className="plan-canvas" style={{ aspectRatio: `${model.planWidth} / ${model.planLength}` }}><div className="dimension dimension-width">16 850 mm + 500 mm + 16 850 mm</div><div className="dimension dimension-height">Lager 2: {model.planLength.toFixed(0)} m</div>{model.roomModels.map((room) => <PlanRoom key={room.key} room={room} model={model} />)}<div className="separator" style={{ left: `${(16.85 / model.planWidth) * 100}%`, width: `${(separatorWidth / model.planWidth) * 100}%` }} />{subtractObstructions && <div className="blocked blocked-l1">Personsluse 1<br />4.85 x 1.8 m</div>}{subtractObstructions && <div className="blocked blocked-l2">Forrom / sluse<br />5.15 x 6.99 m</div>}{useLager2Extension && <div className="extension-label">Rosa felt lagt til som tilgjengelig Lager 2-areal</div>}</div><div className="plan-legend"><span><i className="legend-storage" />Lagerareal</span><span><i className="legend-blocked" />Fratrekk/sluser</span><span><i className="legend-extension" />Utvidet areal</span></div></div>;
}

function PlanRoom({ room, model }) {
  const cells = Math.min(96, room.floorSlots);
  return <article className={`plan-room ${room.key}`} style={{ left: `${room.leftPct}%`, top: `${room.topPct}%`, width: `${room.widthPct}%`, height: `${room.heightPct}%` }}><div className="plan-room-header"><strong>{room.label}</strong><span>{room.width.toFixed(2)} x {room.displayLength.toFixed(2)} m</span></div><div className="storage-zone">{Array.from({ length: cells }).map((_, index) => <span key={index} className="container-cell">{model.levels}</span>)}</div><div className="plan-room-footer">{room.totalSlots} plasser · {room.rows} rader x {room.cols} lengder</div></article>;
}

function buildWarnings({ model, stackLimit, drumWeight, steelWeight, drumShare, steelShare }) {
  const warnings = [];
  if (model.mixedCoverage < 1) warnings.push({ level: "critical", text: `Blandet scenario mangler ca. ${formatNumber(model.requiredContainers - model.totalContainerSlots)} containerplasser.` });
  if (stackLimit > 4) warnings.push({ level: "warn", text: "5 i høyden er kun testmodus. Nederste kasse/container må kontrolleres for trykkbelastning." });
  if (drumWeight > 330) warnings.push({ level: "critical", text: "Tønnevekt overstiger 330 kg UN-/spesifikasjonsgrensen fra rapporten." });
  if (steelWeight > 2500) warnings.push({ level: "warn", text: "Stålkassevekt overstiger 2500 kg truckgrense. Alternativ løftemetode må vurderes." });
  if (steelWeight > 3000) warnings.push({ level: "critical", text: "Stålkassevekt overstiger antatt 3000 kg stålkassegrense." });
  if (drumShare + steelShare > 100) warnings.push({ level: "critical", text: "Andel 210L + stålkasser er over 100%. Reduser én av sliderne." });
  for (const row of model.loadRows) {
    if (row.perContainer === 0) warnings.push({ level: "critical", text: `${row.label} kan ikke pakkes med gjeldende vekt-/dosegrense.` });
    else if (row.packageDose > 2) warnings.push({ level: "warn", text: `${row.label} har dose over 2 mSv/h per kolli og bør håndteres særskilt.` });
  }
  if (warnings.length === 0) warnings.push({ level: "ok", text: "Ingen åpenbare brudd med gjeldende simuleringsgrenser." });
  return warnings;
}

function SummaryCard({ icon, label, value, unit }) { return <article className="summary-card">{React.cloneElement(icon, { size: 20 })}<span>{label}</span><strong>{formatNumber(value)}</strong><small>{unit}</small></article>; }
function PanelTitle({ icon, title }) { return <div className="panel-title">{React.cloneElement(icon, { size: 18 })}<strong>{title}</strong></div>; }
function Slider({ label, value, min, max, step, unit, onChange }) { return <label className="field"><div className="field-label"><span>{label}</span><strong>{formatNumber(value)} {unit}</strong></div><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>; }
function Toggle({ label, checked, onChange }) { return <label className="toggle"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>; }
function Segmented({ options, value, onChange }) { return <div className="segments">{Object.entries(options).map(([key, option]) => <button key={key} className={value === key ? "active" : ""} onClick={() => onChange(key)} type="button">{option.label}</button>)}</div>; }
function formatNumber(value) { if (!Number.isFinite(value)) return "∞"; return new Intl.NumberFormat("nb-NO", { maximumFractionDigits: value < 10 ? 1 : 0 }).format(value); }

createRoot(document.getElementById("root")).render(<App />);
