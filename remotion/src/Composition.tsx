import React from "react";
import {
  AbsoluteFill, Sequence, Series, Freeze, OffthreadVideo, Audio, staticFile,
  useCurrentFrame, interpolate, Easing,
} from "remotion";
import {
  ColdOpen, TheGap, LogoResolve, Outro,
  COLD_OPEN_FRAMES, GAP_FRAMES, LOGO_FRAMES, OPENING_FRAMES, OUTRO_FRAMES,
} from "./TypeActs";
import { PatientIntro, PATIENT_INTRO_FRAMES, PATIENT_SLIDE_FRAMES } from "./PatientIntro";
import { Scene, Eyebrow, Head, Sub } from "./Type";
import { Act9Recovery, ACT9_FRAMES } from "./Act9Recovery";
import { WatchTimeLapseScreen, WatchClock } from "./WatchTimeLapse";

/* ── timing ────────────────────────────────────────────────────────────── */
export const FPS = 30;
export const BAR = (240 / 119) * FPS;          // 60.504 frames
/* Remotion addresses the source in COMPOSITION frames: startFrom/fps is the
   seek point in seconds, regardless of the source file's own frame rate.
   (The webm is 25fps; that does not enter into it.) */
const bars = (n: number) => Math.round(n * BAR);
export const ACT5_FRAMES = 360;
export const ACT7_FRAMES = 570;
export const ACT8_FRAMES = 783;

const C = {
  canvas: "#f3f6f8", ink: "#0d1b2a", muted: "#5f6b7a", teal: "#0f6b6b",
  serif: 'Georgia, "Times New Roman", serif',
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  mono: 'ui-monospace, "DejaVu Sans Mono", Menlo, Consolas, monospace',
};

/* ── device + camera ─────────────────────────────────────────────────────
   The iPad is rigid; the camera moves it. Crucially the camera path is
   continuous ACROSS a whole segment, so the device never jumps at a copy
   change, and the video is mounted once per segment so the playhead never
   rewinds. Earlier each shot re-seeked the footage, which is what made the
   cursor teleport back to a button it had already left.                   */
const VID_W = 1366, VID_H = 1024;
const SCREEN_W = 1000, SCREEN_H = 750, BEZEL = 26;
const K = SCREEN_W / VID_W;
const BASE_X = 700, BASE_Y = 540;
const AIM_X = 545, AIM_Y = 540;

type Cam = { x: number; y: number; z: number };
const focus = (vx: number, vy: number, z: number, aimX = AIM_X): Cam => ({
  x: aimX - BASE_X - z * (vx - VID_W / 2) * K,
  y: AIM_Y - BASE_Y - z * (vy - VID_H / 2) * K,
  z,
});
const WHOLE = focus(VID_W / 2, VID_H / 2, 0.95);
void WHOLE;
// One shared pose across the Act 5/6 boundary, then pan to the worry controls.
const REASSESSMENT_HANDOFF = focus(350, 440, 1.65);

type Key = { t: number; cam: Cam };
type Card = { at: number; len: number; eyebrow?: string; head?: string; sub?: string };
type Seg = { src: string; at: number; to: number; len: number; durationFrames?: number; keys: Key[]; cards: Card[] };

/* ── the act ─────────────────────────────────────────────────────────────
   Three continuous takes. Two cuts in the whole sequence, both at genuine
   scene changes, instead of a cut at every caption.                      */
