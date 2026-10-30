"""Export offline rehearsal responses through the real backend API.

Run with nursing-backend/.venv/bin/python. Storage and identity use the
backend's in-memory test harness; no Supabase client or network is used.
"""
import json
import os
from pathlib import Path
import sys
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT.parent / "nursing-backend"
sys.path[:0] = [str(BACKEND), str(BACKEND / "tests")]
os.environ["SUPABASE_URL"] = "https://example.supabase.co"
os.environ["SUPABASE_SERVICE_KEY"] = "dummy"

from test_mobile_workflows import env, DB, Query  # noqa: E402
from app.services.risk import compute_risk, RULE_LABELS  # noqa: E402

now = datetime.now(timezone.utc)
stamp = now.isoformat()
note = "In my experience, I have seen that swelling of the feet while cramping is a symptom of circulatory decline."
original_execute = Query.execute


def execute(query):
    if query.mode == "insert" and query.name == "worry_signals":
        query.payload.setdefault("created_at", stamp)
    return original_execute(query)


def rpc(database, name, params):
    # The SQL RPC's storage boundary is mocked, just as in the backend tests.
    # The real API, risk calculation, trigger selection and acknowledgment run.
    assert name == "open_patient_escalation"
    review = dict(id="demo-review", org_id=params["p_org"], patient_id=params["p_patient"],
                  worry_signal_id=params["p_signal"], rule=params["p_rule"], status="open",
                  concern_review=True, triggered_at=stamp,
                  sla_deadline=(now + timedelta(minutes=params["p_sla_minutes"])).isoformat(),
                  acknowledged_at=None, assessed_at=None)
    database.rows["escalations"].append(review)
    return SimpleNamespace(execute=lambda: SimpleNamespace(data=deepcopy(review)))


with patch.object(Query, "execute", execute), patch.object(DB, "rpc", rpc), \
     patch("app.services.risk._now", return_value=now), \
     patch("app.services.escalation._now", return_value=now):
    harness = env.__wrapped__()
    client, database, identity = next(harness)
    try:
        database.rows["organizations"][0]["worry_sla_minutes"] = 20
        database.rows["worry_signals"] = []
        database.rows["risk_scores"] = []
        database.rows["escalations"] = []
        vitals = [dict(id=f"demo-vital-{i}", patient_id="p1", org_id="a", source="simulation",
                       recorded_at=(now - timedelta(seconds=(3-i)*15)).isoformat(),
                       heart_rate=88, resp_rate=18, spo2=96, systolic_bp=118,
                       diastolic_bp=74, temperature_c=36.9, news_score=0,
                       supplemental_o2=False, consciousness="A", glucose_mg_dl=None,
                       pain_score=None) for i in range(4)]
        database.rows["vitals"] = list(reversed(vitals))
        patient = dict(id="p1", org_id="a", unit_id="u1", display_name="Timmy Buttons",
                       age=51, age_band="50-59", sex="Male", bed="9B", room="609",
                       admitted_at=stamp, discharged_at=None, allergies=None,
                       health_context="Presenting with swelling of the feet and legs, with cramping.",
                       baseline_vitals={k: vitals[-1][k] for k in ["heart_rate", "resp_rate", "spo2", "systolic_bp", "diastolic_bp", "temperature_c"]})
        database.rows["patients"][0].update(patient)
        before = compute_risk(vitals, [])
        with patch("app.api.worry.supabase", return_value=database):
            response = client.post("/api/v1/worry", json=dict(patient_id="p1", level=4,
                                   reasons=["just_a_feeling"], note=note, capture_ms=9000))
        assert response.status_code == 201, response.get_json()
        submitted = response.get_json()
        assert submitted["escalation"]["rule"] == "nurse_concern"
        assert submitted["risk"]["score"] == 25
        signal = submitted["worry_signal"]
        signal["nurse"] = {"id": "n1", "full_name": "Sally Osborn"}
        review = {**submitted["escalation"], "rule_label": RULE_LABELS["nurse_concern"],
                  "patient": {k: patient[k] for k in ["id", "display_name", "room"]},
                  "worry_signal": signal, "ack_by": None, "assess_by": None}
        identity.update(id="charge-demo", role="charge_nurse")
        response = client.post("/api/v1/escalations/demo-review/acknowledge", json={})
        assert response.status_code == 200, response.get_json()
        acknowledged = {**review, **response.get_json()["escalation"],
                        "ack_by": {"id": "charge-demo", "full_name": "Charge nurse"}}
        assert acknowledged["status"] == "acknowledged" and acknowledged["assessed_at"] is None
        initial_risk = dict(score=before.score, worry_component=0, vitals_component=0,
                            trend_component=0, latest_news=0, news_band="none",
                            trend_slope_per_hour=0, worry_level=0, inputs=before.inputs)
        payload = dict(browserOnly=True, noLiveWrites=True, storageMocked=True,
                       generatedAt=stamp, patient=patient, vitals=vitals,
                       initialRisk=initial_risk, submitted=submitted, review=review,
                       acknowledged=acknowledged, note=note)
        out = ROOT / "remotion/public/response-prototype/fixtures.json"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(payload, indent=2))
        print("Offline API verified: Very worried → yellow review → acknowledged, assessment pending.")
    finally:
        harness.close()
