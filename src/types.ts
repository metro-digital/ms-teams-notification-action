export type MessageCard = PayloadHeader & ContextPayload;
export type PayloadHeader = { "@context": string; "@type": string };
export type ContextPayload = {
  title: string;
  text?: string;
  summary?: string;
  themeColor?: string;
} & PotentialAction &
  Sections;

export type NameValue = { name: string; value: string };
export type NameUrl = { name: string; url: string };

export type FactSection = { facts: NameValue[] };
export type Sections = { sections?: FactSection[] };

export type ActionTarget = { os: string; uri: string };
export type PotentialAction = {
  potentialAction?: {
    "@type": string;
    name: string;
    targets: ActionTarget[];
  }[];
};

export type Config = {
  webhook_url: string;
  workflow_conclusion: string;
};

export type AdaptiveCard = {
  type: string;
  attachments: Attachment[];
};

export type Attachment = {
  contentType: string;
  content: AdaptiveCardContent;
};

export type AdaptiveCardContent = {
  type: string;
  body: AdaptiveCardElement[];
};
export type AdaptiveCardElement = {
  type: string;
  size?: string;
  weight?: string;
  text?: string;
  style?: string;
  wrap?: boolean;
  facts?: AdaptiveCardNameValue[];
  columns?: Column[];
  url?: string;
  altText?: string;
  actions?: Action[];
};

export type Column = {
  type: string;
  weight?: string;
  items: item[];
  width?: string;
};
export type AdaptiveCardNameValue = {
  title: string;
  value: string;
};
export type Action = {
  type: string;
  url: string;
  title: string;
};

export type item = {
  type: string;
  text?: string;
  style?: string;
  url?: string;
  altText?: string;
  size?: string;
  weight?: string;
};

export type Payload = MessageCard | AdaptiveCard;
