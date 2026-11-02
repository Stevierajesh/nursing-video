import React from "react";
import { AbsoluteFill, interpolate, Easing, useCurrentFrame, useVideoConfig } from "remotion";
import { C, Eyebrow, Head, Sub } from "./Type";

export const PATIENT_INTRO_FRAMES = 225; // 6.3 s to meet Timmy, then a 1.2 s slide.
export const PATIENT_SLIDE_FRAMES = 36;

// One push transition: the introduction exits left as the live iPad enters.
export const PatientIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  return (
    <AbsoluteFill style={{
      background: C.canvas, overflow: "hidden",
      translate: `${interpolate(frame, [PATIENT_INTRO_FRAMES - PATIENT_SLIDE_FRAMES, PATIENT_INTRO_FRAMES], [0, -width], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.45, 0, 0.25, 1),
      })}px 0`,
    }}>
      <div style={{ position: "absolute", left: 160, top: 290, width: 1600,
        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 28 }}>
        <Eyebrow d={1} revealFrames={24}>A demonstration case</Eyebrow>
        <div style={{ width: 88, height: 3, background: C.teal, marginTop: 6,
          transformOrigin: "left center",
          scale: `${interpolate(frame, [8, 32], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.4, 0, 0.2, 1),
          })} 1`,
        }} />
        <Head d={18} size={108} revealFrames={24}>Meet Timmy Buttons.</Head>
        <Sub d={44} revealFrames={24}>51 years old · Room 609</Sub>
        <div style={{ maxWidth: 1100, marginTop: 4 }}>
          <Sub d={62} revealFrames={24}>Admitted with swelling in his feet and legs,<br />with cramping.</Sub>
        </div>
        {/* Names Sally here so she is not an unintroduced voice at 0:49. Role and
            unit come from the app's own /me payload; she is his assigned nurse
            in the queue, so nothing beyond that is claimed. */}
        <div style={{ maxWidth: 1100, marginTop: 4 }}>
          <Sub d={82} revealFrames={24}>Cared for by his nurse, <span style={{
            fontWeight: 700, textDecoration: "underline",
            textDecorationThickness: 2, textUnderlineOffset: "0.16em",
          }}>Sally Osborn</span>.</Sub>
        </div>
      </div>
    </AbsoluteFill>
  );
};
