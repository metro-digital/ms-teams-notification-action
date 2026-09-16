import { info } from "@actions/core";
import {
  AdaptiveCardAction,
  AdaptiveCardBodyItem,
  AdaptiveCardFactSet,
  NameUrl,
  NameValue,
  TeamsPayload,
} from "./types";
import type { Context } from "@actions/github/lib/context";

export const changelogFact = (ctx: Context): NameValue => {
  const commits = ctx.payload["commits"];
  if (commits && commits.length > 1) {
    return {
      name: "Changelog",
      value: commits
        .map((c: { message: string }) => `- ${c.message}`)
        .join("\n"),
    };
  }

  if (commits && commits.length === 1) {
    return {
      name: "Commit",
      value: commits[0].message,
    };
  }

  return { name: "Changes", value: "" };
};

export const senderFact = (ctx: Context): NameValue => ({
  name: "By",
  value: ctx.actor,
});

export const repositoryFact = (ctx: Context): NameValue => ({
  name: "Repository",
  value: ctx.repo.repo,
});

export const workflowNameFact = (ctx: Context): NameValue => ({
  name: "Workflow name",
  value: ctx.payload["workflow"].name,
});

export const headCommitFact = (ctx: Context): NameValue => ({
  name: "Head commit",
  value: ctx.payload["workflow_run"].head_commit.message,
});

export const isVersionBranch = (branch: string): boolean =>
  branch.startsWith("v+");

const getFirstWorkflowRunJobId = async (
  jobsUrl: string,
  token: string,
): Promise<number> => {
  const response = await fetch(jobsUrl, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch workflow run jobs.\nStatus: ${response.status}`,
    );
  }

  const data = (await response.json()) as { jobs: { id: number }[] };
  const [firstJob] = data.jobs;
  if (!firstJob) {
    throw new Error("Workflow run has no jobs.");
  }

  return firstJob.id;
};

const getJobLogs = async (
  ctx: Context,
  jobId: number,
  token: string,
): Promise<string> => {
  const { owner, repo } = ctx.repo;
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch job logs.\nStatus: ${response.status}`);
  }

  return response.text();
};

// the actual checked-out ref is only known from the checkout step logs, not the workflow_run payload
const extractCheckoutRef = (logs: string): string | null => {
  const checkoutStep = logs.match(
    /##\[group\]Run actions\/checkout[^\n]*\n([\s\S]*?)##\[endgroup\]/,
  );
  if (!checkoutStep) {
    return null;
  }

  const refMatch = checkoutStep[1].match(/\bref:\s*(\S+)/);
  return refMatch ? refMatch[1] : null;
};

// the actual checked-out commit is only known from the "git log -1" step output, not head_sha
const extractHeadSha = (logs: string): string | null => {
  const commandMatch = logs.match(/git log -1 --format=%H\s*\n([^\n]*)/);
  if (!commandMatch) {
    return null;
  }

  const shaMatch = commandMatch[1].match(/([0-9a-f]{40})/);
  return shaMatch ? shaMatch[1] : null;
};

export const versionBranchMismatchFact = async (
  ctx: Context,
  token: string,
): Promise<NameValue | null> => {
  if (ctx.eventName !== "workflow_run") {
    return null;
  }

  const jobsUrl = ctx.payload["workflow_run"].jobs_url;
  const jobId = await getFirstWorkflowRunJobId(jobsUrl, token);
  const logs = await getJobLogs(ctx, jobId, token);

  const checkoutRef = extractCheckoutRef(logs);
  const tagSha = extractHeadSha(logs);

  info(`checkoutRef: ${checkoutRef}, tagSha: ${tagSha}`);

  if (!checkoutRef || !tagSha || !isVersionBranch(checkoutRef)) {
    return null;
  }

  const mainSha = ctx.payload["workflow_run"].head_sha;
  info(`mainSha: ${mainSha}`);

  if (mainSha === tagSha) {
    return null;
  }

  return {
    name: "⚠️ Version branch warning",
    value: `Head commit (${mainSha}) does not match main (${tagSha}).`,
  };
};

export const repoUrl = (ctx: Context): NameUrl => {
  if (
    typeof ctx.payload.repository !== "object" ||
    ctx.payload.repository === null ||
    typeof ctx.payload.repository.html_url !== "string"
  ) {
    throw new Error("Could not determine repoUrl");
  }
  return {
    name: "Repository",
    url: ctx.payload.repository.html_url,
  };
};

export const pullRequestUrl = (ctx: Context): NameUrl => {
  if (
    typeof ctx.payload.pull_request !== "object" ||
    ctx.payload.pull_request === null ||
    typeof ctx.payload.pull_request.html_url !== "string"
  ) {
    throw new Error("Could not determine pullRequestUrl");
  }

  return {
    name: "Pull Request",
    url: ctx.payload.pull_request.html_url,
  };
};

export const workflowRunUrl = (ctx: Context): NameUrl => ({
  name: "Workflow Run",
  url: ctx.payload["workflow_run"].html_url,
});

export const headCommitUrl = (ctx: Context): NameUrl => ({
  name: "Head Commit",
  url: ctx.payload["head_commit"].url,
});

export const factSection = (facts: NameValue[]): AdaptiveCardFactSet => ({
  type: "FactSet",
  facts: facts.map(({ name, value }) => ({ title: name, value })),
});

export const urlActions = (values: NameUrl[]): AdaptiveCardAction[] =>
  values.map(({ name, url }) => ({
    type: "Action.OpenUrl",
    title: name,
    url,
  }));

export const buildTeamsPayload = (
  title: string,
  body: AdaptiveCardBodyItem[],
  actions: AdaptiveCardAction[],
  accentColor?: "Good" | "Attention",
): TeamsPayload => ({
  type: "message",
  attachments: [
    {
      contentType: "application/vnd.microsoft.card.adaptive",
      content: {
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        type: "AdaptiveCard",
        version: "1.4",
        body: [
          {
            type: "TextBlock",
            text: title,
            weight: "Bolder",
            size: "Medium",
            ...(accentColor ? { color: accentColor } : {}),
            wrap: true,
          },
          ...body,
        ],
        ...(actions.length > 0 ? { actions } : {}),
      },
    },
  ],
});

export const defaultPayload = (ctx: Context): TeamsPayload => {
  const body: AdaptiveCardBodyItem[] = [
    { type: "TextBlock", text: `event: ${ctx.eventName}`, wrap: true },
  ];
  const facts: NameValue[] = [];
  const urls: NameUrl[] = [];

  if (ctx.payload.repository?.html_url) {
    urls.push(repoUrl(ctx));
  }

  if (ctx.payload["workflow_run"]?.html_url) {
    urls.push(workflowRunUrl(ctx));
  }

  if (ctx.actor) {
    facts.push(senderFact(ctx));
  }

  if (ctx.repo.repo) {
    facts.push(repositoryFact(ctx));
  }

  if (facts.length > 0) {
    body.push(factSection(facts));
  }

  return buildTeamsPayload("unknown action", body, urlActions(urls));
};
