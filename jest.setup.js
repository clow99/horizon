import "@testing-library/jest-dom";
import { registerCustomMatchers } from "./tests/setup/custom-matchers.js";

jest.mock("next-auth");
jest.mock("next-auth/providers/google");

if (typeof global.fetch === "undefined") {
  let undici = null;
  try {
    undici = require("node:undici");
  } catch (nodeUndiciError) {
    try {
      undici = require("undici");
    } catch (packageUndiciError) {
      undici = null;
    }
  }

  if (undici) {
    const { fetch, Headers, Request, Response, FormData, File, Blob } = undici;
    Object.assign(global, {
      fetch,
      Headers,
      Request,
      Response,
      FormData,
      File,
      Blob,
    });
  }
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "test";
}
if (process.env.NODE_ENV !== "test") {
  process.env.NODE_ENV = "test";
}

registerCustomMatchers();

// Global test timeout
jest.setTimeout(10000);

// Mock environment variables for tests
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = "http://localhost:3000";
}
if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = "test-secret-key-for-testing-only";
}
if (!process.env.NEXTAUTH_TEST_TOKEN) {
  process.env.NEXTAUTH_TEST_TOKEN = "nextauth-test-token";
}

if (typeof global.TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util");
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}
