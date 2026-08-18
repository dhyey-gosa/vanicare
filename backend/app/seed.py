"""Demo seed. Loads the full VaniCare demo world:
- 5 staff (admin, 2 therapists, 2 supervisors)
- 7 patients / cases including the canonical Aarav Sharma journey
  (SLP-2026-001) with approved plan, 10 SOAP sessions, and a submitted
  report awaiting supervisor evaluation
- workload context for other clinicians, a pending plan for the
  supervisor queue, an unallocated case for the admin queue, and one
  completed closed case
- case events timeline + notifications

Runs once on first boot (idempotent: skipped when users exist).
"""
import json
from datetime import datetime

from . import db, security


def _ms(date_str: str) -> int:
    return int(datetime.strptime(date_str, "%Y-%m-%d %H:%M").timestamp() * 1000)


DEMO_PASSWORD = "vanicare123"

COMPETENCIES = [
    "Clinical Documentation",
    "Therapy Planning",
    "Session Handling",
    "Patient Management",
    "Progress Reporting",
]

USERS = [
    ("usr_admin", "Dr. Meera Kapoor", "admin@vanicare.in", "ADMIN"),
    ("usr_riya", "Riya Mehta", "riya@vanicare.in", "THERAPIST"),
    ("usr_kabir", "Kabir Verma", "kabir@vanicare.in", "THERAPIST"),
    ("usr_ananya", "Dr. Ananya Rao", "ananya@vanicare.in", "SUPERVISOR"),
    ("usr_sen", "Dr. Arjun Sen", "sen@vanicare.in", "SUPERVISOR"),
]

PATIENTS = [
    (
        "pat_aarav", "Aarav Sharma", "2018-04-12", "8", "Male", "98765 43210",
        "Neha Sharma", "Dr. Iyer (Paediatrician)",
        "Speech Sound Disorder — /r/ distortion", "Active", "2026-05-20 10:00",
    ),
    (
        "pat_meera", "Meera Iyer", "2020-02-25", "6", "Female", "98765 11223",
        "Rohini Iyer", "School teacher", "Expressive Language Delay", "Active", "2026-05-21 11:30",
    ),
    (
        "pat_zoya", "Zoya Khan", "2017-08-14", "9", "Female", "98765 55667",
        "Imran Khan", "Paediatrician", "Childhood-Onset Fluency Disorder", "Active", "2026-05-28 09:45",
    ),
    (
        "pat_arjun", "Arjun Nair", "2021-01-09", "5", "Male", "98765 88990",
        "Divya Nair", "Dr. Iyer (Paediatrician)", "Speech Sound Disorder — /s/ distortion", "Active", "2026-06-03 15:20",
    ),
    (
        "pat_kavya", "Kavya Reddy", "2019-07-30", "7", "Female", "98765 22334",
        "Suresh Reddy", "ENT specialist", "Voice Disorder — hoarseness", "Active", "2026-06-05 12:10",
    ),
    (
        "pat_rahul", "Rahul Menon", "2022-03-18", "4", "Male", "98765 66778",
        "Anita Menon", "Paediatric Neurologist", "Childhood Apraxia of Speech", "Active", "2026-07-28 10:40",
    ),
    (
        "pat_rohan", "Rohan Pillai", "2020-06-11", "6", "Male", "98765 33445",
        "Lakshmi Pillai", "School teacher", "Speech Sound Disorder — /l/ distortion", "Completed", "2026-01-10 09:00",
    ),
]

