import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, ReferenceLine,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  TOKENS                                                             */
/* ------------------------------------------------------------------ */

const C = {
  ink: "#0F1923",
  ink80: "#374956",
  steel: "#627D8B",
  mist: "#F5F7F9",
  field: "#EEF1F4",
  panel: "#FFFFFF",
  line: "#D2D9DF",
  lineSoft: "#E4E9ED",
  accent: "#0A7E8A",
  accentDark: "#06656E",
  accentLight: "#E6F5F6",
  band: ["#4C9A84", "#8BA94E", "#D9A441", "#D0622A", "#B03228"],
  bandSoft: ["#E8F3EF", "#F0F3E3", "#FDF4E0", "#FBEAE2", "#F8E3E2"],
};

const MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace';
const SANS = '"Inter", ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const CARD = {
  background: C.panel,
  border: `1px solid ${C.line}`,
  borderRadius: 10,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
};

/* ------------------------------------------------------------------ */
/*  METHOD — CPUC RAMP / S-MAP style multi-attribute value function     */
/* ------------------------------------------------------------------ */

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
  return (
    <div style={{
      fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em",
      textTransform: "uppercase", color: C.steel, fontWeight: 500, ...s
    }}>
      {children}
    </div>
  );
}

function Num({ children, size = 14, weight = 500, color = C.ink }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: size, fontWeight: weight, color, fontVariantNumeric: "tabular-nums" }}>
      {children}
    </span>
  );
}

function BandChip({ level, children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontFamily: MONO, fontSize: 11, letterSpacing: "0.06em", fontWeight: 600,
      background: C.band[level], color: "#fff", borderRadius: 4, padding: "3px 10px",
    }}>
      {children}
    </span>
  );
}

function Trend({ dir }) {
  const map = { up: ["▲", C.band[4]], down: ["▼", C.band[0]], flat: ["■", C.steel] };
  const [g, col] = map[dir] || map.flat;
  return <span style={{ color: col, fontSize: 10, marginLeft: 4 }}>{g}</span>;
}

