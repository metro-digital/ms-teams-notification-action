module.exports = {
  roots: ["<rootDir>/src/", "<rootDir>/tests/"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  testRegex: "(/__tests__/.*|\\.(test|spec))\\.[tj]sx?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  verbose: true,
  testEnvironment: "node",
  testTimeout: 60000,
  testPathIgnorePatterns: ["/node_modules/"],
  maxWorkers: 16,
};