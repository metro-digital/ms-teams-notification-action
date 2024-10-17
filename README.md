<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>


# MS Teams Notification Action

A GitHub action that sends notifications to MS Teams on events specified in the
workflow.

Supported events:
  ```
  pull_request
    types: [opened, reopened]
  ```
  ```
  push
    branches: []
  ```

  ```
  workflow_run
    types: [completed]
  ```

Example usage:
```yaml
name: notifications

on:
  pull_request:
    types: [opened, reopened]
  push:
    branches: [main]
  workflow_run:
    types: [completed]
    workflows: [my_workflow_name]

jobs:
  send:
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Send pull requests to Microsoft Teams
        uses: metro-digital/ms-teams-notification-action@v1.0.3
        with:
          webhook_url: ${{ secrets.MSTEAMS_WEBHOOK_URL }}
          conclusion: ${{ github.workflow.conclusion }}
```

If you want to have notifications only for failure runs you can have an `if` statement at step level.

Example usage:

```yaml
name: notifications

on:
  pull_request:
    types: [opened, reopened]
  push:
    branches: [main]
  workflow_run:
    types: [completed]
    workflows: [my_workflow_name]

jobs:
  send:
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Send pull requests to Microsoft Teams
        if: {{ github.workflow.conclusion == 'failure' }}
        uses: metro-digital/ms-teams-notification-action@v2.0.0
        with:
          webhook_url: ${{ secrets.MSTEAMS_WEBHOOK_URL }}
          conclusion: ${{ github.workflow.conclusion }}
```

## License

This project is licensed under the terms of the [MIT license](LICENSE).
