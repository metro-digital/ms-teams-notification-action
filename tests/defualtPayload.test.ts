import { defaultPayload, versionBranchMismatchFact } from '../src/utils'

describe('defaultPayload', () => {
  test('when the payload does not have any html_url', () => {
    const ctx = {
      eventName: 'workflow_run',
      sha: 'dummy_sha',
      ref: 'refs/heads/main',
      workflow: 'dummy_workflow',
      action: 'dummy_action',
      actor: 'dummy_actor',
      job: 'dummy_job',
      runNumber: 1,
      runId: 1,
      apiUrl: 'https://api.github.com',
      serverUrl: 'https://github.com',
      graphqlUrl: 'https://api.github.com/graphql',
      issue: {
        owner: 'dummy_owner',
        repo: 'dummy_repo',
        number: 1
      },
      repo: {
        owner: 'dummy_owner',
        repo: 'dummy_repo'
      },
      payload: {}
    }

    const actual = defaultPayload(ctx as any)
    const expected = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: 'unknown action',
                weight: 'Bolder',
                size: 'Medium',
                wrap: true,
              },
              {
                type: 'TextBlock',
                text: 'event: workflow_run',
                wrap: true,
              },
              {
                type: 'FactSet',
                facts: [
                  { title: 'By', value: 'dummy_actor' },
                  { title: 'Repository', value: 'dummy_repo' },
                ],
              },
            ],
          },
        },
      ],
    }
    expect(actual).toEqual(expected)
  })

  test('when the payload has only repository html_url', () => {
    const ctx = {
      eventName: 'workflow_run',
      sha: 'dummy_sha',
      ref: 'refs/heads/main',
      workflow: 'dummy_workflow',
      action: 'dummy_action',
      actor: 'dummy_actor',
      job: 'dummy_job',
      runNumber: 1,
      runId: 1,
      apiUrl: 'https://api.github.com',
      serverUrl: 'https://github.com',
      graphqlUrl: 'https://api.github.com/graphql',
      issue: {
        owner: 'dummy_owner',
        repo: 'dummy_repo',
        number: 1
      },
      repo: {
        owner: 'dummy_owner',
        repo: 'dummy_repo'
      },
      payload: {
        repository: {
          html_url: 'https://dummy_repo_url'
        }
      }
    }

    const actual = defaultPayload(ctx as any)
    const expected = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: 'unknown action',
                weight: 'Bolder',
                size: 'Medium',
                wrap: true,
              },
              {
                type: 'TextBlock',
                text: 'event: workflow_run',
                wrap: true,
              },
              {
                type: 'FactSet',
                facts: [
                  { title: 'By', value: 'dummy_actor' },
                  { title: 'Repository', value: 'dummy_repo' },
                ],
              },
            ],
            actions: [
              { type: 'Action.OpenUrl', title: 'Repository', url: 'https://dummy_repo_url' },
            ],
          },
        },
      ],
    }
    expect(actual).toEqual(expected)
  })

  test('when the payload has only workflow_run html_url', () => {
    const ctx = {
      eventName: 'workflow_run',
      sha: 'dummy_sha',
      ref: 'refs/heads/main',
      workflow: 'dummy_workflow',
      action: 'dummy_action',
      actor: 'dummy_actor',
      job: 'dummy_job',
      runNumber: 1,
      runId: 1,
      apiUrl: 'https://api.github.com',
      serverUrl: 'https://github.com',
      graphqlUrl: 'https://api.github.com/graphql',
      issue: {
        owner: 'dummy_owner',
        repo: 'dummy_repo',
        number: 1
      },
      repo: {
        owner: 'dummy_owner',
        repo: 'dummy_repo'
      },
      payload: {
        workflow_run: {
          html_url: 'https://dummy_repo_url'
        }
      }
    }

    const actual = defaultPayload(ctx as any)
    const expected = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: 'unknown action',
                weight: 'Bolder',
                size: 'Medium',
                wrap: true,
              },
              {
                type: 'TextBlock',
                text: 'event: workflow_run',
                wrap: true,
              },
              {
                type: 'FactSet',
                facts: [
                  { title: 'By', value: 'dummy_actor' },
                  { title: 'Repository', value: 'dummy_repo' },
                ],
              },
            ],
            actions: [
              { type: 'Action.OpenUrl', title: 'Workflow Run', url: 'https://dummy_repo_url' },
            ],
          },
        },
      ],
    }
    expect(actual).toEqual(expected)
  })
})

describe('versionBranchMismatchFact', () => {
  const jobsUrl = 'https://api.github.com/repos/dummy_owner/dummy_repo/actions/runs/1/jobs'
  const jobLogs = (ref: string, sha: string) => [
    '##[group]Run actions/checkout@v7',
    'with:',
    `  ref: ${ref}`,
    '##[endgroup]',
    '[command]/usr/bin/git log -1 --format=%H',
    sha,
  ].join('\n')

  const makeCtx = (eventName = 'workflow_run', headSha = 'a9d5bb9cd3338c0c23f7cc4c8daee8203ced275e') => ({
    eventName,
    repo: {
      owner: 'dummy_owner',
      repo: 'dummy_repo'
    },
    payload: {
      workflow_run: {
        jobs_url: jobsUrl,
        head_sha: headSha
      }
    }
  }) as any

  const mockFetch = (ref: string, sha: string) => {
    jest.spyOn(globalThis, 'fetch' as any).mockImplementation((url: any) => {
      if (url === jobsUrl) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ jobs: [{ id: 1 }] })
        } as any)
      }
      return Promise.resolve({
        ok: true,
        text: async () => jobLogs(ref, sha)
      } as any)
    })
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('returns null when event is not workflow_run', async () => {
    const actual = await versionBranchMismatchFact(makeCtx('push'), 'test-token')

    expect(actual).toBeNull()
  })

  const tagSha = '31bff7c2faa15f730e9cc5a1e63beab5c05f2dc1'
  const mainSha = 'a9d5bb9cd3338c0c23f7cc4c8daee8203ced275e'

  test('returns null when checked-out ref does not start with v+', async () => {
    mockFetch('main', tagSha)

    const actual = await versionBranchMismatchFact(makeCtx('workflow_run', mainSha), 'test-token')

    expect(actual).toBeNull()
  })

  test('returns null when tag sha matches triggering head sha', async () => {
    mockFetch('v+2.1', mainSha)

    const actual = await versionBranchMismatchFact(makeCtx('workflow_run', mainSha), 'test-token')

    expect(actual).toBeNull()
  })

  test('returns warning fact when tag sha differs from triggering head sha', async () => {
    mockFetch('v+2.1', tagSha)

    const actual = await versionBranchMismatchFact(makeCtx('workflow_run', mainSha), 'test-token')

    expect(actual).toEqual({
      name: '⚠️ Version branch warning',
      value: `Head commit (${mainSha}) does not match main (${tagSha}).`
    })
  })
})