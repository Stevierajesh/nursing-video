# Response-flow rehearsal

The `ResponseFlow-Prototype` composition is a separate audition of the new
concern → yellow review → charge notification → acknowledgment flow. As of
2026-10-31 it is also used by `SalusDemo` and `Act4-FirstAssessment`. In the main
film its audition audio is disabled, so only the main soundtrack plays. The main
film now lasts 4856 frames / 161.87 s; music and opening logo placement stay fixed.

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
../nursing-backend/.venv/bin/python tools/response-fixtures.py
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
(frame 1235). It does not move the music in the main film.

The charge capture now uses the real dashboard's SALUS light theme and branding
(nursing-dashboard commit `cbdfa6f`), matching the nurse app's palette, sun logo
and Bree Serif wordmark. These are frontend source changes, not capture overlays.
