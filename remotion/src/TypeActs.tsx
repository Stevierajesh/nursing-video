import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { Scene, Eyebrow, Head, Sub, Tiles, Count, Cite, Lockup, Wipe, C } from "./Type";

// Time each thought for reading, rather than holding it to a whole music bar.
// All values are frames at the project's 30 fps.
const CLOCK = 75;       // 2.5 s
// Reuse the removed 105-frame gap slide to give these story beats reading time.
// The evidence still starts at main frame 480; later music cues stay fixed.
const ADMISSION = 135;   // 4.5 s
const OBSERVATIONS = 120; // 4 s
const NURSE = 150;      // 5 s, three staggered statements
const EVIDENCE = 135;   // 4.5 s
const EARLY_WARNING = 116; // The question-and-brand sequence begins at 00:24:11.
export const COLD_OPEN_FRAMES = CLOCK + ADMISSION + OBSERVATIONS + NURSE;
export const GAP_FRAMES = EVIDENCE + EARLY_WARNING;
const LOGO_BRAND_FRAMES = 150; // 5 s: introduction, logo, then tagline.
const LOGO_PIANO_FRAME = 31 * 30 + 26; // Main-film timecode 00:31:26 at 30 fps.
const LOGO_LEAD_IN_FRAMES = LOGO_PIANO_FRAME - COLD_OPEN_FRAMES - GAP_FRAMES;
const LOGO_QUESTION_FRAMES = 105; // Complete question gets just over 3 s after its reveal.
const LOGO_BRIDGE_FRAMES = LOGO_LEAD_IN_FRAMES - LOGO_QUESTION_FRAMES;
export const LOGO_FRAMES = LOGO_BRAND_FRAMES + LOGO_LEAD_IN_FRAMES;
export const OUTRO_FRAMES = 135;
export const OPENING_FRAMES = COLD_OPEN_FRAMES + GAP_FRAMES + LOGO_FRAMES;

export const ColdOpen: React.FC = () => (
  <>
    <Sequence name="4:00 AM" durationInFrames={CLOCK}>
      <Scene dur={CLOCK} center>
        <Eyebrow revealFrames={24}>The shift nobody writes about</Eyebrow>
        <Head size={170} d={8} revealFrames={24}>4:00 <span style={{ color: C.teal }}>AM</span></Head>
      </Scene>
    </Sequence>
    <Sequence name="The admission" from={CLOCK} durationInFrames={ADMISSION}>
      <Scene dur={ADMISSION}>
        <Wipe d={1} revealFrames={24}>
          <div style={{ fontFamily: C.sans, fontSize: 30, color: C.ink }}>A patient admitted for a kidney stone</div>
        </Wipe>
        <Head d={42} size={76} revealFrames={24}>Suddenly, she wasn&apos;t acting like herself.</Head>
        <Sub d={84} revealFrames={24}>Her nurse noticed. The monitors didn&apos;t.</Sub>
      </Scene>
    </Sequence>
    <Sequence name="Every number in range" from={CLOCK + ADMISSION} durationInFrames={OBSERVATIONS}>
      <Scene dur={OBSERVATIONS}>
        <Eyebrow revealFrames={24}>Observations</Eyebrow>
        <Tiles d={8} tiles={[{k:"HR",v:"78",u:"bpm"},{k:"RR",v:"16",u:"/min"},{k:"SpO₂",v:"97",u:"%"},{k:"BP",v:"124/78"},{k:"Temp",v:"36.8",u:"°C"}]} />
        <Sub d={34} revealFrames={24}><span style={{ fontWeight: 700, color: C.ink }}>Her nurse saw a change these numbers couldn&apos;t show.</span></Sub>
      </Scene>
    </Sequence>
    <Sequence name="The nurse said something" from={CLOCK + ADMISSION + OBSERVATIONS} durationInFrames={NURSE}>
      <Scene dur={NURSE}>
        <Head size={86} revealFrames={24}>The nurse said something.</Head>
        <Sub d={50} revealFrames={24}>It was septic shock.</Sub>
        <Sub d={100} revealFrames={24}>She recovered fully.</Sub>
      </Scene>
    </Sequence>
  </>
);

