import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema/auth";
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

  const [row] = await db
    .select({ username: userTable.username, collectionPublic: userTable.collectionPublic })
    .from(userTable)
    .where(eq(userTable.id, id));

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
        username:          row?.username ?? null,
        collectionPublic:  row?.collectionPublic ?? false,
      }}
    />
  );
}
