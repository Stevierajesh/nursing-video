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
import { Eyebrow, Head } from "./Type";
import { CareLoop, RECAP_FRAMES } from "./Act9Recovery";
import { WatchTimeLapseScreen, WatchClock } from "./WatchTimeLapse";
import { ResponseFlowPrototype, RESPONSE_PROTOTYPE_FRAMES } from "./ResponseFlowPrototype";

/* ── timing ────────────────────────────────────────────────────────────── */
export const FPS = 30;
export const BAR = (240 / 119) * FPS;          // 60.504 frames
/* Remotion addresses the source in COMPOSITION frames: startFrom/fps is the
   seek point in seconds, regardless of the source file's own frame rate.
   (The webm is 25fps; that does not enter into it.) */
const bars = (n: number) => Math.round(n * BAR);
export const ACT5_FRAMES = 255;
const REASSESSMENT_ENTRY_FRAMES = 388;
/* The recording's own page load. The patient page is up at source frame 66,
   which is where the old 388-frame entry had reached by frame 58 anyway, so
   skipping the spinner leaves every later action on its original frame. */
const REASSESSMENT_LOADED_AT = 66;
const REASSESSMENT_LOAD_FRAMES = 58;
/* The copy column swaps to the ledger here, a few frames before the camera
   finishes its move onto the result at 380. */
const REASSESSMENT_RESULT_AT = 374;
const REASSESSMENT_FRAMES = REASSESSMENT_ENTRY_FRAMES + 150;
/* Act 7 ends once the detail page has settled. The recording keeps sitting on
   that page for another two seconds; holding it on screen read as a repeat of
   the first response take rather than a new beat. */
export const ACT7_FRAMES = 165;
const ACT7_ARRIVAL_FRAMES = 90;
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

/* `linear` makes the leg STARTING at this key run at constant speed. The
   default bezier eases out into every key, which parks the camera at a segment
   boundary; across the Act 5 handoff that stall is what announced the cut. */
type Key = { t: number; cam: Cam; linear?: boolean };
type Card = { at: number; len: number; eyebrow?: string; head?: string; sub?: string };
type Seg = { src: string; at: number; to: number; len: number; durationFrames?: number; keys: Key[]; cards: Card[] };

/* ── the act ─────────────────────────────────────────────────────────────
   Three continuous takes. Two cuts in the whole sequence, both at genuine
   scene changes, instead of a cut at every caption.                      */
const SEGS: Seg[] = [
  // Trim stationary holds in the first recording. The camera and copy run on
  // one uninterrupted clock; all pointer moves and the complete note survive.
  {
    src: "act4.webm", at: 18.4, to: 57.8, len: 0, durationFrames: RESPONSE_PROTOTYPE_FRAMES,
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
    src: "reassessment/nurse.webm", at: 0.4, to: 16, len: 0, durationFrames: REASSESSMENT_FRAMES,
    keys: [
      /* Arrive on the Act 5 pose already in motion and keep going. The camera
         never stops at the boundary, so the take carries through instead of
         reading as a cut to another scene. */
      { t: 0.00, cam: REASSESSMENT_HANDOFF, linear: true },
      { t: 60 / REASSESSMENT_FRAMES, cam: focus(980, 200, 1.30) },
      { t: 86 / REASSESSMENT_FRAMES, cam: focus(1050, 250, 1.50) },
      { t: 149 / REASSESSMENT_FRAMES, cam: focus(1000, 360, 1.65) },
      { t: 201 / REASSESSMENT_FRAMES, cam: focus(1000, 515, 2.40, 570) },
      /* Hold the note field through the submit: the button reads "Sending…" at
         frame 320 and the result page is up by 321. */
      { t: 322 / REASSESSMENT_FRAMES, cam: focus(1000, 515, 2.40, 570) },
      /* Then one move straight onto the recorded result — the escalation
         banners, the contributions card and the button, at roughly x 60–795,
         y 90–615 of the source. Previously this pulled out to 1.50, held, panned
         up and left, then pushed back in to 2.10: three moves to reach a frame
         it can reach directly, and the result sat unframed for five seconds. */
      { t: 380 / REASSESSMENT_FRAMES, cam: focus(427, 352, 2.10, 630) },
      { t: 1.00, cam: focus(427, 352, 2.18, 630) },
    ],
    cards: [], // Act 6 has independently timed overlays below.
  },
  // Act 7 owns the fresh-review footage below; this entry supplies shared timing.
  {
    src: "team-review/nurse.webm", at: 1.2, to: 6.7, len: 0, durationFrames: ACT7_FRAMES,
    keys: [], cards: [],
  },
];

