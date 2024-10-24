import { getInput } from "@actions/core";
import { Config } from "./types";

export const readInputs = (): Config => {
  const result: Config = {
    webhook_url: getInput("webhook_url"),
    workflow_conclusion: getInput("conclusion"),
  };
  if (result.webhook_url === "") {
    throw new Error("[Error] Missing Microsoft Teams Incoming Webhooks URL.");
  }

  if (result.workflow_conclusion === "") {
    result.workflow_conclusion = "unknown";
  }

  return result;
};
