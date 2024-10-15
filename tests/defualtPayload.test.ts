import {defaultPayload} from '../src/utils'

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
    title: 'unknown action',
    text: 'event: workflow_run',
    sections: [
          {
           facts:  [
              {
               name: "By",
               value: "dummy_actor",
             },
              {
               name: "Repository",
               value: "dummy_repo",
             },
           ],
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
        html_url: "https://dummy_repo_url"
      }
    }
  }

  const actual = defaultPayload(ctx as any)
  const expected = {
    title: 'unknown action',
    text: 'event: workflow_run',
    potentialAction:  [
          {
           "@type": "OpenUri",
           name: "Repository",
           targets:  [
              {
               os: "default",
               uri: "https://dummy_repo_url",
             },
           ],
         },
       ],
    sections: [
          {
           facts:  [
              {
               name: "By",
               value: "dummy_actor",
             },
              {
               name: "Repository",
               value: "dummy_repo",
             },
           ],
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
        html_url: "https://dummy_repo_url"
      }
    }
  }

  const actual = defaultPayload(ctx as any)
  const expected = {
    title: 'unknown action',
    text: 'event: workflow_run',
    potentialAction:  [
          {
           "@type": "OpenUri",
           name: "Workflow Run",
           targets:  [
              {
               os: "default",
               uri: "https://dummy_repo_url",
             },
           ],
         },
       ],
    sections: [
          {
           facts:  [
              {
               name: "By",
               value: "dummy_actor",
             },
              {
               name: "Repository",
               value: "dummy_repo",
             },
           ],
         },
       ],
  }
  expect(actual).toEqual(expected)
})