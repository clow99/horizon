import * as AuthModule from "@/auth";
import { executeQuery, seedUser } from "./database.js";

const DEFAULT_TEST_USER = Object.freeze({
  id: "user-0001",
  email: "tester@example.com",
  name: "Test Runner",
  image: null,
});

const DEFAULT_PLAYWRIGHT_HEADERS = {
  session: "x-nextauth-test-session",
  token: "x-nextauth-test-token",
};

let authSpy = null;

function ensureAuthEnv() {
  if (!process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = "http://localhost:3000";
  }
  if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = "test-secret-key-for-testing-only";
  }
  if (!process.env.NEXTAUTH_TEST_TOKEN) {
    process.env.NEXTAUTH_TEST_TOKEN = "nextauth-test-token";
  }
  return process.env.NEXTAUTH_TEST_TOKEN;
}

function normalizeUser(overrides = {}) {
  return {
    ...DEFAULT_TEST_USER,
    ...overrides,
  };
}

export function createTestSession(overrides = {}) {
  ensureAuthEnv();
  const userOverrides = overrides.user || {};
  const user = normalizeUser(userOverrides);
  const expires =
    overrides.expires || new Date(Date.now() + 86400000).toISOString();
  const session = { ...overrides };
  session.user = user;
  session.expires = expires;
  return session;
}

export function mockAuthSession(sessionOverrides) {
  ensureAuthEnv();
  let session = null;

  if (sessionOverrides === null) {
    session = null;
  } else if (sessionOverrides === undefined) {
    session = createTestSession();
  } else if (typeof sessionOverrides === "object") {
    session = createTestSession(sessionOverrides);
  }

  if (!authSpy) {
    authSpy = jest.spyOn(AuthModule, "auth").mockResolvedValue(session);
  } else {
    authSpy.mockResolvedValue(session);
  }

  return session;
}

export function mockAuthenticatedUser(userOverrides = {}) {
  return mockAuthSession({ user: userOverrides });
}

export function mockUnauthenticatedSession() {
  return mockAuthSession(null);
}

export function restoreAuthSession() {
  if (authSpy) {
    authSpy.mockRestore();
    authSpy = null;
  }
}

export function ensureDatabaseTestUser(overrides = {}) {
  ensureAuthEnv();
  const user = normalizeUser(overrides);
  const existing = executeQuery("SELECT id FROM users WHERE id = ?", [user.id]);

  if (existing.length === 0) {
    seedUser(user);
  }

  return user;
}

export function getTestAuthToken() {
  return ensureAuthEnv();
}

export function buildPlaywrightAuthPayload(overrides = {}) {
  const session = createTestSession(overrides);
  const token = getTestAuthToken();
  const encodedSession = Buffer.from(JSON.stringify(session)).toString(
    "base64"
  );

  return {
    token,
    session,
    headers: {
      [DEFAULT_PLAYWRIGHT_HEADERS.token]: token,
      [DEFAULT_PLAYWRIGHT_HEADERS.session]: encodedSession,
    },
  };
}

export function getPlaywrightHeaderNames() {
  return { ...DEFAULT_PLAYWRIGHT_HEADERS };
}

export function decodePlaywrightSession(encoded) {
  const json = Buffer.from(encoded, "base64").toString("utf8");
  return JSON.parse(json);
}

export function clearAuthMocks() {
  restoreAuthSession();
}
