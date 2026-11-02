import React from "react";
import { AbsoluteFill, Sequence, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { C, Eyebrow, Head, Scene, Sub } from "./Type";

const RECOVERY_FRAMES = 210;
/* The three recap lines land as beats, so the closing thought needs room after
   the last one to settle before the logo rather than being cut into it. */
export const RECAP_FRAMES = 195;
export const ACT9_FRAMES = RECOVERY_FRAMES + RECAP_FRAMES;

// Illustrative continuation of the storyboard, not a captured clinical outcome.
// Fixed axes preserve the scale as the simulated recovery develops.
const RecoveryVital: React.FC<{
  label: string; unit: string; values: number[]; domain: [number, number]; diastolic?: number[];
}> = ({ label, unit, values, domain, diastolic }) => {
  const frame = useCurrentFrame();
  const position = interpolate(frame, [22, 158], [3, values.length - 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const indices = values.map((_, index) => index);
  const value = interpolate(position, indices, values);
  const lower = diastolic ? Math.round(interpolate(position, indices, diastolic)) : null;
  const color = interpolateColors(frame, [22, 90, 158], [C.high, C.watch, C.low]);
  const x = (index: number) => 12 + index / (values.length - 1) * 416;
  const y = (number: number) => interpolate(number, domain, [132, 12]);
  const path = values.map((number, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(number)}`).join(" ");
  const endX = x(position);
  const clipId = `recovery-${label.replace(/ /g, "-")}`;
  return (
    <div style={{ flex: 1, minWidth: 0, padding: "28px 28px 22px", background: C.card,
      border: `1px solid ${C.line}`, borderRadius: 26, textAlign: "left" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
        fontFamily: C.sans, fontSize: 25, color: C.muted }}>
        <span>{label}</span>
        <span style={{ fontSize: 17, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".06em" }}>
          {frame >= 158 ? "Settled" : "Settling"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginTop: 20, fontFamily: C.sans,
        fontWeight: 700, color: C.ink, fontVariantNumeric: "tabular-nums", fontSize: 84, lineHeight: 1.1 }}>
        <span>{Math.round(value)}{lower !== null && <span style={{ fontSize: 43 }}>/{lower}</span>}</span>
        <span style={{ fontSize: 22, fontWeight: 400, color: C.muted }}>{unit}</span>
      </div>
      <svg viewBox="0 0 440 150" style={{ width: "100%", height: 155, marginTop: 22, overflow: "visible" }}
        role="img" aria-label={`${label}, simulated recovery to ${values[values.length - 1]}${lower !== null ? "/72" : ""} ${unit}`}>
        <defs><clipPath id={clipId}><rect x="0" y="0" width={endX + 1} height="150" /></clipPath></defs>
        <path d="M12 142 H428" stroke={C.line} fill="none" />
        <g clipPath={`url(#${clipId})`}>
          <path d={`${path} L428 142 L12 142 Z`} fill={color} opacity={0.08} />
          {/* Dashed: this line is a projection, not a recorded observation. */}
          <path d={path} stroke={color} strokeWidth={3.5} strokeDasharray="9 7" strokeLinejoin="round" strokeLinecap="round" fill="none" />
        </g>
        <circle cx={endX} cy={y(value)} r={5.5} fill={color} />
      </svg>
    </div>
  );
};

const RecoveryTrends: React.FC = () => (
  <Scene dur={RECOVERY_FRAMES} center>
    {/* Conditional, not consequent: the film shows no treatment and the
        follow-up is still open, so this beat is what a response protects. */}
    <Eyebrow>Illustrative scenario · not an outcome</Eyebrow>
    <Head size={74}>{"When the response lands,\nthe lines settle."}</Head>
    <div style={{ display: "flex", gap: 28, width: "100%", marginTop: 12 }}>
      <RecoveryVital label="Heart rate" unit="bpm" domain={[60, 150]} values={[130, 132, 129, 130, 126, 118, 110, 101, 96, 92]} />
      <RecoveryVital label="Respiratory rate" unit="/min" domain={[10, 32]} values={[27, 26, 27, 27, 25, 23, 21, 19, 18, 18]} />
      <RecoveryVital label="Blood pressure" unit="mmHg" domain={[60, 135]} values={[76, 75, 76, 76, 82, 90, 100, 108, 112, 114]}
        diastolic={[53, 52, 53, 53, 56, 60, 65, 69, 71, 72]} />
    </div>
    <Sub>Simulated values. In this demo the follow-up is still open.</Sub>
  </Scene>
);

/* The three lines are parallel clauses, so they land as three beats rather than
   arriving together in one wipe. Each line keeps its layout box from frame 0,
   so the centred block never reflows as the later lines appear. */
export const CareLoop: React.FC = () => (
  <Scene dur={RECAP_FRAMES} center>
    <Eyebrow>The care journey</Eyebrow>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Head d={8} size={74}>A concern heard.</Head>
      <Head d={36} size={74}>A response recorded.</Head>
      <Head d={64} size={74}>A change brought back to the team.</Head>
    </div>
  </Scene>
);

export const Act9Recovery: React.FC = () => (
  <AbsoluteFill style={{ background: C.canvas }}>
    {/* The disclaimer belongs to the projection. The closing recap states nothing
        simulated, so it ends on a clean canvas. */}
    <Sequence name="Act 9: Illustrative projection" durationInFrames={RECOVERY_FRAMES}>
      <RecoveryTrends />
      <div style={{ position: "absolute", left: 90, bottom: 30, color: C.muted, fontFamily: C.mono,
        fontSize: 18, letterSpacing: ".05em" }}>Illustrative projection · simulated values</div>
    </Sequence>
    <Sequence name="Act 9: From concern to decision" from={RECOVERY_FRAMES} durationInFrames={RECAP_FRAMES}><CareLoop /></Sequence>
  </AbsoluteFill>
);
