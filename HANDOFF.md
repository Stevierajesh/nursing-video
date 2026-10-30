# SALUS video handoff — 2026-10-30

## Current status

**Response-flow prototype is ready for review** on branch `response-flow-prototype`:
http://localhost:3000/ResponseFlow-Prototype (755 frames / 25.17 s). This is a
separate composition; SalusDemo and the delivered MP4 retain the baseline edit.
The prototype films the current nurse and charge frontends in an offline browser
rehearsal: stable vitals, Very worried, yellow review confirmation, charge popup,
acknowledgment, and the response queue with assessment pending. A persistent label
identifies the rehearsal. Real backend API/risk/acknowledgment logic generated
responses through its in-memory test harness; database RPC/storage is mocked.
No live clinical writes or notification-delivery claim. See tools/README.md.
Music is auditioned from main frame 1235; main-film music/cues are unchanged.
Lint/TypeScript, full preview playback (no page errors), representative stills,
and main Studio loading checked. User should review this direction before any
broader demo restructure. No new MP4 export.

Latest prototype revision: removed the selected “Just a feeling” chip at the
user's request. No optional reason is selected; the full swelling/cramping note
supplies the observations. Refreshed both captures and API fixtures so the charge
queue also omits that reason. Yellow review behavior is unchanged.

This directory is a local Git repository with its baseline on `main`. The initial checkpoint
is tagged `baseline-before-response-flow` and contains the latest source edits
(including the typography-only Timmy intro), before any charge-nurse workflow
restructure. Source media is tracked; exports, capture workspace, credentials
and dependencies are ignored. See README.md for branch/worktree instructions.
The original nested Remotion Git metadata is preserved in `.git/remotion-original.git`.

The full film was rendered and delivered. On 2026-10-30, two opening copy changes were made and checked in source; `salus-demo.mp4` predates these changes. No new full export was requested.

- Project: `/home/stevie/Desktop/Projects/hackathons/nursing/video`
- Main composition: **SalusDemo**, in `remotion/src/Composition.tsx`, registered in `remotion/src/Root.tsx`.
- Current export: **`salus-demo.mp4`** in this directory. Other MP4s here are older work.
- Export: H.264, CRF 18, 1920×1080, 30 fps, 4588 frames, 152.933 seconds (about 2:33), 36,069,018 bytes. AAC stereo, 48 kHz.
- Render completed successfully. Video/audio metadata and exported frames at 34, 81 and 150 seconds were checked; music is present.
- Studio URL: `http://localhost:3000/SalusDemo` (check whether the server is running before relying on it).
- `CODEX-NOTES.md` is the detailed chronological history. Its older durations and superseded designs are historical; use this handoff and current source for the final state.

## User preferences and decisions to preserve

- Keep the pacing readable, with continuous camera movement between views of the same iPad. Avoid teleporting device poses.
- Remove dead waits between selecting concern, choosing a reason and typing notes. Keep complete notes visible and legible.
- Avoid captions that describe obvious clicks, duplicate the note text, or explain the filmmaking technique.
- Retain the minimalist near-white canvas, Georgia headings, teal accents and existing red SALUS emblem.
- The piano cue **31.26 means 00:31:26 at 30 fps**, main frame **956**. The red emblem must begin there. Do not move the music or this cue casually.
- Act 10's feature overview was considered redundant and is omitted. Recovery leads to the close.
- Narration was discussed, then paused by the user while working on the script and visuals. No voiceover has been added. Do not resume narration without a new request.
- Preserve the user's Act 1 Sequence transform `translate: "-2px 0px"` in Composition.tsx.
- Do not change `storyboard/salus-storyboard.html` as part of routine film edits.

## Current timeline (30 fps)

| Section | Start frame | Duration |
| --- | ---: | ---: |
| Act 0 cold open | 0 | 480 |
| Act 1 evidence | 480 | 251 |
| Act 2 bridge, question, brand | 731 | 375 |
| Meet Timmy | 1106 | 165, overlapping next section by 36 |
| First assessment | 1235 | 607 |
| Act 5 watch/time-lapse | 1842 | 360 |
| Act 6 reassessment | 2202 | 538 |
| Act 7 escalation | 2740 | 570 |
| Act 8 physician review | 3310 | 783 |
| Act 9 recovery/recap | 4093 | 360 |
| Outro | 4453 | 135 |
| End | 4588 | |

Timing is derived from shared source constants; update those rather than duplicating absolute offsets when editing.

## Opening and Timmy

`remotion/src/TypeActs.tsx` contains the typographic acts. The opening patient wording is exactly:

