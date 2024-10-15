import {
  ContextPayload,
  NameUrl,
  NameValue,
  PotentialAction,
  Sections,
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

export const factSection = (facts: NameValue[]): Sections => ({
  sections: [
    {
      facts,
    },
  ],
});

export const urlSection = (values: NameUrl[]): PotentialAction => ({
  potentialAction: values.map(({ name, url }) => ({
    "@type": "OpenUri",
    name,
    targets: [
      {
        os: "default",
        uri: url,
      },
    ],
  })),
});

export const defaultPayload = (ctx: Context): ContextPayload => {
  let payload = {
    title: "unknown action",
    text: `event: ${ctx.eventName}`,
  };

  const urls: NameUrl[] = [];
  if (ctx.payload.repository?.html_url) {
    urls.push(repoUrl(ctx));
  }

  if (ctx.payload["workflow_run"]?.html_url) {
    urls.push(workflowRunUrl(ctx));
  }

  const facts: NameValue[] = [];
  if (ctx.actor) {
    facts.push(senderFact(ctx));
  }

  if (ctx.repo.repo) {
    facts.push(repositoryFact(ctx));
  }

  if (urls.length > 0) {
    payload = { ...payload, ...urlSection(urls) };
  }
  if (facts.length > 0) {
    payload = { ...payload, ...factSection(facts) };
  }

  return payload;
};
