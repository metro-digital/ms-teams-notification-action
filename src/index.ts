import { info, setFailed, getInput } from "./core";
import { existsSync, readFileSync } from "node:fs";
import { Config, GitHubContext, TeamsPayload } from "./types";
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
  deployedReleaseFact,
  workflowNameFact,
  workflowRunUrl,
} from "./utils";

async function run(): Promise<void> {
  try {
    const config = getConfig();

    if (config.webhook_url === "") {
      throw new Error("[Error] Missing Microsoft Teams Incoming Webhooks URL.");
    }

    const ctx = getContext();
    const payload: TeamsPayload = await getContextPayload(ctx, config);

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
    github_token: getInput("github_token"),
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

const getContext = (): GitHubContext => {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  const payload =
    eventPath && existsSync(eventPath)
      ? JSON.parse(readFileSync(eventPath, { encoding: "utf8" }))
      : {};

  const [owner = "", repo = ""] = (process.env.GITHUB_REPOSITORY ?? "/").split(
    "/",
  );

  return {
    payload,
    eventName: process.env.GITHUB_EVENT_NAME ?? "",
    ref: process.env.GITHUB_REF ?? "",
    actor: process.env.GITHUB_ACTOR ?? "",
    repo: { owner, repo },
  };
};

const getContextPayload = async (
  ctx: GitHubContext,
  config: Config,
): Promise<TeamsPayload> => {
  if (
    (ctx.eventName === "pull_request" ||
      ctx.eventName === "pull_request_target") &&
    (ctx.payload.action === "opened" || ctx.payload.action === "reopened")
  ) {
    const text = ctx.payload.pull_request
      ? (ctx.payload.pull_request.title ?? "")
      : "";

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

  const workflowRun = ctx.payload.workflow_run;

  if (
    ctx.eventName === "workflow_run" &&
    workflowRun &&
    workflowRun.conclusion &&
    config.workflow_run_conclusion.includes(workflowRun.conclusion)
  ) {
    const conclusion = workflowRun.conclusion;
    const facts = [
      senderFact(ctx),
      repositoryFact(ctx),
      workflowNameFact(ctx),
      headCommitFact(ctx),
    ];

    const mismatchFact = await deployedReleaseFact(ctx, config.github_token);
    if (mismatchFact) {
      facts.push(mismatchFact);
    }

    return buildTeamsPayload(
      `Workflow ${conclusion}`,
      [factSection(facts)],
      urlActions([repoUrl(ctx), workflowRunUrl(ctx)]),
      conclusion === "failure" ? "Attention" : "Good",
    );
  }

  info(JSON.stringify(ctx, null, 2));
  return defaultPayload(ctx);
};

run();