> A patient admitted for a kidney stone
>
> Suddenly, she wasn't acting like herself.
>
> Her nurse noticed. The monitors didn't.

The observations subtitle is now “Her nurse saw a change these numbers couldn't show.”

ColdOpen text now uses 24-frame / 0.8-second wipes with gentler easing (optional revealFrames prop on shared text components); later scenes retain their default reveals. This slows the text animation without moving its start times or any scene/music boundaries.

The five-point scale graphic and 40.4 likelihood-ratio copy were removed with user approval. Their 116-frame slot (main frames 615–730) now shows “A nurse's concern can be an early warning.” and “It deserves a reliable path to review and response.” in centered typography with 24-frame reveals. Constant renamed EARLY_WARNING. All later timings remain fixed. Lint/TypeScript pass; main frame 690 checked in remotion/out/early-warning-bridge.png. MP4 predates this edit.

Opening pacing revised with user approval: removed the repeated “There's no field for this” slide and allocated its 105 frames to admission (+45), observations (+30), and nurse/recovery (+30). These now last 4.5, 4, and 5 seconds. Admission lines reveal at local frames 1/42/84; nurse/recovery lines at 5/50/100. The 77% evidence still begins at main frame 480 / 16 seconds; all subsequent cues and total film duration are unchanged. Lint/TypeScript and composition metadata checked; representative nurse/recovery still visually checked. MP4 predates these edits.

Act 2 is now: “Her concern deserved more than a note. It needed a response.” for 120 frames; the complete question “What if a nurse's concern became part of the monitoring system?” for 105 frames; then the 150-frame brand reveal. A previous split question reveal was rejected as awkward. Keep the whole question together.

Brand reveal: emblem begins at main frame 956; INTRODUCING fades in; SALUS wordmark follows; then “HEAR THE WORRY. ACT ON TIME.” Shared styles/emblem are in `Type.tsx` and `Sun.tsx`.

`PatientIntro.tsx`: typography-only introduction, approved for trial on 2026-10-30. Small “A DEMONSTRATION CASE” label, short teal rule, large serif “Meet Timmy Buttons.”, then “51 years old · Room 609” and “Admitted with swelling in his feet and legs, with cramping.” Removed the cartoon and circle from the slide; asset remains on disk. Text uses staggered 24-frame reveals. Intro remains 5.5 seconds, with the existing 1.2-second sliding overlap into the iPad view. Lint/TypeScript pass; stills timmy-type-intro.png and timmy-type-transition.png visually checked in remotion/out. MP4 predates this redesign.

## First assessment and Act 5

First assessment uses trimmed adjacent clips from `act4.webm`, one camera path and 607 frames. It zooms into the actual calm vitals, then worry controls and the actual note field. Persistent copy after the calm view: **“But she has seen this before.” / “She selects her concern and adds a reason.”** Removed duplicate sidebar quotation and redundant Very worried/Recording concern headings. Actual submitted score is 3/10.

First note: “In my experience, I have seen that swelling of the feet while cramping is a symptom of circulatory decline.”

`WatchTimeLapse.tsx` supplies Act 5's continuous illustrative replay over a frozen actual baseline frame. Act 5 remains 12 seconds: 2 seconds baseline, 7 seconds accelerated change, 3 seconds final risk. Clock T+00:00 → T+10:00; values and growing trend lines stay synchronized on fixed chart scales.

- Baseline: HR 88, RR 18, BP 118/74, SpO2 96, temperature 36.9.
- Endpoint: HR 106, RR 22, BP 101/66, SpO2 96, temperature 37.0; score 5/10.
- Connecting samples are authored illustration, labeled Demo time-lapse, Simulated observations and Illustrative replay between recorded observations. No patient data was written.
- Change heading: **“Heart rate up. Breathing faster. Pressure falling.”** No “Ten minutes of change, in seconds” subtitle.

## Act 6 — latest substantive edit

User requested: replace “Still very worried” and its tagline with **“Pressure falling. Rates rising.”**, and make concern selection → What's off → Anything else entry one continuous flow.

Implemented a single stationary heading under Second assessment, without a subtitle, from frames 0–388. Removed the old changing action captions and “On the record.” The full updated second note is distinct from the first:

> Circulatory decline. BP falling, heart rate and breathing rising. Please review.

Adjacent footage clips in `ReassessmentFootage` remove stationary waits while preserving pointer glides, selections, full note entry and submission. Source ranges approximately 27.3667–30.8087, 33.9667–36.4667, 38.9667–41.2167, 42.0–46.2, 48.1–57.2 seconds; durations 86, 63, 56, 105, 228 frames, approximately 1.2× playback. Act 6 totals 538 frames. Actual 6/10 result begins at frame 388 and keeps its 5-second hold.