// Act 5 has its own chart check; the second take begins at reassessment.
let cur = 0;
const TIMED = SEGS.map((s) => { const start = cur; const dur = s.durationFrames ?? bars(s.len); cur += dur; return { ...s, start, dur }; });
const FOOTAGE_START = OPENING_FRAMES + PATIENT_INTRO_FRAMES - PATIENT_SLIDE_FRAMES;
const ACT5_START = FOOTAGE_START + TIMED[0].dur;
const TAKES_T = TIMED.map((x, i) => ({ ...x, start: x.start + FOOTAGE_START + (i > 0 ? ACT5_FRAMES : 0) }));
const ACT9_START = FOOTAGE_START + cur + ACT5_FRAMES;
/* The illustrative beat is the same ward map cooling down rather than abstract
   cards, so the conclusion stays in the world the story has been living in. */
export const MAP_RECOVERY_FRAMES = 120;
/* The second level, cut in between the red and the cooling: the room can only
   start improving once somebody comes, so the page has to land first. */
export const PHYSICIAN_FRAMES = 150;
export const TOTAL = ACT9_START + PHYSICIAN_FRAMES + MAP_RECOVERY_FRAMES + RECAP_FRAMES + OUTRO_FRAMES;
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
      const p = (t - a.t) / (b.t - a.t || 1);
      const u = a.linear ? p : e(p);
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

// Shared with the standalone response-flow review; the main film owns its music.
export const FirstAssessmentPreview: React.FC<{ slideIn?: boolean }> = ({ slideIn = false }) => (
  <ResponseFlowPrototype withMusic={false} slideIn={slideIn} />
);

/* A ledger row, not a bar. The earlier bars were scaled against an unstated
   maximum, so two visibly similar bars stood for 2.5 and 3.0 and nothing said
   what a full bar meant. An aligned column of numerals scans down in one pass
   and the contributions visibly sum. */