const SEGS: Seg[] = [
  // Trim stationary holds in the first recording. The camera and copy run on
  // one uninterrupted clock; all pointer moves and the complete note survive.
  {
    src: "act4.webm", at: 18.4, to: 57.8, len: 0, durationFrames: 607,
    keys: [
      { t: 0.00, cam: focus(330, 610, 1.65) },
      { t: 0.05, cam: focus(330, 610, 2.20) },
      { t: 0.14, cam: focus(330, 610, 2.20) },
      { t: 0.22, cam: focus(1050, 250, 1.70) },
      { t: 0.36, cam: focus(970, 350, 1.60) },
      { t: 0.46, cam: focus(1000, 515, 2.40, 570) },
      { t: 0.68, cam: focus(1000, 515, 2.40, 570) },
      { t: 0.74, cam: focus(1000, 618, 1.65) },
      { t: 0.80, cam: focus(1000, 618, 1.65) },
      { t: 0.85, cam: focus(430, 450, 1.22) },
      { t: 1.00, cam: focus(430, 450, 1.22) },
    ],
    cards: [], // The first assessment has action-synchronized overlays below.

  },
  {
    src: "act6-reassessment.webm", at: 27.358, to: 57.2, len: 0, durationFrames: 538,
    keys: [
      { t: 0.00, cam: REASSESSMENT_HANDOFF },
      { t: 60 / 538, cam: focus(980, 200, 1.30) },
      { t: 86 / 538, cam: focus(1050, 250, 1.50) },
      { t: 149 / 538, cam: focus(1000, 360, 1.65) },
      { t: 201 / 538, cam: focus(1000, 515, 2.40, 570) },
      { t: 310 / 538, cam: focus(1000, 515, 2.40, 570) },
      { t: 348 / 538, cam: focus(1000, 618, 1.50) },
      { t: 372 / 538, cam: focus(1000, 618, 1.50) },
      { t: 412 / 538, cam: focus(430, 450, 1.30) },
      { t: 1.00, cam: focus(430, 450, 1.30) },
    ],
    cards: [], // Act 6 has independently timed overlays below.
  },
  // Act 7 owns its escalation, physician-queue and map shots below.
  {
    src: "act7-map.webm", at: 0, to: 0, len: 0, durationFrames: ACT7_FRAMES,
    keys: [], cards: [],
  },
];

// Act 5 has its own chart check; the second take begins at reassessment.
let cur = 0;
const TIMED = SEGS.map((s) => { const start = cur; const dur = s.durationFrames ?? bars(s.len); cur += dur; return { ...s, start, dur }; });
const FOOTAGE_START = OPENING_FRAMES + PATIENT_INTRO_FRAMES - PATIENT_SLIDE_FRAMES;
const ACT5_START = FOOTAGE_START + TIMED[0].dur;
const TAKES_T = TIMED.map((x, i) => ({ ...x, start: x.start + FOOTAGE_START + (i > 0 ? ACT5_FRAMES : 0) }));
const ACT8_START = FOOTAGE_START + cur + ACT5_FRAMES;
const ACT9_START = ACT8_START + ACT8_FRAMES;
export const TOTAL = ACT9_START + ACT9_FRAMES + OUTRO_FRAMES;
export const FIRST_ASSESSMENT_FRAMES = TIMED[0].dur;
export const SECOND_ASSESSMENT_FRAMES = TIMED[1].dur;

/* ── wipe reveal ─────────────────────────────────────────────────────── */
const Reveal: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) => {
  const f = useCurrentFrame();
  const p = interpolate(f - delay, [0, 7], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 1, 0.3, 1),
  });
  return <div style={{ clipPath: `inset(0 ${(1 - p) * 100}% -0.4em 0)` }}>{children}</div>;
};

/** Interpolate the camera through its keyframes — one continuous path. */
function camAt(keys: Key[], t: number): Cam {
  const e = Easing.bezier(0.4, 0, 0.3, 1);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t >= a.t && t <= b.t) {
      const u = e((t - a.t) / (b.t - a.t || 1));
      return {
        x: a.cam.x + (b.cam.x - a.cam.x) * u,
        y: a.cam.y + (b.cam.y - a.cam.y) * u,
        z: a.cam.z + (b.cam.z - a.cam.z) * u,
      };
    }
  }
  return keys[t < keys[0].t ? 0 : keys.length - 1].cam;
};

const CopyBlock: React.FC<{ c: Card; clearBackground?: boolean }> = ({ c, clearBackground = false }) => (
  <div style={{
    position: "absolute", right: 0, top: 0, width: 661, height: "100%", boxSizing: "border-box",
    display: "flex", flexDirection: "column", justifyContent: "center", gap: 20,
    alignItems: "flex-start", paddingLeft: 54, paddingRight: 86,
    background: clearBackground
      ? "linear-gradient(90deg, rgba(243,246,248,0) 0px, #f3f6f8 45px)"
      : "linear-gradient(90deg, rgba(243,246,248,0) 0%, rgba(243,246,248,.93) 16%, #f3f6f8 36%)",
  }}>
    {c.eyebrow && (
      <Reveal delay={2}>
        <div style={{
          fontFamily: C.mono, fontSize: 19, letterSpacing: ".26em", textTransform: "uppercase",
          color: "#fff", background: C.teal, padding: "10px 22px", borderRadius: 999,
        }}>{c.eyebrow}</div>
      </Reveal>
    )}
    {c.head && (
      <Reveal delay={5}>
        <div style={{
          fontFamily: C.serif, fontSize: 62, lineHeight: 1.08, color: C.ink,
          letterSpacing: "-.02em", whiteSpace: "pre-line",
        }}>{c.head}</div>
      </Reveal>
    )}
    {c.sub && (
      <Reveal delay={c.head ? 9 : 5}>
        <div style={{ fontFamily: C.sans, fontSize: 27, lineHeight: 1.45, color: C.muted }}>{c.sub}</div>
      </Reveal>
    )}
  </div>
);

