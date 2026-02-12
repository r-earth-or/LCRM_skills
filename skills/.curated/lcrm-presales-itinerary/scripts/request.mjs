#!/usr/bin/env node

import {
  failAndExit,
  getOption,
  getOptionList,
  lcrmRequest,
  parseCliArgs,
  parseQueryPairs,
  printResult,
  printUsageAndExit,
  readJsonInput,
} from './lib.mjs'

const USAGE = `
LCRM 通用请求脚本

用法:
  node scripts/request.mjs --method GET --path /api/customers --query companyName=朗致 --query limit=5
  node scripts/request.mjs --method POST --path /api/business-records --body '{"customerId":"..."}'
  node scripts/request.mjs --method POST --path /api/business-records --body-file /tmp/payload.json

参数:
  --method      HTTP 方法，默认 GET
  --path        API 路径（必须以 / 开头）
  --query       查询参数，支持重复，格式 key=value
  --body        JSON 字符串
  --body-file   JSON 文件路径
  --timeout-ms  超时毫秒，默认 20000
`

async function main() {
  const { options } = parseCliArgs(process.argv.slice(2))
  const path = getOption(options, 'path')
  if (!path) {
    printUsageAndExit(USAGE)
  }

  const method = getOption(options, 'method', 'GET')
  const timeoutMs = Number(getOption(options, 'timeout-ms', '20000'))
  const queryPairs = parseQueryPairs(getOptionList(options, 'query'))
  const body = readJsonInput({
    inline: getOption(options, 'body'),
    file: getOption(options, 'body-file'),
  })

  const result = await lcrmRequest({
    method,
    path,
    query: queryPairs,
    body: body === null ? undefined : body,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 20000,
  })

  printResult(result)
  if (!result.ok) {
    process.exit(1)
  }
}

main().catch(failAndExit)

