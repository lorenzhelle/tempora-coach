// RuleId -> user-facing copy + citation. Rule text and sources live here,
// never inline in a system prompt — that's what lets the coaching agent's
// explanation stay tied to the computation that actually ran, instead of
// drifting into an invented rationale. The UI renders `plain` under an
// info icon and `technical` + `source` on expand (progressive disclosure,
// per docs/research/designing-a-plan-generator.md §4).

import { RULE_SOURCES } from "../constants";
import type { RuleId } from "../types";

export type CatalogEntry = {
  title: string;
  /** One plain-language sentence for the always-visible info icon. */
  plain: string;
  /** A fuller, technical explanation for the expanded view. */
  technical: string;
  source: string;
};

export const RULE_CATALOG: Record<RuleId, CatalogEntry> = {
  "fitness.vdot_from_result": {
    title: "Fitness index from your result",
    plain:
      "We turned your race or time-trial result into a single fitness number (VDOT) that all your training paces are based on.",
    technical:
      "VDOT is computed from the Daniels-Gilbert (1979) oxygen-cost equation and %VO2max-sustainable-for-duration equation, applied to the most recent qualifying result (a time trial or personal best).",
    source: RULE_SOURCES["fitness.vdot_from_result"],
  },
  "paces.daniels_zones": {
    title: "Training paces per zone",
    plain:
      "Your easy, marathon, threshold, interval, and repetition paces are set as fixed percentages of your fitness index.",
    technical:
      "Each zone's pace is derived by inverting the Daniels-Gilbert VO2 equation at the zone's %VDOT band midpoint (Easy 59-74%, Marathon 75-84%, Threshold 83-88%, Interval 95-100%, Repetition 105-120%).",
    source: RULE_SOURCES["paces.daniels_zones"],
  },
  "fitness.riegel_equivalent": {
    title: "Equivalent times at other distances",
    plain:
      "We cross-check your fitness estimate against a second, independent formula based on race-distance scaling.",
    technical:
      "Riegel's power law (T2 = T1 * (D2/D1)^1.06) predicts equivalent race times at other distances, used as a cross-check on VDOT and to set intermediate milestones.",
    source: RULE_SOURCES["fitness.riegel_equivalent"],
  },
  "fitness.detraining_discount": {
    title: "Adjusted for time away from running",
    plain:
      "Because your best time is from a while ago, we started your paces a bit more conservatively than that result alone would suggest.",
    technical:
      "VDOT is discounted based on weeks since the personal best was set, modeling cardiovascular/muscular detraining (~6% at 4 weeks, ~19% at 9 weeks off training), floored at a 25% discount, applied once the best is 12+ weeks stale.",
    source: RULE_SOURCES["fitness.detraining_discount"],
  },
  "fitness.baseline_from_volume": {
    title: "Starting fitness estimated from your current running",
    plain:
      "With no recent race result, we estimated a conservative starting fitness from your current weekly volume — an early time trial will sharpen this.",
    technical:
      "No qualifying race/time-trial result was available; VDOT is estimated conservatively from current weekly volume and experience tier, with confidence marked 'low' until the first scheduled time trial.",
    source: RULE_SOURCES["fitness.baseline_from_volume"],
  },
  "goal.horizon_cap_12_months": {
    title: "12-month horizon cap",
    plain:
      "We only ever plan up to 12 months ahead — a further-out goal gets an intermediate target instead.",
    technical:
      "If the requested horizon exceeds 52 weeks from startDate, it's clamped to 52 weeks and flagged as a violation for the caller to surface.",
    source: RULE_SOURCES["goal.horizon_cap_12_months"],
  },
  "goal.required_vdot": {
    title: "Fitness your goal requires",
    plain:
      "We worked out the fitness level your target time actually requires, so we can check how big a jump it is from where you are now.",
    technical:
      "The VDOT implied by running the goal distance in the goal target time, via the same Daniels-Gilbert equations used for your current fitness index.",
    source: RULE_SOURCES["goal.required_vdot"],
  },
  "goal.feasibility_gap": {
    title: "How realistic is your goal?",
    plain:
      "We compare the fitness gap to your goal against a rough monthly-improvement budget to flag whether it looks realistic, ambitious, or unrealistic in the time you have.",
    technical:
      "gapPoints = requiredVdot - currentVdot; budget = monthsAvailable * ~1 VDOT-point/month. This budget is an engine heuristic, not a cited figure — treat the verdict as an estimate, not evidence.",
    source: RULE_SOURCES["goal.feasibility_gap"],
  },
  "goal.milestones_from_riegel": {
    title: "Intermediate milestones",
    plain:
      "We set a few checkpoint times along the way, scaled from your current fitness toward your goal.",
    technical:
      "Riegel-scales your current best result to the goal distance, then linearly blends that projection toward your target time across the horizon.",
    source: RULE_SOURCES["goal.milestones_from_riegel"],
  },
  "phase.tempo_gate": {
    title: "When tempo work starts",
    plain:
      "Tempo/threshold sessions start once you've run a consistent base for a few weeks — longer if you're new to running — with the session itself kept small at first.",
    technical:
      "Tempo/threshold work unlocks once you've reached week 8 (beginner) or week 4 (returner/continuous) of consistent base training — an experience-tiered weeks-of-base gate, not an absolute weekly-volume figure. Shares its gate week with phase.interval_gate.",
    source: RULE_SOURCES["phase.tempo_gate"],
  },
  "phase.interval_gate": {
    title: "When interval work starts",
    plain:
      "VO2max interval sessions unlock on the same schedule as tempo work — what keeps early sessions safe is their small size, not a longer wait.",
    technical:
      "VO2max interval work unlocks once you've reached week 8 (beginner) or week 4 (returner/continuous) of consistent base training — the same gate week as phase.tempo_gate, not a separately-timed one; per-session volume/rep caps (see session.interval_structure) bound the risk of an early session instead.",
    source: RULE_SOURCES["phase.interval_gate"],
  },
  "phase.race_block": {
    title: "Race phase",
    plain:
      "The final weeks before your goal race are dedicated to race-specific sharpening, regardless of volume.",
    technical:
      "The last 4 weeks before targetDate are always the 'race' phase.",
    source: RULE_SOURCES["phase.race_block"],
  },
  "phase.maintenance_mesocycles": {
    title: "Beyond the initial build",
    plain:
      "Once you're past the initial build-up, your plan keeps repeating a build/deload rhythm at your target volume rather than trying to build forever.",
    technical:
      "For a horizon longer than the ~6-month build the research table covers, volume plateaus at the target and the 3:1 build/deload rhythm continues, with quality composition still following the same volume gates.",
    source: RULE_SOURCES["phase.maintenance_mesocycles"],
  },
  "volume.start_from_current": {
    title: "Starting volume",
    plain:
      "Your plan's first week matches your current weekly volume — it never starts higher than where you already are.",
    technical:
      "Week 1's target volume is set directly to currentWeeklyVolumeKm.",
    source: RULE_SOURCES["volume.start_from_current"],
  },
  "volume.build_step": {
    title: "Weekly volume increase",
    plain:
      "Your weekly volume grows in small, steady steps rather than a fixed percentage — bigger steps once you're already running more.",
    technical:
      "Build weeks add a fixed +2 km (below 20 km/wk) or +3 km (at/above) rather than a percentage — the 10% rule has no RCT-demonstrated protective effect and is overly cautious at low mileage.",
    source: RULE_SOURCES["volume.build_step"],
  },
  "volume.deload_3_1": {
    title: "Deload weeks",
    plain:
      "Every 4th week backs off to let your body absorb the training instead of piling on more.",
    technical:
      "Every 4th week (a 3-build/1-deload cycle) drops to 80% of the preceding build week's volume, within the documented 10-40% reduction band.",
    source: RULE_SOURCES["volume.deload_3_1"],
  },
  "volume.post_deload_restart": {
    title: "Resuming after a deload",
    plain:
      "After a deload week, your volume picks back up from where you left off before the deload, not from the lower deload-week number.",
    technical:
      "The build week after a deload resumes from the pre-deload peak (two weeks back) plus one build step, not from the deload week's reduced value.",
    source: RULE_SOURCES["volume.post_deload_restart"],
  },
  "volume.target_cap": {
    title: "Target weekly volume",
    plain:
      "Your volume stops increasing once it reaches a level appropriate for your goal distance — or sooner, if a recent time trial shows you're already on track at less.",
    technical:
      "Target weekly volume is looked up/interpolated by goal distance (45 km/wk for a 5K, per the research table; other distances are heuristic control points), floored at your current volume so it never asks you to cut back. If a recent time trial (high-confidence fitness, not the low/medium-confidence baseline estimate) already puts the goal's feasibility verdict at 'realistic', the target holds at current volume instead of climbing toward the heuristic — re-tested every 4-6 weeks (alloc.time_trial_cadence), so the cap can climb again if a later test shows the goal has drifted out of reach.",
    source: RULE_SOURCES["volume.target_cap"],
  },
  "volume.conservative_multiplier": {
    title: "Extra caution after a stress fracture",
    plain:
      "If you've had a stress fracture before, we grow your volume more slowly throughout the whole plan.",
    technical:
      "A reported prior stress fracture multiplies every build step by 0.8 (20% smaller steps) for the whole plan.",
    source: RULE_SOURCES["volume.conservative_multiplier"],
  },
  "volume.taper": {
    title: "Race-week taper",
    plain:
      "Your volume drops significantly in the final two weeks before race day, while you keep running the same number of sessions at the same intensity — this is what produces your best race-day performance.",
    technical:
      "The final 2 weeks before targetDate cut volume ~50% (within Bosquet et al.'s 41-60% band) while holding session count and intensity, with the last long run 3 weeks out.",
    source: RULE_SOURCES["volume.taper"],
  },
  "alloc.runs_per_week": {
    title: "Runs per week",
    plain:
      "How many times a week you run is set by your current volume, not just your preference — spreading volume over more, shorter runs is safer than a few long ones.",
    technical:
      "Runs/week is looked up by weekly volume against the research table's runs/week column, clamped to your stated available training days.",
    source: RULE_SOURCES["alloc.runs_per_week"],
  },
  "alloc.intensity_80_20": {
    title: "Easy vs. hard balance",
    plain:
      "About 80% of your running stays easy-effort, with the rest at tempo/interval intensity — or a 60/40 split if you're only training a few days a week.",
    technical:
      "Once quality work exists, at least 80% of weekly volume is easy; runners training 3 or fewer days/week fall back to a ~60/40 split, since a strict 80/20 becomes impractical at low frequency.",
    source: RULE_SOURCES["alloc.intensity_80_20"],
  },
  "alloc.max_two_quality": {
    title: "At most two hard sessions",
    plain:
      "You never get more than two quality (tempo/interval) sessions in the same week.",
    technical:
      "Quality session count per week is capped at 2, keeping hard/easy spacing manageable.",
    source: RULE_SOURCES["alloc.max_two_quality"],
  },
  "alloc.strength_two_per_week": {
    title: "Strength training",
    plain:
      "Two strength sessions a week are built into your plan — a gym circuit or a bodyweight routine, depending on what you have access to.",
    technical:
      "2 strength sessions/week are scheduled on non-quality days; strength training roughly halves overuse-injury risk in the cited meta-analysis.",
    source: RULE_SOURCES["alloc.strength_two_per_week"],
  },
  "alloc.time_trial_cadence": {
    title: "Recalibration time trials",
    plain:
      "Every few weeks, a deload week includes a time trial instead of your usual long run — it recalibrates your paces and doubles as a milestone check.",
    technical:
      "A time-trial session replaces the long run on every deload week (every 4th week), which falls within the recommended 4-6 week re-testing cadence.",
    source: RULE_SOURCES["alloc.time_trial_cadence"],
  },
  "longrun.share_cap": {
    title: "Long run size",
    plain:
      "Your long run is capped at a fraction of your total weekly volume, so it doesn't dominate the week.",
    technical: "The long run is capped at 30% of that week's target volume.",
    source: RULE_SOURCES["longrun.share_cap"],
  },
  "longrun.spike_ceiling": {
    title: "Single-session spike ceiling",
    plain:
      "No single run in your plan is ever much longer than your recent longest run — the single biggest evidence-backed injury-prevention rule.",
    technical:
      "No session may exceed 1.10x the longest run of the preceding 30 days, seeded by your reported longest recent run and tracked forward across the plan. This truncates the session rather than warning about it.",
    source: RULE_SOURCES["longrun.spike_ceiling"],
  },
  "days.long_run_on_preferred_day": {
    title: "Long-run day",
    plain: "Your long run is always placed on the day you told us works best.",
    technical:
      "The long-run/time-trial session for each week is placed on the stated longRunDay.",
    source: RULE_SOURCES["days.long_run_on_preferred_day"],
  },
  "days.no_back_to_back_hard": {
    title: "Hard/easy spacing",
    plain:
      "Quality sessions and your long run are never scheduled on adjacent days.",
    technical:
      "Quality (tempo/interval) sessions are placed at least 2 days from the long-run day and from each other.",
    source: RULE_SOURCES["days.no_back_to_back_hard"],
  },
  "days.strength_off_quality_days": {
    title: "Strength scheduling",
    plain:
      "Strength sessions are scheduled on easier days, not stacked on top of your hard running days.",
    technical:
      "Strength sessions are placed on days not used for a quality or long-run session.",
    source: RULE_SOURCES["days.strength_off_quality_days"],
  },
  "days.rest_fills_remainder": {
    title: "Rest days",
    plain:
      "Whatever's left after your key sessions are placed becomes a rest day.",
    technical:
      "Key sessions (long run, quality, easy runs, strength) are placed explicitly first; any day left unassigned becomes 'rest'.",
    source: RULE_SOURCES["days.rest_fills_remainder"],
  },
  "session.pace_from_zone": {
    title: "Session pace",
    plain:
      "Each session's pace comes directly from your training zones for that session type.",
    technical:
      "easy -> Easy zone, tempo -> Threshold zone, interval -> Interval zone, timeTrial -> your goal pace.",
    source: RULE_SOURCES["session.pace_from_zone"],
  },
  "session.duration_from_distance": {
    title: "Session duration",
    plain:
      "A session's duration is simply its distance at its prescribed pace.",
    technical: "durationMin = distanceKm * paceSecPerKm / 60.",
    source: RULE_SOURCES["session.duration_from_distance"],
  },
  "session.interval_structure": {
    title: "Interval session structure",
    plain:
      "Interval sessions are built from short, repeated hard efforts with easy jogging in between, sized to your current volume and capped so a single session never asks for too much.",
    technical:
      "Session volume is capped at the lesser of 10 km and 8% of weekly volume (Daniels); rep distance is chosen so each rep takes 3-5 minutes at Interval pace; recovery is set close to the work interval's own duration (~90% of it); rep count falls out of the session cap divided by rep distance, floored at 3 reps.",
    source: RULE_SOURCES["session.interval_structure"],
  },
  "check.spike_ceiling": {
    title: "Spike-ceiling check",
    plain:
      "A final check confirms no session in your plan breaks the single-session spike rule.",
    technical:
      "Post-generation validator: fails if any session's distance exceeds 1.10x the rolling 30-day longest run at its point in the plan.",
    source: RULE_SOURCES["check.spike_ceiling"],
  },
  "check.easy_share": {
    title: "Easy-share check",
    plain:
      "A final check confirms your plan actually keeps enough of your running easy.",
    technical:
      "Post-generation validator: fails if a week's easy-effort share drops below the 80/20 (or 60/40 fallback) target.",
    source: RULE_SOURCES["check.easy_share"],
  },
  "check.hard_spacing": {
    title: "Hard-spacing check",
    plain:
      "A final check confirms hard sessions are never scheduled back-to-back.",
    technical:
      "Post-generation validator: fails if two quality/long-run sessions land on adjacent days.",
    source: RULE_SOURCES["check.hard_spacing"],
  },
  "check.deload_cadence": {
    title: "Deload-cadence check",
    plain:
      "A final check confirms deload weeks actually land every 4th week as intended.",
    technical:
      "Post-generation validator: fails if a deload week's volume doesn't reflect the expected reduction from the preceding build week.",
    source: RULE_SOURCES["check.deload_cadence"],
  },
  "check.horizon": {
    title: "Horizon check",
    plain: "A final check confirms the plan never runs longer than 12 months.",
    technical:
      "Post-generation validator: fails if the plan has more than 52 weeks.",
    source: RULE_SOURCES["check.horizon"],
  },
  "check.weekly_sum": {
    title: "Weekly-total check",
    plain:
      "A final check confirms each week's sessions actually add up to that week's stated total volume.",
    technical:
      "Post-generation validator: fails if the sum of a week's session distances doesn't match its stored targetVolumeKm.",
    source: RULE_SOURCES["check.weekly_sum"],
  },
};
