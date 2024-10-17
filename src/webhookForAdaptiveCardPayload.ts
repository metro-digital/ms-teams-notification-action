import { MS_TEAMS_WEBHOOK } from "./webhook";
import { Context } from "@actions/github/lib/context";
import { AdaptiveCardElement, Config, Payload } from "./types";
import { getConfig } from "./utils";

export class WebhookForAdaptiveCardPayload implements MS_TEAMS_WEBHOOK {
  url: string;

  constructor(url: string) {
    this.url = url;
  }

  preparePayload(ctx: Context): Payload {
    const name = ctx.payload.sender?.login;
    const eventName = ctx.eventName;
    const workflowName = ctx.workflow;
    const repositoryLink = `[${ctx.payload.repository?.full_name}](${ctx.payload.repository?.html_url})`;
    const statusMessage = getWorkflowStatusMessage(getConfig());
    return {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          content: {
            type: "AdaptiveCard",
            body: [
              {
                type: "TextBlock",
                size: "Medium",
                weight: "Bolder",
                text: `${name} triggered ${workflowName} via ${eventName}`,
                style: "heading",
                wrap: true,
              },
              {
                type: "TextBlock",
                size: "Medium",
                weight: "lighter",
                text: repositoryLink,
              },
              statusMessage,
              {
                type: "ActionSet",
                actions: [
                  {
                    type: "Action.OpenUrl",
                    title: "Repository",
                    url: ctx.payload.repository?.html_url as string,
                  },
                ],
              },
            ],
          },
        },
      ],
    };
  }

  async send(payload: Payload): Promise<Response> {
    return fetch(this.url, {
      body: JSON.stringify(payload),
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "manual",
    });
  }
}

export function getWorkflowStatusMessage(config: Config): AdaptiveCardElement {
  const conclusion = config.workflow_conclusion;
  if (conclusion === "success") {
    return getStatusMessageWith(
      "Success!",
      "https://raw.githubusercontent.com/metro-digital/ms-teams-notification-action/send_notification_using_workflows_also/images/check.png",
    );
  } else if (conclusion === "failure") {
    return getStatusMessageWith(
      "Failed!",
      "https://raw.githubusercontent.com/metro-digital/ms-teams-notification-action/send_notification_using_workflows_also/images/fail.png",
    );
  } else {
    return getStatusMessageWith(
      "Unknown/Cancelled/Skipped",
      "https://raw.githubusercontent.com/metro-digital/ms-teams-notification-action/send_notification_using_workflows_also/images/unknown.png",
    );
  }
}

function getStatusMessageWith(
  status: string,
  iconURL: string,
): AdaptiveCardElement {
  return {
    type: "ColumnSet",
    columns: [
      {
        type: "Column",
        items: [
          {
            type: "Image",
            style: "person",
            url: iconURL,
            altText: "Result",
            size: "small",
          },
        ],
        width: "auto",
      },
      {
        type: "Column",
        items: [
          {
            type: "TextBlock",
            weight: "bolder",
            text: status,
          },
        ],
        width: "stretch",
      },
    ],
  };
}
