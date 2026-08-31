import { describe, expect, it } from "vitest";
import { INTERVAL_SESSION } from "../constants";
import {
  intervalSessionStructure,
  intervalStructureRule,
  pickRepDistanceKm,
} from "../rules/session";

// 4:00/km Interval pace — a mid-fitness runner's roughly-VDOT-50 zone.
const INTERVAL_PACE_SEC_PER_KM = 240;
// 1 quality session/week at a standard 80/20 split — chosen so the
// allocation-consistency ceiling (qualitySessionDistanceKm) never binds
// below Daniels' own I-pace cap in these tests, unless a test says
// otherwise; see intervalSessionStructure's doc comment for why both
// ceilings exist.
const QUALITY_COUNT = 1;
const EASY_SHARE_FRACTION = 0.8;

describe("pickRepDistanceKm", () => {
  it("picks the longest 'clean' candidate distance whose duration lands in the 3-5 min band", () => {
    // 1.2 km @ 240 s/km = 4.8 min (in-band); 1.6 km would be 6.4 min (out).
    expect(pickRepDistanceKm(INTERVAL_PACE_SEC_PER_KM)).toBeCloseTo(1.2, 6);
  });

  it("falls back to solving for the band midpoint when no candidate fits (very fast pace)", () => {
    const fastPaceSecPerKm = 100; // even 1.6 km would be under 3 min here
    const result = pickRepDistanceKm(fastPaceSecPerKm);
    const durationMin = (result * fastPaceSecPerKm) / 60;
    expect(durationMin).toBeCloseTo(4, 6); // band midpoint, (3+5)/2
    expect(INTERVAL_SESSION.repDistanceCandidatesKm.includes(result)).toBe(
      false,
    );
  });

  it("falls back to solving for the band midpoint when no candidate fits (very slow pace)", () => {
    const slowPaceSecPerKm = 1800; // even 0.2 km would be over 5 min here
    const result = pickRepDistanceKm(slowPaceSecPerKm);
    const durationMin = (result * slowPaceSecPerKm) / 60;
    expect(durationMin).toBeCloseTo(4, 6);
  });
});

describe("intervalSessionStructure", () => {
  it("caps session volume at 8% of weekly volume when that's below the 10 km ceiling", () => {
    const { sessionDistanceKm } = intervalSessionStructure(
      INTERVAL_PACE_SEC_PER_KM,
      50,
      QUALITY_COUNT,
      EASY_SHARE_FRACTION,
    );
    // 8% of 50 km = 4 km; 3 reps of 1.2 km = 3.6 km, under that cap.
    expect(sessionDistanceKm).toBeLessThanOrEqual(4);
  });

  it("caps session volume at 10 km regardless of weekly volume once 8% would exceed it", () => {
    const { repCount, repDistanceKm } = intervalSessionStructure(
      INTERVAL_PACE_SEC_PER_KM,
      200, // 8% of 200 km = 16 km, above the 10 km ceiling
      QUALITY_COUNT,
      EASY_SHARE_FRACTION,
    );
    expect(repCount * repDistanceKm).toBeLessThanOrEqual(10);
    expect(repCount).toBe(Math.floor(10 / repDistanceKm));
  });

  it("floors rep count at the minimum even when the session cap alone would round to fewer reps", () => {
    const { repCount, sessionDistanceKm } = intervalSessionStructure(
      INTERVAL_PACE_SEC_PER_KM,
      10, // 8% of 10 km = 0.8 km — less than even one 1.2 km rep
      QUALITY_COUNT,
      EASY_SHARE_FRACTION,
    );
    expect(repCount).toBe(INTERVAL_SESSION.minRepCount);
    expect(sessionDistanceKm).toBeCloseTo(
      INTERVAL_SESSION.minRepCount * 1.2,
      6,
    );
  });

  it("sets recovery close to, but shorter than, the work interval's own duration", () => {
    const { repDurationSec, restSec } = intervalSessionStructure(
      INTERVAL_PACE_SEC_PER_KM,
      50,
      QUALITY_COUNT,
      EASY_SHARE_FRACTION,
    );
    expect(restSec).toBeCloseTo(
      repDurationSec * INTERVAL_SESSION.restToWorkRatio,
      6,
    );
    expect(restSec).toBeLessThan(repDurationSec);
  });
});

describe("intervalStructureRule", () => {
  it("traces a human-readable interval prescription, with the session's realized distance as its value", () => {
    const { outcome, value, inputs } = intervalStructureRule.apply({
      zonePaceSecPerKm: INTERVAL_PACE_SEC_PER_KM,
      weeklyVolumeKm: 50,
      qualityCount: QUALITY_COUNT,
      easyShareFraction: EASY_SHARE_FRACTION,
    });
    expect(outcome).toContain("x 1200m @ Interval pace");
    expect(value).toBeCloseTo(3.6, 6); // 3 reps of 1.2 km, Daniels' cap binding
    expect(inputs.repCount).toBeGreaterThanOrEqual(
      INTERVAL_SESSION.minRepCount,
    );
  });
});
