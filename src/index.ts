import { info, setFailed, getInput } from "@actions/core";
import { context } from "@actions/github";
import { Context } from "@actions/github/lib/context";
import { Config, ContextPayload, PayloadHeader } from "./types";
import {
  changelogFact,
  defaultPayload,
  factSection,
  headCommitFact,
  headCommitUrl,
  pullRequestUrl,
  repoUrl,
  repositoryFact,
  senderFact,
  urlSection,
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
    const payload: PayloadHeader & ContextPayload = {
      "@context": "http://schema.org/extensions",
      "@type": "MessageCard",
      themeColor: "0076D7",
      summary: ctx.eventName,
      ...getContextPayload(ctx, getConfig()),
    };

    const response = await fetch(config.webhook_url, {
      body: JSON.stringify(payload),
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "manual",
    });

    if (!response?.text) {
      info(JSON.stringify(payload, null, 2));
      throw new Error(
        `${"Failed to send notification to Microsoft Teams.\n Response:\n"}${JSON.stringify(
          response,
          null,
          2,
        )}`,
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

const getContextPayload = (ctx: Context, config: Config): ContextPayload => {
  if (
    (ctx.eventName === "pull_request" ||
      ctx.eventName === "pull_request_target") &&
    (ctx.payload.action === "opened" || ctx.payload.action === "reopened")
  ) {
    const text = ctx.payload.pull_request ? ctx.payload.pull_request.title : "";

    return {
      title: `Pull request ${ctx.payload.action}`,
      text,
      ...factSection([senderFact(ctx), repositoryFact(ctx)]),
      ...urlSection([repoUrl(ctx), pullRequestUrl(ctx)]),
    };
  }

  if (ctx.eventName === "push") {
    return {
      title: `Push to ${ctx.ref}`,
      ...factSection([
        senderFact(ctx),
        repositoryFact(ctx),
        changelogFact(ctx),
      ]),
      ...urlSection([repoUrl(ctx), headCommitUrl(ctx)]),
    };
  }

  if (
    ctx.eventName === "workflow_run" &&
    config.workflow_run_conclusion.includes(
      ctx.payload["workflow_run"].conclusion,
    )
  ) {
    return {
      title: `Workflow ${ctx.payload["workflow_run"].conclusion}`,
      themeColor:
        ctx.payload["workflow_run"].conclusion === "failure"
          ? "FF0000"
          : "00FF00",
      ...factSection([
        senderFact(ctx),
        repositoryFact(ctx),
        workflowNameFact(ctx),
        headCommitFact(ctx),
      ]),
      ...urlSection([repoUrl(ctx), workflowRunUrl(ctx)]),
    };
  }

  info(JSON.stringify(ctx, null, 2));
  return defaultPayload(ctx);
};

run();
