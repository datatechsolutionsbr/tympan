import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  codeOf,
  CONTRACT_MAPPINGS,
  createRunEventConsumer,
  eventTypeFromContract,
  HttpResponseError,
  isApiError,
  ProblemError,
  runStatusFromContract,
  statusOf,
} from './apiErrors'

const contractFile = join(dirname(fileURLToPath(import.meta.url)), '../../../../../contract/openapi/components/workflows.yaml')

function contractEnum(yaml: string, schema: string, prop?: string): string[] {
  const start = yaml.indexOf(`\n  ${schema}:`)
  const block = yaml.slice(start, start + 1600)
  const scoped = prop ? block.slice(block.indexOf(`${prop}:`)) : block
  const m = /enum:\s*\[([^\]]+)\]/.exec(scoped)
  return m ? m[1]!.split(',').map((s) => s.trim()) : []
}

describe('ApiErrorModel', () => {
  it('HttpResponseError is an ApiError with its status', () => {
    const e = new HttpResponseError('Not found', 404)
    expect(isApiError(e)).toBe(true)
    expect(statusOf(e)).toBe(404)
    expect(codeOf(e)).toBe('http_response')
    expect(new HttpResponseError('x').status).toBe(500)
  })

  it('reads 500 and "unknown" from a plain Error', () => {
    expect(statusOf(new Error('x'))).toBe(500)
    expect(codeOf(new Error('x'))).toBe('unknown')
    expect(statusOf('boom')).toBe(500)
  })

  it('serialises message, code and status', () => {
    expect(JSON.parse(JSON.stringify(new ApiError('Conflict', { status: 409, code: 'edition_frozen' })))).toEqual({
      message: 'Conflict',
      code: 'edition_frozen',
      status: 409,
    })
    const p = new ProblemError({ type: '/problems/forbidden', title: 'Forbidden', status: 403, detail: 'No role' })
    expect(p.toJSON()).toMatchObject({ status: 403, type: '/problems/forbidden', detail: 'No role' })
  })

  it('skips unknown run events without throwing', () => {
    const onDone = vi.fn()
    const consume = createRunEventConsumer({ 'node.completed': onDone })
    expect(consume({ type: 'future.kind', runId: 'r1', timestamp: '2026-09-26T00:00:00Z' })).toBe(false)
    expect(consume({ type: 'node.completed', runId: 'r1', nodeId: 'n', timestamp: '2026-09-26T00:00:00Z' })).toBe(true)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it.runIf(existsSync(contractFile))('maps every status and event of the OpenAPI contract', () => {
    const yaml = readFileSync(contractFile, 'utf8')
    const runStatuses = contractEnum(yaml, 'RunStatus')
    const stepStatuses = contractEnum(yaml, 'StepStatus')
    const events = contractEnum(yaml, 'RunEvent', 'event')
    expect(runStatuses.length).toBeGreaterThan(3)
    for (const s of runStatuses) expect(CONTRACT_MAPPINGS.runStatus).toHaveProperty(s)
    for (const s of stepStatuses) expect(CONTRACT_MAPPINGS.stepStatus).toHaveProperty(s)
    for (const e of events.filter((x) => x !== 'run.status')) expect(CONTRACT_MAPPINGS.events).toHaveProperty([e])
    expect(runStatusFromContract('succeeded')).toBe('completed')
    expect(eventTypeFromContract('run.status', 'failed')).toBe('run.failed')
    expect(eventTypeFromContract('step.succeeded')).toBe('node.completed')
  })
})
