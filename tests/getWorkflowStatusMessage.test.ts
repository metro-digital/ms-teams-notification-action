import { Config } from '../src/types';
import { getWorkflowStatusMessage } from '../src/webhookForAdaptiveCardPayload';

test('When the conclusion passed to the action is success', () => {
  const actual = getWorkflowStatusMessage({workflow_conclusion: "success"} as Config);
  const expected = {
    type: "ColumnSet",
    columns: [
      {
        type: "Column",
        items: [
          {
            type: "Image",
            style: "person",
            url: "https://raw.githubusercontent.com/metro-digital/ms-teams-notification-action/send_notification_using_workflows_also/images/check.png",
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
            text: "Success!",
          },
        ],
        width: "stretch",
      },
    ],
  };

  expect(actual).toEqual(expected);
});

test('When the conclusion passed to the action is failure', () => {
  const actual = getWorkflowStatusMessage({workflow_conclusion: "failure"} as Config);
  const expected = {
    type: "ColumnSet",
    columns: [
      {
        type: "Column",
        items: [
          {
            type: "Image",
            style: "person",
            url: "https://raw.githubusercontent.com/metro-digital/ms-teams-notification-action/send_notification_using_workflows_also/images/fail.png",
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
            text: "Failed!",
          },
        ],
        width: "stretch",
      },
    ],
  };

  expect(actual).toEqual(expected);
});

test('When the conclusion passed to the action is anything other than success/failure', () => {
  const actual = getWorkflowStatusMessage({workflow_conclusion: "skipped"} as Config);
  const expected = {
    type: "ColumnSet",
    columns: [
      {
        type: "Column",
        items: [
          {
            type: "Image",
            style: "person",
            url: "https://raw.githubusercontent.com/metro-digital/ms-teams-notification-action/send_notification_using_workflows_also/images/unknown.png",
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
            text: "Unknown/Cancelled/Skipped",
          },
        ],
        width: "stretch",
      },
    ],
  };

  expect(actual).toEqual(expected);
});