CASES = [
    (
        "cas_aarav", "SLP-2026-001", "pat_aarav", "High", "Active", "Speech Sound Disorder",
        "Persistent distortion of /r/ in all word positions, affecting intelligibility and peer communication.",
        "2024-11", "Speech Sound Disorder (ICD-11 6A01)", "", "Moderate",
        "Parent report: avoids words containing /r/; teacher notes reduced classroom participation.",
        "usr_riya", "usr_ananya", "2026-05-22 09:30", None,
    ),
    (
        "cas_meera", "CS-2026-002", "pat_meera", "Medium", "Active", "Expressive Language Delay",
        "Two-word phrases at age 6; limited vocabulary and reduced sentence length.",
        "2025-08", "Developmental Language Disorder", "", "Moderate",
        "Kannada and English spoken at home.", "usr_kabir", "usr_sen", "2026-05-25 10:15", None,
    ),
    (
        "cas_zoya", "CS-2026-003", "pat_zoya", "High", "Active", "Childhood-Onset Fluency Disorder",
        "Frequent part-word repetitions and blocks, increasing before school presentations.",
        "2023-03", "Fluency Disorder (ICD-11 6A01.2)", "School anxiety", "Severe",
        "Avoids speaking in class; parents report frustration.", "usr_riya", "usr_ananya", "2026-06-01 14:00", None,
    ),
    (
        "cas_arjun", "CS-2026-004", "pat_arjun", "Medium", "Active", "Speech Sound Disorder",
        "Interdental /s/ (lisp) affecting word-initial clusters.",
        "2024-09", "Speech Sound Disorder", "", "Mild",
        "Sibling models correct production.", "usr_kabir", "usr_sen", "2026-06-05 16:30", None,
    ),
    (
        "cas_kavya", "CS-2026-005", "pat_kavya", "Low", "Active", "Voice Disorder",
        "Persistent hoarseness and vocal fatigue after school hours.",
        "2025-11", "Functional Voice Disorder", "Allergic rhinitis", "Mild",
        "ENT review: no nodules; vocal hygiene education needed.", "usr_kabir", "usr_ananya", "2026-06-08 11:00", None,
    ),
    (
        "cas_rahul", "CS-2026-006", "pat_rahul", "Medium", "Unallocated", "Childhood Apraxia of Speech",
        "Limited syllable shapes, inconsistent errors, groping during attempts.",
        "2025-01", "Childhood Apraxia of Speech", "", "Moderate",
        "Referred by paediatric neurologist for intensive motor-planning therapy.",
        None, None, "2026-07-28 10:40", None,
    ),
    (
        "cas_rohan", "CS-2026-007", "pat_rohan", "Low", "Closed", "Speech Sound Disorder",
        "/l/ distortion in final position.", "2024-06", "Speech Sound Disorder", "", "Mild",
        "Completed programme with all goals met.", "usr_riya", "usr_ananya", "2026-01-10 09:00",
        {"decision": "Close Case", "reason": "All goals met with 95% accuracy across 3 consecutive sessions.",
         "rating": 5, "closedAt": _ms("2026-04-28 17:00"), "closedBy": "usr_ananya"},
    ),
]

PLANS = [
    (
        "plan_aarav", "cas_aarav", [
            "Produce /r/ accurately in all word positions in connected speech with 90% accuracy across 3 consecutive sessions",
            "Use /r/ in spontaneous conversation with peers with 80% accuracy across 2 school weeks",
        ], [
            "Produce /r/ in isolation with 100% accuracy across 2 consecutive sessions",
            "Produce /r/ in initial word position with 85% accuracy across 2 consecutive sessions",
            "Use /r/ in 5 target words in connected speech with 60% accuracy across 3 sessions",
        ],
        "Articulation drills, auditory discrimination tasks, mirror practice, word cards, graded reading passages",
        "Aarav produces /r/ as /w/ in all word positions. Baseline probe (20 items): 40% accuracy in isolation, 30% in words.",
        "2 sessions/week", "30 min", 10, "Approved",
        "Please specify whether phrase-level accuracy will be measured using structured picture prompts or spontaneous phrases. Use structured picture prompts during the first phase so that performance can be compared consistently.",
        "2026-05-28 11:00", "2026-05-30 16:00",
    ),
    (
        "plan_meera", "cas_meera", [
            "Produce 4-5 word sentences in structured conversation with 80% accuracy",
        ], [
            "Produce 3-word sentences with correct word order across 10 trials",
            "Use 20 new vocabulary items in play-based activities",
        ],
        "Play-based language stimulation, sentence expansion, vocabulary cards",
        "Baseline: 2-word phrases, 8-word expressive vocabulary on parent report.",
        "2 sessions/week", "40 min", 8, "Approved", "", "2026-05-29 10:00", "2026-05-31 14:00",
    ),
    (
        "plan_zoya", "cas_zoya", [
            "Speak in classroom settings with no avoidance behaviour for 2 consecutive weeks",
        ], [
            "Use easy-onset technique in reading aloud with 70% fluency",
            "Report reduced avoidance of speaking in 3 of 5 school situations",
        ],
        "Fluency shaping, easy onset, desensitisation hierarchy, parent coaching",
        "Baseline: part-word repetitions in 40% of utterances; blocks lasting up to 3s.",
        "2 sessions/week", "45 min", 10, "Approved", "", "2026-06-03 12:00", "2026-06-05 15:00",
    ),
    (
        "plan_arjun", "cas_arjun", [
            "Produce /s/ in connected speech with 90% accuracy in structured tasks",
        ], [
            "Produce /s/ in isolation with 95% accuracy",
            "Produce /s/ in initial clusters (sn-, st-) with 80% accuracy",
        ],
        "Phonetic placement cues, minimal pair drill, story retell tasks",
        "Baseline: interdental /s/ in 85% of attempts; stimulable with tongue-tip cue.",
        "1 session/week", "30 min", 6, "Approved", "", "2026-06-09 09:00", "2026-06-11 13:00",
    ),
    (
        "plan_kavya", "cas_kavya", [
            "Maintain typical vocal quality through the school day for 4 consecutive weeks",
        ], [
            "Use 3 vocal hygiene strategies in 5 of 7 school days",
            "Reduce voice breaks during reading tasks to below 2 per session",
        ],
        "Vocal hygiene education, hydration tracking, soft phonation onset practice",
        "Baseline: hoarse voice reported by parents on 6 of 7 days.",
        "1 session/week", "30 min", 6, "Pending Supervisor Review", "", "2026-08-05 10:00", None,
    ),
    (
        "plan_rohan", "cas_rohan", [
            "Produce /l/ in conversation with 90% accuracy",
        ], [
            "Produce /l/ in final position with 90% accuracy",
        ],
        "Articulation therapy with minimal pair tasks",
        "Baseline: 30% accuracy in final position.",
        "1 session/week", "30 min", 8, "Approved", "", "2026-01-12 10:00", "2026-01-15 12:00",
    ),
]

