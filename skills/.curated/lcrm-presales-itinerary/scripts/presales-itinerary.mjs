#!/usr/bin/env node

import {
  failAndExit,
  getOption,
  isHalfHourPrecision,
  lcrmRequest,
  parseCliArgs,
  printResult,
  printUsageAndExit,
  readJsonInput,
} from './lib.mjs'

const TRIP_TYPES = new Set([
  '需求调研',
  '产品介绍',
  '技术交流',
  '方案沟通',
  '方案撰写',
  '技术预研',
  'POC测试',
  '产品演示',
  '产品部署',
  '标书撰写',
  '讲标支持',
  '商务谈判',
  '内部会议',
  '案例整理',
  '培训学习',
])

const DELIVERY_MODES = new Set(['现场', '远程'])

const USAGE = `
场景3：售前行程脚本

用法:
  node scripts/presales-itinerary.mjs ai-parse --text "明天下午给XX客户做产品演示..."
  node scripts/presales-itinerary.mjs search-opportunities --keyword 朗致 --limit 20
  node scripts/presales-itinerary.mjs create --title "朗致产品演示" --start-time 2026-02-12T14:00:00 --end-time 2026-02-12T16:00:00 --opportunity-id <id> --trip-type 产品演示 --delivery-mode 现场
  node scripts/presales-itinerary.mjs create --payload-file /tmp/itinerary.json
  node scripts/presales-itinerary.mjs update --id <id> --title "更新后的标题" --start-time 2026-02-12T14:00:00 --end-time 2026-02-12T16:00:00 --opportunity-id <id> --trip-type 产品演示 --delivery-mode 现场
  node scripts/presales-itinerary.mjs delete --id <id>
  node scripts/presales-itinerary.mjs complete --id <id> --actual-hours 2.5 --completion-note "完成情况说明"
`

function validateCreatePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('payload 必须为 JSON 对象')
  }

  const required = ['title', 'startTime', 'endTime', 'opportunityId', 'tripType', 'deliveryMode']
  for (const key of required) {
    const value = payload[key]
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`缺少必填字段: ${key}`)
    }
  }

  if (!TRIP_TYPES.has(payload.tripType)) {
    throw new Error(`tripType 非法: ${payload.tripType}`)
  }
  if (!DELIVERY_MODES.has(payload.deliveryMode)) {
    throw new Error(`deliveryMode 非法: ${payload.deliveryMode}`)
  }

  const start = new Date(payload.startTime)
  const end = new Date(payload.endTime)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
    throw new Error('时间范围不合法（endTime 必须晚于 startTime）')
  }
  if (!isHalfHourPrecision(payload.startTime) || !isHalfHourPrecision(payload.endTime)) {
    throw new Error('时间精度需为半小时，分钟只能是 00 或 30')
  }
}

async function runAiParse(options) {
  const text = getOption(options, 'text')
  if (!text) throw new Error('缺少 --text')
  return lcrmRequest({
    method: 'POST',
    path: '/api/presales-itineraries/ai-parse',
    body: { text },
  })
}

async function runSearchOpportunities(options) {
  const keyword = getOption(options, 'keyword')
  const limit = getOption(options, 'limit', '20')
  const query = [['limit', limit]]
  if (keyword) query.push(['keyword', keyword])

  return lcrmRequest({
    method: 'GET',
    path: '/api/presales-itineraries/opportunities',
    query,
  })
}

function buildPayloadFromOptions(options) {
  const inlinePayload = readJsonInput({
    inline: getOption(options, 'payload'),
    file: getOption(options, 'payload-file'),
  })
  if (inlinePayload) return inlinePayload

  return {
    title: getOption(options, 'title'),
    startTime: getOption(options, 'start-time'),
    endTime: getOption(options, 'end-time'),
    opportunityId: getOption(options, 'opportunity-id'),
    tripType: getOption(options, 'trip-type'),
    deliveryMode: getOption(options, 'delivery-mode'),
  }
}

async function runCreate(options) {
  const payload = buildPayloadFromOptions(options)
  validateCreatePayload(payload)
  return lcrmRequest({
    method: 'POST',
    path: '/api/presales-itineraries',
    body: payload,
  })
}

async function runUpdate(options) {
  const id = getOption(options, 'id')
  if (!id) throw new Error('缺少 --id')

  const payload = buildPayloadFromOptions(options)
  validateCreatePayload(payload)
  return lcrmRequest({
    method: 'PUT',
    path: `/api/presales-itineraries/${id}`,
    body: payload,
  })
}

async function runDelete(options) {
  const id = getOption(options, 'id')
  if (!id) throw new Error('缺少 --id')

  return lcrmRequest({
    method: 'DELETE',
    path: `/api/presales-itineraries/${id}`,
  })
}

async function runComplete(options) {
  const id = getOption(options, 'id')
  if (!id) throw new Error('缺少 --id')

  const actualHours = getOption(options, 'actual-hours')
  const completionNote = getOption(options, 'completion-note')

  if (!actualHours) throw new Error('缺少 --actual-hours')
  if (!completionNote) throw new Error('缺少 --completion-note')

  return lcrmRequest({
    method: 'POST',
    path: `/api/presales-itineraries/${id}/complete`,
    body: {
      actualHours: parseFloat(actualHours),
      completionNote,
    },
  })
}

const HANDLERS = {
  'ai-parse': runAiParse,
  'search-opportunities': runSearchOpportunities,
  create: runCreate,
  update: runUpdate,
  delete: runDelete,
  complete: runComplete,
}

async function main() {
  const { positionals, options } = parseCliArgs(process.argv.slice(2))
  const action = positionals[0]
  if (!action || !(action in HANDLERS)) {
    printUsageAndExit(USAGE)
  }

  const result = await HANDLERS[action](options)
  printResult(result)
  if (!result.ok) {
    process.exit(1)
  }
}

main().catch(failAndExit)

