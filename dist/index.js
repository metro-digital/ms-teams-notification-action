"use strict";

// src/core.ts
var import_node_os = require("node:os");
var getInput = (name) => {
  const value = process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] ?? "";
  return value.trim();
};
var info = (message) => {
  process.stdout.write(message + import_node_os.EOL);
};
var escapeData = (value) => value.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
var setFailed = (message) => {
  process.exitCode = 1;
  process.stdout.write(`::error::${escapeData(message)}${import_node_os.EOL}`);
};

// src/index.ts
var import_node_fs = require("node:fs");

// src/utils.ts
var changelogFact = (ctx) => {
  const commits = ctx.payload["commits"];
  if (commits && commits.length > 1) {
    return {
      name: "Changelog",
      value: commits.map((c) => `- ${c.message}`).join("\n")
    };
  }
  if (commits && commits.length === 1) {
    return {
      name: "Commit",
      value: commits[0].message
    };
  }
  return { name: "Changes", value: "" };
};
var senderFact = (ctx) => ({
  name: "By",
  value: ctx.actor
});
var repositoryFact = (ctx) => ({
  name: "Repository",
  value: ctx.repo.repo
});
var workflowNameFact = (ctx) => {
  const workflow = ctx.payload.workflow;
  if (typeof workflow !== "object" || workflow === null || typeof workflow.name !== "string") {
    throw new Error("Could not determine workflow name");
  }
  return {
    name: "Workflow name",
    value: workflow.name
  };
};
var headCommitFact = (ctx) => {
  const workflowRun = ctx.payload.workflow_run;
  if (typeof workflowRun !== "object" || workflowRun === null || typeof workflowRun.head_commit !== "object" || workflowRun.head_commit === null || typeof workflowRun.head_commit.message !== "string") {
    throw new Error("Could not determine head commit");
  }
  return {
    name: "Head commit",
    value: workflowRun.head_commit.message
  };
};
var isVersionBranch = (branch) => branch.startsWith("v+");
var getFirstWorkflowRunJobId = async (jobsUrl, token) => {
  const response = await fetch(jobsUrl, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch workflow run jobs.
Status: ${response.status}`
    );
  }
  const data = await response.json();
  const [firstJob] = data.jobs;
  if (!firstJob) {
    throw new Error("Workflow run has no jobs.");
  }
  return firstJob.id;
};
var getJobLogs = async (ctx, jobId, token) => {
  const { owner, repo } = ctx.repo;
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`
      }
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch job logs.
Status: ${response.status}`);
  }
  return response.text();
};
var extractCheckoutRef = (logs) => {
  const checkoutStep = logs.match(
    /##\[group\]Run actions\/checkout[^\n]*\n([\s\S]*?)##\[endgroup\]/
  );
  if (!checkoutStep) {
    return null;
  }
  const refMatch = checkoutStep[1].match(/\bref:\s*(\S+)/);
  return refMatch ? refMatch[1] : null;
};
var extractHeadSha = (logs) => {
  const commandMatch = logs.match(/git log -1 --format=%H\s*\n([^\n]*)/);
  if (!commandMatch) {
    return null;
  }
  const shaMatch = commandMatch[1].match(/([0-9a-f]{40})/);
  return shaMatch ? shaMatch[1] : null;
};
var deployedReleaseFact = async (ctx, token) => {
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
      value: `${checkoutRef}`
    };
  }
  return {
    name: "Deployed release",
    value: `${checkoutRef} isn't the newest \u26A0\uFE0F`
  };
};
var repoUrl = (ctx) => {
  if (typeof ctx.payload.repository !== "object" || ctx.payload.repository === null || typeof ctx.payload.repository.html_url !== "string") {
    throw new Error("Could not determine repoUrl");
  }
  return {
    name: "Repository",
    url: ctx.payload.repository.html_url
  };
};
var pullRequestUrl = (ctx) => {
  if (typeof ctx.payload.pull_request !== "object" || ctx.payload.pull_request === null || typeof ctx.payload.pull_request.html_url !== "string") {
    throw new Error("Could not determine pullRequestUrl");
  }
  return {
    name: "Pull Request",
    url: ctx.payload.pull_request.html_url
  };
};
var workflowRunUrl = (ctx) => {
  const workflowRun = ctx.payload.workflow_run;
  if (typeof workflowRun !== "object" || workflowRun === null || typeof workflowRun.html_url !== "string") {
    throw new Error("Could not determine workflowRunUrl");
  }
  return {
    name: "Workflow Run",
    url: workflowRun.html_url
  };
};
var headCommitUrl = (ctx) => {
  const headCommit = ctx.payload.head_commit;
  if (typeof headCommit !== "object" || headCommit === null || typeof headCommit.url !== "string") {
    throw new Error("Could not determine headCommitUrl");
  }
  return {
    name: "Head Commit",
    url: headCommit.url
  };
};
var factSection = (facts) => ({
  type: "FactSet",
  facts: facts.map(({ name, value }) => ({ title: name, value }))
});
var urlActions = (values) => values.map(({ name, url }) => ({
  type: "Action.OpenUrl",
  title: name,
  url
}));
var buildTeamsPayload = (title, body, actions, accentColor) => ({
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
            ...accentColor ? { color: accentColor } : {},
            wrap: true
          },
          ...body
        ],
        ...actions.length > 0 ? { actions } : {}
      }
    }
  ]
});
var defaultPayload = (ctx) => {
  const body = [
    { type: "TextBlock", text: `event: ${ctx.eventName}`, wrap: true }
  ];
  const facts = [];
  const urls = [];
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

// src/index.ts
async function run() {
  try {
    const config = getConfig();
    if (config.webhook_url === "") {
      throw new Error("[Error] Missing Microsoft Teams Incoming Webhooks URL.");
    }
    const ctx = getContext();
    const payload = await getContextPayload(ctx, config);
    const response = await fetch(config.webhook_url, {
      body: JSON.stringify(payload),
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "manual"
    });
    if (!response.ok) {
      const body = await response.text();
      info(JSON.stringify(payload, null, 2));
      throw new Error(
        `Failed to send notification to Microsoft Teams.
Status: ${response.status}
Response: ${body}`
      );
    }
  } catch (err) {
    if (err instanceof Error) setFailed(err.message);
  }
}
var getConfig = () => {
  const result = {
    webhook_url: getInput("webhook_url"),
    github_token: getInput("github_token"),
    workflow_run_conclusion: []
  };
  if ([false, "false"].includes(getInput("workflow_run_success")) ? false : true) {
    result.workflow_run_conclusion.push("success");
  }
  if ([false, "false"].includes(getInput("workflow_run_failure")) ? false : true) {
    result.workflow_run_conclusion.push("failure");
  }
  return result;
};
var getContext = () => {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  const payload = eventPath && (0, import_node_fs.existsSync)(eventPath) ? JSON.parse((0, import_node_fs.readFileSync)(eventPath, { encoding: "utf8" })) : {};
  const [owner = "", repo = ""] = (process.env.GITHUB_REPOSITORY ?? "/").split(
    "/"
  );
  return {
    payload,
    eventName: process.env.GITHUB_EVENT_NAME ?? "",
    ref: process.env.GITHUB_REF ?? "",
    actor: process.env.GITHUB_ACTOR ?? "",
    repo: { owner, repo }
  };
};
var getContextPayload = async (ctx, config) => {
  if ((ctx.eventName === "pull_request" || ctx.eventName === "pull_request_target") && (ctx.payload.action === "opened" || ctx.payload.action === "reopened")) {
    const text = ctx.payload.pull_request ? ctx.payload.pull_request.title ?? "" : "";
    return buildTeamsPayload(
      `Pull request ${ctx.payload.action}`,
      [
        { type: "TextBlock", text, wrap: true },
        factSection([senderFact(ctx), repositoryFact(ctx)])
      ],
      urlActions([repoUrl(ctx), pullRequestUrl(ctx)])
    );
  }
  if (ctx.eventName === "push") {
    return buildTeamsPayload(
      `Push to ${ctx.ref}`,
      [factSection([senderFact(ctx), repositoryFact(ctx), changelogFact(ctx)])],
      urlActions([repoUrl(ctx), headCommitUrl(ctx)])
    );
  }
  const workflowRun = ctx.payload.workflow_run;
  if (ctx.eventName === "workflow_run" && workflowRun && workflowRun.conclusion && config.workflow_run_conclusion.includes(workflowRun.conclusion)) {
    const conclusion = workflowRun.conclusion;
    const facts = [
      senderFact(ctx),
      repositoryFact(ctx),
      workflowNameFact(ctx),
      headCommitFact(ctx)
    ];
    try {
      const deployedFact = await deployedReleaseFact(ctx, config.github_token);
      if (deployedFact) {
        facts.push(deployedFact);
      }
    } catch (err) {
      info(
        `Could not determine deployed release: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    return buildTeamsPayload(
      `Workflow ${conclusion}`,
      [factSection(facts)],
      urlActions([repoUrl(ctx), workflowRunUrl(ctx)]),
      conclusion === "failure" ? "Attention" : "Good"
    );
  }
  info(JSON.stringify(ctx, null, 2));
  return defaultPayload(ctx);
};
run();