STO_AARAV = [
    "Produce /r/ in isolation with 100% accuracy across 2 consecutive sessions",
    "Produce /r/ in initial word position with 85% accuracy across 2 consecutive sessions",
    "Use /r/ in 5 target words in connected speech with 60% accuracy across 3 sessions",
]

# (number, date, scores per STO_AARAV) — isolation 40->100%, words 30->85% on the 1-5 scale
AARAV_SESSIONS = [
    (1, "2026-06-02", [2, 1, 1]),
    (2, "2026-06-05", [3, 1, 1]),
    (3, "2026-06-09", [3, 2, 1]),
    (4, "2026-06-12", [4, 2, 2]),
    (5, "2026-06-16", [4, 3, 2]),
    (6, "2026-06-19", [4, 3, 3]),
    (7, "2026-06-23", [5, 4, 3]),
    (8, "2026-06-26", [5, 4, 4]),
    (9, "2026-06-30", [5, 5, 4]),
    (10, "2026-07-03", [5, 5, 5]),
]

# Supervisor feedback per session (shown in the session note + progress table)
AARAV_SUPERVISION_NOTES = {
    1: "Supervisor feedback: Good use of visual placement cues. During the final five word trials, reduce the number of verbal models and check whether Aarav can maintain accuracy with only a visual cue.",
    2: "Supervisor feedback: Visual cues effective - continue with the current cueing ladder.",
    3: "Supervisor feedback: Begin reducing verbal models; use delayed models on every third trial.",
    4: "Supervisor feedback: Add varied word positions (initial, medial, final) to the word probes.",
    5: "Supervisor feedback: Aarav's word-level accuracy is improving. You appropriately reduced verbal models. Continue monitoring whether accuracy remains stable when the target word appears in different positions. Record initial, medial, and final word positions separately.",
    6: "Supervisor feedback: Continue phrase preparation; keep word-level accuracy stable.",
    7: "Supervisor feedback: Accuracy improving - maintain current cueing level and begin phrase probes.",
    8: "Supervisor feedback: Begin structured phrases using picture prompts.",
    9: "Supervisor feedback: Maintain word-level accuracy while introducing longer phrases.",
    10: "",
}

