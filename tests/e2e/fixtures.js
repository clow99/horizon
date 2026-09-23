import { test as base, expect as baseExpect } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { buildPlaywrightAuthPayload } from "../setup/auth-session.js";

const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;
const SESSION_COOKIE_NAME =
  process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.startsWith("https://")
    ? "__Secure-horizon.oauth-v2.session-token"
    : "horizon.oauth-v2.session-token";
const DEFAULT_SECRET = "test-secret-key-for-testing-only";

export const test = base.extend({
  authPayload: [
    async ({}, use) => {
      const payload = buildPlaywrightAuthPayload();
      await use(payload);
    },
    { auto: true },
  ],

  resetDatabase: [
    async ({ request, authPayload }, use) => {
      const response = await request.post("/api/test/reset", {
        headers: authPayload.headers,
      });

      if (!response.ok()) {
        throw new Error(
          `Failed to reset database: ${response.status()} ${await response.text()}`
        );
      }

      const data = await response.json();
      await use(data);
    },
    { auto: true },
  ],

  loginAsTestUser: async ({ context, authPayload }, use) => {
    const login = async (overrides = {}) => {
      const sessionUser = { ...authPayload.session.user, ...overrides };
      const secret = process.env.NEXTAUTH_SECRET || DEFAULT_SECRET;

      const sessionToken = await encode({
        secret,
        token: {
          name: sessionUser.name,
          email: sessionUser.email,
          picture: sessionUser.image ?? null,
          sub: sessionUser.id,
        },
        maxAge: SESSION_MAX_AGE_SECONDS,
      });

      await context.addCookies([
        {
          name: SESSION_COOKIE_NAME,
          value: sessionToken,
          domain: "localhost",
          path: "/",
          httpOnly: true,
          sameSite: "Lax",
          maxAge: SESSION_MAX_AGE_SECONDS,
          secure: false,
        },
      ]);

      return { token: sessionToken, user: sessionUser };
    };

    await use(login);
  },

  seedData: async ({ request, authPayload }, use) => {
    const seed = async (payload) => {
      const response = await request.post("/api/test/seed", {
        headers: authPayload.headers,
        data: payload,
      });

      if (!response.ok()) {
        throw new Error(
          `Failed to seed data: ${response.status()} ${await response.text()}`
        );
      }

      return response.json();
    };

    await use(seed);
  },

  captureCheckpoint: async ({ page }, use, testInfo) => {
    const verbose = process.env.PLAYWRIGHT_CAPTURE === "verbose";

    const capture = async (label) => {
      if (!verbose) return;

      const safeLabel = label
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const fileName = `checkpoint-${Date.now()}-${safeLabel || "step"}.png`;
      const filePath = testInfo.outputPath(fileName);

      await page.screenshot({ path: filePath, fullPage: true });
      await testInfo.attach(fileName, {
        path: filePath,
        contentType: "image/png",
      });
    };

    await use(capture);
  },

  testUser: async ({ authPayload }, use) => {
    await use(authPayload.session.user);
  },
});

export const expect = baseExpect;
