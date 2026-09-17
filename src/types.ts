export type AdaptiveCardFact = { title: string; value: string };

export type AdaptiveCardTextBlock = {
  type: "TextBlock";
  text: string;
  weight?: "Bolder" | "Default" | "Lighter";
  size?: "Small" | "Default" | "Medium" | "Large" | "ExtraLarge";
  color?:
    "Default" | "Dark" | "Light" | "Accent" | "Good" | "Warning" | "Attention";
  wrap?: boolean;
};

export type AdaptiveCardFactSet = {
  type: "FactSet";
  facts: AdaptiveCardFact[];
};

export type AdaptiveCardBodyItem = AdaptiveCardTextBlock | AdaptiveCardFactSet;

export type AdaptiveCardAction = {
  type: "Action.OpenUrl";
  title: string;
  url: string;
};

export type AdaptiveCard = {
  $schema: string;
  type: "AdaptiveCard";
  version: string;
  body: AdaptiveCardBodyItem[];
  actions?: AdaptiveCardAction[];
};

export type AdaptiveCardAttachment = {
  contentType: "application/vnd.microsoft.card.adaptive";
  content: AdaptiveCard;
};

export type TeamsPayload = {
  type: "message";
  attachments: AdaptiveCardAttachment[];
};

export type NameValue = { name: string; value: string };
export type NameUrl = { name: string; url: string };

export type Config = {
  webhook_url: string;
  github_token: string;
  workflow_run_conclusion: ("success" | "failure")[];
};

export type WebhookPayloadCommit = {
  [key: string]: unknown;
  message: string;
};

export type WebhookPayloadWorkflow = {
  [key: string]: unknown;
  name?: string;
};

export type WebhookPayloadWorkflowRun = {
  [key: string]: unknown;
  conclusion?: "success" | "failure";
  jobs_url?: string;
  html_url?: string;
  head_sha?: string;
  head_commit?: {
    [key: string]: unknown;
    message?: string;
  };
};

export type WebhookPayloadRepository = {
  [key: string]: unknown;
  name?: string;
  owner?: { [key: string]: unknown; login?: string };
  html_url?: string;
};

export type WebhookPayloadPullRequest = {
  [key: string]: unknown;
  html_url?: string;
  title?: string;
};

export type WebhookPayload = {
  [key: string]: unknown;
  repository?: WebhookPayloadRepository;
  pull_request?: WebhookPayloadPullRequest;
  workflow?: WebhookPayloadWorkflow;
  workflow_run?: WebhookPayloadWorkflowRun;
  head_commit?: {
    [key: string]: unknown;
    url?: string;
  };
  commits?: WebhookPayloadCommit[];
  action?: string;
};

export type GitHubContext = {
  payload: WebhookPayload;
  eventName: string;
  ref: string;
  actor: string;
  repo: { owner: string; repo: string };
};
