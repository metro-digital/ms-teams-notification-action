import { getInput } from "@actions/core";
import { Config } from "./types";

export const getConfig = (): Config => {
  const result: Config = {
    webhook_url: getInput("webhook_url"),
    workflow_conclusion: getInput("conclusion"),
  };
  if (result.workflow_conclusion === "") {
    result.workflow_conclusion = "unknown";
  }

  return result;
};
