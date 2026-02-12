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
} from './lib.mjs'

const USAGE = `
场景1：检索脚本

用法:
  node scripts/search.mjs me
  node scripts/search.mjs customers --company-name 朗致集团 --limit 5
  node scripts/search.mjs tags --category LEAD --search 活动
  node scripts/search.mjs users --search 张三 --limit 20
  node scripts/search.mjs sales-presales-users --search 张三
  node scripts/search.mjs customer-detail --customer-id <id>
  node scripts/search.mjs customer-business-records --customer-id <id>
  node scripts/search.mjs business-records --recorder-id <userId> --start-date 2026-02-12 --end-date 2026-02-12
  node scripts/search.mjs business-records --customer-id <id> --query limit=10
  node scripts/search.mjs customer-opportunities --customer-id <id>
  node scripts/search.mjs customer-opportunities --customer-name 朗致集团
  node scripts/search.mjs customer-contacts --customer-id <id>
  node scripts/search.mjs leads --query keyword=AI --query limit=20
  node scripts/search.mjs opportunities --query customerName=朗致集团 --query status=需求引导,客户立项
  node scripts/search.mjs notifications --status active --category LEAD_TIMEOUT
  node scripts/search.mjs presales-itineraries --start-date 2026-02-10 --end-date 2026-02-16

公共参数:
  --query key=value    追加查询参数，可重复
`

function queryWithCommon(options) {
  return parseQueryPairs(getOptionList(options, 'query'))
}

function filterUsersResult(result, keyword) {
  const q = String(keyword || '').trim().toLowerCase()
  if (!q) return result
  if (!result || typeof result !== 'object' || !result.data || typeof result.data !== 'object') {
    return result
  }
  const payload = result.data
  if (!Array.isArray(payload.data)) {
    return result
  }

  const filtered = payload.data.filter((user) => {
    const name = String(user?.name || '').toLowerCase()
    const email = String(user?.email || '').toLowerCase()
    return name.includes(q) || email.includes(q)
  })

  return {
    ...result,
    data: {
      ...payload,
      data: filtered,
    },
  }
}

function filterTagsResult(result, keyword) {
  const q = String(keyword || '').trim().toLowerCase()
  if (!q) return result
  if (!result || typeof result !== 'object' || !Array.isArray(result.data?.data)) {
    return result
  }

  const filtered = result.data.data.filter((tag) => {
    const name = String(tag?.name || '').toLowerCase()
    const description = String(tag?.description || '').toLowerCase()
    const category = String(tag?.category || '').toLowerCase()
    return name.includes(q) || description.includes(q) || category.includes(q)
  })

  return {
    ...result,
    data: {
      ...result.data,
      data: filtered,
    },
  }
}

async function runCustomers(options) {
  const query = queryWithCommon(options)
  const companyName = getOption(options, 'company-name')
  const page = getOption(options, 'page')
  const limit = getOption(options, 'limit')

  if (companyName) query.push(['companyName', companyName])
  if (page) query.push(['page', page])
  if (limit) query.push(['limit', limit])

  return lcrmRequest({ method: 'GET', path: '/api/customers', query })
}

async function runMe() {
  return lcrmRequest({
    method: 'GET',
    path: '/api/auth/me',
  })
}

async function runCustomerDetail(options) {
  const customerId = getOption(options, 'customer-id')
  if (!customerId) throw new Error('缺少 --customer-id')
  return lcrmRequest({ method: 'GET', path: `/api/customers/${customerId}` })
}

async function runCustomerBusinessRecords(options) {
  const customerId = getOption(options, 'customer-id')
  if (!customerId) throw new Error('缺少 --customer-id')
  return lcrmRequest({
    method: 'GET',
    path: '/api/business-records',
    query: [['customerId', customerId], ...queryWithCommon(options)],
  })
}

async function runBusinessRecords(options) {
  const query = []

  const customerId = getOption(options, 'customer-id')
  if (customerId) query.push(['customerId', customerId])

  const leadId = getOption(options, 'lead-id')
  if (leadId) query.push(['leadId', leadId])

  const opportunityId = getOption(options, 'opportunity-id')
  if (opportunityId) query.push(['opportunityId', opportunityId])

  const recorderId = getOption(options, 'recorder-id')
  if (recorderId) query.push(['recorderId', recorderId])

  const startDate = getOption(options, 'start-date')
  if (startDate) query.push(['startDate', startDate])

  const endDate = getOption(options, 'end-date')
  if (endDate) query.push(['endDate', endDate])

  query.push(...queryWithCommon(options))

  return lcrmRequest({
    method: 'GET',
    path: '/api/business-records',
    query,
  })
}