const LedgerRow: React.FC<{ label: string; value: string; delay: number; total?: boolean }> =
({ label, value, delay, total = false }) => (
  <Reveal delay={delay}>
    <div style={{
      display: "grid", gridTemplateColumns: "1fr auto", alignItems: "baseline", gap: 24,
      padding: "8px 0", fontFamily: C.sans, fontSize: total ? 29 : 25,
      color: total ? C.ink : C.muted,
    }}>
      <span>{label}</span>
      <span style={{ color: total ? "#c2410c" : C.ink, fontWeight: total ? 700 : 400,
        fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  </Reveal>
);

const ReassessmentResult: React.FC = () => (
  <div style={{ position: "absolute", right: 0, top: 0, width: 661, height: "100%", paddingLeft: 54, paddingRight: 86, boxSizing: "border-box",
    display: "flex", flexDirection: "column", justifyContent: "center", gap: 22,
    background: "linear-gradient(90deg, rgba(243,246,248,0) 0px, #f3f6f8 45px)",
  }}>
    {/* A negative delay starts this already part-way through its wipe, so the
        column is occupied on the very frame the caption leaves rather than
        going blank for one. The later rows keep their stagger. */}
    <Reveal delay={-2}><div style={{ fontFamily: C.mono, fontSize: 19, letterSpacing: ".2em", color: C.teal, textTransform: "uppercase" }}>Assessment recorded</div></Reveal>
    <Reveal delay={2}>
      <div style={{ fontFamily: C.serif, fontSize: 150, lineHeight: 1, color: "#c2410c" }}>6<span style={{ fontSize: 54 }}>/10</span></div>
      <div style={{ fontFamily: C.sans, fontSize: 25, color: "#c2410c", marginTop: 16 }}>Elevated · combined risk</div>
    </Reveal>
    {/* Narrower than the column so the labels and their numerals stay close. */}
    <div style={{ width: "100%", maxWidth: 430, marginTop: 4 }}>
      <LedgerRow label="Nurse worry" value="2.5" delay={9} />
      <LedgerRow label="Current vitals" value="3.0" delay={15} />
      <LedgerRow label="Vitals trend" value="0.0" delay={21} />
      <Reveal delay={27}><div style={{ height: 1, background: "#cfd7e0", margin: "10px 0" }} /></Reveal>
      <LedgerRow label="Combined" value="5.5 → 6" delay={31} total />
    </div>
    <Reveal delay={39}><div style={{ fontFamily: C.sans, fontSize: 23, lineHeight: 1.4, color: C.muted }}>Sally’s updated observations are recorded.</div></Reveal>
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
  return <div style={{ position: "relative", width: "100%", height: "100%" }}>
    {/* Current app rehearsal: faster typing, a full-note hold, then the actual
        backend-generated verdict. Preserve the enclosing camera and timing.
        The recording opens on a "Loading patient…" spinner over a blank page.
        Freezing the first loaded frame for exactly the span the spinner used to
        occupy removes it without moving any later event: the camera glides and
        the time-lapse gives way to a real page instead of to a spinner. */}
    <Series>
      <Series.Sequence name="Settle on the loaded patient page" durationInFrames={REASSESSMENT_LOAD_FRAMES} layout="none">
        <Freeze frame={0}>
          <OffthreadVideo src={staticFile("reassessment/nurse.webm")} startFrom={REASSESSMENT_LOADED_AT} muted style={{ width: "100%", height: "100%" }} />
        </Freeze>
      </Series.Sequence>
      <Series.Sequence name="Concern, breathing change and updated note" durationInFrames={REASSESSMENT_ENTRY_FRAMES - REASSESSMENT_LOAD_FRAMES} layout="none">
        <OffthreadVideo src={staticFile("reassessment/nurse.webm")} startFrom={REASSESSMENT_LOADED_AT}
          playbackRate={(375 - REASSESSMENT_LOADED_AT) / (REASSESSMENT_ENTRY_FRAMES - REASSESSMENT_LOAD_FRAMES)} muted style={{ width: "100%", height: "100%" }} />
      </Series.Sequence>
      <Series.Sequence name="Hold the current review result" durationInFrames={150} layout="none">
        <OffthreadVideo src={staticFile("reassessment/nurse.webm")} startFrom={375} muted style={{ width: "100%", height: "100%" }} />
      </Series.Sequence>
    </Series>
    {/* No transition effect across the Act 5 boundary. The time-lapse ends on
        the very reading this recording opens with, so the camera carrying
        straight through is enough; a dissolve here only announced a cut. */}
  </div>;
};

export const SecondAssessmentPreview: React.FC = () => (
  <AbsoluteFill style={{ background: C.canvas }}>
    {/* One camera move across the trimmed interaction; copy stays in place. */}
    <SegView s={{ ...TIMED[1], cards: [] }}><ReassessmentFootage /></SegView>
    <Sequence name="Continue the time-lapse framing into reassessment" durationInFrames={60}><ReassessmentHandoffMatte /></Sequence>
    {/* Hand the copy column over while the camera is still travelling onto the
        result, not after it has settled. The caption used to end on the frame
        the ledger began, and the ledger's first reveal is delayed, so the column
        sat empty for a few frames and read as a blip. */}
    <Sequence name="Act 6: One explanation through the complete reassessment" durationInFrames={REASSESSMENT_RESULT_AT}>
      <CopyBlock clearBackground c={{ at: 0, len: 0, eyebrow: "Second assessment", head: "Timmy’s observations changed.\nSally raises a fresh concern." }} />
    </Sequence>
    <Sequence name="Act 6: Recorded 6 out of 10 result" from={REASSESSMENT_RESULT_AT}
      durationInFrames={REASSESSMENT_FRAMES - REASSESSMENT_RESULT_AT}><ReassessmentResult /></Sequence>
    <div style={{ position: "absolute", zIndex: 10, bottom: 25, left: 80, right: 80, textAlign: "right",
      fontFamily: C.sans, fontSize: 22, color: C.muted }}>Prototype flow · browser-only rehearsal</div>
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
          /* Leave on the move: the last leg runs linear into the handoff pose
             and the reassessment picks it up at the same speed, so there is no
             stall at 1:28 for the content change to show itself against. */
          { t: 0.78, cam: focus(350, 610, 2.05), linear: true },
          { t: 1, cam: REASSESSMENT_HANDOFF },
        ], cards: [],
      }}><WatchTimeLapseScreen /></SegView>
    </Sequence>
    <AbsoluteFill style={{ left: 1060, background: "linear-gradient(90deg, transparent 0px, #f3f6f8 65px)" }} />
    <Sequence name="Salus keeps watching throughout the change" durationInFrames={ACT5_FRAMES}>
      <CopyBlock clearBackground c={{ at: 0, len: 0, eyebrow: "2 · Watch · Baseline", head: "Salus keeps\nwatching.",
        sub: "Timmy's observations keep updating." }} />
    </Sequence>
    <WatchClock />
  </AbsoluteFill>
);