const SegView: React.FC<{ s: Seg & { dur: number }; slideIn?: boolean; children?: React.ReactNode }> = ({ s, slideIn = false, children }) => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, s.dur], [0, 1], { extrapolateRight: "clamp" });
  const { x, y, z } = camAt(s.keys, t);

  return (
    <AbsoluteFill style={{ background: C.canvas,
      translate: slideIn ? `${interpolate(f, [0, PATIENT_SLIDE_FRAMES], [1920, 0], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.45, 0, 0.25, 1),
      })}px 0` : undefined,
    }}>
      <AbsoluteFill style={{
        transform: `translate(${x}px, ${y}px) scale(${z})`,
        transformOrigin: `${BASE_X}px ${BASE_Y}px`,
      }}>
        <div style={{
          position: "absolute",
          left: BASE_X - (SCREEN_W / 2 + BEZEL), top: BASE_Y - (SCREEN_H / 2 + BEZEL),
          width: SCREEN_W + BEZEL * 2, height: SCREEN_H + BEZEL * 2,
          background: "linear-gradient(158deg,#32363c,#17191c 52%,#0d0f11)",
          borderRadius: 46, padding: BEZEL,
          boxShadow: "0 1px 0 rgba(255,255,255,.16) inset, 0 50px 110px -40px rgba(13,27,42,.6)",
        }}>
          <div style={{ position: "absolute", top: BEZEL / 2 - 3, left: "50%", width: 7, height: 7, marginLeft: -3.5, borderRadius: "50%", background: "#3d434a" }} />
          <div style={{ width: SCREEN_W, height: SCREEN_H, borderRadius: 20, overflow: "hidden", background: C.canvas }}>
            {children ?? <OffthreadVideo
              src={staticFile(s.src)}
              startFrom={Math.round(s.at * FPS)}
              playbackRate={((s.to - s.at) * FPS) / s.dur}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              muted
            />}
          </div>
        </div>
      </AbsoluteFill>

      {s.cards.map((c, i) => (
        <Sequence key={i} from={bars(c.at)} durationInFrames={bars(c.len)}>
          <CopyBlock c={c} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// Cuts only remove stationary pauses, including the server's Sending wait.
// Series keeps the actions adjacent without resetting the enclosing camera.
const FirstAssessmentFootage: React.FC = () => (
  <Series>
    <Series.Sequence name="Calm chart and concern selection" durationInFrames={143} layout="none">
      <OffthreadVideo src={staticFile("act4.webm")} startFrom={552} playbackRate={186 / 143} muted style={{ width: "100%", height: "100%" }} />
    </Series.Sequence>
    <Series.Sequence name="Select reason, trim idle hold" durationInFrames={74} layout="none">
      <OffthreadVideo src={staticFile("act4.webm")} startFrom={852} playbackRate={96 / 74} muted style={{ width: "100%", height: "100%" }} />
    </Series.Sequence>
    <Series.Sequence name="Enter the full note" durationInFrames={192} layout="none">
      <OffthreadVideo src={staticFile("act4.webm")} startFrom={1026} playbackRate={249 / 192} muted style={{ width: "100%", height: "100%" }} />
    </Series.Sequence>
    <Series.Sequence name="Submit without the idle pause" durationInFrames={46} layout="none">
      <OffthreadVideo src={staticFile("act4.webm")} startFrom={1335} playbackRate={60 / 46} muted style={{ width: "100%", height: "100%" }} />
    </Series.Sequence>
    <Series.Sequence name="Recorded result, shorten server wait" durationInFrames={152} layout="none">
      <OffthreadVideo src={staticFile("act4.webm")} startFrom={1536} playbackRate={198 / 152} muted style={{ width: "100%", height: "100%" }} />
    </Series.Sequence>
  </Series>
);

export const FirstAssessmentPreview: React.FC<{ slideIn?: boolean }> = ({ slideIn = false }) => (
  <AbsoluteFill style={{ background: C.canvas }}>
    <SegView s={TIMED[0]} slideIn={slideIn}><FirstAssessmentFootage /></SegView>
    <Sequence name="The calm vitals, before she selects worry" durationInFrames={90}>
      <CopyBlock clearBackground c={{ at: 0, len: 0, head: "The chart is calm.", sub: "HR 88 · RR 18 · BP 118/74. NEWS 0." }} />
    </Sequence>
    <Sequence name="One explanation throughout concern, reason, note and submission" from={90} durationInFrames={429}>
      <CopyBlock clearBackground c={{ at: 0, len: 0, head: "But she has\nseen this before.", sub: "She selects her concern and adds a reason." }} />
    </Sequence>
    <Sequence name="First recorded result: 3 out of 10" from={519} durationInFrames={FIRST_ASSESSMENT_FRAMES - 519}>
      <CopyBlock clearBackground c={{ at: 0, len: 0, eyebrow: "Assessment recorded", head: "3 out of 10.", sub: "Her worry counts. No page is sent yet." }} />
    </Sequence>
  </AbsoluteFill>
);

const Contribution: React.FC<{ label: string; value: number; delay: number }> = ({ label, value, delay }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px 24px", fontFamily: C.sans, fontSize: 25, color: C.muted }}>
      <span>{label}</span><span style={{ color: C.ink, fontVariantNumeric: "tabular-nums" }}>+{value.toFixed(1)}</span>
      <div style={{ gridColumn: "1 / -1", height: 5, background: "#e5e9ee", borderRadius: 5, overflow: "hidden" }}>
        <div style={{ height: "100%", background: C.teal, width: `${interpolate(frame, [delay, delay + 18], [0, value / 3.5 * 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%` }} />
      </div>
    </div>
  );
};

const ReassessmentResult: React.FC = () => (
  <div style={{ position: "absolute", right: 0, top: 0, width: 661, height: "100%", paddingLeft: 54, paddingRight: 86, boxSizing: "border-box",
    display: "flex", flexDirection: "column", justifyContent: "center", gap: 22,
    background: "linear-gradient(90deg, rgba(243,246,248,0) 0px, #f3f6f8 45px)",
  }}>
    <Reveal delay={2}><div style={{ fontFamily: C.mono, fontSize: 19, letterSpacing: ".2em", color: C.teal, textTransform: "uppercase" }}>Assessment recorded</div></Reveal>
    <Reveal delay={5}>
      <div style={{ fontFamily: C.serif, fontSize: 150, lineHeight: 1, color: "#c2410c" }}>6<span style={{ fontSize: 54 }}>/10</span></div>
      <div style={{ fontFamily: C.sans, fontSize: 25, color: "#c2410c", marginTop: 16 }}>Elevated · combined risk</div>
    </Reveal>
    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 8 }}>
      <Contribution label="Nurse worry" value={2.5} delay={12} />
      <Contribution label="Current vitals" value={3.0} delay={18} />
      <Contribution label="Vitals trend" value={0.0} delay={24} />
    </div>
    <Reveal delay={28}><div style={{ fontFamily: C.sans, fontSize: 23, lineHeight: 1.4, color: C.muted }}>5.5 points, rounded to 6/10.<br />Her updated reason stays attached.</div></Reveal>
  </div>
);

const ReassessmentHandoffMatte: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{
    left: interpolate(frame, [0, 60], [1060, 1259], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.4, 0, 0.3, 1) }),
    background: "linear-gradient(90deg, transparent 0px, #f3f6f8 65px)",
  }} />;
};

