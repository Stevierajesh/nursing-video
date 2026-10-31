import React from "react";
import { Freeze, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C } from "./Type";

// Recorded endpoints, with illustrative samples connecting them for the demo.
// This replay is authored for the film and never writes patient observations.
const MINUTES = [0, 2, 4, 6, 7, 8, 9, 10];
const SERIES = {
  heart_rate: [88, 90, 93, 96, 98, 101, 104, 106],
  resp_rate: [18, 18, 19, 19, 20, 21, 21, 22],
  spo2: [96, 96, 96, 96, 96, 96, 96, 96],
  systolic_bp: [118, 115, 110, 106, 104, 103, 103, 101],
  diastolic_bp: [74, 73, 70, 68, 67, 67, 66, 66],
  temperature_c: [36.9, 36.9, 36.8, 36.8, 36.9, 36.9, 36.9, 37.0],
};
type VitalKey = keyof typeof SERIES;
const minutesAt = (frame: number) => interpolate(frame, [60, 270], [0, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const readingAt = (key: VitalKey, minutes: number) => interpolate(minutes, MINUTES, SERIES[key]);
const elapsed = (minutes: number) => {
  const seconds = Math.round(minutes * 60);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
};

const LiveVital: React.FC<{ field: VitalKey; label: string; unit: string; baseline: string; domain: [number, number] }> = ({ field, label, unit, baseline, domain }) => {
  const frame = useCurrentFrame();
  const minutes = minutesAt(frame);
  const value = readingAt(field, minutes);
  const rounded = Math.round(value);
  const tone = field === "heart_rate" && rounded > 100 ? C.watch
    : field === "resp_rate" && rounded >= 21 ? C.elev
    : field === "systolic_bp" && rounded <= 110 ? C.watch : C.teal;
  const flag = field === "heart_rate" && rounded > 100 ? "Watch"
    : field === "resp_rate" && rounded >= 21 ? "Elevated"
    : field === "systolic_bp" && rounded <= 110 ? "Low" : "";
  // Retain a calm history on the left and append new samples across ten minutes.
  const history = [0, 1, 2, 3, 4].map(index => ({ x: index * 10, value: SERIES[field][0] }));
  const recent = MINUTES.filter(minute => minute > 0 && minute <= minutes).map(minute => ({ x: 40 + minute * 12, value: readingAt(field, minute) }));
  const points = [...history, ...recent, { x: 40 + minutes * 12, value }];
  const y = (number: number) => interpolate(number, domain, [40, 4]);
  const path = points.map((point, index) => `${index ? "L" : "M"}${point.x},${y(point.value)}`).join(" ");
  return <div style={{ padding: "12px 13px", background: flag ? `${tone}09` : "#f7f9fa", border: `1px solid ${flag ? `${tone}50` : C.line}`,
    borderRadius: 18, height: 154, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 7 }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 4, fontSize: 12, color: C.muted }}>
      <span>{label}</span><span style={{ fontSize: 11, fontWeight: 700, color: tone }}>{flag}</span>
    </div>
    <div style={{ fontSize: 27, fontWeight: 700, color: C.ink, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
      {field === "temperature_c" ? value.toFixed(1) : rounded}<span style={{ fontSize: 12, fontWeight: 400, color: C.muted }}> {unit}</span>
    </div>
    <svg viewBox="0 0 165 46" style={{ width: "100%", height: 46, marginTop: "auto", overflow: "visible" }} role="img" aria-label={`${label} demo time-lapse trend`}>
      <path d={path} stroke={tone} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx={40 + minutes * 12} cy={y(value)} r={2.5} fill={tone} />
    </svg>
    <div style={{ fontSize: 10, color: C.muted }}>Baseline {baseline}</div>
  </div>;
};

export const WatchTimeLapseScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const minutes = minutesAt(frame);
  const score = Math.round(interpolate(minutes, [0, 5, 10], [3, 4, 5]));
  const news = (Math.round(readingAt("heart_rate", minutes)) > 90 ? 1 : 0)
    + (Math.round(readingAt("resp_rate", minutes)) >= 21 ? 2 : 0)
    + (Math.round(readingAt("systolic_bp", minutes)) <= 110 ? 1 : 0);
  const bandColor = C.watch;
  return <div style={{ position: "relative", width: 1366, height: 1024, scale: 1000 / 1366, transformOrigin: "top left", fontFamily: C.sans }}>
    <Freeze frame={0}>
      <OffthreadVideo src={staticFile("act4.webm")} startFrom={552} muted style={{ width: 1366, height: 1024 }} />
    </Freeze>
    <div style={{ position: "absolute", left: 59, top: 174, width: 612, height: 54, background: C.canvas, color: C.muted }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
        <span style={{ color: news ? C.ink : C.low, background: news ? C.line : "#e0efe7", padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>NEWS {news}</span>
        {minutes >= 4 && <span style={{ color: C.watch, background: "#f3ead9", padding: "3px 8px", borderRadius: 6 }}>↑ trending up</span>}
      </div>
      <div style={{ fontSize: 10, marginTop: 6 }}>Demo T+{elapsed(minutes)} · RR {Math.round(readingAt("resp_rate", minutes))} · SpO₂ 96% · HR {Math.round(readingAt("heart_rate", minutes))}</div>
    </div>
    <div style={{ position: "absolute", left: 59, top: 242, width: 612, height: 90, boxSizing: "border-box", padding: "13px 16px",
      borderRadius: 18, border: `1px solid ${bandColor}50`, background: "#f3ead9", color: bandColor, boxShadow: `0 0 0 3px ${C.canvas}`,
      display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 16, fontWeight: 700 }}>Concern acknowledged · assessment pending</div>
      <div style={{ fontSize: 12, color: C.muted }}>NEWS {news} · {news === 0 ? "Zero" : "Low"}</div>
      <div style={{ fontSize: 12, color: C.muted }}>Combined score {score}/10</div>
    </div>
    <div style={{ position: "absolute", left: 59, top: 352, width: 612, height: 477, padding: 15, boxSizing: "border-box",
      background: "#fff", border: `1px solid ${C.line}`, borderRadius: 24, display: "flex", flexDirection: "column", gap: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 15, fontWeight: 700, color: C.ink }}>
        <span>Latest observations</span><span style={{ fontSize: 10, border: `1px solid ${C.line2}`, borderRadius: 999, padding: "3px 8px", fontWeight: 400 }}>Demo time-lapse</span>
      </div>
      <div style={{ fontSize: 12, color: C.ink }}>Presenting with persistent swelling of the feet and legs, with cramping.</div>
      <div style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal }} />Simulated observations · T+{elapsed(minutes)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <LiveVital field="heart_rate" label="Heart rate" unit="bpm" baseline="78 bpm" domain={[78, 115]} />
        <LiveVital field="resp_rate" label="Respiratory rate" unit="/min" baseline="16 /min" domain={[16, 25]} />
        <LiveVital field="spo2" label="Oxygen saturation" unit="%" baseline="98 %" domain={[90, 100]} />
        <LiveVital field="systolic_bp" label="Systolic BP" unit="mmHg" baseline="124 mmHg" domain={[95, 125]} />
        <LiveVital field="diastolic_bp" label="Diastolic BP" unit="mmHg" baseline="78 mmHg" domain={[60, 80]} />
        <LiveVital field="temperature_c" label="Temperature" unit="°C" baseline="36.8 °C" domain={[36.5, 37.5]} />
      </div>
      <div style={{ fontSize: 10, color: C.muted, marginTop: "auto" }}>Illustrative replay between recorded observations · each trend uses its own scale</div>
    </div>
    <div style={{ position: "absolute", left: 694, top: 362, width: 612, height: 467, boxSizing: "border-box", padding: 16,
      border: `1px solid ${C.line}`, borderRadius: 24, background: "#fff", color: C.muted, fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 14 }}>Recent observation history · demo replay</div>
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr .7fr .7fr .8fr 1fr .8fr", padding: "10px 8px", fontSize: 10 }}>
        {["Time", "HR", "RR", "SpO₂", "BP", "Temp"].map(title => <span key={title}>{title}</span>)}
      </div>
      {[minutes, ...MINUTES.filter(minute => minute < minutes).reverse()].slice(0, 8).map((minute, index) => <div key={index}
        style={{ display: "grid", gridTemplateColumns: "1.3fr .7fr .7fr .8fr 1fr .8fr", padding: "12px 8px", borderTop: `1px solid ${C.line}`, color: C.ink, fontVariantNumeric: "tabular-nums" }}>
        <span>T+{elapsed(minute)}</span><span>{Math.round(readingAt("heart_rate", minute))}</span><span>{Math.round(readingAt("resp_rate", minute))}</span>
        <span>96%</span><span>{Math.round(readingAt("systolic_bp", minute))}/{Math.round(readingAt("diastolic_bp", minute))}</span><span>{readingAt("temperature_c", minute).toFixed(1)}°C</span>
      </div>)}
    </div>
  </div>;
};

export const WatchClock: React.FC = () => {
  const frame = useCurrentFrame();
  const minutes = minutesAt(frame);
  return <div style={{ position: "absolute", left: 1313, top: 160, width: 500, color: C.teal, fontFamily: C.mono,
    opacity: interpolate(frame, [348, 359], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
    <div style={{ fontSize: 18, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 12 }}>Demo time-lapse</div>
    <div style={{ fontSize: 62, fontVariantNumeric: "tabular-nums" }}>T+{elapsed(minutes)}</div>
    <div style={{ height: 4, background: C.line, marginTop: 16, borderRadius: 5 }}>
      <div style={{ width: `${minutes * 10}%`, height: "100%", background: C.teal, borderRadius: 5 }} />
    </div>
  </div>;
};
