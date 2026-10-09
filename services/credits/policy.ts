import type { ExportPolicy, Plan } from "@/lib/types";

export function resolveExportPolicy(plan: Plan): ExportPolicy {
  if (plan === "pro") {
    return {
      watermark: false,
      quality: "1080p",
      dailyLimit: 30,
      cost: 10,
    };
  }

  return {
    watermark: true,
    quality: "720p",
    dailyLimit: 10,
    cost: 10,
  };
}
