import type { APIRequestContext } from "@playwright/test";

export const TEST_USERS = {
  admin:  { email: "admin@tcgmarket.ph", password: process.env.SEED_ADMIN_PASSWORD ?? "" },
  seller: { email: "joven@test.com",     password: process.env.SEED_USER_PASSWORD ?? "" },
  buyer:  { email: "marco@test.com",     password: process.env.SEED_USER_PASSWORD ?? "" },
  seller2:{ email: "lian@test.com",      password: process.env.SEED_USER_PASSWORD ?? "" },
};

/**
 * Sign in via better-auth email/password and return the Set-Cookie header
 * value so subsequent requests can carry the session.
 */
export async function signIn(
  request: APIRequestContext,
  role: keyof typeof TEST_USERS = "buyer",
): Promise<string> {
  const { email, password } = TEST_USERS[role];
  const res = await request.post("/api/auth/sign-in/email", {
    data: { email, password },
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok()) {
    throw new Error(
      `signIn(${role}) failed: ${res.status()} ${await res.text()}`,
    );
  }

  // Collect all Set-Cookie values and join them
  const cookies = res.headers()["set-cookie"] ?? "";
  return cookies;
}

/**
 * Return headers with a valid session cookie for the given role.
 */
export async function authHeaders(
  request: APIRequestContext,
  role: keyof typeof TEST_USERS = "buyer",
): Promise<Record<string, string>> {
  const cookie = await signIn(request, role);
  return { Cookie: cookie };
}
