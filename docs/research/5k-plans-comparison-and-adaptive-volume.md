# 5K training plan landscape, and why volume targets should be tested, not assumed

## TL;DR
- Across essentially every credible 5K plan, the same skeleton recurs:
  ~80% easy running plus 2 (rarely 3) quality sessions/week (VO2max
  intervals + threshold/tempo work), one long run for endurance, and a
  7-14 day taper; typical plan length is 6-12 weeks.
- For a sub-20 5K goal, the binding constraint for a low-mileage runner is
  usually volume, not intensity: published sub-20 plans (Runner's World
  DE, runnerspoint.de, Marathon Handbook, runningfastr, Jonny Mellor/
  TrainingPeaks) assume 30-50 km/week and 4-5 runs, well above a 10 km/
  week starting point.
- **There is no formula that outputs "your" correct weekly volume.** The
  only robust finding in the literature is a correlation (Vickers &
  Vertosick 2016: more weekly mileage tracks with faster race times
  across 2,300+ recreational runners), not a target number — the
  volume-to-benefit curve flattens at a point that varies by runner and
  can't be predicted in advance. The practically useful instrument is
  therefore *periodic re-testing* (a time trial every 4-6 weeks) to check
  whether the last volume increase actually moved the needle, not a fixed
  km/week target baked into the plan from day one. This is the rationale
  behind `volume.target_cap` in `packages/plan-engine` becoming
  feasibility-gated rather than a flat lookup (see
  [ADR-0009](../decisions/0009-plan-engine-package.md) and
  `packages/plan-engine/src/rules/volume.ts`).

## Key Findings

### A. Three types of 5K plans

1. **Beginner/finisher plans** (Couch to 5K, NHS, Galloway, Nike Run Club,
   adidas Running) — walk/run intervals, 3 sessions/week, 8-15 weeks,
   goal is "finish running."
2. **Time-goal plans** (Runner's World DE Sub-25/22:30/20, Hal Higdon
   Intermediate/Advanced, runnerspoint.de, Marathon Handbook,
   runningfastr, McMillan/Garmin, Jack Daniels/VDOT) — structured
   intervals, tempo runs, 4-6 sessions, 8-12 weeks.
3. **Elite/methodology frameworks** (Jack Daniels VDOT, Norwegian double
   threshold) — a principles scaffold rather than a ready-made weekly
   schedule.

### B. The shared build pattern

Nearly every time-goal plan combines, per week: 1x VO2max intervals
(short reps, e.g. 400-1000 m), 1x threshold/tempo run, 1 easy long run,
1-3 easy/recovery runs, 1-2 rest days — i.e. the polarized/pyramidal
intensity distribution the sports-science literature independently
favors (Seiler; see `docs/research/onboarding-und-trainingsmethodik.md`).

### C. Volume beats intensity as the limiting factor at recreational level

The most commonly documented mistake is running "easy" days too fast
(grey-zone training) combined with too little total volume. Sub-20 for
5K corresponds to roughly VO2max 52-54 ml/kg/min and holding 4:00 min/km
throughout the distance.

## Details

### D1. Program survey

**Beginner/finisher:**
- *Couch to 5K (Josh Clark/NHS)* — 9 weeks, 3 runs/week, walk/run
  intervals from 60s run/90s walk to 30 min continuous. No quality work.
- *Jeff Galloway Run-Walk-Run* — 15 weeks (also a 4-week variant), 3
  days/week, planned walk breaks from the start, "Magic Mile" pace tests.
- *Nike Run Club 5K* — 8 weeks (flexible from 4), 3 core runs (speed,
  recovery, long); speed runs already use 5K/10K/mile-pace intervals
  (e.g. 8x1:00 at 5K pace/1:00 recovery).
- *adidas Running (Runtastic)* — 5-16 weeks, adaptive; interval runs
  (5x1min on/off, 4x1km), progressive tempo runs, recovery runs, strength.
- *Garmin Coach (Galloway/McMillan/Parkerson-Mitchell)* — 6-26 weeks,
  adaptive. McMillan's time-goal 5K: 4 runs/week (easy, hill repeats,
  speed repeats, goal-pace repeats, strides, steady state, time trial),
  longest run ~70 min two weeks out, 1-week taper.

**Time-goal:**
- *Hal Higdon Intermediate 5K* — 8 weeks, ~5-6 days/week. Weekly shape:
  intervals (5x400 -> 8x400 at mile pace) OR a tempo run (30 -> 40 min),
  plus easy runs and a long run building to 5-7 mi.