CONTEXT_SESSIONS = [
    ("cas_meera", 1, "2026-06-08", "Expressive language"),
    ("cas_meera", 2, "2026-06-15", "Expressive language"),
    ("cas_meera", 3, "2026-06-22", "Expressive language"),
    ("cas_zoya", 1, "2026-06-09", "Fluency"),
    ("cas_zoya", 2, "2026-06-12", "Fluency"),
    ("cas_zoya", 3, "2026-06-16", "Fluency"),
    ("cas_arjun", 1, "2026-06-18", "Articulation"),
    ("cas_arjun", 2, "2026-06-25", "Articulation"),
    ("cas_kavya", 1, "2026-08-07", "Voice"),
]

REPORTS = [
    (
        "rep_aarav", "cas_aarav",
        "Aarav completed 10 of 10 planned sessions (100% attendance). Isolation accuracy rose from 40% to 100% and "
        "word-position accuracy from 30% to 85%. All three short-term goals were met; long-term goal 1 is in progress.",
        "Isolation: 40% -> 100%. Initial word position: 30% -> 85%. Connected speech targets: 60% criterion met in 3 of 5 "
        "target words.",
        "Continue therapy with revised goals targeting /r/ in medial and final word positions, then generalisation into "
        "conversation. Review after 5 more sessions.",
        "Aarav practiced consistently with parents. Motivation remained high when tasks were gamified. "
        "Fading of cues was achieved by session 8.",
        {
            "Articulation & Phonology": {"applicable": True, "baseline": 2, "current": 4},
            "Fluency & Stuttering": {"applicable": False, "baseline": None, "current": None},
            "Receptive & Expressive Language": {"applicable": True, "baseline": 3, "current": 3},
            "Voice & Resonance": {"applicable": False, "baseline": None, "current": None},
            "Pragmatics & Social Communication": {"applicable": True, "baseline": 3, "current": 4},
        },
        "Awaiting Supervisor Evaluation", "2026-07-07 11:00", None,
    ),
    (
        "rep_rohan", "cas_rohan",
        "Rohan completed 8 of 8 sessions with all goals met at 95% accuracy across 3 consecutive sessions.",
        "/l/ final position: 30% -> 95%.",
        "Case closed. Recommend monitoring at school and parental follow-up in 3 months.",
        "Excellent home practice compliance.",
        {
            "Articulation & Phonology": {"applicable": True, "baseline": 2, "current": 5},
            "Fluency & Stuttering": {"applicable": False, "baseline": None, "current": None},
            "Receptive & Expressive Language": {"applicable": False, "baseline": None, "current": None},
            "Voice & Resonance": {"applicable": False, "baseline": None, "current": None},
            "Pragmatics & Social Communication": {"applicable": False, "baseline": None, "current": None},
        },
        "Evaluated", "2026-04-25 10:00",
        {"feedback": "All goals met with consistent carryover. Excellent documentation throughout.",
         "rating": 5, "outcome": "Close Case", "evaluatedAt": _ms("2026-04-28 16:30"), "evaluatedBy": "usr_ananya"},
    ),
]

