function resolveUrl(pathOrUrl, origin = "http://localhost:3000") {
  if (!pathOrUrl) {
    return origin;
  }
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }
  const base = origin.endsWith("/") ? origin.slice(0, -1) : origin;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

export function createMockRequest(options = {}) {
  const {
    method = "GET",
    url = "/api/test",
    origin = "http://localhost:3000",
    headers = {},
    body,
    json,
  } = options;

  const supportsFetchInterfaces =
    typeof Headers !== "undefined" && typeof Request !== "undefined";

  const requestHeaders = supportsFetchInterfaces
    ? new Headers(headers)
    : createHeaderBag(headers);

  let requestBody = body;
  let storedJson = json;

  if (json !== undefined) {
    requestBody = JSON.stringify(json);
    if (!requestHeaders.has("content-type")) {
      requestHeaders.set("content-type", "application/json");
    }
  }

  if (supportsFetchInterfaces) {
    return new Request(resolveUrl(url, origin), {
      method,
      headers: requestHeaders,
      body: requestBody,
    });
  }

  // Minimal fallback for environments without fetch Request implementation
  const resolvedUrl = resolveUrl(url, origin);
  const rawBody = requestBody;

  return {
    method,
    url: resolvedUrl,
    headers: requestHeaders,
    async json() {
      if (storedJson !== undefined) {
        return storedJson;
      }
      if (!rawBody) {
        return null;
      }
      try {
        return JSON.parse(rawBody);
      } catch (error) {
        throw new Error("Failed to parse JSON body in mock request");
      }
    },
    async text() {
      if (typeof rawBody === "string") {
        return rawBody;
      }
      if (rawBody == null) {
        return "";
      }
      return String(rawBody);
    },
    clone() {
      return createMockRequest({
        method,
        url: resolvedUrl,
        origin,
        headers,
        body: rawBody,
        json: storedJson,
      });
    },
  };
}

export function createJsonRequest(url, jsonBody, init = {}) {
  return createMockRequest({
    url,
    json: jsonBody,
    method: init.method || "POST",
    headers: init.headers,
    origin: init.origin,
  });
}

export async function readJsonResponse(response) {
  const target =
    typeof response.clone === "function" ? response.clone() : response;
  if (typeof target.json !== "function") {
    return null;
  }
  return target.json();
}

export function extractStatus(response) {
  return response?.status ?? null;
}

export function extractHeader(response, headerName) {
  if (!response || !response.headers) {
    return null;
  }
  return response.headers.get(headerName) ?? null;
}

function createHeaderBag(seed = {}) {
  const entries = new Map();
  Object.entries(seed || {}).forEach(([key, value]) => {
    entries.set(key.toLowerCase(), value);
  });

  return {
    get(name) {
      return entries.get(name.toLowerCase()) ?? null;
    },
    set(name, value) {
      entries.set(name.toLowerCase(), value);
    },
    has(name) {
      return entries.has(name.toLowerCase());
    },
    entries() {
      return entries.entries();
    },
  };
}