/* One caption carries the whole map sequence — the escalation through the room
   cooling — so it is mounted once by MyComposition and spans both scenes rather
   than being re-revealed per scene. Standalone previews render it themselves. */
/* Sally's words are on the prescriber's screen in the middle beat, so the
   caption states the mechanism instead of quoting her twice. */
export const MapCaption: React.FC = () => (
  <CopyBlock clearBackground c={{ at: 0, len: 0, eyebrow: "Escalation overdue", head: "The physician\nis alerted.",
    sub: "Unanswered within the window, it escalates past the nursing tier to every prescriber on the unit." }} />
);

/* The prescriber's deterioration queue. reaches_physician() lets this through
   because the escalation went auto_escalated — the nursing tier had its SLA
   window and did not answer. The card says so itself: "Nursing tier did not
   respond". No medication request exists in this story, and the approval column
   on screen reads empty, so nothing here is a prescription. */
export const PhysicianQueue: React.FC = () => (
  <AbsoluteFill style={{ background: C.canvas }}>
    <SegView s={{
      src: "physician-queue/prescriber.webm", at: 0.8, to: 5.8, len: 0, dur: PHYSICIAN_FRAMES,
      /* Opens on the queue's empty state — "Nothing has been escalated to a
         physician" — then the SLA lapses and the critical notice and the row
         arrive together on the same poll. The queue card spans x 256–1350 of
         the source; centred in the 1259px the copy column leaves. */
      keys: [
        { t: 0, cam: focus(803, 217, 1.42, 630) },
        /* Hold on the empty queue until the notice lands at about frame 32,
           then push onto it. The toast occupies x 478–890, y 14–136 of the
           source; aiming just below its centre keeps the row with Sally's
           words legible underneath. */
        { t: 32 / PHYSICIAN_FRAMES, cam: focus(803, 217, 1.45, 630) },
        { t: 1, cam: focus(690, 110, 2.25, 590) },
      ], cards: [],
    }} />
    <div style={{ position: "absolute", zIndex: 10, bottom: 25, left: 80, right: 80, textAlign: "right",
      fontFamily: C.sans, fontSize: 22, color: C.muted }}>Prototype flow · browser-only rehearsal</div>
  </AbsoluteFill>
);

export const Act7Escalation: React.FC<{ showCaption?: boolean }> = ({ showCaption = true }) => (
  <AbsoluteFill style={{ background: C.canvas }}>
    {/* One continuous shot on the ward map. Room 609 carries room-risk-high: the
        reassessment state is NEWS 8 in the high band with an open news_high
        escalation, which is rank 3 in patientPriority. The room's own chip reads
        "Escalation open · Combined 6/10", so the act can stay here and still say
        the follow-up is unanswered — no cutaway to a cropped-out card. */}
    <SegView s={{
      src: "escalation-map/nurse.webm", at: 1.9, to: 7.4, len: 0, dur: ACT7_FRAMES,
      keys: [
        { t: 0, cam: focus(980, 700, 1.30, 700) },
        { t: ACT7_ARRIVAL_FRAMES / ACT7_FRAMES, cam: focus(1100, 790, 2.35, 660) },
        { t: 1, cam: focus(1120, 800, 2.75, 640) },
      ], cards: [],
    }} />
    {showCaption && <MapCaption />}
    <div style={{ position: "absolute", zIndex: 10, bottom: 25, left: 80, right: 80, textAlign: "right",
      fontFamily: C.sans, fontSize: 22, color: C.muted }}>Prototype flow · browser-only rehearsal</div>
  </AbsoluteFill>
);

