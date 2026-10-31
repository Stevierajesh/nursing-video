# Response-flow rehearsal

The `ResponseFlow-Prototype` composition is a separate audition of the new
concern → yellow review → charge notification → acknowledgment flow. As of
2026-10-31 it is also used by `SalusDemo` and `Act4-FirstAssessment`. In the main
film its audition audio is disabled, so only the main soundtrack plays. The main
film now lasts 4916 frames / 163.87 s; music and opening logo placement stay fixed.

The recordings use the current nurse app and charge console, with browser-scoped
API interception. Fake sessions contain no real login credentials. All API
responses are local fixtures; no live submissions or acknowledgments are sent.
The prototype is labeled as a browser-only rehearsal throughout.

`response-fixtures.py` uses the backend's existing in-memory test harness to run
the real worry endpoint, risk calculation, independent concern trigger, and
acknowledgment endpoint. The database RPC/storage boundary is mocked; this is
not an end-to-end database or notification-delivery test. The captured charge
popup uses the app's real polling fallback, without a live Realtime connection.

To reproduce from the video directory:

```sh
../nursing-backend/.venv/bin/python tools/response-fixtures.py --baseline-motion
npm ci --prefix tools
node tools/capture-response-prototype.mjs
```

Both frontends must already be running at localhost:5173 and localhost:5174.
The script reads only their configured Supabase URL from `.env.local` to derive
the local session key. It blocks Supabase HTTP requests and uses a dummy token.
Playwright uses the existing Chrome executable listed in HANDOFF.md.

Fixtures, two source WebMs and capture marks are saved under
`remotion/public/response-prototype/` and tracked by Git. Proof screenshots and
raw capture files are saved under ignored `build/footage/response-prototype/`.
If re-recording changes action times, update the source trims and camera keys
in `remotion/src/ResponseFlowPrototype.tsx` using the new capture marks.

The preview plays the approved music from the existing first-assessment offset
(derived from the current opening and Timmy intro timing). It does not move the music in the main film.

The charge capture now uses the real dashboard's SALUS light theme and branding
(nursing-dashboard commit `cbdfa6f`), matching the nurse app's palette, sun logo
and Bree Serif wordmark. These are frontend source changes, not capture overlays.

`--baseline-motion` supplies eight authored baseline history samples with small
variations, all NEWS 0, retaining the same final readings. It keeps the established
scenario timestamp from the existing fixture. The capture freezes only browser
clock time to that scenario time; polling/animation timers continue normally.
These samples are simulation data, not newly observed patient measurements.

## Reassessment note

The updated second assessment has its own offline rehearsal capture:

```sh
../nursing-backend/.venv/bin/python tools/response-fixtures.py --reassessment
node tools/capture-reassessment.mjs
```

It uses the previously filmed reassessment observations (HR 129, RR 26,
BP 75/52, SpO2 96, temperature 36.9), recomputes NEWS 8 and combined score 55
through current backend logic, and reuses an acknowledged concern review in
mock storage. No real patient state is changed. The source video, fixtures and
marks live under `remotion/public/reassessment/`; proof screenshots under
`build/footage/reassessment/`. The new note is typed at an 8 ms input delay,
then held before submission. Main Act 6 timing remains 538 frames, including
its five-second result hold.
