export type AdaptiveCardFact = { title: string; value: string };

export type AdaptiveCardTextBlock = {
  type: "TextBlock";
  text: string;
  weight?: "Bolder" | "Default" | "Lighter";
  size?: "Small" | "Default" | "Medium" | "Large" | "ExtraLarge";
  color?: "Default" | "Dark" | "Light" | "Accent" | "Good" | "Warning" | "Attention";
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
  contentUrl: null;
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
  workflow_run_conclusion: ("success" | "failure")[];
};
