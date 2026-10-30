import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { Sun } from "./Sun";

export const C = {
  canvas: "#f3f6f8", card: "#fff", line: "#e5e9ee", line2: "#cfd7e0",
  ink: "#0d1b2a", muted: "#5f6b7a", teal: "#0f6b6b",
  low: "#15803d", watch: "#a16207", elev: "#c2410c", high: "#dc2626",
  serif: 'Georgia, "Times New Roman", serif',
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  mono: 'ui-monospace, "DejaVu Sans Mono", Menlo, Consolas, monospace',
};

/* Type is uncovered by a travelling edge. Opacity is never animated: a fade has
   no physical analogue and is what made the first cut read as slides. */
export const Wipe: React.FC<{ d: number; revealFrames?: number; children: React.ReactNode }> = ({ d, revealFrames = 8, children }) => {
  const f = useCurrentFrame();
  const p = interpolate(f - d, [0, revealFrames], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: revealFrames > 8 ? Easing.bezier(0.4, 0, 0.2, 1) : Easing.bezier(0.2, 1, 0.3, 1),
  });
  return <div style={{ clipPath: `inset(-0.15em ${(1 - p) * 100}% -0.3em 0)` }}>{children}</div>;
};

/** Rises into place with mass. Transform only. */
export const Lift: React.FC<{ d: number; dy?: number; children: React.ReactNode }> =
({ d, dy = 40, children }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - d, fps, config: { damping: 15, mass: 0.6, stiffness: 150 } });
  return <div style={{ transform: `translateY(${(1 - s) * dy}px)` }}>{children}</div>;
};

/** Every type scene drifts slowly so nothing is ever truly still. */
export const Scene: React.FC<{ dur: number; children: React.ReactNode; center?: boolean }> =
({ dur, children, center }) => {
  const f = useCurrentFrame();
  const drift = interpolate(f, [0, dur], [10, -10], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: C.canvas }}>
      <AbsoluteFill style={{
        display: "flex", flexDirection: "column", justifyContent: "center",
        alignItems: center ? "center" : "flex-start",
        textAlign: center ? "center" : "left",
        padding: "0 150px", gap: 34, transform: `translateY(${drift}px)`,
        fontFamily: C.sans,
      }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Eyebrow: React.FC<{ d?: number; revealFrames?: number; children: React.ReactNode }> = ({ d = 2, revealFrames, children }) => (
  <Wipe d={d} revealFrames={revealFrames}>
    <div style={{ fontFamily: C.mono, fontSize: 24, letterSpacing: ".3em", textTransform: "uppercase", color: C.muted }}>
      {children}
    </div>
  </Wipe>
);

export const Head: React.FC<{ d?: number; size?: number; revealFrames?: number; children: React.ReactNode }> =
({ d = 5, size = 108, revealFrames, children }) => (
  <Wipe d={d} revealFrames={revealFrames}>
    <div style={{ fontFamily: C.serif, fontSize: size, lineHeight: 1.08, letterSpacing: "-.022em", color: C.ink, whiteSpace: "pre-line" }}>
      {children}
    </div>
  </Wipe>
);

export const Sub: React.FC<{ d?: number; revealFrames?: number; children: React.ReactNode }> = ({ d = 11, revealFrames, children }) => (
  <Wipe d={d} revealFrames={revealFrames}>
    <div style={{ fontFamily: C.sans, fontSize: 38, lineHeight: 1.45, color: C.muted, maxWidth: 1180 }}>
      {children}
    </div>
  </Wipe>
);

/* ── the vitals row ──────────────────────────────────────────────────── */
type Tile = { k: string; v: string; u?: string };
export const Tiles: React.FC<{ tiles: Tile[]; gap?: boolean; d?: number }> =
({ tiles, gap, d = 6 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", gap: 26, width: "100%" }}>
      {tiles.map((t, i) => {
        const s = spring({ frame: f - (d + i * 3), fps, config: { damping: 16, mass: 0.6, stiffness: 160 } });
        return (
          <div key={i} style={{
            flex: "1 1 0", minWidth: 0, boxSizing: "border-box", minHeight: 212,
            visibility: f < d + i * 3 ? "hidden" : "visible",
            background: C.card, border: `1px solid ${C.line}`, borderRadius: 26,
            padding: "32px 30px", transform: `translateY(${(1 - s) * 44}px)`,
          }}>
            <div style={{ fontSize: 25, color: C.muted }}>{t.k}</div>
            <div style={{ fontSize: 66, fontWeight: 700, letterSpacing: "-.02em", color: C.low, lineHeight: 1.2 }}>
              {t.v}{t.u && <span style={{ fontSize: 28, fontWeight: 400, color: C.muted }}> {t.u}</span>}
            </div>
          </div>
        );
      })}
      {gap && <GapTile d={d + tiles.length * 3 + 6} />}
    </div>
  );
};

/* The one tile that does not exist. It arrives last, overshoots, and its dashed
   border draws itself rather than fading up. */
const GapTile: React.FC<{ d: number }> = ({ d }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - d, fps, config: { damping: 11, mass: 0.8, stiffness: 150 } });
  const dash = interpolate(f - d, [0, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{
      flex: "1 1 0", minWidth: 0, boxSizing: "border-box", borderRadius: 26,
      visibility: f < d ? "hidden" : "visible",
      padding: "32px 30px", position: "relative",
      background: "#fdf0f0", transform: `translateY(${(1 - s) * 44}px) scale(${0.94 + 0.06 * s})`,
    }}>
      <div style={{ position: "absolute", inset: 0, border: `2px dashed ${C.high}`,
        borderRadius: 26, clipPath: `inset(0 ${(1 - dash) * 100}% 0 0)` }} />
      <div style={{ position: "relative", fontSize: 25, color: C.high }}>Nurse worry</div>
      <div style={{ position: "relative", fontSize: 36, fontWeight: 600, color: C.high, lineHeight: 1.25 }}>
        There's no field<br />for this
      </div>
    </div>
  );
};