export const TheGap: React.FC = () => (
  <>
    <Sequence name="77 percent" durationInFrames={EVIDENCE}>
      <Scene dur={EVIDENCE} center>
        <Count to={77} suffix="%" d={4} />
        <Sub d={14}>of calls prompted by nurse worry<br />were backed by independent reviewers.</Sub>
        <Cite d={28}>Romero-Brufau et al. · JAMIA Open 2019<br />Mayo Clinic · 31,159 patient-shifts</Cite>
      </Scene>
    </Sequence>
    <Sequence name="Concern as an early warning" from={EVIDENCE} durationInFrames={EARLY_WARNING}>
      <Scene dur={EARLY_WARNING} center>
        <Head size={80} revealFrames={24}>A nurse&apos;s concern can be<br />an early warning.</Head>
        <Sub d={32} revealFrames={24}>It deserves a reliable path to review and response.</Sub>
      </Scene>
    </Sequence>
  </>
);

const IntroducingSalus: React.FC = () => {
  const frame = useCurrentFrame();
  return <Scene dur={LOGO_BRAND_FRAMES} center>
    <div style={{ position: "relative", width: "100%", height: 560,
      opacity: interpolate(frame, [138, 149], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, textAlign: "center",
        fontFamily: C.mono, fontSize: 24, letterSpacing: ".3em", color: C.muted,
        opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
        INTRODUCING
      </div>
      <Sequence name="Emblem, then wordmark and tagline" durationInFrames={LOGO_BRAND_FRAMES} layout="none">
        <div style={{ position: "absolute", top: 85, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
          <Lockup d={0} wordmarkReveal={18} taglineDelay={44} tagline="Hear the worry. Act on time." />
        </div>
      </Sequence>
    </div>
  </Scene>;
};

const ConcernBridge: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ background: C.canvas }}>
    <AbsoluteFill style={{ opacity: interpolate(frame, [LOGO_BRIDGE_FRAMES - 10, LOGO_BRIDGE_FRAMES - 1], [1, 0], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    }) }}>
      <Scene dur={LOGO_BRIDGE_FRAMES} center>
        <Head size={84}>Her concern deserved more than a note.<br />It needed a response.</Head>
      </Scene>
    </AbsoluteFill>
  </AbsoluteFill>;
};

const MonitoringQuestion: React.FC = () => (
  <Scene dur={LOGO_QUESTION_FRAMES} center>
    <Head d={0} size={80}>What if a nurse&apos;s concern became<br />part of the monitoring system?</Head>
  </Scene>
);

export const LogoResolve: React.FC = () => (
  <AbsoluteFill style={{ background: C.canvas }}>
    <Sequence name="Her concern needed a response" durationInFrames={LOGO_BRIDGE_FRAMES}><ConcernBridge /></Sequence>
    <Sequence name="The complete monitoring question" from={LOGO_BRIDGE_FRAMES} durationInFrames={LOGO_QUESTION_FRAMES}><MonitoringQuestion /></Sequence>
    <Sequence name="Introducing SALUS, then the tagline" from={LOGO_LEAD_IN_FRAMES} durationInFrames={LOGO_BRAND_FRAMES}><IntroducingSalus /></Sequence>
  </AbsoluteFill>
);

export const Outro: React.FC = () => (
  <Scene dur={OUTRO_FRAMES} center>
    <Lockup d={4} tagline="Hear the worry, act on time" />
    <div style={{ fontFamily: C.sans, fontSize: 38, lineHeight: 1.45, color: C.muted }}>
      <Wipe d={24}>Nurse worry + vitals · Closed-loop escalation</Wipe>
      <Wipe d={42}>Physician-gated approval</Wipe>
    </div>
    <div style={{ position: "absolute", left: 100, right: 100, bottom: 72,
      textAlign: "center", fontFamily: C.sans, fontSize: 24, color: C.muted }}>
      Prototype · sample data only · decision support, not a medical device
    </div>
  </Scene>
);

// Review the opening and closing typography without waiting through footage.
export const TypographyReview: React.FC = () => (
  <AbsoluteFill style={{ background: C.canvas }}>
    <Sequence name="Act 0: Cold open" durationInFrames={COLD_OPEN_FRAMES}><ColdOpen /></Sequence>
    <Sequence name="Act 1: The gap" from={COLD_OPEN_FRAMES} durationInFrames={GAP_FRAMES}><TheGap /></Sequence>
    <Sequence name="Act 2: Logo" from={COLD_OPEN_FRAMES + GAP_FRAMES} durationInFrames={LOGO_FRAMES}><LogoResolve /></Sequence>
    <Sequence name="Act 11: Outro" from={OPENING_FRAMES} durationInFrames={OUTRO_FRAMES}><Outro /></Sequence>
  </AbsoluteFill>
);
