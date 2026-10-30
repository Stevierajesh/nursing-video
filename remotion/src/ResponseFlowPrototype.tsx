import React from "react";
import { AbsoluteFill, Audio, Easing, OffthreadVideo, Sequence, Series, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, Eyebrow, Head, Sub } from "./Type";

const ENTRY_FRAMES = 320;
const RESULT_FRAMES = 135;
const NOTIFICATION_FRAMES = 180;
const QUEUE_FRAMES = 120;
export const RESPONSE_PROTOTYPE_FRAMES = ENTRY_FRAMES + RESULT_FRAMES + NOTIFICATION_FRAMES + QUEUE_FRAMES;

type Pose = { x: number; y: number; zoom: number };
type CameraKey = Pose & { frame: number };
const RESULT_POSE: Pose = { x: 640, y: 280, zoom: 1.5 };
const QUEUE_POSE: Pose = { x: 600, y: 245, zoom: 1.25 };

// Match the main film's rigid iPad geometry; all entry actions share one camera.
const Device: React.FC<{ keys: CameraKey[]; children: React.ReactNode }> = ({ keys, children }) => {
  const frame = useCurrentFrame();
  const options = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const, easing: Easing.bezier(0.45, 0, 0.25, 1) };
  const times = keys.map(key => key.frame);
  const x = interpolate(frame, times, keys.map(key => key.x), options);
  const y = interpolate(frame, times, keys.map(key => key.y), options);
  const zoom = interpolate(frame, times, keys.map(key => key.zoom), options);
  const ratio = 1000 / 1366;
  return <AbsoluteFill style={{ overflow: "hidden" }}>
    <div style={{ position: "absolute", left: 570 - x * ratio * zoom - 26 * zoom,
      top: 540 - y * ratio * zoom - 26 * zoom,
      width: 1052, height: 802, padding: 26, boxSizing: "border-box",
      background: "linear-gradient(158deg,#32363c,#17191c 52%,#0d0f11)",
      borderRadius: 46, transformOrigin: "top left", scale: `${zoom}`,
      boxShadow: "0 50px 110px -40px rgba(13,27,42,.6)" }}>
      <div style={{ width: 1000, height: 750, overflow: "hidden", borderRadius: 20, background: C.canvas }}>
        {children}
      </div>
    </div>
  </AbsoluteFill>;
};

const Caption: React.FC<{ label: string; title: React.ReactNode; children?: React.ReactNode }> = ({ label, title, children }) => (
  <div style={{ position: "absolute", inset: "0 0 0 auto", width: 660, boxSizing: "border-box",
    display: "flex", flexDirection: "column", justifyContent: "center", gap: 28, padding: "0 78px 0 60px",
    background: "linear-gradient(90deg,rgba(243,246,248,0),#f3f6f8 45px)" }}>
    <Eyebrow revealFrames={24}>{label}</Eyebrow>
    <Head size={62} revealFrames={24}>{title}</Head>
    {children && <Sub d={30} revealFrames={24}>{children}</Sub>}
  </div>
);

const ConcernEntry: React.FC = () => (
  <AbsoluteFill>
    <Device keys={[
      { frame: 0, x: 530, y: 520, zoom: 1.65 },
      { frame: 40, x: 530, y: 520, zoom: 1.65 },
      { frame: 65, x: 1080, y: 180, zoom: 1.8 },
      { frame: 100, x: 1080, y: 230, zoom: 1.8 },
      { frame: 150, x: 1080, y: 440, zoom: 1.9 },
      { frame: 272, x: 1080, y: 440, zoom: 1.9 },
      { frame: 300, x: 1080, y: 540, zoom: 1.7 },
      { frame: ENTRY_FRAMES, ...RESULT_POSE },
    ]}>
      <OffthreadVideo src={staticFile("response-prototype/nurse.webm")} startFrom={12} muted style={{ width: "100%", height: "100%" }} />
    </Device>
    <Sequence name="Stable observations" durationInFrames={50}>
      <Caption label="First assessment" title={<>The observations<br />are calm.</>}>HR 88 · RR 18 · BP 118/74.<br />NEWS 0.</Caption>
    </Sequence>
    <Sequence name="The nurse notices" from={50} durationInFrames={100}>
      <Caption label="Nurse concern" title={<>But she has<br />seen this before.</>} />
    </Sequence>
  </AbsoluteFill>
);

const ReviewRequested: React.FC = () => (
  <AbsoluteFill>
    <Device keys={[{ frame: 0, ...RESULT_POSE }, { frame: RESULT_FRAMES, ...RESULT_POSE }]}>
      {/* Skip the waiting/toast overlay; retain the real UI's complete verdict. */}
      <OffthreadVideo src={staticFile("response-prototype/nurse.webm")} startFrom={645} muted style={{ width: "100%", height: "100%" }} />
    </Device>
    <Caption label="Review requested" title={<>Her concern<br />starts a response.</>}>Stable vital signs do not block a charge-nurse review.</Caption>
  </AbsoluteFill>
);

const ChargeNotification: React.FC = () => (
  <AbsoluteFill>
    <Device keys={[{ frame: 0, x: 1158, y: 220, zoom: 2.5 }, { frame: 135, x: 1158, y: 220, zoom: 2.5 }, { frame: NOTIFICATION_FRAMES, ...QUEUE_POSE }]}>
      <OffthreadVideo src={staticFile("response-prototype/charge.webm")} startFrom={495} muted style={{ width: "100%", height: "100%" }} />
    </Device>
    <Caption label="Charge nurse" title={<>The concern<br />reaches the team.</>}>The nurse&apos;s reason travels with the review request.</Caption>
  </AbsoluteFill>
);

const AssessmentPending: React.FC = () => (
  <AbsoluteFill>
    <Device keys={[{ frame: 0, ...QUEUE_POSE }, { frame: QUEUE_FRAMES, ...QUEUE_POSE }]}>
      <OffthreadVideo src={staticFile("response-prototype/charge.webm")} startFrom={690} muted style={{ width: "100%", height: "100%" }} />
    </Device>
    <Caption label="Response tracked" title={<>Acknowledged.<br />Assessment pending.</>}>Seeing the concern is the first step. Assessment is tracked separately.</Caption>
  </AbsoluteFill>
);

export const ResponseFlowPrototype: React.FC = () => (
  <AbsoluteFill style={{ background: C.canvas }}>
    {/* Audition against the music at the existing first-assessment position. */}
    <Audio src={staticFile("b51-q2.wav")} startFrom={1235} />
    <Series>
      <Series.Sequence name="Record the concern" durationInFrames={ENTRY_FRAMES}><ConcernEntry /></Series.Sequence>
      <Series.Sequence name="Yellow review confirmation" durationInFrames={RESULT_FRAMES}><ReviewRequested /></Series.Sequence>
      <Series.Sequence name="Charge-nurse notification and acknowledgment" durationInFrames={NOTIFICATION_FRAMES}><ChargeNotification /></Series.Sequence>
      <Series.Sequence name="Acknowledged, assessment still pending" durationInFrames={QUEUE_FRAMES}><AssessmentPending /></Series.Sequence>
    </Series>
    <div style={{ position: "absolute", zIndex: 10, bottom: 25, left: 80, right: 80, textAlign: "right",
      fontFamily: C.sans, fontSize: 22, color: C.muted }}>
      Prototype flow · browser-only rehearsal
    </div>
  </AbsoluteFill>
);