EVENTS = [
    ("cas_aarav", "usr_admin", "Case registered", "Case SLP-2026-001 opened for Aarav Sharma", "2026-05-22 09:30"),
    ("cas_aarav", "usr_admin", "Case allocated", "Allocated to Riya Mehta (therapist) and Dr. Ananya Rao (supervisor)", "2026-05-24 10:00"),
    ("cas_aarav", "usr_riya", "Plan submitted", "Therapy plan submitted for supervisor review", "2026-05-28 11:00"),
    ("cas_aarav", "usr_ananya", "Plan revision requested", "Feedback: specify how phrase-level accuracy will be measured (structured picture prompts vs spontaneous phrases)", "2026-05-29 15:00"),
    ("cas_aarav", "usr_riya", "Plan resubmitted", "Objective 3 revised to structured three-to-five-word phrases using picture prompts", "2026-05-30 09:00"),
    ("cas_aarav", "usr_ananya", "Plan approved", "Plan approved and co-signed by Dr. Ananya Rao", "2026-05-30 16:00"),
    ("cas_aarav", "usr_ananya", "Session co-signed", "Session 1 co-signed with feedback", "2026-06-03 09:30"),
    ("cas_aarav", "usr_ananya", "Session co-signed", "Session 2 co-signed with feedback", "2026-06-06 09:30"),
    ("cas_aarav", "usr_ananya", "Session co-signed", "Session 3 co-signed with feedback", "2026-06-10 09:30"),
    ("cas_aarav", "usr_ananya", "Session co-signed", "Session 4 co-signed with feedback", "2026-06-13 09:30"),
    ("cas_aarav", "usr_ananya", "Session co-signed", "Session 5 co-signed with feedback", "2026-06-17 09:30"),
    ("cas_aarav", "usr_ananya", "Session co-signed", "Session 6 co-signed with feedback", "2026-06-20 09:30"),
    ("cas_aarav", "usr_ananya", "Session co-signed", "Session 7 co-signed with feedback", "2026-06-24 09:30"),
    ("cas_aarav", "usr_ananya", "Session co-signed", "Session 8 co-signed with feedback", "2026-06-27 09:30"),
    ("cas_aarav", "usr_ananya", "Session co-signed", "Session 9 co-signed with feedback", "2026-07-01 09:30"),
    ("cas_aarav", "usr_riya", "Report auto-drafted", "Progress report auto-drafted from 10 documented sessions", "2026-07-04 17:15"),
    ("cas_aarav", "usr_riya", "Report submitted", "Progress report submitted for supervisor evaluation", "2026-07-07 11:00"),
    ("cas_rahul", "usr_admin", "Case registered", "Case CS-2026-006 opened for Rahul Menon — awaiting allocation", "2026-07-28 10:40"),
    ("cas_rohan", "usr_ananya", "Case closed", "Case closed after successful outcome evaluation", "2026-04-28 17:00"),
]

NOTIFICATIONS = [
    ("usr_riya", "Case SLP-2026-001 (Aarav Sharma) has been allocated to you", 1, "2026-05-24 10:00"),
    ("usr_riya", "Dr. Ananya Rao approved your therapy plan for Aarav Sharma", 1, "2026-05-30 16:00"),
    ("usr_ananya", "Progress report for SLP-2026-001 is awaiting your evaluation", 0, "2026-07-07 11:00"),
    ("usr_admin", "Case CS-2026-006 (Rahul Menon) is awaiting allocation", 0, "2026-07-28 10:40"),
    ("usr_ananya", "Plan for CS-2026-005 (Kavya Reddy) is pending your review", 0, "2026-08-05 10:00"),
]


