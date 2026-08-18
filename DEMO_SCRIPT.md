# VaniCare Demo Script — 12 Scenes (SIH Sprint 2026, PS-SW-008)

Rehearsed 18 Aug 2026: **40/40 checks passed** against the live stack (vite dev + backend + SQLite).

Accounts (password `vanicare123`): admin@vanicare.in · riya@vanicare.in · ananya@vanicare.in
Demo world: Aarav Sharma (SLP-2026-001) pre-plays scenes 1-10. Scenes 11-12 are **live actions** — the DB is reset to pristine before the demo so they replay exactly.

Timing per scene is the measured rehearsal time. Total interactive demo ≈ 90-120 s of clicking, plus narration.

---

## Scene 1 — Patient intake & case registration (Admin)
**Actor:** Admin · **Screen:** Dashboard → Patients → Cases
**Click path:** Log in as admin → "Patients" → point at Aarav Sharma row → "Cases" → point at SLP-2026-001 row → back to Dashboard
**Say:** Intake happens here - patient registered, clinical case opened with referral reason and priority. All admin work is one or two clicks from the dashboard.
**Beat:** Dashboard alert "Case CS-2026-006 (Rahul Menon) is awaiting allocation" - admin sees pending work immediately.
**Time:** ~4 s

## Scene 2 — Allocation & notifications (Admin)
**Actor:** Admin · **Screen:** Allocation page + bell
**Click path:** "Allocation" → point at SLP-2026-001 row (Riya Mehta + Dr. Ananya Rao) → bell (1 unread) → dropdown shows "awaiting allocation" → "Mark all as read" → badge clears
**Say:** Every assignment is a two-person pair - therapist + supervisor - so no case is ever unmonitored. The notification bell keeps every role aware of what needs them.
**Time:** ~4 s

## Scene 3 — Caseload & case timeline (Therapist)
**Actor:** Riya · **Screen:** Dashboard → Session documentation
**Click path:** Log in as riya → "Session documentation" → click SLP-2026-001 → scroll to "Case timeline"
**Say:** Riya's caseload. Open a case and the full timeline is right there - registered, allocated, plan submitted, revised, co-signed, sessions documented. Complete audit trail, no manual logging.
**Time:** ~3 s

## Scene 4 — Approved therapy plan (Therapist)
**Actor:** Riya · **Screen:** Therapy plans
**Click path:** "Therapy plans" → SLP-2026-001
**Say:** The plan was reviewed by the supervisor - approved, co-signed, locked. Riya sees the supervisor's revision feedback right on the plan, then proceeds to sessions.
**Beat:** Amber "Supervisor feedback" banner + "This plan is approved and read-only."
**Time:** ~2 s

## Scene 5 — Supervisor review queue (Supervisor)
**Actor:** Dr. Ananya · **Screen:** Dashboard → Plan reviews
**Click path:** Log in as ananya → "Plan reviews" → SLP-2026-001
**Say:** The supervisor side: queues, not chaos. Every plan awaiting review, and the approved one shows the revision loop in its timeline - requested, resubmitted, co-signed. Kavya's plan is pending in the same queue (workload context).
**Time:** ~3 s

## Scene 6 — Session documentation with supervision (Therapist)
**Actor:** Riya · **Screen:** Session documentation
**Click path:** "Session documentation" → SLP-2026-001 → "Edit" on Session 1
**Say:** Ten documented SOAP sessions. Open Session 1 and the supervisor's clinical feedback is attached to the note itself - "reduce verbal models, maintain accuracy with only a visual cue." Supervision is embedded in the workflow, not a separate meeting.
**Time:** ~3 s

## Scene 7 — Supervisor audits session data (Supervisor)
**Actor:** Dr. Ananya · **Screen:** Report evaluations (SLP-2026-001)
**Click path:** "Report evaluations" → SLP-2026-001
**Say:** Before the supervisor signs anything, they audit the underlying evidence: session log, 10 of 10 sessions completed, the co-sign trail on the timeline, and a smart digest computed from the session data.
**Beat:** The digest card: "Aarav completed 10 of 10 planned sessions…"
**Time:** ~3 s

## Scene 8 — Longitudinal progress (Therapist)
**Actor:** Riya · **Screen:** Longitudinal progress
**Click path:** "Longitudinal progress" → SLP-2026-001
**Say:** Objective-level progress across sessions - the 1-to-5 clinical scale over time. This is what tells us therapy is actually working.
**Time:** ~2.5 s

## Scene 9 — Report automatically due (Therapist)
**Actor:** Riya · **Screen:** Progress reports
**Click path:** "Progress reports" → SLP-2026-001
**Say:** When the 10 planned sessions completed, the system flagged the report as due - the therapist did not have to remember anything. The report is auto-drafted and read-only pending the supervisor.
**Time:** ~2 s

## Scene 10 — Generated report + safeguard (Therapist)
**Actor:** Riya · **Screen:** Progress reports (draft)
**Click path:** same screen, scroll to the amber notice
**Say:** The smart digest, outcome profile and recommendations are generated from session data. Critically: the amber safeguard - "This is an automatically generated draft based on recorded session data. The therapist and supervisor must verify and approve all clinical conclusions." AI assists, clinicians decide.
**Time:** ~1 s

## Scene 11 — LIVE: Supervisor evaluates (Supervisor)
**Actor:** Dr. Ananya · **Screen:** Report evaluations
**Click path:** "Report evaluations" → SLP-2026-001 → fill feedback → rating 5/5 → outcome "Continue Therapy" → "Submit evaluation"
**Say:** **LIVE ACTION.** The supervisor reads the digest, checks the sessions, rates the work 5/5 and sets the outcome - here, Continue Therapy. The state machine fires: report → Evaluated, case → stays Active, timeline gains the event, Riya is notified.
**Time:** ~4 s

## Scene 12 — Outcome & notification loop
**Actor:** any · **Screen:** API + Riya's bell
**Click path:** log in as riya → bell shows 1 unread → dropdown: "Your report was evaluated: Continue Therapy"
**Say:** The loop closes itself: evaluation stored, case continues, therapist notified - nothing lost in email threads. If the outcome had been Close Case, the case would go read-only and leave every workspace.
**Time:** ~6 s

---

## Rehearsal notes
- All 40 automated checks pass; screenshots per scene in `C:\Users\Asus\AppData\Local\Temp\opencode\sih\shots\`.
- **Known story gap (flag for the pitch, not a blocker):** the story's "session notes awaiting co-signature" beat plays as the supervisor auditing sessions + feedback inside the evaluation flow (scene 7) and via the timeline, not a separate supervisor session-review screen. One sentence covers it in the narration.
- DB reset command (run before the demo): stop backend, delete `vanicare.db`, start `run.py` — or just ask the assistant.