/* The illustrative close. Real app behaviour — as the simulated observations
   improve, patientPriority drops out of rank 3 and UnitFloorPlan swaps room 609
   from room-risk-high to room-concern-pending to no highlight, and the room's
   own chip steps 6/10 → 4/10 → "Combined score low". The clinical improvement
   is simulated, which is what the eyebrow and the corner label say. The opening
   pose matches the end of Act 7 so it reads as the same frame cooling. */
export const MapRecovery: React.FC = () => (
  <AbsoluteFill style={{ background: C.canvas }}>
    <SegView s={{
      /* Picks up just before the amber switch: the red was already held through
         Act 7 and the prescriber beat, so showing it a third time stalls. */
      src: "deescalation-map/nurse.webm", at: 3.3, to: 8.0, len: 0, dur: MAP_RECOVERY_FRAMES,
      keys: [
        { t: 0, cam: focus(1120, 800, 2.75, 640) },
        { t: 1, cam: focus(1100, 790, 2.45, 660) },
      ], cards: [],
    }} />
    {/* The repeat-paging line is a stated product intent, not something the
        code does today: sweep_sla_breaches() is a single SLA deadline, not a
        repeating page. It sits inside the beat the corner label already marks
        as illustrative. */}
    <CopyBlock clearBackground c={{ at: 0, len: 0, eyebrow: "Illustrative scenario", head: "The physician\ntakes action.",
      sub: "Salus keeps paging until the escalation is acknowledged." }} />
    <div style={{ position: "absolute", zIndex: 10, left: 90, bottom: 30, color: C.muted, fontFamily: C.mono,
      fontSize: 18, letterSpacing: ".05em" }}>Illustrative projection · simulated values</div>
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
    {/* The source is 209s against a 128s film, so the track was being cut off
        mid-phrase at full level on the last frame. Ride it down under the
        outro instead; the music's own placement is unchanged. */}
    <Audio src={staticFile("b51-q2.wav")} volume={(f) => interpolate(f, [TOTAL - 90, TOTAL - 1], [1, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.4, 0, 0.7, 1),
    })} />
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
      <Sequence key={`t${i}`} name={i === 0 ? "First assessment and charge-nurse response" : i === 1 ? "Second assessment: updated observations" : "Act 7: Updated concern reaches the team"} from={s.start} durationInFrames={s.dur}>
        {i === 0 ? <FirstAssessmentPreview slideIn /> : i === 1 ? <SecondAssessmentPreview /> : <Act7Escalation showCaption={false} />}
      </Sequence>
    ))}
    <Sequence name="Act 8: No one answered, so it goes past them" from={ACT9_START} durationInFrames={PHYSICIAN_FRAMES}><PhysicianQueue /></Sequence>
    <Sequence name="Act 9: The room cools down" from={ACT9_START + PHYSICIAN_FRAMES} durationInFrames={MAP_RECOVERY_FRAMES}><MapRecovery /></Sequence>
    {/* Held across the red room and the prescriber queue so it reveals once and
        stays put; the cooling then carries its own caption. */}
    <Sequence name="The physician is alerted" from={TAKES_T[2].start}
      durationInFrames={ACT7_FRAMES + PHYSICIAN_FRAMES}><MapCaption /></Sequence>
    <Sequence name="Act 9: From concern to decision" from={ACT9_START + PHYSICIAN_FRAMES + MAP_RECOVERY_FRAMES} durationInFrames={RECAP_FRAMES}><CareLoop /></Sequence>
    <Sequence name="Act 11: Outro" from={ACT9_START + PHYSICIAN_FRAMES + MAP_RECOVERY_FRAMES + RECAP_FRAMES} durationInFrames={OUTRO_FRAMES}><Outro /></Sequence>
  </AbsoluteFill>
);