async function runCustomerOpportunities(options) {
  const customerId = getOption(options, 'customer-id')
  const customerName = getOption(options, 'customer-name')

  if (customerId) {
    return lcrmRequest({ method: 'GET', path: `/api/customers/${customerId}` })
  }
  if (!customerName) {
    throw new Error('请提供 --customer-id 或 --customer-name')
  }
  return lcrmRequest({
    method: 'GET',
    path: '/api/opportunities/list',
    query: [['customerName', customerName], ...queryWithCommon(options)],
  })
}

async function runCustomerContacts(options) {
  const customerId = getOption(options, 'customer-id')
  if (!customerId) throw new Error('缺少 --customer-id')
  return lcrmRequest({ method: 'GET', path: `/api/customers/${customerId}` })
}

async function runLeads(options) {
  return lcrmRequest({
    method: 'GET',
    path: '/api/leads',
    query: queryWithCommon(options),
  })
}

async function runTags(options) {
  const query = queryWithCommon(options)
  const category = getOption(options, 'category')
  const search = getOption(options, 'search')
  if (category) query.push(['category', category])

  const result = await lcrmRequest({
    method: 'GET',
    path: '/api/tags',
    query,
  })
  return filterTagsResult(result, search)
}

async function runUsers(options) {
  const query = queryWithCommon(options)
  const search = getOption(options, 'search')
  const page = getOption(options, 'page')
  const limit = getOption(options, 'limit')

  if (search) query.push(['search', search])
  if (page) query.push(['page', page])
  if (limit) query.push(['limit', limit])

  const result = await lcrmRequest({
    method: 'GET',
    path: '/api/users',
    query,
  })

  if (result.ok || (result.status !== 401 && result.status !== 403)) {
    return result
  }

  const fallback = await lcrmRequest({
    method: 'GET',
    path: '/api/users/sales-presales',
  })
  return filterUsersResult(fallback, search)
}

async function runSalesPresalesUsers(options) {
  const search = getOption(options, 'search')
  const result = await lcrmRequest({
    method: 'GET',
    path: '/api/users/sales-presales',
  })
  return filterUsersResult(result, search)
}

async function runOpportunities(options) {
  return lcrmRequest({
    method: 'GET',
    path: '/api/opportunities/list',
    query: queryWithCommon(options),
  })
}

async function runNotifications(options) {
  const query = queryWithCommon(options)
  const status = getOption(options, 'status')
  const category = getOption(options, 'category')
  const page = getOption(options, 'page')
  const limit = getOption(options, 'limit')

  if (status) query.push(['status', status])
  if (category) query.push(['category', category])
  if (page) query.push(['page', page])
  if (limit) query.push(['limit', limit])

  return lcrmRequest({
    method: 'GET',
    path: '/api/notifications',
    query,
  })
}

async function runPresalesItineraries(options) {
  const query = queryWithCommon(options)
  const startDate = getOption(options, 'start-date')
  const endDate = getOption(options, 'end-date')
  const userId = getOption(options, 'user-id')
  const opportunityId = getOption(options, 'opportunity-id')

  if (startDate) query.push(['startDate', startDate])
  if (endDate) query.push(['endDate', endDate])
  if (userId) query.push(['userId', userId])
  if (opportunityId) query.push(['opportunityId', opportunityId])

  return lcrmRequest({
    method: 'GET',
    path: '/api/presales-itineraries/week',
    query,
  })
}

const HANDLERS = {
  me: runMe,
  customers: runCustomers,
  'customer-detail': runCustomerDetail,
  'customer-business-records': runCustomerBusinessRecords,
  'business-records': runBusinessRecords,
  'customer-opportunities': runCustomerOpportunities,
  'customer-contacts': runCustomerContacts,
  leads: runLeads,
  tags: runTags,
  users: runUsers,
  'sales-presales-users': runSalesPresalesUsers,
  opportunities: runOpportunities,
  notifications: runNotifications,
  'presales-itineraries': runPresalesItineraries,
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
