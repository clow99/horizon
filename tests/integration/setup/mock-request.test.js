import {
  createJsonRequest,
  createMockRequest,
  readJsonResponse,
  extractStatus,
  extractHeader,
} from "../../setup/mock-request.js";

describe("Mock request helpers", () => {
  test("createMockRequest builds Request with JSON body", async () => {
    const request = createMockRequest({
      method: "POST",
      url: "/api/example",
      json: { hello: "world" },
      headers: { "x-test": "1" },
    });

    expect(request.method).toBe("POST");
    expect(request.headers.get("content-type")).toBe("application/json");
    expect(request.headers.get("x-test")).toBe("1");

    const parsed = await request.clone().json();
    expect(parsed).toEqual({ hello: "world" });
  });

  test("createJsonRequest defaults to POST and serialises body", async () => {
    const request = createJsonRequest("/api/alt", { foo: "bar" });
    expect(request.method).toBe("POST");

    const payload = await request.clone().json();
    expect(payload).toEqual({ foo: "bar" });
  });

  test("readJsonResponse parses mock response body", async () => {
    const payload = { ok: true };
    const response = {
      status: 201,
      headers: {
        get(name) {
          return name.toLowerCase() === "content-type"
            ? "application/json; charset=utf-8"
            : null;
        },
      },
      async json() {
        return payload;
      },
      clone() {
        return {
          status: this.status,
          headers: this.headers,
          json: async () => payload,
        };
      },
    };

    const data = await readJsonResponse(response);

    expect(data).toEqual({ ok: true });
    expect(extractStatus(response)).toBe(201);
    expect(extractHeader(response, "content-type")).toContain(
      "application/json"
    );
  });
});