- *Runner's World DE Sub-25/22:30/20 series* — four stacked 8-week plans;
  the Sub-20 tier explicitly requires already running sub-22 and holding
  4:00/km over the distance.
- *runnerspoint.de Sub-20 (8 weeks)* — entry requirement ~21:30 5K and
  8+ weeks at 30 km/week already; 4-5 runs, 30-45 km/week, RPE-steered;
  1 quality session + 2 easy runs + 1 long run (45-60 min); progression
  from 6x400 to 3x1km over the cycle, explicit taper and race week. Cites
  WHO, tapering (PLoS One 2023), and training-intensity-distribution
  literature directly.
- *Marathon Handbook "Run 5K in 20 Minutes" (Cathal Logue)* — a menu of
  7 building blocks (3K-pace intervals, 1500-pace intervals, tempo at
  4:20/km, hills, long run 10-16 km) rather than a dated calendar;
  readiness assumed after ~6 weeks of quality work.
- *runningfastr Sub-20* — cyclical 3-build+1-recovery weeks; entry
  requirement a sub-6:25 mile and/or sub-22 5K PB; ~5 running days.
- *Jonny Mellor/TrainingPeaks Sub-20* — assumes 25-30 mi/week and up to
  8-mile runs already in place before starting.

**Methodology frameworks:**
- *Jack Daniels VDOT* — %VDOT training zones (Easy 59-74%, Marathon
  75-84%, Threshold ~88%, Interval 95-100%, Repetition >100%); ~70-80%
  of volume easy; interval volume capped under ~8% of weekly mileage;
  re-test every 4-6 weeks.
- *Norwegian double threshold (Marius Bakken/Ingebrigtsen)* — elite
  method, 110-120+ mi/week with six quality sessions including two
  same-day threshold sessions; explicitly not recommended for amateurs
  at 30-60 km/week, who should build volume first.

### D2. Cross-plan patterns confirmed by the literature

- **Polarized/80-20 intensity distribution** — most volume easy, a small
  hard fraction, minimal "grey zone." Muñoz, Seiler et al. (*Int J Sports
  Physiol Perform* 2014;9(2):265-272; 30 recreational runners, 10 weeks):
  a polarized group (77/3/20) improved 10K time more than a
  threshold-heavy group (46/35/19) — 5.0% vs. 3.5%. A 16-week study
  (*Scand J Med Sci Sports* 2022) found a pyramidal-to-polarized shift
  produced the largest 5K gain (~1.5%). Festa et al. (*Front Sports Act
  Living* 2020;1:70; 38 recreational runners, 8 weeks) found a smaller,
  non-significant difference between polarized and a "focused" 40/50/10
  split — the superiority of strict polarization over pyramidal isn't
  uniform across studies.
- **VO2max intervals** — short reps (400 m-1 km, 3-5 min) are the
  backbone of nearly every sub-25/22/20 week; "time above 90% VO2max" is
  the key stimulus, and long intervals reach a higher %VO2max than short
  ones (Seiler & Sjursen 2004).
- **Threshold/tempo work** — 20-40 min at ~88% VDOT in essentially every
  time-goal plan; improves lactate threshold, secondary to VO2max for 5K
  specifically.
- **Long run** — retained even for 5K (Higdon up to 7 mi, runnerspoint
  45-60 min, Marathon Handbook 60-90 min) for aerobic base and fatigue
  resistance.
- **Periodization** — base -> specific quality work -> taper, explicit in
  runnerspoint and Higdon.
- **Time to measurable improvement** — plans typically run 6-12 weeks;
  VO2max/3K studies show measurable gains in 6-10 weeks; reaching sub-20
  from a higher starting deficit can take months to years.
- **Common failure modes** — easy days run too fast; too little total
  volume; volume/single-run jumps too large; too many hard days in a
  row. The Garmin RUNSAFE/Frandsen cohort (*BJSM* 2025; 5,205 runners,
  87 countries, 588,071 sessions, 35% injured — see also
  `docs/research/progression-und-verletzungspraevention.md` §A1) found a
  single run exceeding the 30-day longest run by 10-30% raises overuse
  injury hazard by 64%, 30-100% by 52%, and >100% by 128% — while
  week-level volume metrics (including ACWR) barely predicted injury at
  all. This is already the app's core safety rule (Spec 5, AC 4;
  `longrun.spike_ceiling`/`check.spike_ceiling` in `packages/plan-engine`)
  and is unaffected by the change described below.

## Why there's no formula for "how much volume is enough"