function StatBox({ label: lb, value, color = "#fff" }) {
  return (
    <div style={{
      textAlign: "center", padding: "12px 20px",
      background: "rgba(255,255,255,0.06)", borderRadius: 8,
    }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
        {lb}
      </div>
      <Num size={28} weight={700} color={color}>{value}</Num>
    </div>
  );
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

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("utility-risk-register:v1");
        if (r && r.value) {
          const p = JSON.parse(r.value);
          if (p.risks) setRisks(p.risks);
          if (p.weights) setWeights(p.weights);
        }
      } catch (e) { /* seed */ } finally { setLoaded(true); }
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
      } catch (e) { setSaveNote("Session only"); }
    }, 600);
  }, [risks, weights, loaded]);

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
      "risk_id","risk_name","category","risk_owner","lore_events_per_year","lore_basis",
      "safety_level","reliability_level","financial_level","core_mavf",
      "inherent_risk_score","control_effectiveness","residual_risk_score",
      "velocity","trend","drivers","consequences","cross_cutting_factors",
      "mitigation","mitigation_cost_musd","residual_reduction_pct","rse_risk_units_per_musd","mitigation_status",
    ];
    const rows = [];
    scored.forEach((r) => {
      const base = [
        r.id, r.name, r.category, r.owner, r.lore, r.loreBasis,
        r.safety, r.reliability, r.financial, r.core.toFixed(2),
        r.inherent.toFixed(2), r.ce, r.residual.toFixed(2),
        r.velocity, r.trend,
        (r.drivers||[]).join("; "), (r.consequences||[]).join("; "), (r.crossCutting||[]).join("; "),
      ];
      if (!r.mits.length) rows.push([...base,"","","","",""]);
      r.mits.forEach((m) => rows.push([...base, m.name, m.cost, m.reduction, m.rse.toFixed(3), m.status]));
    });
    const esc = (v) => `"${String(v).replace(/"/g,'""')}"`;
    const csv = [head,...rows].map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    const a = document.createElement("a");
    a.href = url; a.download = "risk-register.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const TABS = [
    ["register", "Register"],
    ["heatmap", "Heat Map"],
    ["portfolio", "Mitigation Portfolio"],
    ["method", "Method & Template"],
  ];

  return (
    <div style={{ background: C.field, color: C.ink, fontFamily: SANS, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
        .rr-row:hover { background: ${C.accentLight} !important; }
        .rr-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .rr-btn:active { transform: translateY(0); }
        .rr-tab:hover { color: #fff !important; }
        .rr-tab:focus-visible, .rr-btn:focus-visible, .rr-row:focus-visible {
          outline: 2px solid ${C.accent}; outline-offset: 2px; }
        input[type=range] { accent-color: ${C.accent}; height: 6px; }
        input[type=range]::-webkit-slider-thumb { width: 16px; height: 16px; }
        @media (max-width: 1000px) { .rr-split { grid-template-columns: 1fr !important; } }
        * { box-sizing: border-box; }
      `}</style>

      {/* ============ HEADER ============ */}
      <header style={{
        background: `linear-gradient(135deg, ${C.ink} 0%, #1A2D3A 100%)`,
        color: "#fff", padding: "40px 48px 0 48px",
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: SANS, fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.15, margin: 0 }}>
              Enterprise Risk Register
            </h1>
            <div style={{ fontFamily: SANS, fontSize: 16, color: "rgba(255,255,255,0.5)", marginTop: 8, fontWeight: 400 }}>
              Electric Utility · Risk &amp; Mitigation Portfolio
            </div>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <StatBox label="Risks" value={scored.length} />
            <StatBox label="Residual" value={fmt(totals.res, 0)} />
            <StatBox label="Portfolio $M" value={fmt(totals.cost, 0)} />
            <StatBox label="Portfolio RSE" value={fmt(totals.rse, 2)} />
          </div>
        </div>

        <nav style={{ display: "flex", gap: 4, flexWrap: "wrap", marginLeft: -8 }}>
          {TABS.map(([k, v]) => (
            <button key={k} onClick={() => setTab(k)} className="rr-tab"
              style={{
                fontFamily: SANS, fontSize: 14, fontWeight: tab === k ? 600 : 400,
                letterSpacing: "0.02em", background: "transparent", border: 0,
                cursor: "pointer", padding: "12px 20px",
                color: tab === k ? "#fff" : "rgba(255,255,255,0.45)",
                borderBottom: `3px solid ${tab === k ? C.accent : "transparent"}`,
                transition: "color .15s, border-color .15s",
              }}>
              {v}
            </button>
          ))}
        </nav>
      </header>

      {/* ============ TOOLBAR ============ */}
      <div style={{
        padding: "18px 48px", background: C.panel,
        borderBottom: `1px solid ${C.line}`,
        display: "flex", flexWrap: "wrap", alignItems: "center", gap: 28,
      }}>
        <Eyebrow style={{ fontSize: 10 }}>MAVF Weights</Eyebrow>
        {["safety", "reliability", "financial"].map((k) => (
          <label key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: C.ink80, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {k.slice(0, 3)}
            </span>
            <input type="range" min={0} max={1} step={0.05} value={weights[k]}
              onChange={(e) => {
                const v = +e.target.value;
                const others = ["safety","reliability","financial"].filter((o) => o !== k);
                const rest = 1 - v, cur = weights[others[0]] + weights[others[1]] || 1;
                setWeights({
                  [k]: v,
                  [others[0]]: +(rest * (weights[others[0]] / cur)).toFixed(3),
                  [others[1]]: +(rest * (weights[others[1]] / cur)).toFixed(3),
                });
              }}
              style={{ width: 100 }} />
            <Num size={13} weight={600}>{weights[k].toFixed(2)}</Num>
          </label>
        ))}

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button className="rr-btn" onClick={addRisk}
            style={{
              fontFamily: SANS, fontSize: 14, fontWeight: 600,
              background: C.accent, color: "#fff", border: 0, borderRadius: 8,
              cursor: "pointer", padding: "12px 28px",
              transition: "opacity .15s, transform .1s",
              boxShadow: "0 2px 8px rgba(10,126,138,0.25)",
            }}>
            + Add Risk
          </button>
          <button className="rr-btn" onClick={exportCsv}
            style={{
              fontFamily: SANS, fontSize: 14, fontWeight: 600,
              background: "transparent", color: C.ink,
              border: `2px solid ${C.line}`, borderRadius: 8,
              cursor: "pointer", padding: "11px 28px",
              transition: "opacity .15s, transform .1s",
            }}>
            Export CSV
          </button>
        </div>
        {saveNote && <span style={{ fontFamily: MONO, fontSize: 10, color: C.steel }}>{saveNote}</span>}
      </div>

      {/* ============ CONTENT ============ */}
      <main style={{ padding: "32px 48px 56px 48px" }}>
        {tab === "register" && (
          <div className="rr-split" style={{ display: "grid", gap: 24, gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)" }}>
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
    ["id", "ID", 60], ["name", "Risk", null], ["lore", "LoRE /yr", 80],
    ["core", "CoRE", 70], ["inherent", "Inherent", 80], ["residual", "Residual", 170],
  ];

  const selectStyle = {
    fontFamily: MONO, fontSize: 12, fontWeight: 500,
    border: `1px solid ${C.line}`, borderRadius: 6,
    padding: "8px 12px", background: C.mist, color: C.ink,
    cursor: "pointer",
  };

  return (
    <section style={CARD}>
      <div style={{
        padding: "20px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", borderBottom: `1px solid ${C.lineSoft}`,
      }}>
        <Eyebrow>Register — ranked by {sortKey === "residual" ? "residual risk" : sortKey}</Eyebrow>
        <div style={{ display: "flex", gap: 10 }}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={selectStyle}>
            {["All", ...CATEGORIES].map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} style={selectStyle}>
            <option value="residual">Residual</option>
            <option value="inherent">Inherent</option>
            <option value="lore">Frequency</option>
            <option value="core">Consequence</option>
            <option value="mitCost">Mitigation cost</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.line}` }}>
              {cols.map(([k, t, w]) => (
                <th key={k} style={{
                  fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
                  color: C.steel, fontWeight: 500,
                  width: w || undefined, textAlign: k === "name" || k === "id" ? "left" : "right",
                  padding: "12px 14px",
                }}>
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
                <tr key={r.id} className="rr-row" tabIndex={0}
                  onClick={() => setSelected(r.id)}
                  onKeyDown={(e) => e.key === "Enter" && setSelected(r.id)}
                  style={{
                    borderBottom: `1px solid ${C.lineSoft}`, cursor: "pointer",
                    background: on ? C.accentLight : "transparent",
                    transition: "background .12s",
                  }}>
                  <td style={{ padding: "14px 14px", borderLeft: `4px solid ${on ? C.accent : "transparent"}` }}>
                    <Num size={12} color={C.steel}>{r.id}</Num>
                  </td>
                  <td style={{ padding: "14px 14px" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, color: C.ink }}>{r.name}</div>
                    <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.06em", color: C.steel, marginTop: 4 }}>
                      {r.category} · {r.owner} <Trend dir={r.trend} />
                    </div>
                  </td>
                  <td style={{ padding: "14px 14px", textAlign: "right" }}><Num size={13}>{fmt(r.lore, 2)}</Num></td>
                  <td style={{ padding: "14px 14px", textAlign: "right" }}><Num size={13}>{fmt(r.core, 1)}</Num></td>
                  <td style={{ padding: "14px 14px", textAlign: "right" }}><Num size={13} color={C.steel}>{fmt(r.inherent, 0)}</Num></td>
                  <td style={{ padding: "14px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
                      <div style={{ position: "relative", flex: 1, height: 10, background: C.lineSoft, borderRadius: 5, minWidth: 70, overflow: "hidden" }}>
                        <div style={{ position: "absolute", inset: 0, width: `${(r.inherent / max) * 100}%`, background: C.lineSoft, borderRight: `2px dashed ${C.steel}` }} />
                        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${(r.residual / max) * 100}%`, background: C.band[lvl], borderRadius: 5, transition: "width .25s" }} />
                      </div>
                      <Num size={14} weight={700}>{fmt(r.residual, 0)}</Num>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "14px 24px", fontFamily: MONO, fontSize: 10, color: C.steel, borderTop: `1px solid ${C.lineSoft}`, letterSpacing: "0.04em" }}>
        Solid bar = residual risk after controls · Dashed marker = inherent risk before controls
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

  const inputStyle = {
    fontFamily: MONO, fontSize: 14, fontWeight: 600,
    border: `2px solid ${C.line}`, borderRadius: 6, padding: "8px 12px",
    background: C.mist, color: C.ink, outline: "none", width: 100,
  };

  return (
    <section style={CARD}>
      {/* Header */}
      <div style={{ padding: "24px 28px", borderBottom: `1px solid ${C.lineSoft}`, background: C.mist, borderRadius: "10px 10px 0 0" }}>
        <Eyebrow style={{ marginBottom: 8 }}>{r.id} · Risk Sheet</Eyebrow>
        <input value={r.name} onChange={(e) => patch(r.id, "name", e.target.value)}
          style={{ fontSize: 18, fontWeight: 700, border: 0, outline: "none", width: "100%", background: "transparent", color: C.ink, fontFamily: SANS }} />
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.steel, marginTop: 6, letterSpacing: "0.04em" }}>
          {r.owner} · Velocity: {r.velocity}
        </div>
      </div>

      {/* Bow-tie */}
      <div style={{ padding: "24px 28px", borderBottom: `1px solid ${C.lineSoft}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <Eyebrow style={{ marginBottom: 10 }}>Drivers</Eyebrow>
          {r.drivers.map((d) => (
            <div key={d} style={{ fontSize: 13, lineHeight: 1.6, paddingLeft: 14, textIndent: -14, color: C.ink80 }}>
              <span style={{ color: C.accent, fontWeight: 700, marginRight: 6 }}>›</span>{d}
            </div>
          ))}
        </div>
        <div>
          <Eyebrow style={{ marginBottom: 10 }}>Consequences</Eyebrow>
          {r.consequences.map((d) => (
            <div key={d} style={{ fontSize: 13, lineHeight: 1.6, paddingLeft: 14, textIndent: -14, color: C.ink80 }}>
              <span style={{ color: C.band[3], fontWeight: 700, marginRight: 6 }}>›</span>{d}
            </div>
          ))}
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Eyebrow style={{ marginBottom: 8 }}>Cross-cutting factors</Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {r.crossCutting.map((c) => (
              <span key={c} style={{
                fontFamily: MONO, fontSize: 11, fontWeight: 500,
                border: `1px solid ${C.line}`, borderRadius: 6,
                padding: "5px 12px", color: C.ink80, background: C.mist,
              }}>{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Scoring */}
      <div style={{ padding: "24px 28px", borderBottom: `1px solid ${C.lineSoft}` }}>
        <Eyebrow style={{ marginBottom: 12 }}>Frequency — LoRE</Eyebrow>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input type="number" step="0.01" min="0" value={r.lore}
            onChange={(e) => patch(r.id, "lore", Math.max(0, +e.target.value))}
            style={inputStyle} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: C.steel }}>events / year</span>
        </div>
        <div style={{ fontSize: 12, color: C.steel, marginTop: 8, lineHeight: 1.5, fontStyle: "italic" }}>{r.loreBasis}</div>

        <Eyebrow style={{ marginTop: 24, marginBottom: 14 }}>Consequence — CoRE by Attribute</Eyebrow>
        {attrs.map(([k, t]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, width: 80, color: C.ink80, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t}</span>
            <input type="range" min={1} max={7} step={1} value={r[k]}
              onChange={(e) => patch(r.id, k, +e.target.value)} style={{ width: 110, flex: "none" }} />
            <BandChip level={Math.min(4, Math.floor((r[k] - 1) * 0.7))}>L{r[k]}</BandChip>
            <span style={{ fontSize: 12, color: C.steel, flex: 1 }}>{SCALES[k][r[k]]}</span>
            <Num size={12} color={C.steel}>×{weights[k].toFixed(2)}</Num>
          </div>
        ))}

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, paddingTop: 14, borderTop: `1px solid ${C.lineSoft}` }}>
          <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, width: 80, color: C.ink80, textTransform: "uppercase", letterSpacing: "0.06em" }}>Controls</span>
          <input type="range" min={0} max={0.95} step={0.05} value={r.ce}
            onChange={(e) => patch(r.id, "ce", +e.target.value)} style={{ width: 110, flex: "none" }} />
          <Num size={14} weight={700}>{Math.round(r.ce * 100)}%</Num>
          <span style={{ fontSize: 12, color: C.steel }}>effective</span>
        </div>
      </div>

      {/* Score summary */}
      <div style={{ padding: "20px 28px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, borderBottom: `1px solid ${C.lineSoft}` }}>
        {[["CoRE", fmt(r.core, 1), C.ink], ["Inherent", fmt(r.inherent, 0), C.ink], ["Residual", fmt(r.residual, 0), C.band[4]]].map(([k, v, col]) => (
          <div key={k} style={{ background: C.mist, borderRadius: 8, padding: "16px 18px", textAlign: "center" }}>
            <Eyebrow style={{ marginBottom: 6 }}>{k}</Eyebrow>
            <Num size={24} weight={700} color={col}>{v}</Num>
          </div>
        ))}
      </div>

      {/* Mitigations */}
      <div style={{ padding: "24px 28px" }}>
        <Eyebrow style={{ marginBottom: 16 }}>Mitigations — ranked by RSE</Eyebrow>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {[...r.mits].sort((a, b) => b.rse - a.rse).map((m, i) => (
              <tr key={m.name} style={{ borderTop: i === 0 ? 0 : `1px solid ${C.lineSoft}` }}>
                <td style={{ padding: "14px 0 14px 0" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.ink }}>{m.name}</div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: C.steel, marginTop: 4, letterSpacing: "0.04em" }}>
                    <span style={{
                      display: "inline-block", padding: "2px 8px", borderRadius: 4, marginRight: 8,
                      fontSize: 10, fontWeight: 600,
                      background: m.status === "Funded" ? C.bandSoft[0] : m.status === "Proposed" ? C.bandSoft[2] : C.mist,
                      color: m.status === "Funded" ? C.band[0] : m.status === "Proposed" ? C.band[2] : C.steel,
                    }}>{m.status}</span>
                    ${fmt(m.cost, 0)}M · −{Math.round(m.reduction * 100)}%
                  </div>
                </td>
                <td style={{ padding: "14px 0", textAlign: "right", width: 70, verticalAlign: "top" }}>
                  <Num size={16} weight={700}>{fmt(m.rse, 2)}</Num>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: C.steel, marginTop: 2, letterSpacing: "0.08em" }}>RSE</div>
                </td>
              </tr>
            ))}
            {!r.mits.length && (
              <tr><td style={{ fontSize: 13, color: C.steel, padding: "20px 0" }}>
                No mitigations recorded yet.
              </td></tr>
            )}
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
    <div className="rr-split" style={{ display: "grid", gap: 24, gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)" }}>
      <section style={{ ...CARD, padding: 28 }}>
        <Eyebrow style={{ marginBottom: 20 }}>Frequency × Consequence — Residual Position</Eyebrow>
        <div style={{ display: "flex" }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.steel, writingMode: "vertical-rl", transform: "rotate(180deg)", display: "flex", alignItems: "center", justifyContent: "center", paddingRight: 10, letterSpacing: "0.1em" }}>
            Consequence (CoRE) →
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px repeat(5,1fr)", gap: 3 }}>
              {[4, 3, 2, 1, 0].map((c) => (
                <React.Fragment key={c}>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: C.steel, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10, height: 70, fontWeight: 500 }}>
                    {CONS_LABELS[c]}
                  </div>
                  {[0, 1, 2, 3, 4].map((f) => {
                    const items = grid[c][f];
                    const lvl = cellLevel(f, c);
                    return (
                      <div key={f} style={{
                        height: 70, padding: 6, display: "flex", flexWrap: "wrap", gap: 4,
                        alignItems: "flex-start", alignContent: "flex-start",
                        background: items.length ? C.band[lvl] : C.mist,
                        border: `1px solid ${items.length ? "rgba(0,0,0,0.1)" : C.lineSoft}`,
                        borderRadius: 6, overflow: "hidden",
                      }}>
                        {items.map((r) => (
                          <button key={r.id} onClick={() => onPick(r.id)} title={r.name}
                            style={{
                              fontFamily: MONO, fontSize: 10, fontWeight: 600,
                              background: "rgba(255,255,255,.92)", color: C.ink,
                              border: 0, padding: "3px 7px", borderRadius: 4, cursor: "pointer",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                            }}>
                            {r.id}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
              <div />
              {FREQ_LABELS.map((f) => (
                <div key={f} style={{ textAlign: "center", paddingTop: 8, fontFamily: MONO, fontSize: 10, color: C.steel, fontWeight: 500 }}>
                  {f}
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", paddingTop: 12, fontFamily: MONO, fontSize: 10, color: C.steel, letterSpacing: "0.1em" }}>
              Frequency (LoRE, events per year) →
            </div>
          </div>
        </div>
      </section>

      <section style={{ ...CARD, padding: 28 }}>
        <Eyebrow style={{ marginBottom: 20 }}>Tier 1 — Top Residual Risks</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[...scored].sort((a, b) => b.residual - a.residual).slice(0, 6).map((r, i) => (
            <button key={r.id} onClick={() => onPick(r.id)}
              style={{ background: "transparent", border: 0, cursor: "pointer", padding: 0, textAlign: "left", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  <Num size={11} color={C.steel}>{r.id}</Num>&nbsp;&nbsp;{r.name}
                </span>
                <Num size={14} weight={700}>{fmt(r.residual, 0)}</Num>
              </div>
              <div style={{ height: 8, background: C.mist, borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  height: 8, borderRadius: 4,
                  width: `${(r.residual / scored.reduce((a, x) => Math.max(a, x.residual), 1)) * 100}%`,
                  background: C.band[Math.min(4, 4 - Math.floor(i / 2))],
                }} />
              </div>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.lineSoft}`, fontSize: 12, color: C.steel, lineHeight: 1.6 }}>
          Cells are shaded by combined band, not by count. A risk in the far-left column is rare but can still
          be Tier 1 if its consequence band is catastrophic — read position, not colour alone.
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PORTFOLIO                                                          */
/* ------------------------------------------------------------------ */