const ReassessmentFootage: React.FC = () => {
  const frame = useCurrentFrame();
  return <div style={{ position: "relative", width: "100%", height: "100%" }}>
    {/* Trim only stationary waits. Keep every selection, pointer move and the
        entire updated note, under one uninterrupted device/camera path. */}
    <Series>
      <Series.Sequence name="Choose the worry level" durationInFrames={86} layout="none">
        <OffthreadVideo src={staticFile("act6-reassessment.webm")} startFrom={821} playbackRate={103.26 / 86} muted style={{ width: "100%", height: "100%" }} />
      </Series.Sequence>
      <Series.Sequence name="Move directly to What's off" durationInFrames={63} layout="none">
        <OffthreadVideo src={staticFile("act6-reassessment.webm")} startFrom={1019} playbackRate={75 / 63} muted style={{ width: "100%", height: "100%" }} />
      </Series.Sequence>
      <Series.Sequence name="Continue directly into Anything else" durationInFrames={56} layout="none">
        <OffthreadVideo src={staticFile("act6-reassessment.webm")} startFrom={1169} playbackRate={67.5 / 56} muted style={{ width: "100%", height: "100%" }} />
      </Series.Sequence>
      <Series.Sequence name="Type the full note without the focus pause" durationInFrames={105} layout="none">
        <OffthreadVideo src={staticFile("act6-reassessment.webm")} startFrom={1260} playbackRate={126 / 105} muted style={{ width: "100%", height: "100%" }} />
      </Series.Sequence>
      <Series.Sequence name="Submit and hold the recorded result" durationInFrames={228} layout="none">
        <OffthreadVideo src={staticFile("act6-reassessment.webm")} startFrom={1443} playbackRate={273 / 228} muted style={{ width: "100%", height: "100%" }} />
      </Series.Sequence>
    </Series>
    <Sequence name="Blend the time-lapse into the reassessment recording" durationInFrames={20} layout="none">
      <AbsoluteFill style={{ opacity: interpolate(frame, [0, 20], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        <Freeze frame={ACT5_FRAMES - 1}><WatchTimeLapseScreen /></Freeze>
      </AbsoluteFill>
    </Sequence>
  </div>;
};

export const SecondAssessmentPreview: React.FC = () => (
  <AbsoluteFill style={{ background: C.canvas }}>
    {/* One camera move across the trimmed interaction; copy stays in place. */}
    <SegView s={{ ...TIMED[1], cards: [] }}><ReassessmentFootage /></SegView>
    <Sequence name="Continue the time-lapse framing into reassessment" durationInFrames={60}><ReassessmentHandoffMatte /></Sequence>
    <Sequence name="Act 6: One explanation through the complete reassessment" durationInFrames={388}>
      <CopyBlock clearBackground c={{ at: 0, len: 0, eyebrow: "Second assessment", head: "Pressure falling.\nRates rising." }} />
    </Sequence>
    <Sequence name="Act 6: Recorded 6 out of 10 result" from={388} durationInFrames={150}><ReassessmentResult /></Sequence>
  </AbsoluteFill>
);

export const Act5Watch: React.FC = () => (
  <AbsoluteFill style={{ background: C.canvas }}>
    <Sequence name="Salus watches: continuous demo time-lapse" durationInFrames={ACT5_FRAMES}>
      <SegView s={{
        src: "act4.webm", at: 18.4, to: 18.4, len: 0, dur: ACT5_FRAMES,
        keys: [
          { t: 0, cam: focus(350, 610, 1.90) },
          { t: 0.12, cam: focus(350, 610, 2.05) },
          { t: 0.75, cam: focus(350, 610, 2.05) },
          { t: 0.90, cam: REASSESSMENT_HANDOFF },
          { t: 1, cam: REASSESSMENT_HANDOFF },
        ], cards: [],
      }}><WatchTimeLapseScreen /></SegView>
    </Sequence>
    <AbsoluteFill style={{ left: 1060, background: "linear-gradient(90deg, transparent 0px, #f3f6f8 65px)" }} />
    <Sequence name="The calm chart" durationInFrames={60}>
      <CopyBlock clearBackground c={{ at: 0, len: 0, eyebrow: "2 · Watch · Baseline", head: "Salus keeps\nwatching.",
        sub: "Timmy's observations keep updating." }} />
    </Sequence>
    <Sequence name="Ten minutes of change, compressed" from={60} durationInFrames={210}>
      <CopyBlock clearBackground c={{ at: 0, len: 0, head: "Heart rate up.\nBreathing faster.\nPressure falling." }} />
    </Sequence>
    <Sequence name="The risk update is visible in Salus" from={270} durationInFrames={90}>
      <CopyBlock clearBackground c={{ at: 0, len: 0, eyebrow: "In-app risk update", head: "5 out of 10.",
        sub: "Watch. The change is visible in Salus, ready for the team to review." }} />
    </Sequence>
    <WatchClock />
  </AbsoluteFill>
);

export const Act7Escalation: React.FC = () => (
  <AbsoluteFill style={{ background: C.canvas }}>
    <Sequence name="Act 7: Concern and observations agree" durationInFrames={90}>
      <Scene dur={90} center>
        <Eyebrow>3 · Escalate</Eyebrow>
        <Head size={88}>Now the nurse and<br />the vitals agree.</Head>
        <Sub>Human concern. Objective change.</Sub>
      </Scene>
    </Sequence>
    <Sequence name="Act 7: Actual overdue escalation" from={90} durationInFrames={135}>
      <SegView s={{
        src: "act7-escalation.webm", at: 4.6, to: 9.1, len: 0, dur: 135,
        keys: [{ t: 0, cam: focus(1070, 250, 2.00) }, { t: 1, cam: focus(1070, 250, 2.10) }], cards: [],
      }} />
      <CopyBlock clearBackground c={{ at: 0, len: 0, eyebrow: "Response overdue", head: "The concern\nstays visible.",
        sub: "Past the response window, an unanswered escalation reaches the physician queue." }} />
    </Sequence>
    <Sequence name="Act 7: Sally's concern in the real physician queue" from={225} durationInFrames={180}>
      <AbsoluteFill style={{ clipPath: "inset(342px 80px 340px 80px round 28px)" }}>
      <SegView s={{
        src: "act7-physician.webm", at: 4.0, to: 10.0, len: 0, dur: 180,
        keys: [{ t: 0, cam: focus(803, 820, 2.00, 960) }, { t: 1, cam: focus(803, 820, 2.10, 960) }], cards: [],
      }} />
      </AbsoluteFill>
      <div style={{ position: "absolute", top: 100, left: 130, right: 130,
        background: C.canvas, padding: "24px 30px", textAlign: "center" }}>
        <Eyebrow>Physician queue · Room 609</Eyebrow>
        <div style={{ marginTop: 22 }}><Head size={60}>Her concern reaches the physician.</Head></div>
      </div>
    </Sequence>
    <Sequence name="Act 7: Find Timmy in Room 609" from={405} durationInFrames={165}>
      <SegView s={{
        // Same recording as Act 6, preserving the 6/10 result in the map.
        src: "act6-reassessment.webm", at: 62.2, to: 67.7, len: 0, dur: 165,
        keys: [
          { t: 0, cam: focus(430, 450, 0.95) },
          { t: 0.55, cam: focus(160, 260, 2.30) },
          { t: 1, cam: focus(160, 260, 2.30) },
        ], cards: [],
      }} />
      <CopyBlock clearBackground c={{ at: 0, len: 0, eyebrow: "6 North Telemetry", head: "Room 609.\nBed 9B.",
        sub: "The red bed on the unit map shows where the team needs to respond." }} />
    </Sequence>
  </AbsoluteFill>
);

const REVIEW_SECTIONS = [
  "Patient details", "Risk and deterioration", "Vitals and charts", "Nurse notes",
  "History", "Treatment progress", "Nurse recommendation", "Your prescription",
];

const ReviewGate: React.FC<{ count: number; ready?: boolean }> = ({ count, ready = false }) => (
  <div style={{ position: "absolute", right: 0, top: 0, width: 661, height: "100%",
    boxSizing: "border-box", padding: "70px 86px 70px 54px", display: "flex", flexDirection: "column",
    justifyContent: "center", gap: 24, background: "linear-gradient(90deg, transparent 0px, #f3f6f8 45px)" }}>
    <Eyebrow>4 · Physician</Eyebrow>
    <Head size={58}>{ready ? "Review complete.\nApproval unlocked." : "Eight sections.\nReview before deciding."}</Head>
    <div style={{ fontFamily: C.serif, fontSize: 92, color: C.teal, lineHeight: 1 }}>
      {count}<span style={{ fontSize: 40, color: C.muted }}> / 8 reviewed</span>
    </div>
    <div style={{ height: 7, background: "#e5e9ee", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ width: `${count / 8 * 100}%`, height: "100%", background: C.teal }} />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
      {REVIEW_SECTIONS.map((name, index) => <div key={name} style={{ display: "flex", alignItems: "flex-start", gap: 10,
        fontFamily: C.sans, fontSize: 22, lineHeight: 1.3, color: index < count ? C.ink : C.muted }}>
        <span style={{ flexShrink: 0, width: 23, height: 23, border: `1px solid ${index < count ? C.teal : "#cfd7e0"}`,
          background: index < count ? C.teal : "#fff", color: "#fff", textAlign: "center", borderRadius: 5 }}>{index < count ? "✓" : ""}</span>
        <span>{name}</span>
      </div>)}
    </div>
    <div style={{ fontFamily: C.sans, fontSize: 23, lineHeight: 1.4, color: C.muted }}>
      {ready ? "All sections reviewed. Prescription details complete." : "Approval stays locked until all eight sections are reviewed."}
    </div>
  </div>
);

const ReviewSectionShot: React.FC<{ at: number; to: number; index: number }> = ({ at, to, index }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill>
    <SegView s={{ src: "act8-review.webm", at, to, len: 0, dur: 36,
      keys: [{ t: 0, cam: focus(index < 4 ? 522 : 1083, 350, 1.55) }], cards: [] }} />
    <ReviewGate count={index + (frame >= 23 ? 1 : 0)} />
  </AbsoluteFill>;
};

export const Act8Review: React.FC = () => (
  <AbsoluteFill style={{ background: C.canvas }}>
    <Sequence name="Act 8: Approval starts locked" durationInFrames={90}>
      <SegView s={{ src: "act8-review.webm", at: 6.4, to: 8.2, len: 0, dur: 90,
        keys: [{ t: 0, cam: focus(1165, 820, 1.75) }, { t: 1, cam: focus(1165, 820, 1.85) }], cards: [] }} />
      <ReviewGate count={0} />
    </Sequence>
    <Sequence name="Review patient details" from={90} durationInFrames={36}><ReviewSectionShot index={0} at={8.955} to={10.138} /></Sequence>
    <Sequence name="Review risk and deterioration" from={126} durationInFrames={36}><ReviewSectionShot index={1} at={10.714} to={11.892} /></Sequence>
    <Sequence name="Review vitals and charts" from={162} durationInFrames={36}><ReviewSectionShot index={2} at={12.459} to={13.652} /></Sequence>
    <Sequence name="Review nurse notes" from={198} durationInFrames={36}><ReviewSectionShot index={3} at={14.223} to={15.255} /></Sequence>
    <Sequence name="Review history" from={234} durationInFrames={36}><ReviewSectionShot index={4} at={15.828} to={17.005} /></Sequence>
    <Sequence name="Review treatment progress" from={270} durationInFrames={36}><ReviewSectionShot index={5} at={17.567} to={18.756} /></Sequence>
    <Sequence name="Act 8: Review the medication concern" from={306} durationInFrames={90}>
      <SegView s={{ src: "act8-review.webm", at: 19.2, to: 21.3, len: 0, dur: 90,
        keys: [{ t: 0, cam: focus(1083, 160, 1.80) }, { t: 1, cam: focus(1083, 160, 1.95) }], cards: [] }} />
      <CopyBlock clearBackground c={{ at: 0, len: 0, eyebrow: "Nurse recommendation", head: "The physician\nmakes the call.",
        sub: "No class was suggested for this low reading. The concern still reaches review." }} />
    </Sequence>
    <Sequence name="Review nurse recommendation" from={396} durationInFrames={36}><ReviewSectionShot index={6} at={21.567} to={22.521} /></Sequence>
    <Sequence name="Act 8: Complete the demo prescription" from={432} durationInFrames={135}>
      <SegView s={{ src: "act8-review.webm", at: 22.95, to: 29.5, len: 0, dur: 135,
        keys: [{ t: 0, cam: focus(1083, 220, 1.70) }, { t: 1, cam: focus(1083, 220, 1.85) }], cards: [] }} />
      <CopyBlock clearBackground c={{ at: 0, len: 0, eyebrow: "Demo prescription", head: "A complete\nprescription.",
        sub: "Medication, dose, route, frequency and duration." }} />
    </Sequence>
    <Sequence name="Review the completed prescription" from={567} durationInFrames={36}><ReviewSectionShot index={7} at={29.585} to={30.753} /></Sequence>
    <Sequence name="Act 8: Eight reviewed and approval unlocked" from={603} durationInFrames={90}>
      <SegView s={{ src: "act8-review.webm", at: 30.85, to: 34.25, len: 0, dur: 90,
        keys: [{ t: 0, cam: focus(1180, 790, 1.85) }, { t: 1, cam: focus(1180, 790, 1.95) }], cards: [] }} />
      <ReviewGate count={8} ready />
    </Sequence>
    <Sequence name="Act 8: Approved in the browser-only demo" from={693} durationInFrames={90}>
      <AbsoluteFill style={{ clipPath: "inset(432px 980px 490px 185px round 24px)" }}>
        <SegView s={{ src: "act8-review.webm", at: 35.5, to: 38.0, len: 0, dur: 90,
          keys: [{ t: 0, cam: focus(1120, 615, 2.20) }], cards: [] }} />
      </AbsoluteFill>
      <CopyBlock clearBackground c={{ at: 0, len: 0, eyebrow: "Prototype demonstration", head: "Demo decision\nrecorded.",
        sub: "The approval appears in the review history." }} />
    </Sequence>
    <div style={{ position: "absolute", left: 90, bottom: 30, padding: "10px 16px", borderRadius: 12,
      background: C.canvas, color: C.muted, fontFamily: C.mono, fontSize: 18, letterSpacing: ".05em" }}>
      Prototype review · demo prescription
    </div>
  </AbsoluteFill>
);

export const INTRO_PREVIEW_FRAMES = PATIENT_INTRO_FRAMES - PATIENT_SLIDE_FRAMES + 150;
export const TimmyIntroductionPreview: React.FC = () => (
  <AbsoluteFill style={{ background: C.canvas }}>
    <Sequence name="Meet Timmy Buttons" durationInFrames={PATIENT_INTRO_FRAMES}><PatientIntro /></Sequence>
    <Sequence name="Slide into the live chart" from={PATIENT_INTRO_FRAMES - PATIENT_SLIDE_FRAMES} durationInFrames={150}>
      <FirstAssessmentPreview slideIn />
    </Sequence>
  </AbsoluteFill>
);

export const MyComposition: React.FC = () => (
  <AbsoluteFill style={{ background: C.canvas }}>
    <Audio src={staticFile("b51-q2.wav")} />
    <Sequence name="Act 0: Cold open" durationInFrames={COLD_OPEN_FRAMES}><ColdOpen /></Sequence>
    <Sequence
      name="Act 1: The gap"
      from={COLD_OPEN_FRAMES}
      durationInFrames={GAP_FRAMES}
      style={{
        translate: "-2px 0px"
      }}
    ><TheGap /></Sequence>
    <Sequence name="Act 2: Logo" from={COLD_OPEN_FRAMES + GAP_FRAMES} durationInFrames={LOGO_FRAMES}><LogoResolve /></Sequence>
    <Sequence name="Meet Timmy Buttons" from={OPENING_FRAMES} durationInFrames={PATIENT_INTRO_FRAMES}><PatientIntro /></Sequence>
    <Sequence name="Act 5: Salus watches" from={ACT5_START} durationInFrames={ACT5_FRAMES}><Act5Watch /></Sequence>
    {TAKES_T.map((s, i) => (
      <Sequence key={`t${i}`} name={i === 0 ? "First assessment" : i === 1 ? "Second assessment: updated observations" : "Act 7: Escalation and Room 609"} from={s.start} durationInFrames={s.dur}>
        {i === 0 ? <FirstAssessmentPreview slideIn /> : i === 1 ? <SecondAssessmentPreview /> : <Act7Escalation />}
      </Sequence>
    ))}
    <Sequence name="Act 8: Physician review and demo decision" from={ACT8_START} durationInFrames={ACT8_FRAMES}><Act8Review /></Sequence>
    <Sequence name="Act 9: Simulated recovery and care journey" from={ACT9_START} durationInFrames={ACT9_FRAMES}><Act9Recovery /></Sequence>
    <Sequence name="Act 11: Outro" from={ACT9_START + ACT9_FRAMES} durationInFrames={OUTRO_FRAMES}><Outro /></Sequence>
  </AbsoluteFill>
);
