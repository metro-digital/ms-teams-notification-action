import { EOL } from "node:os";

// minimal stand-ins for the @actions/core helpers we use, avoiding the oidc/http-client/exec deps it bundles
export const getInput = (name: string): string => {
  const value =
    process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] ?? "";
  return value.trim();
};

export const info = (message: string): void => {
  process.stdout.write(message + EOL);
};

const escapeData = (value: string): string =>
  value.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");

export const setFailed = (message: string): void => {
  process.exitCode = 1;
  process.stdout.write(`::error::${escapeData(message)}${EOL}`);
};