def seed_if_empty() -> bool:
    """Seed the demo world. Returns True when seeding ran, False when data already existed."""
    existing = db.q("SELECT COUNT(*) AS n FROM users")
    if existing and existing["n"] > 0:
        return False

    with db.get_conn() as conn:
        now = db.now_ms()

        for uid_, name, email, role in USERS:
            conn.execute(
                "INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (uid_, name, email, security.hash_password(DEMO_PASSWORD), role, now - 86400_000),
            )

        for row in PATIENTS:
            pid, name, dob, age, gender, contact, guardian, referral, dx, status, created = row
            conn.execute(
                "INSERT INTO patients (id, full_name, dob, age, gender, contact_number, guardian_name, "
                "referral_source, diagnosis, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (pid, name, dob, age, gender, contact, guardian, referral, dx, status, _ms(created)),
            )

        for row in CASES:
            (cid, ref, pid, prio, status, ctype, reason, onset, pdx, sdx, sev, notes, tid, sid, created, closure) = row
            conn.execute(
                "INSERT INTO cases (id, reference, patient_id, priority, status, case_type, referral_reason, "
                "onset_date, primary_diagnosis, secondary_diagnosis, severity, notes, therapist_id, supervisor_id, "
                "created_at, closure) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (cid, ref, pid, prio, status, ctype, reason, onset, pdx, sdx, sev, notes, tid, sid, _ms(created),
                 json.dumps(closure) if closure else None),
            )

        for row in PLANS:
            (pid, cid, ltg, stg, activities, baseline, freq, dur, total, status, feedback, submitted, reviewed) = row
            conn.execute(
                "INSERT INTO plans (id, case_id, long_term_goals, short_term_goals, activities, baseline_summary, "
                "frequency, duration, total_sessions, status, feedback, submitted_at, reviewed_at, created_at, updated_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (pid, cid, json.dumps(ltg), json.dumps(stg), activities, baseline, freq, dur, total, status, feedback,
                 _ms(submitted) if submitted else None, _ms(reviewed) if reviewed else None,
                 _ms(submitted or "2026-05-25 09:00"), _ms(reviewed or "2026-05-25 09:00")),
            )

        n = 0
        for num, date, scores in AARAV_SESSIONS:
            n += 1
            conn.execute(
                "INSERT INTO sessions (id, case_id, number, date, duration, goals_addressed, activities, "
                "patient_response, progress_observed, challenges, notes, next_session_plan, status, goal_scores, created_at) "
                "VALUES (?, 'cas_aarav', ?, ?, '30 min', ?, ?, ?, ?, ?, ?, ?, 'Completed', ?, ?)",
                (
                    f"ses_aarav_{num}", num, f"{date} 16:00",
                    "STO 1: /r/ isolation. STO 2: initial word position. STO 3: connected speech targets.",
                    "Mirror drill, auditory discrimination, word cards, 20-item probe.",
                    f"Accuracy: isolation {[40, 50, 55, 65, 70, 75, 85, 90, 95, 100][num-1]}%, "
                    f"words {[30, 35, 40, 50, 55, 60, 70, 75, 80, 85][num-1]}%.",
                    f"Probe of 20 items scored {scores[0]}/5; cueing faded from maximum to minimum by session {min(8, num)}.",
                    "Occasional backing of /r/ in blends; addressed with tactile cues." if num < 8 else "No significant challenges.",
                    AARAV_SUPERVISION_NOTES[num],
                    f"Continue with {('word-level' if num < 8 else 'connected speech')} targets.",
                    json.dumps({STO_AARAV[i]: scores[i] for i in range(3)}),
                    _ms(f"{date} 16:00"),
                ),
            )

        for cid, num, date, area in CONTEXT_SESSIONS:
            conn.execute(
                "INSERT INTO sessions (id, case_id, number, date, duration, goals_addressed, activities, "
                "patient_response, progress_observed, challenges, notes, next_session_plan, status, goal_scores, created_at) "
                "VALUES (?, ?, ?, ?, '30 min', ?, 'Structured tasks per plan', 'Good engagement', "
                "'Steady progress within session', 'None', '', 'Continue per plan', 'Completed', '{}', ?)",
                (f"ses_{cid}_{num}", cid, num, f"{date} 16:00", f"{area} goals", _ms(f"{date} 16:00")),
            )

        for row in REPORTS:
            (rid, cid, summary, goals, recs, obs, domains, status, submitted, evaluation) = row
            conn.execute(
                "INSERT INTO reports (id, case_id, summary, goals_addressed, recommendations, observations, "
                "domains, status, submitted_at, evaluation, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (rid, cid, summary, goals, recs, obs, json.dumps(domains), status,
                 _ms(submitted) if submitted else None, json.dumps(evaluation) if evaluation else None,
                 _ms(submitted or "2026-07-01 09:00"), _ms(submitted or "2026-07-01 09:00")),
            )

        riya_comp = {c: "In Progress" for c in COMPETENCIES}
        riya_comp["Session Handling"] = "Competent"
        conn.execute(
            "INSERT INTO records (therapist_id, direct_hours, indirect_hours, competencies) VALUES (?, ?, ?, ?)",
            ("usr_riya", 24, 18, json.dumps(riya_comp)),
        )
        kabir_comp = {c: "In Progress" for c in COMPETENCIES}
        kabir_comp["Patient Management"] = "Not Started"
        kabir_comp["Progress Reporting"] = "Not Started"
        conn.execute(
            "INSERT INTO records (therapist_id, direct_hours, indirect_hours, competencies) VALUES (?, ?, ?, ?)",
            ("usr_kabir", 16, 12, json.dumps(kabir_comp)),
        )

        for i, (cid, actor, etype, detail, created) in enumerate(EVENTS):
            conn.execute(
                "INSERT INTO case_events (id, case_id, actor_id, event_type, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (f"evt_{cid}_{etype.replace(' ', '_').lower()}_{i}", cid, actor, etype, detail, _ms(created)),
            )

        for uid_, text, read, created in NOTIFICATIONS:
            conn.execute(
                "INSERT INTO notifications (id, user_id, text, read, created_at) VALUES (?, ?, ?, ?, ?)",
                (f"ntf_{uid_}_{read}_{created.replace(' ', '_')}", uid_, text, read, _ms(created)),
            )

    return True
