import * as core from '@actions/core'
import * as github from '@actions/github'
import {Context} from '@actions/github/lib/context'
import {IncomingWebhook} from 'ms-teams-webhook'
import {
  changelogFact,
  factSection,
  headCommitFact,
  headCommitUrl,
  pullRequestUrl,
  repoUrl,
  repositoryFact,
  senderFact,
  urlSection,
  workflowNameFact,
  workflowRunUrl,
  defaultPayload
} from './utils'

import {ContextPayload, PayloadHeader} from './types'

async function run(): Promise<void> {
  try {
    const webhookUrl = core.getInput('webhook_url')
    if (webhookUrl === '') {
      throw new Error('[Error] Missing Microsoft Teams Incoming Webhooks URL.')
    }

    const ctx = github.context
    const payload: PayloadHeader & ContextPayload = {
      '@context': 'http://schema.org/extensions',
      '@type': 'MessageCard',
      themeColor: '0076D7',
      summary: ctx.eventName,
      ...getContextPayload(ctx)
    }

    const client = new IncomingWebhook(webhookUrl)
    const response = await client.send(JSON.stringify(payload))

    if (!response?.text) {
      core.info(JSON.stringify(payload, null, 2))
      throw new Error(
        `${'Failed to send notification to Microsoft Teams.\n Response:\n'}${JSON.stringify(
          response,
          null,
          2
        )}`
      )
    }
  } catch (err) {
    core.setFailed(err.message)
  }
}

const getContextPayload = (ctx: Context): ContextPayload => {
  if (
    ctx.eventName === 'pull_request' &&
    (ctx.payload.action === 'opened' || ctx.payload.action === 'reopened')
  ) {
    return {
      title: `Pull request ${ctx.payload.action}`,
      text: ctx.payload.pull_request!.title,
      ...factSection([senderFact(ctx), repositoryFact(ctx)]),
      ...urlSection([repoUrl(ctx), pullRequestUrl(ctx)])
    }
  }

  if (ctx.eventName === 'push') {
    return {
      title: `Push to ${ctx.ref}`,
      ...factSection([
        senderFact(ctx),
        repositoryFact(ctx),
        changelogFact(ctx)
      ]),
      ...urlSection([repoUrl(ctx), headCommitUrl(ctx)])
    }
  }

  if (
    ctx.eventName === 'workflow_run' &&
    (ctx.payload['workflow_run'].conclusion === 'failure' ||
      ctx.payload['workflow_run'].conclusion === 'success')
  ) {
    return {
      title: `Workflow ${ctx.payload['workflow_run'].conclusion}`,
      themeColor:
        ctx.payload['workflow_run'].conclusion === 'failure'
          ? 'FF0000'
          : '00FF00',
      ...factSection([
        senderFact(ctx),
        repositoryFact(ctx),
        workflowNameFact(ctx),
        headCommitFact(ctx)
      ]),
      ...urlSection([repoUrl(ctx), workflowRunUrl(ctx)])
    }
  }

  core.info(JSON.stringify(ctx, null, 2))
  return defaultPayload(ctx)
}

run()
