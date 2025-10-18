export function registerCustomMatchers() {
  expect.extend({
    toBeValidUUID(received) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const pass = uuidRegex.test(received);

      return {
        pass,
        message: () =>
          pass
            ? `expected ${received} not to be a valid UUID v4`
            : `expected ${received} to be a valid UUID v4`,
      };
    },

    toHaveTaskStatus(received, expectedStatus) {
      const pass = received.status === expectedStatus;

      return {
        pass,
        message: () =>
          pass
            ? `expected task status not to be ${expectedStatus}`
            : `expected task status to be ${expectedStatus}, got ${received.status}`,
      };
    },

    toBeArchivedProject(received) {
      const pass = Boolean(received.archived);

      return {
        pass,
        message: () =>
          pass
            ? "expected project not to be archived"
            : "expected project to be archived",
      };
    },
  });
}
