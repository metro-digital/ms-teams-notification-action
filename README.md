<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>


# MS Teams Notification Action

A GitHub action that sends notifications to MS Teams on events specified in the
workflow.

## Version Information

- **v2**: Uses Power Automate workflow integration for enhanced notification capabilities
- **v1**: Uses legacy MS Teams webhooks

## Breaking Changes in v2

Version 2 introduces a significant change in how notifications are delivered:

### Migration from Webhooks to Power Automate Workflow

**v1** used direct MS Teams webhook URLs for sending notifications. **v2** transitions to Power Automate workflow integration for improved reliability, formatting, and scalability.

**Breaking Changes:**
- The `webhook_url` input parameter is deprecated in v2
- Power Automate workflow URL configuration is now required
- Payload structure and formatting have been updated
- Some webhook-specific options are no longer supported

**Migration Guide:**
If you're upgrading from v1 to v2, you will need to:
1. Set up a Power Automate workflow in your tenant
2. Update your GitHub workflow configuration to use the new `power_automate_url` parameter
3. Test notifications in a non-production environment first

**For v1 Users:**
v1 continues to be available and supported. To stay on v1, pin your workflow to `@v1.0.3` or use the `v1` branch.


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

  (The notification will be sent by default on both: success and failure conclusions.)
  ```

You can set the options workflow_run_success and workflow_run_failure to false to disable the notification. E.g. if you want to only get notifications on failures, set workflow_run_success to false. 

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
        uses: metro-digital/ms-teams-notification-action@v1.0.3
        with:
          webhook_url: ${{ secrets.MSTEAMS_WEBHOOK_URL }}
          workflow_run_success: true # default is true
          workflow_run_failure: true # default is true
```



## License

This project is licensed under the terms of the [MIT license](LICENSE).
