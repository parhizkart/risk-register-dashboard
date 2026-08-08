import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, ReferenceLine, Legend,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  TOKENS                                                             */
/* ------------------------------------------------------------------ */

const C = {
  ink: "#131A20",
  ink80: "#38444D",
  steel: "#5C7280",
  field: "#EDEFEE",
  panel: "#FFFFFF",
  line: "#D5DAD9",
  lineSoft: "#E6E9E8",
  arcSolid: "#0E7C86",
  band: ["#6E8F86", "#A8AE68", "#D9A441", "#C4692F", "#97302B"],
};

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
const SANS = 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const label = {
  fontFamily: MONO,
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: C.steel,
};

/* ------------------------------------------------------------------ */
/*  METHOD — CPUC RAMP / S-MAP style multi-attribute value function     */
/* ------------------------------------------------------------------ */

// Impact level 1..7 -> normalized attribute value 0..100 (log-spaced)
const VALUE_OF_LEVEL = [0, 0.1, 0.3, 1, 3.3, 10, 33.3, 100];

const SCALES = {
  safety: [
    "", "First-aid case", "OSHA-recordable injury", "Serious injury (1)",
    "Serious injury (multiple)", "Single fatality", "Multiple fatalities (2–10)",
    "Mass casualty (>10)",
  ],
  reliability: [
    "", "<1k customer-hours", "~10k customer-hours", "~100k customer-hours",
    "~1M customer-hours", "~10M customer-hours", "~50M customer-hours",
    ">100M customer-hours",
  ],
  financial: [
    "", "<$1M", "~$10M", "~$50M", "~$250M", "~$1B", "~$5B", ">$10B",
  ],
};

const CATEGORIES = [
  "Wildfire & climate", "Safety", "Asset & operations",
  "Cyber & physical security", "Enterprise & workforce",
];

/* ------------------------------------------------------------------ */
/*  SEED REGISTER                                                      */
/* ------------------------------------------------------------------ */

