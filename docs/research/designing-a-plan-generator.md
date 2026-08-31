# Designing a Deterministic, Science-Based Running Training Plan Generator

## TL;DR
- **A deterministic generator is not only feasible but arguably preferable to an LLM for this use case**: convert a recent race/time-trial into a fitness index (Jack Daniels' VDOT via the Daniels-Gilbert equations, or Riegel's power law), derive training paces as fixed percentages of that index, then place predefined workout types onto days using periodization rules (base → build → peak → taper), an 80/20 easy/hard intensity split, hard/easy day sequencing, a ~10% weekly volume progression cap with cutback weeks, and an acute:chronic workload ratio (ACWR) guardrail. Every one of these decisions is a named, citable rule — which is exactly what makes the plan explainable.
- **The core computed intermediate values** are: VDOT (or equivalent fitness index) → per-zone training paces → weekly volume target curve → per-week workout allocation → per-day placement → ACWR/long-run-spike safety checks. Store the rule that fired at each step so the UI can surface "why" for every week and workout.
- **Reference material already exists** to adapt: open-source VDOT implementations and plan generators on GitHub (FastAsYouCan, time-to-run, mekeetsa/vdot), the published Daniels-Gilbert equations, established plan structures (Pfitzinger/Douglas, Hansons, Daniels, Higdon, Furman FIRST), and transparency design patterns borrowed from explainable-AI robo-advisors (layered explanations, "reveal the inputs, logic and outputs," trust calibration over blind trust).

## Key Findings

1. **Fitness quantification is a solved, formula-based problem.** A recent all-out race or time trial is the single most important input. Jack Daniels' VDOT converts it to a fitness index via two published Daniels-Gilbert (1979 *Oxygen Power*) equations, and training paces are then fixed percentages of that index. Riegel's 1977 power law (T₂ = T₁ × (D₂/D₁)^1.06) offers a simpler race-equivalence predictor. McMillan uses the Riegel exponent plus his own zone methodology. All are deterministic and implementable in a few lines of code.

2. **Multiple mature methodologies give you ready-made plan skeletons.** Daniels (VDOT/phases), Pfitzinger & Douglas (*Advanced Marathoning*, medium-long runs, 4 mesocycles), Hansons (cumulative fatigue, 16-mile long-run cap), 80/20 / polarized (Fitzgerald, Seiler), and Furman FIRST (3 quality runs + 2 cross-training) each specify phases, workout types, progression, and taper you can encode directly.

3. **Existing apps split into two camps** — transparent/rule-based (The Running Genie, Garmin's named-coach plans, Runna's structured settings) vs. opaque neural-net (TrainAsONE). For an explainable product, the rule-based camp is the model to emulate.

4. **Safety guardrails are quantified**: ~10% weekly volume cap (with important caveats), 80/20 intensity split, hard/easy alternation (≤2 hard sessions/week), cutback weeks every 3–4 weeks, ACWR "sweet spot" 0.8–1.3 with a "danger zone" above 1.5 (Gabbett 2016), and a 2–3 week taper cutting volume 41–60% while holding intensity (Bosquet et al. 2007).

5. **Explainability is a design discipline with transferable patterns** from robo-advisory XAI: reveal inputs/logic/outputs, give layered ("progressive disclosure") explanations, and calibrate trust rather than maximize it.

## Details

### 1. Inputs needed to scientifically personalize a plan

**Fitness / performance (most important):**
- **Recent race result or time trial** (distance + time). This is the primary input to every pace system. Daniels' VDOT is "most accurate for race performances between approximately 1.5 km and 50 km on relatively flat courses." Best accuracy comes from a race lasting 8–30 minutes (5K/10K). If no race exists, a time trial or (in beginner apps) self-reported ability level + recent activity is substituted — this is exactly how Runna and Garmin Coach bootstrap fitness for beginners.
- **Current weekly mileage and current longest run** — sets the starting volume so week 1 is appropriate. Runna explicitly asks ability level then uses it "to set a starting point for your current weekly mileage and current longest run." Pfitzinger requires a runner already log 25–70 mi/wk before starting his plans, and to have completed a long run equal to week 1's longest within the last month.

