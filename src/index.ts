import { info, setFailed } from "@actions/core";
import { context } from "@actions/github";
import { getConfig } from "./utils";
import { WebhookForAdaptiveCardPayload } from "./webhookForAdaptiveCardPayload";

async function run(): Promise<void> {
  try {
    const config = getConfig();
    if (config.webhook_url === "") {
      throw new Error("[Error] Missing Microsoft Teams Incoming Webhooks URL.");
    }

    const webhook = new WebhookForAdaptiveCardPayload(config.webhook_url);
    const payload = webhook.preparePayload(context);
    const response = await webhook.send(payload);
    if (!response?.text) {
      info(JSON.stringify(payload, null, 2));
      throw new Error(
        `${"Failed to send notification to Microsoft Teams.\n Response:\n"}${JSON.stringify(
          response,
          null,
          2,
        )}`,
      );
    }
  } catch (err) {
    if (err instanceof Error) setFailed(err.message);
  }
}

run();
