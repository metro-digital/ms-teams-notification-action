import {
  AdaptiveCardAction,
  AdaptiveCardBodyItem,
  AdaptiveCardFactSet,
  GitHubContext as Context,
  NameUrl,
  NameValue,
  TeamsPayload,
} from "./types";

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

export const workflowNameFact = (ctx: Context): NameValue => {
  const workflow = ctx.payload.workflow;

  if (
    typeof workflow !== "object" ||
    workflow === null ||
    typeof workflow.name !== "string"
  ) {
    throw new Error("Could not determine workflow name");
  }

  return {
    name: "Workflow name",
    value: workflow.name,
  };
};

export const headCommitFact = (ctx: Context): NameValue => {
  const workflowRun = ctx.payload.workflow_run;

  if (
    typeof workflowRun !== "object" ||
    workflowRun === null ||
    typeof workflowRun.head_commit !== "object" ||
    workflowRun.head_commit === null ||
    typeof workflowRun.head_commit.message !== "string"
  ) {
    throw new Error("Could not determine head commit");
  }

  return {
    name: "Head commit",
    value: workflowRun.head_commit.message,
  };
};

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

export const deployedReleaseFact = async (
  ctx: Context,
  token: string,
): Promise<NameValue | null> => {
  if (ctx.eventName !== "workflow_run") {
    return null;
  }

  const workflowRun = ctx.payload.workflow_run;
  if (typeof workflowRun !== "object" || workflowRun === null) {
    return null;
  }

  const jobsUrl = workflowRun.jobs_url;
  if (typeof jobsUrl !== "string") {
    return null;
  }

  const jobId = await getFirstWorkflowRunJobId(jobsUrl, token);
  const logs = await getJobLogs(ctx, jobId, token);

  const checkoutRef = extractCheckoutRef(logs);
  const tagSha = extractHeadSha(logs);

  if (!checkoutRef || !tagSha || !isVersionBranch(checkoutRef)) {
    return null;
  }

  const mainSha = workflowRun.head_sha;

  if (mainSha === tagSha) {
    return {
      name: "Deployed release",
      value: `${checkoutRef}`,
    };
  }

  return {
    name: "Deployed release",
    value: `${checkoutRef} isn't the newest ⚠️`,
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

export const workflowRunUrl = (ctx: Context): NameUrl => {
  const workflowRun = ctx.payload.workflow_run;

  if (
    typeof workflowRun !== "object" ||
    workflowRun === null ||
    typeof workflowRun.html_url !== "string"
  ) {
    throw new Error("Could not determine workflowRunUrl");
  }

  return {
    name: "Workflow Run",
    url: workflowRun.html_url,
  };
};

export const headCommitUrl = (ctx: Context): NameUrl => {
  const headCommit = ctx.payload.head_commit;

  if (
    typeof headCommit !== "object" ||
    headCommit === null ||
    typeof headCommit.url !== "string"
  ) {
    throw new Error("Could not determine headCommitUrl");
  }

  return {
    name: "Head Commit",
    url: headCommit.url,
  };
};

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
