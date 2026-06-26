import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const { id, name, email, image } = session.user;
  const u = session.user as typeof session.user & {
    phone?: string | null;
    phoneVerified?: boolean;
    preferredCurrency?: string | null;
  };

  return (
    <SettingsClient
      user={{
        id,
        name,
        email,
        image:             image ?? null,
        phone:             u.phone ?? null,
        phoneVerified:     u.phoneVerified ?? false,
        preferredCurrency: u.preferredCurrency ?? "PHP",
      }}
    />
  );
}
