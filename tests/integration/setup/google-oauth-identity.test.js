import { authConfig } from "@/auth";
import { query } from "@/lib/db";
import { getTestDatabase, resetTestDatabase } from "../../setup/database";

const signIn = authConfig.callbacks.signIn;

function googleLogin({
  email = "owner@gmail.com",
  subject = "google-sub-1",
  verified = true,
  provider = "google",
  accountSubject = subject,
} = {}) {
  const user = { email, name: "Google Name", image: "https://example.test/photo" };
  return {
    user,
    account: { provider, providerAccountId: accountSubject },
    profile: { email, email_verified: verified, sub: subject },
  };
}

describe("Google OAuth identity callback", () => {
  beforeEach(() => resetTestDatabase());

  test("rejects an unverified identity before an existing email is selected", async () => {
    await query("INSERT INTO users (id, email) VALUES (?, ?)", [
      "existing", "owner@gmail.com",
    ]);
    const login = googleLogin({ verified: false });
    expect(await signIn(login)).toBe(false);
    expect(login.user.id).toBeUndefined();
    const users = await query("SELECT * FROM users WHERE id = ?", ["existing"]);
    expect(users[0].google_sub).toBeNull();
  });

  test.each([
    { subject: "", accountSubject: "" },
    { accountSubject: "another-subject" },
    { provider: "github" },
  ])("rejects a missing or inconsistent Google subject: %p", async (overrides) => {
    const login = googleLogin(overrides);
    expect(await signIn(login)).toBe(false);
    expect(await query("SELECT * FROM users")).toHaveLength(0);
  });

  test("rejects a user email that differs from the verified profile", async () => {
    const login = googleLogin();
    login.user.email = "another@gmail.com";
    expect(await signIn(login)).toBe(false);
    expect(await query("SELECT * FROM users")).toHaveLength(0);
  });

  test("keeps dangerous email linking and custom PKCE cookies disabled", () => {
    expect(authConfig.providers[0].allowDangerousEmailAccountLinking).not.toBe(true);
    expect(authConfig.cookies.pkceCodeVerifier).toBeUndefined();
  });

  test("links a verified Gmail owner to the existing ID and preserves project ownership", async () => {
    await query("INSERT INTO users (id, email) VALUES (?, ?)", [
      "existing", "owner@gmail.com",
    ]);
    await query("INSERT INTO projects (id, user_id, name) VALUES (?, ?, ?)", [
      "project-1", "existing", "Existing project",
    ]);
    const login = googleLogin();
    expect(await signIn(login)).toBe(true);
    expect(login.user.id).toBe("existing");
    const users = await query("SELECT * FROM users");
    expect(users).toHaveLength(1);
    expect(users[0].google_sub).toBe("google-sub-1");
    expect((await query("SELECT * FROM projects WHERE id = ?", ["project-1"]))[0].user_id)
      .toBe("existing");
  });

  test("uses the linked subject when Google's email changes", async () => {
    await query("INSERT INTO users (id, email, google_sub) VALUES (?, ?, ?)", [
      "existing", "old@example.com", "google-sub-1",
    ]);
    const login = googleLogin({ email: "new@example.com" });
    expect(await signIn(login)).toBe(true);
    expect(login.user.id).toBe("existing");
    expect(login.user.email).toBe("old@example.com");
    expect(await query("SELECT * FROM users")).toHaveLength(1);
  });

  test("does not claim an existing non-Gmail account from email alone", async () => {
    await query("INSERT INTO users (id, email) VALUES (?, ?)", [
      "existing", "owner@example.com",
    ]);
    const login = googleLogin({ email: "owner@example.com" });
    expect(await signIn(login)).toBe(false);
    expect((await query("SELECT * FROM users WHERE id = ?", ["existing"]))[0].google_sub)
      .toBeNull();
  });

  test("does not replace a different subject already linked to that email", async () => {
    await query("INSERT INTO users (id, email, google_sub) VALUES (?, ?, ?)", [
      "existing", "owner@gmail.com", "first-google-sub",
    ]);
    expect(await signIn(googleLogin({ subject: "second-google-sub" }))).toBe(false);
    expect((await query("SELECT * FROM users WHERE id = ?", ["existing"]))[0].google_sub)
      .toBe("first-google-sub");
  });

  test("creates a new verified account with a durable subject", async () => {
    const login = googleLogin({ email: "new@example.com" });
    expect(await signIn(login)).toBe(true);
    expect(login.user.id).toEqual(expect.any(String));
    const users = await query("SELECT * FROM users");
    expect(users).toHaveLength(1);
    expect(users[0].id).toBe(login.user.id);
    expect(users[0].google_sub).toBe("google-sub-1");
  });

  test("fails closed if identity storage is unavailable", async () => {
    getTestDatabase().exec("DROP TABLE users");
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(await signIn(googleLogin())).toBe(false);
    } finally {
      error.mockRestore();
    }
  });
});
