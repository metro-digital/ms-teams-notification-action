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
  const makeCtx = (branch = 'v1.2.3', headSha = 'branch-sha') => ({
    repo: {
      owner: 'dummy_owner',
      repo: 'dummy_repo'
    },
    payload: {
      workflow_run: {
        head_branch: branch,
        head_sha: headSha
      }
    }
  }) as any

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('returns null when branch does not start with v', async () => {
    const ctx = makeCtx('main', 'branch-sha')

    const actual = await versionBranchMismatchFact(ctx, 'test-token')

    expect(actual).toBeNull()
  })

  test('returns null when head sha matches main', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ commit: { sha: 'branch-sha' }})
    } as any)

    const actual = await versionBranchMismatchFact(makeCtx('v1.2.3', 'branch-sha'), 'test-token')

    expect(actual).toBeNull()
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/dummy_owner/dummy_repo/branches/main',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token'
        })
      })
    )
  })

  test('returns warning fact when head sha differs from main', async () => {
    jest.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
      ok: true,
      json: async () => ({ commit: { sha: 'main-sha' }})
    } as any)

    const actual = await versionBranchMismatchFact(makeCtx('v1.2.3', 'branch-sha'), 'test-token')

    expect(actual).toEqual({
      name: '⚠️ Version branch warning',
      value: 'Head commit (branch-sha) does not match main (main-sha).'
    })
  })
})