The only well-replicated quantitative relationship is a correlation, not
a target-setting formula: Vickers & Vertosick (2016, *BMC Sports Science,
Medicine and Rehabilitation* 8:26) analyzed 2,300+ recreational runners
and found weekly volume tracks with faster race times from 5K to
marathon. That's not the same as "runner X needs Y km/week for goal Z" —
the curve has diminishing returns and the point where extra volume stops
paying off is individual and can't be predicted from a lookup table.
Daniels' own volume guidance is likewise indirect: it caps *hard*
volume (interval work at ~8% of the week) rather than setting a target
for total volume.

The practically useful "cap" comes from the injury side, not the
performance side: the RUNSAFE finding above says the real risk driver is
a single session's spike relative to the recent longest run, not weekly
volume as such — which argues for a *progression rule* (small steps,
regular deloads, no big single jumps — already
`volume.build_step`/`volume.deload_3_1`/`longrun.spike_ceiling`) rather
than a fixed ceiling number.

**The instrument that actually answers "is more volume worth it" is
repeated field testing, not a formula:** run a 5K time trial (or
equivalent) every 4-6 weeks, compare it to the previous one, and use the
trend as the decision signal — this is standard practice across the
methodology-driven plans above (Daniels: re-test every 4-6 weeks;
runnerspoint: explicit test weeks built into the cycle) and is already
`alloc.time_trial_cadence` in `packages/plan-engine` (a time trial
replaces the long-run slot in every deload week). What was previously
missing is connecting that test's *result* back into the volume target
itself: `volume.target_cap` used to always climb toward a fixed
by-distance heuristic (45 km/week for a 5K) regardless of how a runner
was actually testing. It now checks the feasibility verdict computed
from the most recent time trial (Spec 5's full-replan mechanism already
recomputes this on every new result) and holds the target at current
volume once that verdict is "realistic" from a real (not baseline-
estimated) test — instead of forcing further build-up toward a generic
number a runner may not need. If a later re-test shows the goal has
drifted out of reach again (e.g. progress stalled, or the race date
approaching without enough improvement), the cap climbs back toward the
heuristic automatically, because feasibility is recomputed from scratch
on every replan rather than cached.

For the user's concrete case (currently ~4:45/km average, PB 4:19/km,
10 km/week, goal sub-20 = 4:00/km): this means the plan will still start
by building volume (10 km/week is a clear constraint at any target), but
it will stop short of forcing the full 40-45 km/week climb if a time
trial partway through already shows sub-20 on track at, say, 25-30
km/week — rather than assuming 40 km/week is required just because that's
where comparable published plans top out.

## Recommendations

1. Keep building volume in the base phase (10 km/week is limiting
   regardless of target) but let a real time trial's feasibility verdict
   cap further build-up early, rather than defaulting to the 40-45
   km/week figure most published sub-20 plans use.
2. Re-test every 4-6 weeks (already the deload-week time trial cadence)
   and treat two consecutive tests with no improvement despite a volume
   increase as the practical signal that the last increase wasn't worth
   it — a plateau-across-cycles check that needs a second historical data
   point (not yet in `packages/plan-engine`'s stateless input) and is
   flagged as a natural next step rather than implemented here.
3. Use intermediate goals (sub-22:30, then sub-21) rather than judging
   volume decisions purely against the final sub-20 target, matching how
   `Milestone` interpolation already works (Spec 2).
4. Continue treating the RUNSAFE single-session spike ceiling as the
   primary safety rule regardless of the target-volume question — the two
   are independent (this doc's volume-target change doesn't touch
   `longrun.spike_ceiling`).

## Caveats
- Many detailed weekly plans (Runner's World DE, adidas, McMillan,
  Higdon's full version) are paid/app-gated; only structure and early
  weeks are publicly documented.
- App-driven plans (Nike, adidas, Garmin, Strava/Runna) are adaptive —
  their exact weekly structure varies by input and isn't fixed.
- VDOT for a 20:00 5K varies by calculator (49-54); it's an "effective
  VO2max," not a lab value.
- Evidence for polarized over pyramidal intensity distribution isn't
  uniform (Festa: no significant difference; Muñoz/Seiler: a clear one) —
  treat "polarized is best" as a strong default, not a settled fact.
- The plateau-detection idea in Recommendation 2 is a natural extension
  of this change, not something `packages/plan-engine` implements yet —
  it would need the app layer to pass a prior time-trial result (e.g.
  derived from a previous completed `timeTrial` `PlannedSession`'s linked
  `Activity`) alongside `recentTimeTrial`, which is a data-flow change,
  not a plan-engine schema change.
