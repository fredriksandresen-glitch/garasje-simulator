import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Car, DoorOpen, Gauge, Home, Ruler } from "lucide-react";
import "./styles.css";

const carTypes = {
  compact: { label: "Kompaktbil", length: 4.25, width: 1.8 },
  suv: { label: "SUV", length: 4.85, width: 1.98 },
  van: { label: "Varebil", length: 5.35, width: 2.08 }
};

function App() {
  const [garageWidth, setGarageWidth] = useState(6.2);
  const [garageDepth, setGarageDepth] = useState(6.8);
  const [doorWidth, setDoorWidth] = useState(3.0);
  const [carType, setCarType] = useState("suv");

  const car = carTypes[carType];
  const metrics = useMemo(() => {
    const sideClearance = (garageWidth - car.width) / 2;
    const frontBackClearance = garageDepth - car.length;
    const doorClearance = doorWidth - car.width;
    const area = garageWidth * garageDepth;
    const score = Math.max(
      0,
      Math.min(100, Math.round(sideClearance * 18 + frontBackClearance * 15 + doorClearance * 20 + 35))
    );

    return { sideClearance, frontBackClearance, doorClearance, area, score };
  }, [car, garageDepth, garageWidth, doorWidth]);

  return (
    <main className="app-shell">
      <section className="simulator">
        <div className="topbar">
          <div>
            <p className="eyebrow">Garasje Simulator</p>
            <h1>Planlegg garasjen før du bygger</h1>
          </div>
          <div className="score" aria-label="Plass-score">
            <Gauge size={20} />
            <span>{metrics.score}</span>
          </div>
        </div>

        <div className="workspace">
          <aside className="controls" aria-label="Garasjeinnstillinger">
            <Control icon={<Ruler size={18} />} label="Bredde" value={garageWidth} min={3.5} max={9} step={0.1} unit="m" onChange={setGarageWidth} />
            <Control icon={<Home size={18} />} label="Dybde" value={garageDepth} min={4.5} max={10} step={0.1} unit="m" onChange={setGarageDepth} />
            <Control icon={<DoorOpen size={18} />} label="Port" value={doorWidth} min={2.2} max={5.5} step={0.1} unit="m" onChange={setDoorWidth} />

            <div className="field">
              <div className="field-label">
                <Car size={18} />
                <span>Biltype</span>
              </div>
              <div className="segments">
                {Object.entries(carTypes).map(([key, option]) => (
                  <button key={key} className={carType === key ? "active" : ""} onClick={() => setCarType(key)} type="button">
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="garage-stage" aria-label="Garasjevisning">
            <div className="garage" style={{ aspectRatio: `${garageWidth} / ${garageDepth}` }}>
              <div className="back-wall">Arbeidsbenk</div>
              <div
                className="car"
                style={{
                  width: `${Math.min(82, (car.width / garageWidth) * 100)}%`,
                  height: `${Math.min(78, (car.length / garageDepth) * 100)}%`
                }}
              >
                <div className="windshield" />
                <Car size={44} strokeWidth={1.6} />
                <span>{car.label}</span>
              </div>
              <div className="door" style={{ width: `${Math.min(92, (doorWidth / garageWidth) * 100)}%` }} />
            </div>
          </section>
        </div>

        <section className="metrics" aria-label="Nøkkeltall">
          <Metric label="Sideklaring" value={metrics.sideClearance} unit="m" />
          <Metric label="Foran/bak" value={metrics.frontBackClearance} unit="m" />
          <Metric label="Portklaring" value={metrics.doorClearance} unit="m" />
          <Metric label="Areal" value={metrics.area} unit="m²" />
        </section>
      </section>
    </main>
  );
}

function Control({ icon, label, value, min, max, step, unit, onChange }) {
  return (
    <label className="field">
      <div className="field-label">
        {icon}
        <span>{label}</span>
        <strong>{value.toFixed(1)} {unit}</strong>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function Metric({ label, value, unit }) {
  const status = value < 0.3 ? "tight" : value < 0.8 ? "ok" : "good";
  return (
    <div className={`metric ${status}`}>
      <span>{label}</span>
      <strong>{value.toFixed(1)} {unit}</strong>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