const SEED = [
  {
    id: "R-01", name: "Wildfire ignition — overhead lines",
    category: "Wildfire & climate", owner: "VP, Wildfire Mitigation",
    lore: 6.0, loreBasis: "10-yr ignition history normalized to HFTD circuit-miles",
    safety: 7, reliability: 5, financial: 7, ce: 0.55, velocity: "High", trend: "down",
    drivers: ["Conductor or hardware failure", "Vegetation contact", "Third-party contact", "Animal contact"],
    consequences: ["Catastrophic wildfire", "Fatalities and injuries", "Property destruction", "Inverse-condemnation liability"],
    crossCutting: ["Climate change", "Asset age", "Contractor management"],
    mitigations: [
      { name: "Covered conductor — HFTD Tier 3", cost: 1450, reduction: 0.34, status: "Funded" },
      { name: "Enhanced vegetation management", cost: 620, reduction: 0.12, status: "Funded" },
      { name: "Fast-curve relay settings", cost: 48, reduction: 0.09, status: "Funded" },
      { name: "Targeted undergrounding", cost: 2100, reduction: 0.18, status: "Proposed" },
    ],
  },
  {
    id: "R-02", name: "Public Safety Power Shutoff execution",
    category: "Wildfire & climate", owner: "Dir., Emergency Management",
    lore: 14.0, loreBasis: "Modeled de-energization events per season, 2020–2025 weather record",
    safety: 4, reliability: 6, financial: 3, ce: 0.6, velocity: "High", trend: "flat",
    drivers: ["Extreme fire weather", "Circuit-level risk exceedance", "Forecast uncertainty"],
    consequences: ["Medical-baseline customer harm", "Extended outage", "Regulatory penalty"],
    crossCutting: ["Climate change", "Customer vulnerability", "Emergency preparedness"],
    mitigations: [
      { name: "Sectionalizing devices and switches", cost: 210, reduction: 0.22, status: "Funded" },
      { name: "Community resource centers", cost: 65, reduction: 0.10, status: "Funded" },
      { name: "Microgrids at critical facilities", cost: 340, reduction: 0.14, status: "Proposed" },
    ],
  },
  {
    id: "R-03", name: "Contact with energized equipment",
    category: "Safety", owner: "Chief Safety Officer",
    lore: 3.5, loreBasis: "Serious-injury and fatality precursor events per year",
    safety: 6, reliability: 1, financial: 3, ce: 0.65, velocity: "High", trend: "down",
    drivers: ["Procedure non-compliance", "Inadequate isolation", "Fatigue", "Contractor qualification"],
    consequences: ["Employee or contractor fatality", "Regulatory citation", "Work stoppage"],
    crossCutting: ["Contractor management", "Workforce experience", "Safety culture"],
    mitigations: [
      { name: "Human performance / HOP program", cost: 34, reduction: 0.20, status: "Funded" },
      { name: "Contractor qualification overhaul", cost: 18, reduction: 0.15, status: "Funded" },
      { name: "Wearable proximity alarms", cost: 27, reduction: 0.08, status: "Under review" },
    ],
  },
  {
    id: "R-04", name: "Motor vehicle incident — fleet",
    category: "Safety", owner: "Dir., Fleet Services",
    lore: 42.0, loreBasis: "Preventable collisions per year, 5-yr average",
    safety: 5, reliability: 1, financial: 2, ce: 0.5, velocity: "High", trend: "flat",
    drivers: ["Distracted driving", "Speed", "Third-party at-fault", "Night and storm response driving"],
    consequences: ["Public or employee fatality", "Third-party liability", "Fleet downtime"],
    crossCutting: ["Workforce experience", "Storm response"],
    mitigations: [
      { name: "Telematics with in-cab coaching", cost: 22, reduction: 0.28, status: "Funded" },
      { name: "Collision-avoidance retrofits", cost: 41, reduction: 0.19, status: "Proposed" },
    ],
  },
  {
    id: "R-05", name: "Cyber attack on OT / SCADA",
    category: "Cyber & physical security", owner: "CISO",
    lore: 0.12, loreBasis: "Expert elicitation anchored to sector intrusion-to-impact base rate",
    safety: 5, reliability: 7, financial: 6, ce: 0.7, velocity: "Very high", trend: "up",
    drivers: ["Nation-state intrusion", "Supply-chain compromise", "Insider action", "Unpatched field devices"],
    consequences: ["Loss of grid control", "Extended regional outage", "NERC CIP penalty"],
    crossCutting: ["Third-party / vendor dependence", "IT-OT convergence", "Legacy technology"],
    mitigations: [
      { name: "OT network segmentation", cost: 96, reduction: 0.30, status: "Funded" },
      { name: "24/7 OT detection and response", cost: 58, reduction: 0.22, status: "Funded" },
      { name: "Vendor SBOM and firmware attestation", cost: 12, reduction: 0.09, status: "Proposed" },
    ],
  },
  {
    id: "R-06", name: "Physical attack on substations",
    category: "Cyber & physical security", owner: "Dir., Corporate Security",
    lore: 1.1, loreBasis: "Reported intrusion and ballistic events per year across service territory",
    safety: 3, reliability: 6, financial: 4, ce: 0.45, velocity: "Very high", trend: "up",
    drivers: ["Ballistic attack", "Forced entry / copper theft", "Coordinated multi-site action"],
    consequences: ["Transformer loss", "Regional load loss", "Long lead-time replacement"],
    crossCutting: ["Supply chain", "Critical asset concentration"],
    mitigations: [
      { name: "Ballistic barriers at critical stations", cost: 130, reduction: 0.26, status: "Proposed" },
      { name: "Intrusion detection and remote monitoring", cost: 44, reduction: 0.20, status: "Funded" },
    ],
  },
  {
    id: "R-07", name: "Transmission asset failure",
    category: "Asset & operations", owner: "VP, Transmission",
    lore: 2.4, loreBasis: "Catastrophic bank / breaker failures per year, fleet reliability model",
    safety: 3, reliability: 6, financial: 5, ce: 0.55, velocity: "Medium", trend: "up",
    drivers: ["Insulation and bushing degradation", "Through-fault duty", "End-of-life population", "Deferred overhaul"],
    consequences: ["Bulk-system outage", "Fire or oil release", "Multi-year replacement lead time"],
    crossCutting: ["Asset age", "Supply chain", "Data quality"],
    mitigations: [
      { name: "Online DGA and bushing monitoring", cost: 38, reduction: 0.24, status: "Funded" },
      { name: "Risk-ranked bank replacement", cost: 480, reduction: 0.31, status: "Funded" },
      { name: "Strategic spares program", cost: 155, reduction: 0.16, status: "Under review" },
    ],
  },
  {
    id: "R-08", name: "Underground equipment failure",
    category: "Asset & operations", owner: "Dir., Distribution Engineering",
    lore: 18.0, loreBasis: "Vault and manhole faults with energy release per year",
    safety: 5, reliability: 4, financial: 3, ce: 0.4, velocity: "High", trend: "up",
    drivers: ["Cable insulation degradation", "Water intrusion", "Splice workmanship", "Load cycling"],
    consequences: ["Manhole event / public injury", "Network outage", "Street disruption"],
    crossCutting: ["Asset age", "Data quality", "Urban density"],
    mitigations: [
      { name: "Cable diagnostics and injection", cost: 88, reduction: 0.25, status: "Funded" },
      { name: "Vented / latched manhole covers", cost: 19, reduction: 0.17, status: "Funded" },
    ],
  },
  {
    id: "R-09", name: "Hydro dam and penstock integrity",
    category: "Asset & operations", owner: "Dir., Hydro Generation",
    lore: 0.02, loreBasis: "FERC Part 12D probabilistic dam-failure assessment",
    safety: 7, reliability: 4, financial: 6, ce: 0.75, velocity: "Medium", trend: "flat",
    drivers: ["Seismic loading", "Extreme inflow / PMF", "Seepage and internal erosion", "Spillway gate failure"],
    consequences: ["Downstream inundation", "Mass casualty", "Facility loss"],
    crossCutting: ["Climate change", "Asset age", "Emergency preparedness"],
    mitigations: [
      { name: "Spillway and gate rehabilitation", cost: 210, reduction: 0.28, status: "Funded" },
      { name: "Instrumentation and monitoring upgrade", cost: 26, reduction: 0.15, status: "Funded" },
    ],
  },
  {
    id: "R-10", name: "Third-party dig-in on underground assets",
    category: "Asset & operations", owner: "Dir., Damage Prevention",
    lore: 260.0, loreBasis: "Excavation damages per year, 811 ticket volume normalized",
    safety: 4, reliability: 3, financial: 2, ce: 0.5, velocity: "High", trend: "flat",
    drivers: ["No 811 notification", "Mismarked facilities", "Inaccurate records", "Excavator practice"],
    consequences: ["Excavator injury", "Localized outage", "Restoration cost"],
    crossCutting: ["Data quality", "Third-party behavior", "Urban construction cycle"],
    mitigations: [
      { name: "GIS record accuracy remediation", cost: 31, reduction: 0.21, status: "Funded" },
      { name: "Excavator education and enforcement", cost: 9, reduction: 0.12, status: "Funded" },
    ],
  },
  {
    id: "R-11", name: "Extreme weather and climate stress",
    category: "Wildfire & climate", owner: "Chief Resilience Officer",
    lore: 4.5, loreBasis: "Major-event-day count per year, NOAA-conditioned projection",
    safety: 4, reliability: 6, financial: 4, ce: 0.35, velocity: "High", trend: "up",
    drivers: ["Heat storms and load exceedance", "Atmospheric river / flooding", "High wind", "Sea-level rise at coastal substations"],
    consequences: ["Widespread outage", "Asset inundation", "Restoration surge cost"],
    crossCutting: ["Climate change", "Mutual aid capacity", "Asset siting"],
    mitigations: [
      { name: "Substation flood hardening", cost: 175, reduction: 0.20, status: "Proposed" },
      { name: "Thermal uprate and dynamic ratings", cost: 62, reduction: 0.13, status: "Funded" },
      { name: "Storm response and mutual aid scaling", cost: 28, reduction: 0.11, status: "Funded" },
    ],
  },
  {
    id: "R-12", name: "Critical skills loss and workforce capability",
    category: "Enterprise & workforce", owner: "Chief Human Resources Officer",
    lore: 1.0, loreBasis: "Annualized capability-gap events; attrition and retirement projection",
    safety: 4, reliability: 4, financial: 4, ce: 0.4, velocity: "Low", trend: "up",
    drivers: ["Retirement wave", "Labor market competition", "Training pipeline capacity"],
    consequences: ["Execution shortfall on capital program", "Error rate increase", "Escalated contractor cost"],
    crossCutting: ["Workforce experience", "Contractor management", "Program scale-up"],
    mitigations: [
      { name: "Lineworker apprenticeship expansion", cost: 54, reduction: 0.24, status: "Funded" },
      { name: "Knowledge capture for critical roles", cost: 7, reduction: 0.10, status: "Under review" },
    ],
  },
  {
    id: "R-13", name: "Supply chain disruption — long lead assets",
    category: "Enterprise & workforce", owner: "Chief Procurement Officer",
    lore: 2.0, loreBasis: "Material shortfall events affecting capital delivery per year",
    safety: 2, reliability: 5, financial: 4, ce: 0.3, velocity: "Medium", trend: "up",
    drivers: ["Transformer lead times", "Conductor and cable allocation", "Single-source vendors", "Tariff and trade policy"],
    consequences: ["Capital program delay", "Deferred risk reduction", "Cost escalation"],
    crossCutting: ["Third-party / vendor dependence", "Program scale-up"],
    mitigations: [
      { name: "Multi-year strategic sourcing agreements", cost: 15, reduction: 0.22, status: "Funded" },
      { name: "Standardized designs and inventory pooling", cost: 33, reduction: 0.18, status: "Proposed" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  COMPUTATION                                                        */
/* ------------------------------------------------------------------ */

const fmt = (n, d = 1) =>
  n >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 0 })
            : n.toLocaleString(undefined, { maximumFractionDigits: d });

function score(r, w) {
  const core =
    w.safety * VALUE_OF_LEVEL[r.safety] +
    w.reliability * VALUE_OF_LEVEL[r.reliability] +
    w.financial * VALUE_OF_LEVEL[r.financial];
  const inherent = r.lore * core;
  const residual = inherent * (1 - r.ce);
  const mits = (r.mitigations || []).map((m) => ({
    ...m,
    riskReduced: residual * m.reduction,
    rse: m.cost > 0 ? (residual * m.reduction) / m.cost : 0,
  }));
  return {
    ...r, core, inherent, residual, mits,
    mitCost: mits.reduce((a, m) => a + m.cost, 0),
    mitReduction: mits.reduce((a, m) => a + m.riskReduced, 0),
  };
}

const freqBand = (l) => (l < 0.1 ? 0 : l < 1 ? 1 : l < 10 ? 2 : l < 100 ? 3 : 4);
const consBand = (c) => (c < 1 ? 0 : c < 5 ? 1 : c < 20 ? 2 : c < 50 ? 3 : 4);
const cellLevel = (f, c) => Math.min(4, Math.round((f + c) / 2));

const FREQ_LABELS = ["<0.1/yr", "0.1–1/yr", "1–10/yr", "10–100/yr", ">100/yr"];
const CONS_LABELS = ["Minor", "Moderate", "Major", "Severe", "Catastrophic"];

/* ------------------------------------------------------------------ */
/*  SMALL PARTS                                                        */
/* ------------------------------------------------------------------ */

function Eyebrow({ children, style: s }) {
  return <div style={{ ...label, ...s }}>{children}</div>;
}

function Num({ children, size = 13, weight = 500, color = C.ink }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: size, fontWeight: weight, color, fontVariantNumeric: "tabular-nums" }}>
      {children}
    </span>
  );
}

