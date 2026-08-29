import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @tempora/plan-engine (packages/plan-engine) ships untranspiled TS
  // source — see ADR-0009.
  transpilePackages: ["@tempora/plan-engine"],
};

export default nextConfig;
