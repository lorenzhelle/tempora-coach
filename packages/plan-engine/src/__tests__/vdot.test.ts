import { describe, expect, it } from "vitest";
import { riegelPredict } from "../fitness/riegel";
import {
  paceZonesFromVdot,
  percentVo2Max,
  vdotFromResult,
  vo2Cost,
} from "../fitness/vdot";

describe("vo2Cost / percentVo2Max", () => {
  it("matches a hand-computed value at 5K race pace (250 m/min, 20 min)", () => {
    expect(vo2Cost(250)).toBeCloseTo(47.4645, 3);
    expect(percentVo2Max(20)).toBeCloseTo(0.95297, 4);
  });
});

describe("vdotFromResult", () => {
  it("golden: 20:00 over 5 km yields VDOT ~= 49.8 (Daniels' table: 19:57 = 50)", () => {
    const vdot = vdotFromResult({ distanceMeters: 5000, timeSeconds: 1200 });
    expect(vdot).toBeCloseTo(49.8, 1);
  });

  it("a faster time over the same distance yields a higher VDOT", () => {
    const slower = vdotFromResult({ distanceMeters: 5000, timeSeconds: 1500 });
    const faster = vdotFromResult({ distanceMeters: 5000, timeSeconds: 1200 });
    expect(faster).toBeGreaterThan(slower);
  });
});

describe("paceZonesFromVdot", () => {
  const zones = paceZonesFromVdot(49.8);

  it("orders zones from slowest (easy) to fastest (repetition)", () => {
    expect(zones.easy.paceSecPerKm).toBeGreaterThan(
      zones.marathon.paceSecPerKm,
    );
    expect(zones.marathon.paceSecPerKm).toBeGreaterThan(
      zones.threshold.paceSecPerKm,
    );
    expect(zones.threshold.paceSecPerKm).toBeGreaterThan(
      zones.interval.paceSecPerKm,
    );
    expect(zones.interval.paceSecPerKm).toBeGreaterThan(
      zones.repetition.paceSecPerKm,
    );
  });

  it("keeps each zone's low/high band bracketing its midpoint pace", () => {
    for (const zone of Object.values(zones)) {
      expect(zone.lowPaceSecPerKm).toBeGreaterThanOrEqual(zone.paceSecPerKm);
      expect(zone.paceSecPerKm).toBeGreaterThanOrEqual(zone.highPaceSecPerKm);
    }
  });

  it("puts a VDOT-50 easy pace in a plausible range (4:30-6:00/km)", () => {
    expect(zones.easy.paceSecPerKm).toBeGreaterThan(270);
    expect(zones.easy.paceSecPerKm).toBeLessThan(360);
  });

  it("round-trips: the pace it derives for a zone costs that zone's target VO2", () => {
    const velocityMetersPerMin = 60000 / zones.threshold.paceSecPerKm;
    // Threshold band midpoint is 85.5% of VDOT (83-88%).
    expect(vo2Cost(velocityMetersPerMin)).toBeCloseTo(49.8 * 0.855, 1);
  });
});

describe("riegelPredict", () => {
  it("predicts a slower time at a longer distance", () => {
    const fiveK = { distanceMeters: 5000, timeSeconds: 1200 };
    const tenK = riegelPredict(fiveK, 10000);
    // Pure doubling would be 2400s; Riegel's exponent > 1 predicts slightly more.
    expect(tenK).toBeGreaterThan(2400);
    expect(tenK).toBeLessThan(2520);
  });

  it("is the identity at the same distance", () => {
    const result = { distanceMeters: 5000, timeSeconds: 1200 };
    expect(riegelPredict(result, 5000)).toBeCloseTo(1200, 6);
  });
});
