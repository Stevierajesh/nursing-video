import React from "react";
import { Composition, Folder } from "remotion";
import { MyComposition, TOTAL, FPS, TimmyIntroductionPreview, INTRO_PREVIEW_FRAMES, Act5Watch, ACT5_FRAMES, FirstAssessmentPreview, FIRST_ASSESSMENT_FRAMES, SecondAssessmentPreview, SECOND_ASSESSMENT_FRAMES, Act7Escalation, ACT7_FRAMES, Act8Review, ACT8_FRAMES } from "./Composition";
import { ColdOpen, TheGap, LogoResolve, Outro, TypographyReview,
  COLD_OPEN_FRAMES, GAP_FRAMES, LOGO_FRAMES, OPENING_FRAMES, OUTRO_FRAMES } from "./TypeActs";
import { Act9Recovery, ACT9_FRAMES } from "./Act9Recovery";

export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Composition
      id="SalusDemo"
      component={MyComposition}
      durationInFrames={TOTAL}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Folder name="Typography">
      <Composition id="MeetTimmy" component={TimmyIntroductionPreview} durationInFrames={INTRO_PREVIEW_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="TypographyReview" component={TypographyReview} durationInFrames={OPENING_FRAMES + OUTRO_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="Act0-ColdOpen" component={ColdOpen} durationInFrames={COLD_OPEN_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="Act1-TheGap" component={TheGap} durationInFrames={GAP_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="Act2-Logo" component={LogoResolve} durationInFrames={LOGO_FRAMES} fps={30} width={1920} height={1080} />
      <Composition id="Act11-Outro" component={Outro} durationInFrames={OUTRO_FRAMES} fps={30} width={1920} height={1080} />
    </Folder>
    <Composition id="Act5-SalusWatches" component={Act5Watch} durationInFrames={ACT5_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Act4-FirstAssessment" component={FirstAssessmentPreview} durationInFrames={FIRST_ASSESSMENT_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Act6-Reassessment" component={SecondAssessmentPreview} durationInFrames={SECOND_ASSESSMENT_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Act7-Escalation" component={Act7Escalation} durationInFrames={ACT7_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Act8-PhysicianReview" component={Act8Review} durationInFrames={ACT8_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="Act9-Recovery" component={Act9Recovery} durationInFrames={ACT9_FRAMES} fps={30} width={1920} height={1080} />
    </>
  );
};
