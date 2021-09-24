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

  (The notification will be sent on both: success and failure conclusions.)
  ```

All of the supported events can be configured in a single workflow.

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
    steps:
      - name: Send pull requests to Microsoft Teams
        uses: metro-digital/ms-teams-notification-action@v1.0.0
        with:
          webhook_url: ${{ secrets.MSTEAMS_WEBHOOK_URL }}
```

## License

This project is licensed under the terms of the [MIT license](LICENSE).
