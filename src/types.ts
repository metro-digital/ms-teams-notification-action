export type PayloadHeader = {'@context': string; '@type': string}
export type ContextPayload = {
  title: string
  text?: string
  summary?: string
  themeColor?: string
} & PotentialAction &
  Sections

export type NameValue = {name: string; value: string}
export type NameUrl = {name: string; url: string}

export type FactSection = {facts: NameValue[]}
export type Sections = {sections?: FactSection[]}

export type ActionTarget = {os: string; uri: string}
export type PotentialAction = {
  potentialAction?: {
    '@type': string
    name: string
    targets: ActionTarget[]
  }[]
}

export type Config = {
  webhook_url: string
  workflow_run_conclusion: ('success' | 'failure')[]
}