**Goal:**
- **Goal race distance, target time, and race date** — define the horizon, the phase lengths, and the goal paces. Multiple races with priority weighting is an advanced feature (TrainAsONE supports this).

**Personal / constraint inputs:**
- **Age** (for max-HR estimation, e.g., 220−age, and recovery scaling), **sex** (Riegel exponent differs: b = 1.055 men, 1.080 women in some formulations; also affects taper response, where female recreational runners showed greater finish-time benefit per Smyth 2021), **training history / experience level** (beginner/intermediate/advanced gates plan aggressiveness), **available training days per week** and which days (drives workout placement), **injury history and current injuries** (gates intensity, triggers return-to-run logic), and optionally **HR/HRV/sleep** data if a wearable is connected.

**Established intake fields observed in real systems:** Garmin Coach asks current weekly miles, average pace, time-goal-vs-finish, and coach choice; Runna asks distance/race date, ability level, recent finish times, training days, training volume preference (Progressive/Balanced/Comfortable), and strength-training preferences.

### 2. Established, science-based methodologies to build on

**Jack Daniels' Running Formula (VDOT).** The backbone for pace prescription. Two Daniels-Gilbert (1979) equations:
- Oxygen cost: **VO₂ = −4.60 + 0.182258·v + 0.000104·v²** (v = velocity in m/min)
- Sustainable fraction: **%VO₂max = 0.8 + 0.1894393·e^(−0.012778·t) + 0.2989558·e^(−0.1932605·t)** (t = race duration in minutes)
- **VDOT = VO₂ / %VO₂max**

