import { auth } from "@/auth";
import {
  buildPlaywrightAuthPayload,
  createTestSession,
  decodePlaywrightSession,
  ensureDatabaseTestUser,
  mockAuthSession,
  mockUnauthenticatedSession,
  restoreAuthSession,
} from "../../setup/auth-session.js";
import { resetTestDatabase, truncateTables } from "../../setup/database.js";

describe("Auth session helpers", () => {
  beforeEach(() => {
    resetTestDatabase();
    truncateTables();
    restoreAuthSession();
  });

  afterEach(() => {
    restoreAuthSession();
  });

  test("mockAuthSession returns deterministic user session", async () => {
    ensureDatabaseTestUser();
    const session = mockAuthSession();
    const result = await auth();

    expect(result).toEqual(session);
    expect(result.user.email).toBe("tester@example.com");
    expect(result.user.id).toBe("user-0001");
  });

  test("mockUnauthenticatedSession resolves auth() to null", async () => {
    mockUnauthenticatedSession();
    const result = await auth();
    expect(result).toBeNull();
  });

  test("buildPlaywrightAuthPayload encodes session details for helper route", () => {
    const payload = buildPlaywrightAuthPayload({
      user: { email: "custom@example.com" },
    });

    expect(payload.token).toBe(process.env.NEXTAUTH_TEST_TOKEN);

    const headerNames = Object.keys(payload.headers);
    expect(headerNames).toContain("x-nextauth-test-token");
    expect(headerNames).toContain("x-nextauth-test-session");

    const decoded = decodePlaywrightSession(
      payload.headers["x-nextauth-test-session"]
    );

    expect(decoded.user.email).toBe("custom@example.com");
    expect(decoded.expires).toBeDefined();
  });

  test("createTestSession allows session overrides", () => {
    const session = createTestSession({
      user: { name: "Override User" },
      expires: "2099-01-01T00:00:00.000Z",
    });

    expect(session.user.name).toBe("Override User");
    expect(session.expires).toBe("2099-01-01T00:00:00.000Z");
  });
});