function BandChip({ level, children }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5"
      style={{
        fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em",
        background: C.band[level], color: "#fff", borderRadius: 2,
      }}
    >
      {children}
    </span>
  );
}

function Trend({ dir }) {
  const map = { up: ["▲", C.band[4]], down: ["▼", C.band[0]], flat: ["■", C.steel] };
  const [g, col] = map[dir] || map.flat;
  return <span style={{ color: col, fontSize: 9 }}>{g}</span>;
}

/* ------------------------------------------------------------------ */
/*  MAIN                                                               */
/* ------------------------------------------------------------------ */

export default function RiskRegister() {
  const [risks, setRisks] = useState(SEED);
  const [weights, setWeights] = useState({ safety: 0.5, reliability: 0.25, financial: 0.25 });
  const [tab, setTab] = useState("register");
  const [selected, setSelected] = useState("R-01");
  const [sortKey, setSortKey] = useState("residual");
  const [filter, setFilter] = useState("All");
  const [loaded, setLoaded] = useState(false);
  const [saveNote, setSaveNote] = useState("");

  /* persistence ---------------------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("utility-risk-register:v1");
        if (r && r.value) {
          const p = JSON.parse(r.value);
          if (p.risks) setRisks(p.risks);
          if (p.weights) setWeights(p.weights);
        }
      } catch (e) {
        /* no saved register yet — start from the seed */
      } finally { setLoaded(true); }
    })();
  }, []);

  const saveTimer = useRef(null);
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await window.storage.set("utility-risk-register:v1", JSON.stringify({ risks, weights }));
        setSaveNote("Saved " + new Date().toLocaleTimeString());
      } catch (e) {
        setSaveNote("Working in this session only — changes are not being saved");
      }
    }, 600);
  }, [risks, weights, loaded]);

  /* derived -------------------------------------------------------- */
  const scored = useMemo(() => risks.map((r) => score(r, weights)), [risks, weights]);
  const shown = useMemo(() => {
    const s = filter === "All" ? scored : scored.filter((r) => r.category === filter);
    return [...s].sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0));
  }, [scored, sortKey, filter]);

  const sel = scored.find((r) => r.id === selected) || scored[0];

  const totals = useMemo(() => {
    const inh = scored.reduce((a, r) => a + r.inherent, 0);
    const res = scored.reduce((a, r) => a + r.residual, 0);
    const cost = scored.reduce((a, r) => a + r.mitCost, 0);
    const red = scored.reduce((a, r) => a + r.mitReduction, 0);
    return { inh, res, cost, red, rse: cost ? red / cost : 0 };
  }, [scored]);

  const portfolio = useMemo(() => {
    const all = scored.flatMap((r) => r.mits.map((m) => ({ ...m, riskId: r.id, riskName: r.name })));
    all.sort((a, b) => b.rse - a.rse);
    let cc = 0, cr = 0;
    return all.map((m) => { cc += m.cost; cr += m.riskReduced; return { ...m, cumCost: cc, cumReduction: cr }; });
  }, [scored]);

  /* mutations ------------------------------------------------------ */
  const patch = (id, key, val) =>
    setRisks((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: val } : r)));

  const addRisk = () => {
    const n = `R-${String(risks.length + 1).padStart(2, "0")}`;
    setRisks((rs) => [...rs, {
      id: n, name: "New risk — rename", category: "Asset & operations", owner: "Unassigned",
      lore: 1, loreBasis: "Basis not yet documented", safety: 3, reliability: 3, financial: 3,
      ce: 0.3, velocity: "Medium", trend: "flat", drivers: [], consequences: [],
      crossCutting: [], mitigations: [],
    }]);
    setSelected(n); setTab("register");
  };

  const exportCsv = () => {
    const head = [
      "risk_id", "risk_name", "category", "risk_owner", "lore_events_per_year", "lore_basis",
      "safety_level", "reliability_level", "financial_level", "core_mavf",
      "inherent_risk_score", "control_effectiveness", "residual_risk_score",
      "velocity", "trend", "drivers", "consequences", "cross_cutting_factors",
      "mitigation", "mitigation_cost_musd", "residual_reduction_pct", "rse_risk_units_per_musd", "mitigation_status",
    ];
    const rows = [];
    scored.forEach((r) => {
      const base = [
        r.id, r.name, r.category, r.owner, r.lore, r.loreBasis,
        r.safety, r.reliability, r.financial, r.core.toFixed(2),
        r.inherent.toFixed(2), r.ce, r.residual.toFixed(2),
        r.velocity, r.trend,
        (r.drivers || []).join("; "), (r.consequences || []).join("; "), (r.crossCutting || []).join("; "),
      ];
      if (!r.mits.length) rows.push([...base, "", "", "", "", ""]);
      r.mits.forEach((m) => rows.push([...base, m.name, m.cost, m.reduction, m.rse.toFixed(3), m.status]));
    });
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [head, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = "risk-register.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------------------------------------------------------------- */

  const TABS = [
    ["register", "Register"],
    ["heatmap", "Heat map"],
    ["portfolio", "Mitigation portfolio"],
    ["method", "Method & template"],
  ];

  return (
    <div style={{ background: C.field, color: C.ink, fontFamily: SANS, minHeight: "100%" }}>
      <style>{`
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
        .rr-row:hover { background: #F5F7F6; }
        .rr-tab:focus-visible, .rr-btn:focus-visible, .rr-row:focus-visible {
          outline: 2px solid ${C.arcSolid}; outline-offset: -2px; }
        input[type=range] { accent-color: ${C.arcSolid}; }
        @media (max-width: 900px) { .rr-split { grid-template-columns: minmax(0,1fr) !important; } }
      `}</style>

      {/* HEADER ---------------------------------------------------- */}
      <header style={{ background: C.ink, color: "#fff" }}>
        <div className="px-5 pt-4 pb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div style={{ ...label, color: "#7E8F99" }}>Enterprise risk register · electric utility</div>
            <h1 style={{ fontFamily: MONO, fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", marginTop: 4 }}>
              Risk &amp; Mitigation Portfolio
            </h1>
          </div>
          <div className="flex items-end gap-6">
            {[["Risks", scored.length], ["Residual", fmt(totals.res, 0)], ["Portfolio $M", fmt(totals.cost, 0)],
              ["Portfolio RSE", fmt(totals.rse, 2)]].map(([k, v]) => (
              <div key={k}>
                <div style={{ ...label, color: "#7E8F99" }}>{k}</div>
                <Num size={17} weight={600} color="#fff">{v}</Num>
              </div>
            ))}
          </div>
        </div>
        <nav className="px-5 flex gap-1 flex-wrap">
          {TABS.map(([k, v]) => (
            <button key={k} onClick={() => setTab(k)} className="rr-tab px-3 py-2"
              style={{
                fontFamily: MONO, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
                background: "transparent", border: 0, cursor: "pointer",
                color: tab === k ? "#fff" : "#7E8F99",
                borderBottom: `2px solid ${tab === k ? C.band[2] : "transparent"}`,
              }}>
              {v}
            </button>
          ))}
        </nav>
      </header>

      {/* WEIGHTS BAR ----------------------------------------------- */}
      <div className="px-5 py-2 flex flex-wrap items-center gap-x-6 gap-y-2"
        style={{ background: C.panel, borderBottom: `1px solid ${C.line}` }}>
        <Eyebrow>MAVF attribute weights</Eyebrow>
        {["safety", "reliability", "financial"].map((k) => (
          <label key={k} className="flex items-center gap-2">
            <span style={{ ...label, color: C.ink80 }}>{k.slice(0, 3)}</span>
            <input type="range" min={0} max={1} step={0.05} value={weights[k]}
              onChange={(e) => {
                const v = +e.target.value;
                const others = ["safety", "reliability", "financial"].filter((o) => o !== k);
                const rest = 1 - v, cur = weights[others[0]] + weights[others[1]] || 1;
                setWeights({
                  [k]: v,
                  [others[0]]: +(rest * (weights[others[0]] / cur)).toFixed(3),
                  [others[1]]: +(rest * (weights[others[1]] / cur)).toFixed(3),
                });
              }}
              style={{ width: 82 }} />
            <Num size={11}>{weights[k].toFixed(2)}</Num>
          </label>
        ))}
        <div className="flex-1" />
        <button className="rr-btn px-3 py-1" onClick={addRisk}
          style={{ fontFamily: MONO, fontSize: 11, background: C.ink, color: "#fff", border: 0, borderRadius: 2, cursor: "pointer" }}>
          + Add risk
        </button>
        <button className="rr-btn px-3 py-1" onClick={exportCsv}
          style={{ fontFamily: MONO, fontSize: 11, background: "transparent", color: C.ink, border: `1px solid ${C.line}`, borderRadius: 2, cursor: "pointer" }}>
          Export CSV
        </button>
        <span style={{ ...label, fontSize: 9 }}>{saveNote}</span>
      </div>

      <main className="p-5">
        {tab === "register" && (
          <div className="rr-split grid gap-5" style={{ gridTemplateColumns: "minmax(0,1.65fr) minmax(0,1fr)" }}>
            <Register {...{ shown, sortKey, setSortKey, filter, setFilter, selected, setSelected }} />
            <Detail risk={sel} patch={patch} weights={weights} />
          </div>
        )}
        {tab === "heatmap" && <Heatmap scored={scored} onPick={(id) => { setSelected(id); setTab("register"); }} />}
        {tab === "portfolio" && <Portfolio portfolio={portfolio} totals={totals} />}
        {tab === "method" && <Method weights={weights} />}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  REGISTER TABLE                                                     */
/* ------------------------------------------------------------------ */

function Register({ shown, sortKey, setSortKey, filter, setFilter, selected, setSelected }) {
  const max = Math.max(...shown.map((r) => r.inherent), 1);
  const cols = [
    ["id", "ID", 54], ["name", "Risk", null], ["lore", "LoRE /yr", 76],
    ["core", "CoRE", 62], ["inherent", "Inherent", 74], ["residual", "Residual", 150],
  ];
  return (
    <section style={{ background: C.panel, border: `1px solid ${C.line}` }}>
      <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.line}` }}>
        <Eyebrow>Register — ranked by {sortKey === "residual" ? "residual risk" : sortKey}</Eyebrow>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            style={{ fontFamily: MONO, fontSize: 11, border: `1px solid ${C.line}`, padding: "2px 4px", background: "#fff" }}>
            {["All", ...CATEGORIES].map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}
            style={{ fontFamily: MONO, fontSize: 11, border: `1px solid ${C.line}`, padding: "2px 4px", background: "#fff" }}>
            <option value="residual">Residual</option>
            <option value="inherent">Inherent</option>
            <option value="lore">Frequency</option>
            <option value="core">Consequence</option>
            <option value="mitCost">Mitigation cost</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              {cols.map(([k, t, w]) => (
                <th key={k} style={{ ...label, width: w, textAlign: k === "name" || k === "id" ? "left" : "right", padding: "6px 10px", fontWeight: 400 }}>
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const lvl = cellLevel(freqBand(r.lore), consBand(r.core));
              const on = r.id === selected;
              return (
                <tr key={r.id} className="rr-row" tabIndex={0} onClick={() => setSelected(r.id)}
                  onKeyDown={(e) => e.key === "Enter" && setSelected(r.id)}
                  style={{ borderBottom: `1px solid ${C.lineSoft}`, cursor: "pointer", background: on ? "#EFF5F5" : undefined }}>
                  <td className="px-2.5 py-2" style={{ borderLeft: `3px solid ${on ? C.arcSolid : "transparent"}` }}>
                    <Num size={11} color={C.steel}>{r.id}</Num>
                  </td>
                  <td className="px-2.5 py-2">
                    <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}>{r.name}</div>
                    <div style={{ ...label, fontSize: 9, marginTop: 2 }}>
                      {r.category} · {r.owner} <Trend dir={r.trend} />
                    </div>
                  </td>
                  <td className="px-2.5 py-2 text-right"><Num size={12}>{fmt(r.lore, 2)}</Num></td>
                  <td className="px-2.5 py-2 text-right"><Num size={12}>{fmt(r.core, 1)}</Num></td>
                  <td className="px-2.5 py-2 text-right"><Num size={12} color={C.steel}>{fmt(r.inherent, 0)}</Num></td>
                  <td className="px-2.5 py-2">
                    <div className="flex items-center gap-2 justify-end">
                      <div style={{ position: "relative", flex: 1, height: 9, background: C.lineSoft, minWidth: 60 }}>
                        <div style={{ position: "absolute", inset: 0, width: `${(r.inherent / max) * 100}%`, background: C.lineSoft, borderRight: `1px dashed ${C.steel}` }} />
                        <div style={{ position: "absolute", top: 0, bottom: 0, width: `${(r.residual / max) * 100}%`, background: C.band[lvl], transition: "width .25s" }} />
                      </div>
                      <Num size={12} weight={600}>{fmt(r.residual, 0)}</Num>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2" style={{ ...label, fontSize: 9, borderTop: `1px solid ${C.line}` }}>
        Solid bar = residual risk after controls · dashed marker = inherent risk before controls
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  DETAIL                                                             */
/* ------------------------------------------------------------------ */

function Detail({ risk: r, patch, weights }) {
  if (!r) return null;
  const attrs = [["safety", "Safety"], ["reliability", "Reliability"], ["financial", "Financial"]];
  return (
    <section style={{ background: C.panel, border: `1px solid ${C.line}` }}>
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
        <Eyebrow>{r.id} · risk sheet</Eyebrow>
        <input value={r.name} onChange={(e) => patch(r.id, "name", e.target.value)}
          style={{ fontSize: 16, fontWeight: 600, border: 0, outline: "none", width: "100%", marginTop: 4, background: "transparent", color: C.ink }} />
        <div style={{ ...label, fontSize: 9, marginTop: 2 }}>{r.owner} · velocity {r.velocity}</div>
      </div>

      {/* bow-tie */}
      <div className="px-4 py-3 grid grid-cols-2 gap-4" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div>
          <Eyebrow>Drivers</Eyebrow>
          <ul className="mt-1.5" style={{ fontSize: 12, lineHeight: 1.55 }}>
            {r.drivers.map((d) => <li key={d} style={{ paddingLeft: 10, textIndent: -10 }}>› {d}</li>)}
          </ul>
        </div>
        <div>
          <Eyebrow>Consequences</Eyebrow>
          <ul className="mt-1.5" style={{ fontSize: 12, lineHeight: 1.55 }}>
            {r.consequences.map((d) => <li key={d} style={{ paddingLeft: 10, textIndent: -10 }}>› {d}</li>)}
          </ul>
        </div>
        <div className="col-span-2">
          <Eyebrow>Cross-cutting factors</Eyebrow>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {r.crossCutting.map((c) => (
              <span key={c} style={{ fontFamily: MONO, fontSize: 10, border: `1px solid ${C.line}`, padding: "2px 6px", color: C.ink80 }}>{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* scoring */}
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.line}` }}>
        <Eyebrow>Frequency — LoRE</Eyebrow>
        <div className="flex items-center gap-3 mt-1.5">
          <input type="number" step="0.01" min="0" value={r.lore}
            onChange={(e) => patch(r.id, "lore", Math.max(0, +e.target.value))}
            style={{ fontFamily: MONO, fontSize: 13, width: 84, border: `1px solid ${C.line}`, padding: "3px 6px" }} />
          <span style={{ ...label, fontSize: 9 }}>events / year</span>
        </div>
        <div style={{ fontSize: 11, color: C.steel, marginTop: 4, lineHeight: 1.4 }}>{r.loreBasis}</div>

        <div className="mt-3"><Eyebrow>Consequence — CoRE by attribute</Eyebrow></div>
        {attrs.map(([k, t]) => (
          <div key={k} className="flex items-center gap-2 mt-2">
            <span style={{ ...label, width: 66, color: C.ink80 }}>{t}</span>
            <input type="range" min={1} max={7} step={1} value={r[k]}
              onChange={(e) => patch(r.id, k, +e.target.value)} style={{ width: 96 }} />
            <BandChip level={Math.min(4, Math.floor((r[k] - 1) * 0.7))}>L{r[k]}</BandChip>
            <span style={{ fontSize: 11, color: C.steel, flex: 1 }}>{SCALES[k][r[k]]}</span>
            <Num size={11} color={C.steel}>×{weights[k].toFixed(2)}</Num>
          </div>
        ))}

        <div className="flex items-center gap-2 mt-3">
          <span style={{ ...label, width: 66, color: C.ink80 }}>Controls</span>
          <input type="range" min={0} max={0.95} step={0.05} value={r.ce}
            onChange={(e) => patch(r.id, "ce", +e.target.value)} style={{ width: 96 }} />
          <Num size={11}>{Math.round(r.ce * 100)}% effective</Num>
        </div>
      </div>

      <div className="px-4 py-3 grid grid-cols-3 gap-3" style={{ borderBottom: `1px solid ${C.line}` }}>
        {[["CoRE", fmt(r.core, 1)], ["Inherent", fmt(r.inherent, 0)], ["Residual", fmt(r.residual, 0)]].map(([k, v], i) => (
          <div key={k}>
            <Eyebrow>{k}</Eyebrow>
            <Num size={20} weight={600} color={i === 2 ? C.band[4] : C.ink}>{v}</Num>
          </div>
        ))}
      </div>

      <div className="px-4 py-3">
        <Eyebrow>Mitigations — ranked by risk spend efficiency</Eyebrow>
        <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse" }}>
          <tbody>
            {[...r.mits].sort((a, b) => b.rse - a.rse).map((m) => (
              <tr key={m.name} style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                <td className="py-1.5 pr-2" style={{ fontSize: 12 }}>
                  {m.name}
                  <div style={{ ...label, fontSize: 9 }}>{m.status} · ${fmt(m.cost, 0)}M · −{Math.round(m.reduction * 100)}%</div>
                </td>
                <td className="py-1.5 text-right" style={{ width: 62 }}>
                  <Num size={13} weight={600}>{fmt(m.rse, 2)}</Num>
                  <div style={{ ...label, fontSize: 8 }}>RSE</div>
                </td>
              </tr>
            ))}
            {!r.mits.length && <tr><td style={{ fontSize: 12, color: C.steel, paddingTop: 8 }}>No mitigations recorded. Add them in the CSV and re-import, or extend this sheet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  HEAT MAP                                                           */
/* ------------------------------------------------------------------ */

function Heatmap({ scored, onPick }) {
  const grid = Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => []));
  scored.forEach((r) => grid[consBand(r.core)][freqBand(r.lore)].push(r));
  return (
    <div className="rr-split grid gap-5" style={{ gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)" }}>
      <section className="p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <Eyebrow>Frequency × consequence — residual position</Eyebrow>
        <div className="mt-3 flex">
          <div className="flex flex-col justify-between pr-2" style={{ ...label, fontSize: 9, writingMode: "vertical-rl", transform: "rotate(180deg)", height: 320 }}>
            <span>Consequence (CoRE) →</span>
          </div>
          <div className="flex-1">
            <div className="grid" style={{ gridTemplateColumns: "68px repeat(5,1fr)", gap: 2 }}>
              {[4, 3, 2, 1, 0].map((c) => (
                <React.Fragment key={c}>
                  <div className="flex items-center justify-end pr-2" style={{ ...label, fontSize: 9, height: 62 }}>{CONS_LABELS[c]}</div>
                  {[0, 1, 2, 3, 4].map((f) => {
                    const items = grid[c][f];
                    const lvl = cellLevel(f, c);
                    return (
                      <div key={f} className="p-1.5 flex flex-wrap gap-1 items-start content-start"
                        style={{ height: 62, background: items.length ? C.band[lvl] : "#F4F6F5", border: `1px solid ${C.lineSoft}`, overflow: "hidden" }}>
                        {items.map((r) => (
                          <button key={r.id} onClick={() => onPick(r.id)} title={r.name}
                            style={{ fontFamily: MONO, fontSize: 10, background: "rgba(255,255,255,.9)", color: C.ink, border: 0, padding: "1px 4px", borderRadius: 2, cursor: "pointer" }}>
                            {r.id}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
              <div />
              {FREQ_LABELS.map((f) => <div key={f} className="text-center pt-1" style={{ ...label, fontSize: 9 }}>{f}</div>)}
            </div>
            <div className="text-center pt-2" style={{ ...label, fontSize: 9 }}>Frequency (LoRE, events per year) →</div>
          </div>
        </div>
      </section>

      <section className="p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <Eyebrow>Tier 1 — top residual risks</Eyebrow>
        <div className="mt-3 space-y-2.5">
          {[...scored].sort((a, b) => b.residual - a.residual).slice(0, 6).map((r, i) => (
            <button key={r.id} onClick={() => onPick(r.id)} className="w-full text-left"
              style={{ background: "transparent", border: 0, cursor: "pointer", padding: 0 }}>
              <div className="flex justify-between items-baseline">
                <span style={{ fontSize: 12, fontWeight: 500 }}><Num size={10} color={C.steel}>{r.id}</Num>&nbsp; {r.name}</span>
                <Num size={12} weight={600}>{fmt(r.residual, 0)}</Num>
              </div>
              <div style={{ height: 6, background: C.lineSoft, marginTop: 3 }}>
                <div style={{ height: 6, width: `${(r.residual / scored.reduce((a, x) => Math.max(a, x.residual), 1)) * 100}%`, background: C.band[Math.min(4, 4 - Math.floor(i / 2))] }} />
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${C.line}`, fontSize: 11, color: C.steel, lineHeight: 1.5 }}>
          Cells are shaded by combined band, not by count. A risk in the far-left column is rare but can still
          be Tier 1 if its consequence band is catastrophic — read position, not colour alone.
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PORTFOLIO — the RSE frontier                                       */
/* ------------------------------------------------------------------ */

function Portfolio({ portfolio, totals }) {
  const funded = portfolio.filter((m) => m.status === "Funded");
  const fundedCost = funded.reduce((a, m) => a + m.cost, 0);
  const curve = [{ cumCost: 0, cumReduction: 0 }, ...portfolio];
  const top = portfolio.slice(0, 14);

  return (
    <div className="space-y-5">
      <section className="p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <div className="flex justify-between items-baseline flex-wrap gap-2">
          <div>
            <Eyebrow>Risk-buy-down frontier</Eyebrow>
            <div style={{ fontSize: 12, color: C.steel, marginTop: 3 }}>
              Mitigations sequenced by risk spend efficiency. The knee is where each additional dollar starts buying much less risk reduction.
            </div>
          </div>
          <div className="flex gap-6">
            <div><Eyebrow>Cumulative spend</Eyebrow><Num size={17} weight={600}>${fmt(totals.cost, 0)}M</Num></div>
            <div><Eyebrow>Risk removed</Eyebrow><Num size={17} weight={600}>{fmt(totals.red, 0)}</Num></div>
          </div>
        </div>
        <div style={{ height: 260, marginTop: 12 }}>
          <ResponsiveContainer>
            <LineChart data={curve} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
              <CartesianGrid stroke={C.lineSoft} vertical={false} />
              <XAxis dataKey="cumCost" type="number" tick={{ fontFamily: MONO, fontSize: 10, fill: C.steel }}
                stroke={C.line} label={{ value: "Cumulative cost ($M)", position: "insideBottom", offset: -14, style: { fontFamily: MONO, fontSize: 10, fill: C.steel } }} />
              <YAxis tick={{ fontFamily: MONO, fontSize: 10, fill: C.steel }} stroke={C.line}
                label={{ value: "Risk removed", angle: -90, position: "insideLeft", style: { fontFamily: MONO, fontSize: 10, fill: C.steel } }} />
              <Tooltip contentStyle={{ fontFamily: MONO, fontSize: 11, border: `1px solid ${C.line}`, borderRadius: 2 }}
                formatter={(v, n) => [fmt(v, 1), n === "cumReduction" ? "Risk removed" : n]}
                labelFormatter={(v) => `$${fmt(v, 0)}M cumulative`} />
              <ReferenceLine x={fundedCost} stroke={C.band[4]} strokeDasharray="4 3"
                label={{ value: "Funded cut line", fontFamily: MONO, fontSize: 10, fill: C.band[4], position: "top" }} />
              <Line type="monotone" dataKey="cumReduction" stroke={C.ink} strokeWidth={2} dot={{ r: 2.5, fill: C.band[2], stroke: C.ink }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <Eyebrow>Risk spend efficiency — risk units removed per $M</Eyebrow>
        <div style={{ height: 380, marginTop: 12 }}>
          <ResponsiveContainer>
            <BarChart data={top} layout="vertical" margin={{ left: 210, right: 24, top: 4, bottom: 20 }}>
              <CartesianGrid stroke={C.lineSoft} horizontal={false} />
              <XAxis type="number" tick={{ fontFamily: MONO, fontSize: 10, fill: C.steel }} stroke={C.line} />
              <YAxis type="category" dataKey="name" width={205} tick={{ fontFamily: SANS, fontSize: 11, fill: C.ink }} stroke={C.line} />
              <Tooltip cursor={{ fill: "#F4F6F5" }}
                contentStyle={{ fontFamily: MONO, fontSize: 11, border: `1px solid ${C.line}`, borderRadius: 2 }}
                formatter={(v, n, p) => [`RSE ${fmt(v, 2)} · $${fmt(p.payload.cost, 0)}M · ${p.payload.riskId}`, p.payload.status]} />
              <Bar dataKey="rse" barSize={14}>
                {top.map((m, i) => (
                  <Cell key={i} fill={m.status === "Funded" ? C.band[0] : m.status === "Proposed" ? C.band[2] : C.steel} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 pt-2">
          {[["Funded", C.band[0]], ["Proposed", C.band[2]], ["Under review", C.steel]].map(([t, col]) => (
            <span key={t} className="flex items-center gap-1.5" style={{ ...label, fontSize: 9 }}>
              <span style={{ width: 10, height: 10, background: col, display: "inline-block" }} />{t}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  METHOD & TEMPLATE                                                  */
/* ------------------------------------------------------------------ */

function Method({ weights }) {
  const fields = [
    ["risk_id", "Stable identifier. Never reused once retired."],
    ["risk_name", "Event, not a topic. \"Wildfire ignition from overhead lines\", not \"Wildfire\"."],
    ["category", "Grouping for roll-up reporting only. Does not affect scoring."],
    ["risk_owner", "One accountable executive. Not a committee."],
    ["drivers", "Initiating causes on the left of the bow-tie. Each one should be separately controllable."],
    ["consequences", "Outcomes on the right of the bow-tie, stated in natural units."],
    ["cross_cutting_factors", "Conditions that raise several risks at once — climate, asset age, data quality, contractor management."],
    ["lore", "Likelihood of risk event, in events per year. Frequentist where you have a record; elicited where you do not."],
    ["lore_basis", "Where the number came from. This column is what an intervenor will test first."],
    ["safety_level / reliability_level / financial_level", "Impact level 1–7 on the published natural-unit scales."],
    ["core_mavf", "Weighted consequence, 0–100. Computed, never entered."],
    ["control_effectiveness", "Fraction of inherent risk removed by controls already in place and operating."],
    ["velocity", "Speed of onset. Drives preparedness, not the score."],
    ["mitigation / cost / reduction", "Proposed action, four-year cost in $M, and fraction of residual risk it removes."],
    ["rse", "Risk spend efficiency. Computed."],
  ];
  const formulas = [
    ["v(level)", "log-spaced value: 0.1, 0.3, 1, 3.3, 10, 33.3, 100 for levels 1–7"],
    ["CoRE", `${weights.safety.toFixed(2)}·v(Safety) + ${weights.reliability.toFixed(2)}·v(Reliability) + ${weights.financial.toFixed(2)}·v(Financial)`],
    ["Inherent risk", "LoRE × CoRE"],
    ["Residual risk", "Inherent × (1 − control effectiveness)"],
    ["Risk reduced", "Residual × mitigation reduction fraction"],
    ["RSE", "Risk reduced ÷ mitigation cost ($M)"],
  ];
  return (
    <div className="rr-split grid gap-5" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
      <section className="p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
        <Eyebrow>Register schema — the template</Eyebrow>
        <p style={{ fontSize: 12, color: C.steel, margin: "6px 0 12px", lineHeight: 1.5 }}>
          Export CSV writes one row per mitigation, with the parent risk repeated. That shape loads directly into
          a filing workbook and keeps the risk-to-mitigation link intact.
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {fields.map(([f, d]) => (
              <tr key={f} style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                <td className="py-1.5 pr-3 align-top" style={{ fontFamily: MONO, fontSize: 11, whiteSpace: "nowrap", color: C.ink }}>{f}</td>
                <td className="py-1.5" style={{ fontSize: 12, color: C.ink80, lineHeight: 1.45 }}>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="space-y-5">
        <section className="p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <Eyebrow>Calculation chain</Eyebrow>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
            <tbody>
              {formulas.map(([k, v]) => (
                <tr key={k} style={{ borderTop: `1px solid ${C.lineSoft}` }}>
                  <td className="py-1.5 pr-3 align-top" style={{ fontFamily: MONO, fontSize: 11, whiteSpace: "nowrap" }}>{k}</td>
                  <td className="py-1.5" style={{ fontFamily: MONO, fontSize: 11, color: C.ink80, lineHeight: 1.5 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="p-4" style={{ background: C.panel, border: `1px solid ${C.line}` }}>
          <Eyebrow>Impact scales — natural units</Eyebrow>
          <div className="mt-2 space-y-3">
            {["safety", "reliability", "financial"].map((k) => (
              <div key={k}>
                <div style={{ ...label, color: C.ink80 }}>{k}</div>
                <div className="grid gap-1 mt-1" style={{ gridTemplateColumns: "repeat(7,1fr)" }}>
                  {[1, 2, 3, 4, 5, 6, 7].map((l) => (
                    <div key={l} className="p-1" style={{ background: "#F4F6F5", border: `1px solid ${C.lineSoft}` }}>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: C.steel }}>L{l}</div>
                      <div style={{ fontSize: 9.5, lineHeight: 1.25, color: C.ink80 }}>{SCALES[k][l]}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="p-4" style={{ background: C.ink, color: "#fff" }}>
          <Eyebrow style={{ color: "#7E8F99" }}>How to run the cycle</Eyebrow>
          <ol className="mt-2 space-y-1.5" style={{ fontSize: 12, lineHeight: 1.5, color: "#D8DEE1" }}>
            <li>1 — Agree the attribute weights with the risk committee before anything is scored. Re-litigating weights after ranking is how registers lose credibility.</li>
            <li>2 — Set LoRE from data where a record exists; document elicitation protocol where it does not.</li>
            <li>3 — Score consequence on the published scales, not on a feeling about severity.</li>
            <li>4 — Rank by residual risk. Rank mitigations by RSE, then apply judgement for anything that is legally mandated regardless of efficiency.</li>
            <li>5 — Re-baseline annually, and after any event that changes the frequency evidence.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