Act 5 ends and Act 6 starts at shared `REASSESSMENT_HANDOFF = focus(350, 440, 1.65)`. Act 6 smoothly pans to the top-right controls over 60 frames. A 20-frame blend from the frozen final time-lapse into real footage prevents a source jump inside the iPad; the right-hand matte moves with the pan. Preserve this handoff when editing camera keys.

Proof stills: `remotion/out/act6-continuous-note-final.png`, `act6-continuous-main.png`, and earlier `reassessment-smooth-*` / `reassessment-pan-*` frames.

## Acts 7–9 and evidence limits

Act 7: 19 seconds. Agreement title → actual overdue controls → actual physician queue → Room 609 map. Uses the original Act 6 map recording at 62.2–67.7 seconds to preserve actual score 6/10; later live captures had drifted to 5/10. Physician queue retains the first linked worry note, matching actual app behavior. Do not invent new toasts, two-minute repeat pages, acknowledgement, or assigned-physician routing. Capture script: `build/shoot-act7.mjs`.

Act 8: 26.1 seconds. Real app UI filmed in a **browser-only rehearsal**, with eight-section review checklist and complete placeholder prescription fields. Existing dismissed Timmy review was not changed in the backend. `build/shoot-act8.mjs` uses page-scoped route interception to supply/approve only a local rehearsal copy. Persistent Prototype review · demo prescription label; final Demo decision recorded. Fields use Demo medication/dose/route/frequency/duration, with a prototype-only note. No actual prescription, pharmacy delivery or notification occurred. Approval requires eight sections **and** complete prescription fields. Asset `public/act8-review.webm`.

Act 9: `Act9Recovery.tsx`, 12 seconds. Seven seconds of clearly labeled illustrative recovery, HR 130→92, RR 27→18, BP 76/53→114/72, followed by five-second care recap. Numeric values, fixed-scale trends and end dots move together. Settling → Settled, not a clinical Normal assertion. Label Illustrative recovery · simulated values. Recap: Worry recorded → Vitals changed → Concern escalated → Physician reviewed → Decision recorded. No real treatment/outcome or database write is claimed.

## Validation and rendering

Latest source edits passed `npm run lint` (eslint + TypeScript) in `remotion/`, full Act 6 Studio playback and representative main frames. Earlier acts received their own playback and visual checks. No source changes were made during the final export.

Use the existing dependencies; Remotion 4.0.539, Node 22. Chrome executable:

`/home/stevie/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`

Full export command, from `remotion/`:

```bash
npx remotion render src/index.ts SalusDemo ../salus-demo.mp4 --codec=h264 --crf=18 --concurrency=4 --browser-executable=/home/stevie/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome
```

Render took about eight minutes. Keep user updated during long operations. Do not repeat a full render unless requested or necessary for a new deliverable.

Still command pattern:

```bash
npx remotion still src/index.ts Act6-Reassessment out/check.png --frame=300 --browser-executable=/home/stevie/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome --log=error
```

FFmpeg/FFprobe: `/snap/bin/shotcut.ffmpeg`, `/snap/bin/shotcut.ffprobe`. Playwright import for root scripts: `./build/node_modules/playwright-core/index.mjs`.

Source music remains `remotion/public/b51-q2.wav` (also `build/b51-q2.wav`), 209.818292 seconds. SHA256 `3f269933a7553d126c1135a5a723b4d91eb55141dcd0fba6dc56c890c94d229b`. Do not alter the approved music or its placement.

Standalone composition IDs: Act0-ColdOpen, Act1-TheGap, Act2-Logo, MeetTimmy, Act4-FirstAssessment, Act5-SalusWatches, Act6-Reassessment, Act7-Escalation, Act8-PhysicianReview, Act9-Recovery, Act11-Outro, TypographyReview.

## App capture notes if further footage is needed

Local app: `http://localhost:5173`; sources in sibling `nursing-app` and `nursing-backend`. Read existing capture scripts before recording. At desktop width use `nav:visible`; `nav[aria-label="Main navigation"]` fails because the label is on its containing aside. Actual configured physician account is james@mercygeneral.example, not the obsolete prescriber seed email; nurse account maria@mercygeneral.example displays Sally Osborn. Do not print credentials or modify live clinical state for video capture. Existing scripts and detailed notes contain the necessary capture context.

No active goal or pending approval. Next step is whatever film revision the user requests.