function Portfolio({ portfolio, totals }) {
  const funded = portfolio.filter((m) => m.status === "Funded");
  const fundedCost = funded.reduce((a, m) => a + m.cost, 0);
  const curve = [{ cumCost: 0, cumReduction: 0 }, ...portfolio];
  const top = portfolio.slice(0, 14);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <section style={{ ...CARD, padding: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 24 }}>
          <div>
            <Eyebrow style={{ marginBottom: 6 }}>Risk-Buy-Down Frontier</Eyebrow>
            <div style={{ fontSize: 14, color: C.steel, lineHeight: 1.5, maxWidth: 520 }}>
              Mitigations sequenced by risk spend efficiency. The knee is where each additional dollar starts buying much less risk reduction.
            </div>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ background: C.mist, borderRadius: 8, padding: "14px 22px", textAlign: "center" }}>
              <Eyebrow style={{ marginBottom: 4 }}>Cumulative Spend</Eyebrow>
              <Num size={22} weight={700}>${fmt(totals.cost, 0)}M</Num>
            </div>
            <div style={{ background: C.mist, borderRadius: 8, padding: "14px 22px", textAlign: "center" }}>
              <Eyebrow style={{ marginBottom: 4 }}>Risk Removed</Eyebrow>
              <Num size={22} weight={700}>{fmt(totals.red, 0)}</Num>
            </div>
          </div>
        </div>
        <div style={{ height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={curve} margin={{ top: 8, right: 20, bottom: 28, left: 12 }}>
              <CartesianGrid stroke={C.lineSoft} vertical={false} />
              <XAxis dataKey="cumCost" type="number" tick={{ fontFamily: MONO, fontSize: 11, fill: C.steel }}
                stroke={C.line} label={{ value: "Cumulative cost ($M)", position: "insideBottom", offset: -16, style: { fontFamily: MONO, fontSize: 11, fill: C.steel } }} />
              <YAxis tick={{ fontFamily: MONO, fontSize: 11, fill: C.steel }} stroke={C.line}
                label={{ value: "Risk removed", angle: -90, position: "insideLeft", style: { fontFamily: MONO, fontSize: 11, fill: C.steel } }} />
              <Tooltip contentStyle={{ fontFamily: MONO, fontSize: 12, border: `1px solid ${C.line}`, borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                formatter={(v, n) => [fmt(v, 1), n === "cumReduction" ? "Risk removed" : n]}
                labelFormatter={(v) => `$${fmt(v, 0)}M cumulative`} />
              <ReferenceLine x={fundedCost} stroke={C.band[4]} strokeDasharray="4 3"
                label={{ value: "Funded cut line", fontFamily: MONO, fontSize: 11, fill: C.band[4], position: "top" }} />
              <Line type="monotone" dataKey="cumReduction" stroke={C.accent} strokeWidth={2.5} dot={{ r: 3, fill: C.accent, stroke: "#fff", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section style={{ ...CARD, padding: 32 }}>
        <Eyebrow style={{ marginBottom: 20 }}>Risk Spend Efficiency — Risk Units Removed per $M</Eyebrow>
        <div style={{ height: 420 }}>
          <ResponsiveContainer>
            <BarChart data={top} layout="vertical" margin={{ left: 220, right: 28, top: 4, bottom: 20 }}>
              <CartesianGrid stroke={C.lineSoft} horizontal={false} />
              <XAxis type="number" tick={{ fontFamily: MONO, fontSize: 11, fill: C.steel }} stroke={C.line} />
              <YAxis type="category" dataKey="name" width={215} tick={{ fontFamily: SANS, fontSize: 12, fill: C.ink }} stroke={C.line} />
              <Tooltip cursor={{ fill: C.mist }}
                contentStyle={{ fontFamily: MONO, fontSize: 12, border: `1px solid ${C.line}`, borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                formatter={(v, n, p) => [`RSE ${fmt(v, 2)} · $${fmt(p.payload.cost, 0)}M · ${p.payload.riskId}`, p.payload.status]} />
              <Bar dataKey="rse" barSize={16} radius={[0, 4, 4, 0]}>
                {top.map((m, i) => (
                  <Cell key={i} fill={m.status === "Funded" ? C.band[0] : m.status === "Proposed" ? C.band[2] : C.steel} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", gap: 24, paddingTop: 12 }}>
          {[["Funded", C.band[0]], ["Proposed", C.band[2]], ["Under review", C.steel]].map(([t, col]) => (
            <span key={t} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: MONO, fontSize: 11, color: C.steel, fontWeight: 500 }}>
              <span style={{ width: 14, height: 14, background: col, borderRadius: 3, display: "inline-block" }} />{t}
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
    ["safety / reliability / financial", "Impact level 1–7 on the published natural-unit scales."],
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
    <div className="rr-split" style={{ display: "grid", gap: 24, gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
      <section style={{ ...CARD, padding: 32 }}>
        <Eyebrow style={{ marginBottom: 8 }}>Register Schema — The Template</Eyebrow>
        <p style={{ fontSize: 13, color: C.steel, marginBottom: 20, lineHeight: 1.6 }}>
          Export CSV writes one row per mitigation, with the parent risk repeated. That shape loads directly into
          a filing workbook and keeps the risk-to-mitigation link intact.
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {fields.map(([f, d], i) => (
              <tr key={f} style={{ borderTop: i === 0 ? 0 : `1px solid ${C.lineSoft}` }}>
                <td style={{ padding: "12px 16px 12px 0", fontFamily: MONO, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", color: C.accent, verticalAlign: "top" }}>{f}</td>
                <td style={{ padding: "12px 0", fontSize: 13, color: C.ink80, lineHeight: 1.5 }}>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <section style={{ ...CARD, padding: 32 }}>
          <Eyebrow style={{ marginBottom: 16 }}>Calculation Chain</Eyebrow>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {formulas.map(([k, v], i) => (
                <tr key={k} style={{ borderTop: i === 0 ? 0 : `1px solid ${C.lineSoft}` }}>
                  <td style={{ padding: "12px 16px 12px 0", fontFamily: MONO, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", color: C.ink, verticalAlign: "top" }}>{k}</td>
                  <td style={{ padding: "12px 0", fontFamily: MONO, fontSize: 12, color: C.ink80, lineHeight: 1.6 }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={{ ...CARD, padding: 32 }}>
          <Eyebrow style={{ marginBottom: 16 }}>Impact Scales — Natural Units</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {["safety", "reliability", "financial"].map((k) => (
              <div key={k}>
                <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: C.ink80, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{k}</div>
                <div style={{ display: "grid", gap: 4, gridTemplateColumns: "repeat(7,1fr)" }}>
                  {[1, 2, 3, 4, 5, 6, 7].map((l) => (
                    <div key={l} style={{ padding: 8, background: C.mist, border: `1px solid ${C.lineSoft}`, borderRadius: 6 }}>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: C.accent, fontWeight: 700 }}>L{l}</div>
                      <div style={{ fontSize: 10, lineHeight: 1.3, color: C.ink80, marginTop: 3 }}>{SCALES[k][l]}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...CARD, padding: 32, background: C.ink, color: "#fff", border: 0 }}>
          <Eyebrow style={{ color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>How to Run the Cycle</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              "Agree the attribute weights with the risk committee before anything is scored. Re-litigating weights after ranking is how registers lose credibility.",
              "Set LoRE from data where a record exists; document elicitation protocol where it does not.",
              "Score consequence on the published scales, not on a feeling about severity.",
              "Rank by residual risk. Rank mitigations by RSE, then apply judgement for anything that is legally mandated regardless of efficiency.",
              "Re-baseline annually, and after any event that changes the frequency evidence.",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 14, fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.75)" }}>
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.accent, flexShrink: 0 }}>{i + 1}</span>
                {t}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
