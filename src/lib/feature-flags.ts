import { redis } from "./redis";

const FLAGS = {
  online_payments: "platform:flag:online_payments",
} as const;

export type FeatureFlagKey = keyof typeof FLAGS;

export async function getFlag(key: FeatureFlagKey): Promise<boolean> {
  if (!redis) return false;
  const val = await redis.get<string>(FLAGS[key]);
  return val === "1";
}

export async function setFlag(key: FeatureFlagKey, enabled: boolean): Promise<void> {
  if (!redis) return;
  await redis.set(FLAGS[key], enabled ? "1" : "0");
}

export async function getAllFlags(): Promise<Record<FeatureFlagKey, boolean>> {
  const [online_payments] = await Promise.all([
    getFlag("online_payments"),
  ]);
  return { online_payments };
}
