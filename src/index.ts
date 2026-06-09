import { info, setFailed, getInput } from "@actions/core";
import { context } from "@actions/github";
import { Context } from "@actions/github/lib/context";
import { Config, TeamsPayload } from "./types";
import {
  buildTeamsPayload,
  changelogFact,
  defaultPayload,
  factSection,
  headCommitFact,
  headCommitUrl,
  pullRequestUrl,
  repoUrl,
  repositoryFact,
  senderFact,
  urlActions,
  workflowNameFact,
  workflowRunUrl,
} from "./utils";

async function run(): Promise<void> {
  try {
    const config = getConfig();

    if (config.webhook_url === "") {
      throw new Error("[Error] Missing Microsoft Teams Incoming Webhooks URL.");
    }

    const ctx = context;
    const payload: TeamsPayload = getContextPayload(ctx, config);

    const response = await fetch(config.webhook_url, {
      body: JSON.stringify(payload),
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "manual",
    });

    if (!response.ok) {
      const body = await response.text();
      info(JSON.stringify(payload, null, 2));
      throw new Error(
        `Failed to send notification to Microsoft Teams.\nStatus: ${response.status}\nResponse: ${body}`,
      );
    }
  } catch (err) {
    if (err instanceof Error) setFailed(err.message);
  }
}

const getConfig = (): Config => {
  const result: Config = {
    webhook_url: getInput("webhook_url"),
    workflow_run_conclusion: [],
  };

  if (
    [false, "false"].includes(getInput("workflow_run_success")) ? false : true
  ) {
    result.workflow_run_conclusion.push("success");
  }
  if (
    [false, "false"].includes(getInput("workflow_run_failure")) ? false : true
  ) {
    result.workflow_run_conclusion.push("failure");
  }
  return result;
};

const getContextPayload = (ctx: Context, config: Config): TeamsPayload => {
  if (
    (ctx.eventName === "pull_request" ||
      ctx.eventName === "pull_request_target") &&
    (ctx.payload.action === "opened" || ctx.payload.action === "reopened")
  ) {
    const text = ctx.payload.pull_request ? ctx.payload.pull_request.title : "";

    return buildTeamsPayload(
      `Pull request ${ctx.payload.action}`,
      [
        { type: "TextBlock", text, wrap: true },
        factSection([senderFact(ctx), repositoryFact(ctx)]),
      ],
      urlActions([repoUrl(ctx), pullRequestUrl(ctx)]),
    );
  }

  if (ctx.eventName === "push") {
    return buildTeamsPayload(
      `Push to ${ctx.ref}`,
      [factSection([senderFact(ctx), repositoryFact(ctx), changelogFact(ctx)])],
      urlActions([repoUrl(ctx), headCommitUrl(ctx)]),
    );
  }

  if (
    ctx.eventName === "workflow_run" &&
    config.workflow_run_conclusion.includes(
      ctx.payload["workflow_run"].conclusion,
    )
  ) {
    const conclusion = ctx.payload["workflow_run"].conclusion;
    return buildTeamsPayload(
      `Workflow ${conclusion}`,
      [
        factSection([
          senderFact(ctx),
          repositoryFact(ctx),
          workflowNameFact(ctx),
          headCommitFact(ctx),
        ]),
      ],
      urlActions([repoUrl(ctx), workflowRunUrl(ctx)]),
      conclusion === "failure" ? "Attention" : "Good",
    );
  }

  info(JSON.stringify(ctx, null, 2));
  return defaultPayload(ctx);
};

run();
