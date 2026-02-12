#!/usr/bin/env node

import { readFileSync } from 'node:fs'

export function parseCliArgs(argv) {
  const args = Array.isArray(argv) ? argv : []
  const positionals = []
  const options = new Map()

  let i = 0
  while (i < args.length) {
    const arg = args[i]
    if (!arg.startsWith('--')) {
      positionals.push(arg)
      i += 1
      continue
    }

    const eqIndex = arg.indexOf('=')
    if (eqIndex > 2) {
      const key = arg.slice(2, eqIndex)
      const value = arg.slice(eqIndex + 1)
      pushOption(options, key, value)
      i += 1
      continue
    }

    const key = arg.slice(2)
    const next = args[i + 1]
    if (!next || next.startsWith('--')) {
      pushOption(options, key, 'true')
      i += 1
      continue
    }

    pushOption(options, key, next)
    i += 2
  }

  return { positionals, options }
}

function pushOption(map, key, value) {
  if (!map.has(key)) {
    map.set(key, [])
  }
  map.get(key).push(String(value))
}

export function getOption(options, key, fallback = '') {
  const values = options.get(key)
  if (!values || values.length === 0) return fallback
  return values[values.length - 1]
}

export function getOptionList(options, key) {
  return options.get(key) || []
}

export function parseQueryPairs(pairs) {
  const result = []
  for (const item of pairs) {
    const idx = item.indexOf('=')
    if (idx <= 0) {
      throw new Error(`无效 query 参数: ${item}，请使用 key=value`)
    }
    const key = item.slice(0, idx)
    const value = item.slice(idx + 1)
    result.push([key, value])
  }
  return result
}

export function ensureApiConfig() {
  const apiKey = process.env.LCRM_API_KEY || ''
  if (!apiKey) {
    throw new Error('缺少环境变量 LCRM_API_KEY')
  }

  const baseUrl = (process.env.LCRM_BASE_URL || 'https://crm.langcore.net').replace(/\/+$/, '')
  return { apiKey, baseUrl }
}

export function readJsonInput({ inline, file }) {
  if (inline) {
    return JSON.parse(inline)
  }
  if (file) {
    const content = readFileSync(file, 'utf8')
    return JSON.parse(content)
  }
  return null
}

export function isHalfHourPrecision(input) {
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return false
  const minutes = date.getMinutes()
  return (minutes === 0 || minutes === 30) && date.getSeconds() === 0 && date.getMilliseconds() === 0
}

export async function lcrmRequest({
  method = 'GET',
  path,
  query = [],
  headers = {},
  body = undefined,
  timeoutMs = 20000,
}) {
  const { apiKey, baseUrl } = ensureApiConfig()
  if (!path || !path.startsWith('/')) {
    throw new Error('path 必须以 / 开头，例如 /api/customers')
  }

  const url = new URL(`${baseUrl}${path}`)
  for (const [key, value] of query) {
    url.searchParams.append(key, value)
  }

  const requestHeaders = new Headers({
    Authorization: `Bearer ${apiKey}`,
    ...headers,
  })

  if (!requestHeaders.has('Content-Type') && body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  const requestInit = {
    method: method.toUpperCase(),
    headers: requestHeaders,
  }
  if (body !== undefined) {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body)
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  requestInit.signal = controller.signal

  let response
  try {
    response = await fetch(url, requestInit)
  } finally {
    clearTimeout(timer)
  }

  const contentType = response.headers.get('content-type') || ''
  let payload
  if (contentType.includes('application/json')) {
    payload = await response.json()
  } else {
    payload = await response.text()
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    method: method.toUpperCase(),
    url: url.toString(),
    data: payload,
  }
}

export function printResult(result) {
  console.log(JSON.stringify(result, null, 2))
}

export function printUsageAndExit(usage, code = 1) {
  console.error(usage.trim())
  process.exit(code)
}

export function failAndExit(error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(JSON.stringify({ ok: false, error: message }, null, 2))
  process.exit(1)
}

