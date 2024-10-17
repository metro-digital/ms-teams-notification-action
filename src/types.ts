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

export type Payload = AdaptiveCard;
