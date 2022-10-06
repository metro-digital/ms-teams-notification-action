/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as core from '@actions/core'
import * as github from '@actions/github'
import {Config, ContextPayload, PayloadHeader} from './types'
import {
  changelogFact,
  defaultPayload,
  factSection,
  headCommitFact,
  headCommitUrl,
  pullRequestUrl,
  repoUrl,
  repositoryFact,
  senderFact,
  urlSection,
  workflowNameFact,
  workflowRunUrl
} from './utils'
import {Context} from '@actions/github/lib/context'
import {IncomingWebhook} from 'ms-teams-webhook'

async function run(): Promise<void> {
  try {
    const config = getConfig()

    if (config.webhook_url === '') {
      throw new Error('[Error] Missing Microsoft Teams Incoming Webhooks URL.')
    }

    const ctx = github.context
    const payload: PayloadHeader & ContextPayload = {
      '@context': 'http://schema.org/extensions',
      '@type': 'MessageCard',
      themeColor: '0076D7',
      summary: ctx.eventName,
      ...getContextPayload(ctx, getConfig())
    }

    const client = new IncomingWebhook(config.webhook_url)
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
    if (err instanceof Error) core.setFailed(err.message)
  }
}

const getConfig = (): Config => {
  const webhook_url = core.getInput('webhook_url')

  const workflow_run_conclusion: ('success' | 'failure')[] = []

  if (core.getInput('workflow_run_success') ?? true) {
    workflow_run_conclusion.push('success')
  }
  if (core.getInput('workflow_run_failure') ?? true) {
    workflow_run_conclusion.push('failure')
  }
  return {
    webhook_url,
    workflow_run_conclusion
  }
}

const getContextPayload = (ctx: Context, config: Config): ContextPayload => {
  if (
    (ctx.eventName === 'pull_request' ||
      ctx.eventName === 'pull_request_target') &&
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
    config.workflow_run_conclusion.includes(
      ctx.payload['workflow_run'].conclusion
    )
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