Training zones as % of VDOT (from *Daniels' Running Formula*, 3rd ed., 2014): **Easy (E) 59–74%, Marathon (M) 75–84%, Threshold (T) 83–88%, Interval (I) 95–100%, Repetition (R) ~105–120%**. To get a pace, target VO₂ = VDOT × zone%, then invert the quadratic: v = (−0.182258 + √(0.182258² + 4×0.000104×(4.60 + VO₂))) / (2×0.000104), pace/km = 1000/v. Daniels' volume distribution: ~70–80% easy, 10–15% M+T, 10–15% I+R; and caution caps like keeping I-pace under ~8% of weekly mileage.

**Pfitzinger & Douglas (*Advanced Marathoning*).** 18-week (or compressed 12-week) plans in four mesocycles: (1) Endurance, (2) Lactate Threshold + Endurance, (3) Race Preparation (VO₂max, tune-up races), (4) Taper. Signature "medium-long run" mid-week (11–15 mi) gives a second endurance stimulus. Zones built on Heart Rate Reserve (Karvonen). Tiers 55/70/85/105 mpw. Progressive overload with recovery weeks.

**Hansons Marathon Method.** Cumulative-fatigue philosophy: three weekly "SOS" (Something of Substance) workouts — speed/strength, tempo at goal marathon pace, and a long run capped at 16 miles (rationale: long run ≤25–30% of weekly volume per Daniels; caps glycogen depletion under ~3 h). Six days/week. Good template for time-limited runners who can't do 20-milers.

**80/20 / Polarized (Fitzgerald; Seiler).** ~80% of training volume/time at low intensity (below ventilatory threshold), ~20% at moderate-high. Backed by Seiler's observations of elite endurance athletes and studies (Esteve-Lanao 2007; Muñoz 2014). This is an intensity-distribution rule that layers on top of any periodization structure. Note Runna's honest caveat: for runners training only 2–3×/week, a strict 80/20 becomes impractical and a ~60/40 split is more realistic.

**McMillan Running.** Uses the Riegel exponent (1.06) plus McMillan's own zone methodology to give equivalent race times and "optimal training pace ranges" for each workout type. Offers "Endurance Monster" vs "Speedster" vs "Combo" plan variants — a simple, encodable way to tilt a plan toward a runner's strength.

**Periodization models to encode:**
- **Linear** (Matveyev): high volume/low intensity → low volume/high intensity over the cycle. Simplest; best for beginners.
- **Block**: sequential 2–4 week blocks each targeting one quality (e.g., aerobic capacity → threshold → race-specific). Issurin's reviews favor block for advanced athletes.
- **Undulating (DUP/WUP)**: vary intensity/volume within the week — this is effectively what a weekly running schedule with hard/easy alternation already is.
- These are not mutually exclusive; a practical running plan is typically "linear macro-structure + undulating micro-structure + polarized intensity."

**Garmin / Firstbeat load model** (for adaptive extensions): EPOC-based training load; **acute load = last 7 days, chronic load = ~28 days**; Training Status blends VO₂max trend with the acute:chronic balance; **load ratio > ~1.5 flags elevated injury risk.** Firstbeat also drives Training Readiness (sleep, HRV, recovery, acute load).

**ACWR injury model.** Acute:chronic workload ratio = (recent ~7-day load) / (chronic ~28-day average load). Per Tim Gabbett's "training–injury prevention paradox" (*Br J Sports Med* 2016;50(5):273–280), the injury-minimizing "sweet spot" lies in the **0.8–1.3** range while the "danger zone" is a ratio **over 1.5**, associated with roughly 2–4× injury risk in the following week. EWMA (exponentially weighted moving average) is more sensitive than simple rolling averages at high ratios. **Important caveat:** ACWR has attracted methodological criticism, and a large cohort study — Frandsen et al., "How much running is too much? Identifying high-risk running sessions in a 5200-person cohort study" (*Br J Sports Med* 2025;59(17):e109380; 5,205 runners from 87 countries, 588,071 sessions over 18 months, 1,820 [35%] injured) — found that **single-session distance spikes** relative to the longest run in the prior 30 days were predictive while week-to-week ratio was not: a >10–30% spike carried a hazard rate ratio of **1.64** (95% CI 1.31–2.05), >30–100% HRR 1.52 (1.16–2.00), and >100% HRR 2.28 (1.50–3.48). Treat ACWR as one guardrail, not gospel, and specifically cap single long-run jumps.

### 3. How existing tools structure rule-based generation

- **The Running Genie** — explicitly "transparent, established methodology: adaptive Jack Daniels' VDOT pacing combined with 80/20 polarised intensity distribution," recalculating VDOT from synced runs. "The plans are built from named principles you can read about." This is the closest public model to what the user wants.
- **Garmin Coach** — pick race distance + goal + coach (McMillan/Galloway/Parkerson-Mitchell); populates a periodized calendar (base/build/peak/taper), pace-based workouts, a "confidence score," and (per Garmin Wiki) "explanations of why each workout was suggested." Adaptive Garmin Run Coach adds VO₂max/lactate-threshold/load inputs. Notably criticized for pace-only targets (poor on hills) and (historically) no full marathon plan.
- **Runna** — algorithm-driven with optional human coach input. Onboarding: distance/race date, ability, recent times, training days, and Training Preferences (Progressive/Balanced/Comfortable volume; number and intensity of hard runs; long-run structure). Adds strength, yoga, deload weeks. Explains principles via in-app articles (e.g., its 80/20 explainer).
- **TrainAsONE** — the opaque counterexample: a neural net trained on "over 100 million kilometres," "minimum effective dose," daily rebuild on missed/extra runs. Powerful but "you can't read a book that explains" it — the wrong model for a transparency-first product.
- **Open-source GitHub projects to adapt:**
  - **karalyndewalt/FastAsYouCan** — VDOT-based 18-week marathon generator (Python/Flask). Clean OOD data model: **segment** (intensity as %VDOT + duration as time/distance/%-of-week) → **workout** (a day) → **week** (total distance = % of user max) → cycle. User sets days/week; explicit key workouts placed, remaining running days auto-generated ("any days remaining from a weekly total of seven will return as 'rest days'"), leftover days = rest. Directly mirrors the architecture the user should build.
  - **hoovercj/time-to-run** — TypeScript/React (inspired by defy.org's "Calendar Hack"); encodes Pfitzinger's *Advanced Marathoning*, *Faster Road Racing*, Hansons, and Higdon plans verbatim and maps them backward from race date onto a calendar; exports iCal/JSON/CSV. Model = ordered list of unit-aware workouts organized into weeks, anchored to race day. Great for a "load a proven template then personalize" approach. (Its README stresses the plans "should be used in combination with the books" — respect the authors' IP.)
  - **Isss11/Running-Plan-Generator** — full-stack (Spring Boot + React) that generates a plan from goal + skill level, rendering a schedule table plus a Chart.js mileage-progression graph.
  - **sbailliez/training-plan** — encodes the Furman FIRST (Run Less Run Faster) 3-key-run plans; exports TCX for Garmin.
  - **mekeetsa/vdot** — reference implementation of the Daniels-Gilbert VDOT equations.
  - **tommyod/streprogen** — Python strength-program generator; useful pattern for the strength-training component and for "sensible defaults + warnings on unreasonable inputs."

### 4. Making the output explainable in the UI

Robo-advisory explainable-AI research is the most directly transferable domain (both give a lay user an algorithmic prescription about a high-stakes personal goal). Key findings to apply:
- **Reveal inputs, logic, and outputs.** Algorithm transparency = "revealing the inputs, logic and outputs of an algorithm"; decision auditability = being able to "trace the steps leading to a decision and challenge them." Your rule engine should log the fired rule at each step precisely so this is possible.
- **Layered / progressive disclosure.** "Provide layered explanations for decisions" without "overwhelming people with technical details." Surface a one-line "why" per workout, expandable to the underlying principle and citation.
- **Calibrate trust, don't maximize it.** The FinTech XAI literature stresses explanations should support "trust calibration rather than merely increasing trust or adoption" — i.e., also communicate uncertainty (e.g., "race predictions are typically within 1–3% when your input race is recent and honest"; Riegel underestimates marathons).
- **Segment your explanations.** A discrete-choice study found "selective high-expertise investors" prioritize personalization/control while "receptive general consumers respond strongly to enhanced explainability" — so let advanced users drill into VDOT math while giving beginners plain-language rationales.
- **Distinguish interpretability (for you/debugging) from explainability (for the user).**

**Concrete phrasing patterns for a running app:**
- "Today is easy because yesterday was your hard interval session — alternating hard and easy days is how your body absorbs training (the hard/easy principle)."
- "Your long run is capped at ~13 mi this week because that's ~30% of your weekly volume; going beyond that sharply raises injury risk without proportional benefit (Daniels' long-run guideline)."
- "We increased your mileage only ~8% from last week to stay within a safe progression range."
- "80% of your runs this week are easy — this polarized 80/20 split builds aerobic fitness while limiting injury risk (Seiler; Fitzgerald)."
- "Your taper starts 2 weeks out: we cut volume ~50% but keep the intensity, which research shows produces the best race-day performance (Bosquet et al. 2007 meta-analysis, which found a 2-week taper reducing volume 41–60% without altering intensity/frequency yielded ~2.2% average performance improvement)."

### 5. Concrete build guidance (rules engine / decision-tree / formula system)

**Input schema (sketch):**
```
UserProfile {
  age, sex,
  experienceLevel: enum(beginner, intermediate, advanced),
  recentRace: { distanceMeters, timeSeconds } | timeTrial | null,
  currentWeeklyVolume (km/mi), currentLongestRun,
  goalRace: { distance, targetTime?, date },
  availableDays: [Mon..Sun], maxDaysPerWeek,
  longRunDayPreference,
  injuries: [{ type, status: active|recovering|historical, severity }],
  strengthTrainingOptIn, wearableConnected
}
```

**Core computed intermediate values (compute in this order):**
1. **Fitness index** — VDOT from `recentRace` via Daniels-Gilbert; if none, infer from experience/activity (Runna-style). Also compute Riegel-equivalent times for cross-checking and race-time prediction.
2. **Training paces** — E/M/T/I/R by inverting the VO₂ quadratic at each zone %. (Use `mekeetsa/vdot` as reference.) Optionally overlay HR zones.
3. **Feasibility check** — compare goal pace (from target time) to current VDOT; flag over-ambitious goals ("this needs a 7% improvement — possible but everything must go right," McMillan-style).
4. **Plan length & phase map** — from race date to today; allocate base/build/peak/taper. If horizon is long (up to the 12-month case), insert repeating mesocycles / a base-maintenance loop and multiple tune-up races rather than one giant linear ramp.
5. **Weekly volume curve** — start at current volume; ramp ≤~10%/week (allow more for low-mileage beginners, per the evidence that the 10% rule is soft); insert a cutback (−20–30%) every 3–4 weeks; peak, then taper.
6. **Per-week workout allocation** — decide counts of each type from experience + days available + phase + 80/20 (or 60/40 for ≤3 days). Typically ≤2 hard sessions/week for most runners.
7. **Per-day placement** — put hard sessions on non-consecutive days, long run on preferred day (usually weekend), recovery/easy the day after hard/long, rest on remaining days. This is the FastAsYouCan "explicit key workouts, auto-fill the rest, remainder = rest" pattern.
8. **Safety post-checks** — verify week-over-week volume delta, ACWR (if history exists) stays 0.8–1.3, and no single long-run jump >10% over the 30-day longest; if violated, re-solve.
9. **Explanation trace** — attach the fired rule + citation to each week and workout.

**Key numeric rules to encode:**
- Volume progression: ≤~10%/week baseline; cutback every 3–4 weeks (−20–30%).
- Long run: ≤~25–30% of weekly volume (Daniels); cap absolute length by distance/method (Hansons caps at 16 mi).
- Single-run spike guard: avoid >10% over prior-30-day longest run (Frandsen 2025: >10–30% spike ≈ 1.64× overuse-injury hazard).
- Intensity distribution: 80/20 (≥4 days) or ~60/40 (2–3 days).
- Hard/easy: never two hard days back-to-back; ≤2 (occasionally 3, à la Hansons) SOS sessions/week; easy the day after long.
- Taper: 2 weeks (5K–half) to 3 weeks (marathon); cut volume 41–60%, hold intensity/frequency; last long run ~3 weeks out.
- Strength: **2–3 sessions/week** (Blagrove et al. 2018, *Sports Medicine* 48(5):1117–1149 — "The addition of two to three ST sessions per week … are likely to provide benefits," improving running economy 2–8% with VO₂max and body composition largely unchanged); reduce/stop ~10–14 days before race.
- Return-to-run (active injury): walk/run intervals (e.g., 2 min run / 1 min walk × 5) on non-consecutive days; start at 25–50% of pre-injury volume, +10–15%/week; "traffic-light" pain rule — green (0–2/10) continue, yellow (3–4/10) hold load, red (5+/10) stop; readiness gates like 30-min pain-free walking and ≥80% strength symmetry before starting.

**Reference implementations/libraries to adapt:** `mekeetsa/vdot` (VDOT math), `karalyndewalt/FastAsYouCan` (VDOT-plan OOD architecture), `hoovercj/time-to-run` (encoded expert plans + calendar/ICS export), `sbailliez/training-plan` (Furman FIRST + TCX export), `Isss11/Running-Plan-Generator` (full-stack schedule + chart), `tommyod/streprogen` (strength generator + defaults/warnings pattern).

## Recommendations

**Stage 1 — MVP (weeks 1–4 of dev):** Implement the VDOT pipeline (race → VDOT → E/M/T/I/R paces) using `mekeetsa/vdot` as a checked reference; add Riegel as a cross-check and race predictor. Encode one methodology end-to-end — recommend **Daniels + 80/20** for 5K/10K/half — with linear macro-periodization, hard/easy placement, ≤10% ramp, cutback weeks, and a distance-based taper. Ship the explanation trace from day one (it's far cheaper to build in than bolt on). Benchmark: for a given race input, your paces should match published Daniels tables within ~1–2 s/km and your plan should pass all safety post-checks.

**Stage 2 — Personalization & breadth:** Add experience tiers, days-available-driven allocation, marathon support (add medium-long runs à la Pfitzinger; offer a Hansons-style option for time-limited runners), strength training (2–3×/wk), and McMillan-style "Speedster/Endurance/Combo" tilt. Add the feasibility/goal-realism check.

**Stage 3 — Long-horizon & safety depth:** Support the 12-month horizon via repeating mesocycles + tune-up races + base-maintenance loops rather than one ramp. Add injury handling: a return-to-run module (walk/run progression, non-consecutive days, traffic-light pain rule, start at 25–50% of pre-injury volume, +10–15%/week) and, if a wearable is connected, an ACWR/load guardrail (flag ratio >1.5; cap single-run spikes >10%).

**Stage 4 — Adaptivity (optional):** Recompute VDOT from completed runs and re-solve future weeks (Running-Genie style) — still fully deterministic. Only consider ML if you have large outcome data; keep the rule engine as the auditable default.

**Thresholds that should change your approach:** if a user trains ≤3 days/week, switch from 80/20 to ~60/40 and drop medium-long runs; if goal requires >7% VDOT improvement in the time available, warn and offer a later date or easier goal; if injury is active, route to the return-to-run module before any goal plan; if ACWR >1.5 or a long-run jump >10%, force a re-solve.

## Caveats
- **The "10% rule" is soft, not law.** Studies (Buist 2008; Nielsen group) found little injury-prevention benefit from a strict 10% weekly cap, and well-trained runners tolerate ~20–25%. Use it as a sensible default guardrail, disclose it as such, and specifically guard single-run spikes.
- **ACWR is contested.** Methodological critiques and the Frandsen et al. 2025 runner study (which found *no* relationship for week-to-week ratio but a clear one for single-session spikes) weaken it as a sole predictor. Treat it as one signal among several, and prefer EWMA over rolling averages if you implement it.
- **Race predictors have known error.** Per Vickers & Vertosick, "An empirical study of race times in recreational endurance runners" (*BMC Sports Science, Medicine and Rehabilitation* 2016;8:26; 2,303 recreational runners), Riegel was "well-calibrated for races up to a half marathon, but dramatically underestimated marathon time, giving times at least 10 minutes too fast for half of runners" (validation MSE 208 vs Riegel 381). Daniels/McMillan/Riegel can also disagree by minutes for the same input. Always show equivalent-time estimates with an uncertainty band. (Note: the separate large-scale 158,000-runner dataset in the literature is the Smyth 2021 marathon-taper study, not a Riegel-validation study — don't conflate them.)
- **VDOT assumes an honest, recent, flat-course maximal effort** and treats running economy as a single regression (real economy varies 15–20% between runners). Speed- vs endurance-biased runners deviate; that's why McMillan offers Speedster/Endurance variants.
- **Some cited sources are secondary** (calculator sites, coaching blogs) rather than primary literature; the underlying equations (Daniels-Gilbert 1979), meta-analyses (Bosquet et al. 2007 taper; Blagrove et al. 2018 strength; Gabbett 2016 ACWR), and named books are the authoritative anchors and should be cited directly in-product.
- **Marketing vs. mechanism.** App descriptions (TrainAsONE's "100 million km," "patented algorithm") are promotional; treat performance claims skeptically and don't replicate opaque black-box framing in a transparency-first product.
- This report covers algorithm/plan design, not medical safety; a real product needs a medical disclaimer and, ideally, professional review of the injury logic. The return-to-run pain thresholds in particular vary by injury type (bone stress injuries often demand 0/10) and should be reviewed by a clinician.