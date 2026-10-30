-- Demo-data changes made on 2026-10-27 to shoot the storyboard captures.
-- The user gave free rein on application data; this file exists so none of it is
-- a one-way door. Run the whole file to undo, or pick individual statements.

-- 1. Nurse name. The film's nurse is Sally Osborn; Timmy is assigned to Maria.
update public.profiles set full_name = 'Maria Santos'
where email = 'maria@mercygeneral.example';

-- 2. Nurse's unit. Moved to 6 North purely to work around the WorryTap bug below.
--    Maria's own patients are on 4 West, so this is the correct home value.
update public.profiles pr set unit_id = u.id
from public.units u
where pr.email = 'maria@mercygeneral.example'
  and u.name = '4 West — Med/Surg' and u.org_id = pr.org_id;

-- 3. Timmy Buttons' record. age/diagnosis/health_context were null before.
update public.patients
set age = null, diagnosis = null, health_context = null
where display_name = 'Timmy Buttons';

-- NOT reverted deliberately — this one was a genuine data error, not a demo change:
--   Timmy's unit_id pointed at 4 West while his bed (609/9B) is on 6 North.
--   It now points at 6 North. Leave it.

-- 4. Simulation. Was respiratory_decline on a 10-minute arc, with a stranded
--    sampling clock (last_sample_elapsed 60,791s ahead of elapsed_seconds, which
--    blocks the monotonic guard and makes the patient go silent). The reset is
--    worth keeping; only the scenario is a demo choice.
update public.simulation_runs
set config = config
      || jsonb_build_object('scenario', 'respiratory_decline')
      || jsonb_build_object('duration_minutes', 10)
      || jsonb_build_object('baseline', jsonb_build_object(
           'heart_rate', 78, 'resp_rate', 16, 'spo2', 98,
           'systolic_bp', 124, 'diastolic_bp', 78, 'temperature_c', 36.8)),
    revision = revision + 1
where patient_id = (select id from public.patients where display_name = 'Timmy Buttons')
  and status = 'running';

-- 5. Timmy's observations, worry signals and escalations were deleted during the
--    shoot and cannot be restored. They were simulated rows; the running
--    simulation regenerates vitals on its own.

-- ---------------------------------------------------------------------------
-- Code bug found while shooting, NOT fixed (outside the video task):
--   nursing-app/src/screens/WorryTap.tsx:284 renders `me?.unit?.name` — the
--   signed-in nurse's unit — next to the patient's room. A nurse covering a
--   patient on another unit sees that patient captioned with the wrong unit.
--   It should read the patient's unit, as the patients list already does.
--
-- Note also: app/auth/middleware.py caches profiles in memory
-- (Config.PROFILE_CACHE_SECONDS), so profile edits need an API restart to show up.
