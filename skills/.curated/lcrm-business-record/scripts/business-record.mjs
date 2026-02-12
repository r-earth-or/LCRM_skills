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
} from './_lib.mjs'

const FOLLOW_UP_TYPES = new Set(['微信', '电话', '线上会议', '邮件', '现场拜访', '商务活动', '其他'])

const USAGE = `
场景2：商务记录脚本

用法:
  node scripts/business-record.mjs find-customer --company-name 朗致集团 --limit 5
  node scripts/business-record.mjs customer-detail --customer-id <id>
  node scripts/business-record.mjs create --customer-id <id> --follow-up-type 电话 --contacted-person 张三 --description "已沟通预算与排期..."
  node scripts/business-record.mjs create --payload-file /tmp/business-record.json

子命令:
  find-customer    按客户名检索客户
  customer-detail  获取客户详情（含联系人/机会/商务记录）
  create           创建商务记录

注意: 商务记录查询请使用 search.mjs 脚本
`

function validateCreatePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('payload 必须为 JSON 对象')
  }

  const hasCustomer = typeof payload.customerId === 'string' && payload.customerId.trim()
  const hasLead = typeof payload.leadId === 'string' && payload.leadId.trim()
  if (!hasCustomer && !hasLead) {
    throw new Error('必须提供 customerId 或 leadId')
  }

  const followUpType = typeof payload.followUpType === 'string' ? payload.followUpType.trim() : ''
  if (!followUpType || !FOLLOW_UP_TYPES.has(followUpType)) {
    throw new Error('followUpType 非法，必须为：微信/电话/线上会议/邮件/现场拜访/商务活动/其他')
  }

  const contactedPerson = typeof payload.contactedPerson === 'string' ? payload.contactedPerson.trim() : ''
  if (!contactedPerson) {
    throw new Error('contactedPerson 不能为空')
  }

  const description = typeof payload.description === 'string' ? payload.description.replace(/<[^>]*>/g, '').trim() : ''
  if (description.length < 10) {
    throw new Error('description 去 HTML 后至少 10 个字')
  }
}

async function runFindCustomer(options) {
  const companyName = getOption(options, 'company-name')
  if (!companyName) throw new Error('缺少 --company-name')
  const limit = getOption(options, 'limit', '5')
  return lcrmRequest({
    method: 'GET',
    path: '/api/customers',
    query: [
      ['companyName', companyName],
      ['limit', limit],
      ...parseQueryPairs(getOptionList(options, 'query')),
    ],
  })
}

async function runCustomerDetail(options) {
  const customerId = getOption(options, 'customer-id')
  if (!customerId) throw new Error('缺少 --customer-id')
  return lcrmRequest({ method: 'GET', path: `/api/customers/${customerId}` })
}

function buildPayloadFromOptions(options) {
  const inlinePayload = readJsonInput({
    inline: getOption(options, 'payload'),
    file: getOption(options, 'payload-file'),
  })
  if (inlinePayload) return inlinePayload

  const payload = {
    customerId: getOption(options, 'customer-id') || undefined,
    leadId: getOption(options, 'lead-id') || undefined,
    followUpType: getOption(options, 'follow-up-type') || undefined,
    contactedPerson: getOption(options, 'contacted-person') || undefined,
    description: getOption(options, 'description') || undefined,
    recordTime: getOption(options, 'record-time') || undefined,
    opportunityId: getOption(options, 'opportunity-id') || undefined,
    opportunityStatus: getOption(options, 'opportunity-status') || undefined,
    estimatedCloseDate: getOption(options, 'estimated-close-date') || undefined,
    actualCloseDate: getOption(options, 'actual-close-date') || undefined,
  }

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== ''))
}

async function runCreate(options) {
  const payload = buildPayloadFromOptions(options)
  validateCreatePayload(payload)

  return lcrmRequest({
    method: 'POST',
    path: '/api/business-records',
    body: payload,
  })
}

const HANDLERS = {
  'find-customer': runFindCustomer,
  'customer-detail': runCustomerDetail,
  create: runCreate,
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

