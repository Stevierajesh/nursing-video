# Claude handoff: SALUS demo film

Updated 2026-11-01. This is the current handoff for continuing the film edits.
For older decisions and implementation detail, see [HANDOFF.md](HANDOFF.md) and
[CODEX-NOTES.md](CODEX-NOTES.md); their older entries are historical and may be
superseded by the current status below.

## Current state

- Workspace: `/home/stevie/Desktop/Projects/hackathons/nursing/video`
- Branch: `assessment-response-story`; latest commit `7b3eb46` (`Finish Timmy
  story with team review and recovery`), 17 commits ahead of origin. Do not push.
- Remotion preview: <http://localhost:3000/SalusDemo>
- Main composition: 3893 frames at 30 fps, about 2:10.
- No updated full MP4 export has been made; the existing ignored `salus-demo.mp4`
  is stale.

The story now ends with Sally raising a fresh concern, the charge team seeing the
updated picture, the existing illustrative recovery sequence, and a short recap.
The physician medication demonstration and its bridge have been removed from
the main film. The standalone `Act8-PhysicianReview` and its source assets remain
available as history. The user explicitly asked to keep the recovery animation.

Current ending order and frame ranges:

| Section | Frames | Approx. time |
| --- | ---: | ---: |
| Follow-up team review | 3188–3397 | 1:46–1:53 |
| Illustrative recovery | 3398–3607 | 1:53–2:00 |
| Care recap | 3608–3757 | 2:00–2:05 |
| Logo outro | 3758–3892 | 2:05–2:10 |

The follow-up review is visibly open and awaiting response. Do not imply that a
physician reviewed it, medication was prescribed, or recovery is an established
patient outcome. Recovery remains explicitly illustrative and simulated.

## Current narrative

1. Sally raises a concern while Timmy's initial observations appear calm.
2. The charge nurse receives the concern, assesses Timmy, and records a plan to
   repeat observations in 10 minutes and reassess sooner if symptoms change.
3. SALUS continues monitoring; later observations change.
4. Sally raises a fresh concern. The charge team sees the updated observations
   and her note; the follow-up remains open for response.
5. An illustrative recovery sequence is followed by: “A concern heard. A
   response recorded. A change brought back to the team.”

The main first-response footage is one continuous nurse-app take: notification,
open patient, acknowledge, write the assessment note, mark assessed, and see the
recorded state. The charge-role handoff from the map uses a short dissolve; there
are no app changes inside that response take. The second escalation also uses a
real nurse-app capture, with the editorial caption quoting Sally's note.

## Key files

- `remotion/src/Composition.tsx` — main composition, scene order and durations.
- `remotion/src/ResponseFlowPrototype.tsx` — first concern, map navigation and
  continuous charge-nurse response.
- `remotion/src/WatchTimeLapse.tsx` — illustrative observations and continuous
  rolling trend lines.
- `remotion/src/Act9Recovery.tsx` — illustrative recovery and final recap.
- `remotion/src/TypeActs.tsx` — opening observations caption and typography.
- `remotion/public/charge-app-flow/`, `map-navigation/`, `reassessment/`, and
  `team-review/` — recorded browser-rehearsal footage and capture manifests.
- `tools/capture-*.mjs` and `tools/response-fixtures.py` — offline capture setup.

## Editing and verification notes

- Preserve the user's approved story, actual app footage, and clearly marked
  simulated/rehearsal values. Don't invent app behavior, clinical measurements,
  treatment, notification delivery, or a completed follow-up response.
- The assessment note is: “Reviewed Timmy at bedside following Sally’s concern.
  Repeat observations in 10 minutes; reassess sooner if symptoms change.”
- The second concern reads: “Concerned about deterioration. BP falling, heart
  rate and breathing rising. Please assess.”
- Preserve the full-width continuous trend lines and the actual amber on/off map
  blink. The user wanted a visible blink, not a subtle color pulse.
- The source music and its placement are unchanged. The user explicitly said
  alignment after 1:28 need not be maintained; don't add holds or prolong scenes
  just to fit the music.
- Use the existing Remotion dependencies and preview. `npm run lint` in
  `remotion/` checks ESLint and TypeScript. Stills and Studio playback were
  checked after the latest edit. Don't render a full MP4 unless requested.
- Keep changes in the main video repository unless a requested change requires
  an app or backend edit. Sibling repositories have user-owned uncommitted work;
  inspect status and preserve it. Never stage unrelated changes or push.

## Current preview check

Latest visual checks covered the new team review, recovery, closing recap, and
Studio playback through the ending. The latest lint passed. No current uncommitted
changes were present when this handoff was written.
