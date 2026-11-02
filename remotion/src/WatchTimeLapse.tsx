import React from "react";
import { Freeze, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C } from "./Type";

// Recorded endpoints, with illustrative samples connecting them for the demo.
// This replay is authored for the film and never writes patient observations.
// The replay runs from the 5:01:25 PM baseline to 5:11:25 PM, which is the very
// observation the reassessment capture opens on ("observed just now · 5:11:25
// PM", HR 129 · RR 26 · BP 75/52 · 36.9). The final sample is therefore pinned
// to that recorded reading so the two screens describe one moment, not two.
const MINUTES = [0, 2, 4, 6, 7, 8, 9, 10];
const SERIES = {
  heart_rate: [88, 90, 94, 100, 107, 115, 123, 129],
  resp_rate: [18, 18, 19, 20, 21, 23, 24, 26],
  spo2: [96, 96, 96, 96, 96, 96, 96, 96],
  systolic_bp: [118, 115, 110, 103, 96, 88, 81, 75],
  diastolic_bp: [74, 73, 70, 66, 62, 58, 55, 52],
  temperature_c: [36.9, 36.9, 36.8, 36.8, 36.9, 36.9, 36.9, 36.9],
};
type VitalKey = keyof typeof SERIES;
const minutesAt = (frame: number) => interpolate(frame, [60, 254], [0, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const readingAt = (key: VitalKey, minutes: number) => interpolate(minutes, MINUTES, SERIES[key]);
/* Real NEWS thresholds rather than the earlier 1/2/1 approximation, which
   topped out at 4 and so handed off to a page reading NEWS 8. This runs 0 at
   the baseline to 8 at 5:11:25 PM, matching both ends. */
const newsAt = (minutes: number) => {
  const hr = Math.round(readingAt("heart_rate", minutes));
  const rr = Math.round(readingAt("resp_rate", minutes));
  const sbp = Math.round(readingAt("systolic_bp", minutes));
  return (hr >= 131 ? 3 : hr >= 111 ? 2 : hr >= 91 ? 1 : 0)
    + (rr >= 25 ? 3 : rr >= 21 ? 2 : 0)
    + (sbp <= 90 ? 3 : sbp <= 100 ? 2 : sbp <= 110 ? 1 : 0);
};
// The app's own banding, from nursing-app's risk.ts.
const newsBandLabel = (news: number) => news === 0 ? "Zero" : news >= 7 ? "High" : news >= 5 ? "Medium" : "Low";
// Match the first-assessment capture's 5:01:25 PM baseline. Format explicitly
// so the demo clock stays identical in Studio and renders in any time zone.
const BASELINE_CLOCK_SECONDS = 17 * 3600 + 60 + 25;
const clockTime = (minutes: number) => {
  const seconds = BASELINE_CLOCK_SECONDS + Math.round(minutes * 60);
  const hours = Math.floor(seconds / 3600) % 24;
  const minute = Math.floor(seconds / 60) % 60;
  return `${hours % 12 || 12}:${String(minute).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
};

const LiveVital: React.FC<{ field: VitalKey; label: string; unit: string; baseline: string; domain: [number, number] }> = ({ field, label, unit, baseline, domain }) => {
  const frame = useCurrentFrame();
  const minutes = minutesAt(frame);
  const value = readingAt(field, minutes);
  const rounded = Math.round(value);
  /* Flags escalate with the reading so the final tile matches the reassessment
     page it hands off to: heart rate Elevated, respiratory rate High, BP Low. */
  const tone = field === "heart_rate" ? (rounded > 110 ? C.elev : rounded > 100 ? C.watch : C.teal)
    : field === "resp_rate" ? (rounded >= 25 ? C.high : rounded >= 21 ? C.elev : C.teal)
    : field === "systolic_bp" ? (rounded <= 90 ? C.high : rounded <= 110 ? C.watch : C.teal) : C.teal;
  const flag = field === "heart_rate" ? (rounded > 110 ? "Elevated" : rounded > 100 ? "Watch" : "")
    : field === "resp_rate" ? (rounded >= 25 ? "High" : rounded >= 21 ? "Elevated" : "")
    : field === "systolic_bp" ? (rounded <= 110 ? "Low" : "") : "";
  // Keep a full history window on screen from the start. New observations
  // enter at the right edge while the established baseline scrolls left.
  const points = Array.from({ length: 65 }, (_, index) => {
    const x = index * 2.5;
    const sampleMinute = Math.max(0, minutes - (160 - x) / 12);
    return { x, value: readingAt(field, sampleMinute) };
  });
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
      <circle cx={160} cy={y(value)} r={2.5} fill={tone} />
    </svg>
    <div style={{ fontSize: 10, color: C.muted }}>Baseline {baseline}</div>
  </div>;
};

export const WatchTimeLapseScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const minutes = minutesAt(frame);
  const score = Math.round(interpolate(minutes, [0, 5, 10], [3, 4, 5]));
  const news = newsAt(minutes);
  const bandColor = news >= 7 ? C.high : score >= 4 ? C.watch : C.low;
  return <div style={{ position: "relative", width: 1366, height: 1024, scale: 1000 / 1366, transformOrigin: "top left", fontFamily: C.sans }}>
    <Freeze frame={0}>
      <OffthreadVideo src={staticFile("act4.webm")} startFrom={552} muted style={{ width: 1366, height: 1024 }} />
    </Freeze>
    <div style={{ position: "absolute", left: 59, top: 174, width: 612, height: 54, background: C.canvas, color: C.muted }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
        <span style={{ color: news ? C.ink : C.low, background: news ? C.line : "#e0efe7", padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>NEWS {news}</span>
        {minutes >= 4 && <span style={{ color: C.watch, background: "#f3ead9", padding: "3px 8px", borderRadius: 6 }}>↑ trending up</span>}
      </div>
      <div style={{ fontSize: 10, marginTop: 6 }}>Demo {clockTime(minutes)} · RR {Math.round(readingAt("resp_rate", minutes))} · SpO₂ 96% · HR {Math.round(readingAt("heart_rate", minutes))}</div>
    </div>
    <div style={{ position: "absolute", left: 59, top: 242, width: 612, height: 90, boxSizing: "border-box", padding: "13px 16px",
      borderRadius: 18, border: `1px solid ${bandColor}50`, background: news >= 7 ? "#fbe9e9" : score >= 4 ? "#f3ead9" : "#e0efe7", color: bandColor, boxShadow: `0 0 0 3px ${C.canvas}`,
      display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 16, fontWeight: 700 }}>Assessment recorded · monitoring continues</div>
      <div style={{ fontSize: 12, color: C.muted }}>NEWS {news} · {newsBandLabel(news)}</div>
      <div style={{ fontSize: 12, color: C.muted }}>Combined score {score}/10</div>
    </div>
    <div style={{ position: "absolute", left: 59, top: 352, width: 612, height: 477, padding: 15, boxSizing: "border-box",
      background: "#fff", border: `1px solid ${C.line}`, borderRadius: 24, display: "flex", flexDirection: "column", gap: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 15, fontWeight: 700, color: C.ink }}>
        <span>Latest observations</span><span style={{ fontSize: 10, border: `1px solid ${C.line2}`, borderRadius: 999, padding: "3px 8px", fontWeight: 400 }}>Demo time-lapse</span>
      </div>
      <div style={{ fontSize: 12, color: C.ink }}>Presenting with persistent swelling of the feet and legs, with cramping.</div>
      <div style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal }} />Simulated observations · {clockTime(minutes)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {/* Domains widened to hold the new endpoints; the trend lines stay
            continuous and inside their boxes instead of running off the top. */}
        <LiveVital field="heart_rate" label="Heart rate" unit="bpm" baseline="78 bpm" domain={[78, 135]} />
        <LiveVital field="resp_rate" label="Respiratory rate" unit="/min" baseline="16 /min" domain={[16, 28]} />
        <LiveVital field="spo2" label="Oxygen saturation" unit="%" baseline="98 %" domain={[90, 100]} />
        <LiveVital field="systolic_bp" label="Systolic BP" unit="mmHg" baseline="124 mmHg" domain={[70, 125]} />
        <LiveVital field="diastolic_bp" label="Diastolic BP" unit="mmHg" baseline="78 mmHg" domain={[50, 80]} />
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
        <span>{clockTime(minute)}</span><span>{Math.round(readingAt("heart_rate", minute))}</span><span>{Math.round(readingAt("resp_rate", minute))}</span>
        <span>96%</span><span>{Math.round(readingAt("systolic_bp", minute))}/{Math.round(readingAt("diastolic_bp", minute))}</span><span>{readingAt("temperature_c", minute).toFixed(1)}°C</span>
      </div>)}
    </div>
  </div>;
};

export const WatchClock: React.FC = () => {
  const frame = useCurrentFrame();
  const minutes = minutesAt(frame);
  return <div style={{ position: "absolute", left: 1313, top: 160, width: 500, color: C.teal, fontFamily: C.mono,
    opacity: interpolate(frame, [243, 254], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
    <div style={{ fontSize: 18, letterSpacing: ".16em", textTransform: "uppercase", marginBottom: 12 }}>Demo time-lapse</div>
    <div style={{ fontSize: 62, fontVariantNumeric: "tabular-nums" }}>{clockTime(minutes)}</div>
    <div style={{ height: 4, background: C.line, marginTop: 16, borderRadius: 5 }}>
      <div style={{ width: `${minutes * 10}%`, height: "100%", background: C.teal, borderRadius: 5 }} />
    </div>
  </div>;
};
