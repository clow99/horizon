module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/__tests__/**/*.test.js", "**/*.test.js"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/tests/e2e/"],
  transformIgnorePatterns: [
    "node_modules/(?!(uuid|next-auth|@auth|@panva|jose)/)",
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/tests/",
    "/coverage/",
    "/.next/",
  ],
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/**/*.test.{js,jsx}",
    "!src/**/__tests__/**",
    "!src/app/api-docs/**",
    "!src/app/changelog/**",
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    "./src/lib/**": {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
  },
  transform: {
    "^.+\\.(js|jsx)$": ["babel-jest", { configFile: "./babel.config.cjs" }],
  },
  moduleFileExtensions: ["js", "jsx", "json"],
  testTimeout: 10000,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
};