/* ── the five point scale ────────────────────────────────────────────── */
const LV = ["#eef6f0", "#e8f2e6", "#f6efdf", "#f8ece3", "#fbe9e9"];
export const Scale: React.FC<{ labels: string[]; on?: number; d?: number }> =
({ labels, on = 4, d = 6 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", gap: 24, width: "100%" }}>
      {labels.map((l, i) => {
        const s = spring({ frame: f - (d + i * 4), fps, config: { damping: 15, mass: 0.6, stiffness: 160 } });
        const sel = i === on;
        const ring = spring({ frame: f - (d + labels.length * 4 + 6), fps, config: { damping: 12, mass: 0.7, stiffness: 170 } });
        return (
          <div key={i} style={{
            flex: 1, height: 132, borderRadius: 26, background: LV[i],
            boxSizing: "border-box", visibility: f < d + i * 4 ? "hidden" : "visible",
            border: `${sel ? 2 + 2 * ring : 2}px solid ${sel ? C.high : C.line2}`,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            paddingBottom: 16, fontSize: 38,
            color: sel ? C.ink : C.muted, fontWeight: sel ? 700 : 400,
            transform: `translateY(${(1 - s) * 38}px)`,
          }}>{l}</div>
        );
      })}
    </div>
  );
};

/* ── counting number ─────────────────────────────────────────────────── */
export const Count: React.FC<{ to: number; suffix?: string; d?: number; size?: number }> =
({ to, suffix = "", d = 4, size = 230 }) => {
  const f = useCurrentFrame();
  const p = interpolate(f - d, [0, 34], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
  });
  return (
    <div style={{ fontFamily: C.serif, fontSize: size, lineHeight: 1, letterSpacing: "-.03em", color: C.ink, fontVariantNumeric: "tabular-nums" }}>
      {Math.round(p * to)}<span style={{ fontSize: size * 0.42 }}>{suffix}</span>
    </div>
  );
};

export const Cite: React.FC<{ d?: number; children: React.ReactNode }> = ({ d = 26, children }) => (
  <Wipe d={d}>
    <div style={{ fontFamily: C.mono, fontSize: 21, letterSpacing: ".11em", textTransform: "uppercase", color: C.muted }}>
      {children}
    </div>
  </Wipe>
);

/* ── the lockup ──────────────────────────────────────────────────────── */
export const Lockup: React.FC<{ d?: number; tagline?: string; wordmarkReveal?: number; taglineDelay?: number }> =
({ d = 4, tagline, wordmarkReveal, taglineDelay }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - d, fps, config: { damping: 14, mass: 0.9, stiffness: 140 } });
  const w = spring({ frame: f - (d + 14), fps, config: { damping: 16, mass: 0.7, stiffness: 150 } });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
      <Sun size={190} style={{ transform: `scale(${0.8 + 0.2 * s}) rotate(${(1 - s) * -26}deg)` }} />
      <div style={{
        fontFamily: C.serif, fontSize: 150, lineHeight: 1, color: C.ink,
        letterSpacing: `${0.3 + (1 - w) * 0.22}em`, textIndent: `${0.3 + (1 - w) * 0.22}em`,
        transform: `translateY(${(1 - w) * 22}px)`,
        opacity: wordmarkReveal === undefined ? 1 : interpolate(f, [wordmarkReveal, wordmarkReveal + 10], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
        }),
      }}>SALUS</div>
      {tagline && (
        <Wipe d={taglineDelay ?? d + 26}>
          <div style={{ fontFamily: C.mono, fontSize: 30, letterSpacing: ".3em", textTransform: "uppercase", color: C.high }}>
            {tagline}
          </div>
        </Wipe>
      )}
    </div>
  );
};
