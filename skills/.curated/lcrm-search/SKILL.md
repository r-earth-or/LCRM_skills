---
name: lcrm-search
description: >
  LCRM销售数据检索工具。当用户需要查询CRM系统中的任何数据时必须使用此技能，包括：
  - 查询客户信息（我的客户、公海客户、客户列表）
  - 查询线索（我的线索、公海线索、线索详情）
  - 查询销售机会、合同、回款
  - 查询商务记录、跟进记录
  - 查询用户信息（销售、售前、其他同事）
  - 查询标签、通知、售前行程
  - 查询"我"的当前身份信息
  无论用户是说"查一下"、"看看"、"找一下"还是明确说"搜索/检索"，只要涉及CRM数据查询，立即使用此技能。
compatibility:
  requires:
    - Node.js >= 18
  env:
    - LCRM_API_KEY（必填）
---

# LCRM通用检索

## 目标

支持销售快速检索 CRM 数据：自己、客户、线索、机会、商务记录、联系人、标签、用户、通知、售前行程、合同、回款。

## 何时不使用此技能

- **创建/修改数据** - 此技能仅用于检索，不用于创建或更新。如需创建客户、录入商务记录等，使用对应的专业技能（如 lcrm-business-record）
- **复杂数据分析** - 如需生成报表或深度分析，使用数据分析相关技能

## 脚本入口

### 主脚本（推荐）

```bash
node scripts/search.mjs <action> [options]
```

每个 action 对应一种数据类型，使用方式见下方各章节。

### 环境变量

执行前确保已设置 API 密钥：

```bash
export LCRM_API_KEY="your-api-key"
```

**为什么需要 API 密钥：**
所有 API 调用都需要身份验证，`LCRM_API_KEY` 用于标识和验证当前用户身份。

## 执行流程

### 核心原则

检索数据时，先确定对象类型，再选择对应的检索方式。这样能快速定位到正确的 API，避免不必要的重复查询。

### 步骤

1. **识别对象类型** - 从用户问题中判断要查的是：自己、客户、线索、机会、商务记录、联系人、标签、用户、通知、售前行程、合同还是回款
2. **选择对应 action** - 根据对象类型选择最优检索方式：
   - 查自己 → `me` action
   - 查用户 → `users` 或 `sales-presales-users` action
   - 查标签 → `tags` action
   - 查客户关联数据（机会、联系人、商务记录）→ 先确认客户ID，再使用对应 action
3. **执行检索** - 调用 `search.mjs` 对应 action
4. **处理多条结果** - 若命中多条且无法确定唯一对象，展示列表让用户选择
5. **返回结果** - 先展示核心字段，再提供可进一步筛选的参数建议

## 资源检索指南

每个资源模块包含筛选参数和具体用法。使用原则：**先确定对象类型，再选择对应 action**。

| Action | 对象 | 常用场景 |
|--------|------|----------|
| `me` | 自己 | 获取当前用户身份信息 |
| `customers` | 客户 | 按公司名/状态/区域筛选客户 |
| `business-records` | 商务记录 | 按线索/机会/记录人/时间查询 |
| `customer-business-records` | 客户商务记录 | 按客户查询商务记录 |
| `customer-opportunities` | 客户机会 | 查询某客户的所有机会 |
| `customer-contacts` | 联系人 | 查询某客户的联系人 |
| `leads` | 线索 | 按关键词/状态/标签/来源查询 |
| `opportunities` | 机会 | 按客户名/状态/金额/日期查询 |
| `users` | 用户 | 查询所有用户信息 |
| `sales-presales-users` | 销售/售前 | 仅查询销售或售前用户 |
| `tags` | 标签 | 查询标签列表（主要用于线索） |
| `notifications` | 通知 | 查询激活/历史通知 |
| `presales-itineraries` | 售前行程 | 按时间段/用户/机会查询 |
| `contracts` | 合同 | 按标题/编号/客户/日期查询 |
| `contract-payments` | 回款 | 按状态/合同/日期查询 |

---

### 1) 自己 (me)

获取当前登录用户的基本信息和权限。

```bash
node scripts/search.mjs me
```

**输出核心字段：** `id`, `name`, `email`, `roles`

---

### 2) 客户 (customers)

#### 筛选参数

| 参数 | 可选值 | 说明 |
|------|--------|------|
| `customerType[]` | `直接客户`、`合作伙伴` | 客户类型（多选） |
| `customerSource[]` | `自拓线索`、`公司分配` | 客户来源（多选） |
| `customerStatus[]` | `潜在客户`、`跟进客户`、`商机客户`、`合作客户`、`无效客户` | 客户状态（多选） |
| `region[]` | `上海`、`北京`、`华南`、`华东`、`海外`、`其他` | 所属区域（多选） |
| `followUpSalesId[]` | ID | 跟进销售ID（多选） |
| `companyName` | string | 公司名（模糊搜索） |

#### 用法示例

**基础查询 - 按公司名：**
```bash
node scripts/search.mjs customers --company-name "<客户名>" --limit 5
```

**复杂筛选 - 多条件组合：**
```bash
node scripts/search.mjs customers \
  --query 'customerStatus[]=跟进客户' \
  --query 'region[]=华东'
```

**我的客户 vs 公海客户：**
```bash
# 我的客户
node scripts/search.mjs customers --query 'followUpSalesId[]=<我的用户ID>'

# 公海客户（需先获取公海用户ID，见"公海概念"章节）
node scripts/search.mjs customers --query 'followUpSalesId[]=<公海用户ID>'
```

**输出核心字段：** `id`, `companyName`, `customerStatus`, `followUpSales`

---

### 3) 商务记录 (business-records / customer-business-records)

#### 筛选参数

| 参数 | 说明 |
|------|------|
| `customer-id` | 客户ID（customer-business-records 专用） |
| `lead-id` | 线索ID |
| `opportunity-id` | 机会ID |
| `recorder-id` | 记录人ID |
| `start-date` / `end-date` | 记录时间范围（YYYY-MM-DD） |

#### 商务记录字段枚举

| 字段 | 可选值 | 说明 |
|------|--------|------|
| `followUpType` | `微信`、`电话`、`线上会议`、`邮件`、`现场拜访`、`商务活动`、`其他` | 跟进方式 |

#### 用法示例

**按客户查询：**
```bash
node scripts/search.mjs customer-business-records --customer-id "<customerId>"
```

**按线索查询：**
```bash
node scripts/search.mjs business-records --lead-id "<leadId>"
```

**按机会查询：**
```bash
node scripts/search.mjs business-records --opportunity-id "<opportunityId>"
```

**按记录人和时间：**
```bash
node scripts/search.mjs business-records \
  --recorder-id "<userId>" \
  --start-date 2026-02-01 \
  --end-date 2026-02-28
```

**输出核心字段：** `recordTime`, `followUpType`, `contactedPerson`, `description`

---

### 4) 客户机会 (customer-opportunities)

#### 筛选参数

| 参数 | 说明 |
|------|------|
| `customer-id` | 客户ID（精确匹配） |
| `customer-name` | 客户名称（模糊匹配） |

#### 用法示例

```bash
# 已知客户ID
node scripts/search.mjs customer-opportunities --customer-id "<customerId>"

# 已知客户名
node scripts/search.mjs customer-opportunities --customer-name "<客户名>"
```

**输出核心字段：** `id`, `name`, `status`, `amount`, `estimatedCloseDate`

---

### 5) 客户联系人 (customer-contacts)

#### 筛选参数

| 参数 | 说明 |
|------|------|
| `customer-id` | 客户ID（必填） |

#### 用法示例

```bash
node scripts/search.mjs customer-contacts --customer-id "<customerId>"
```

**输出核心字段：** `name`, `phone`, `position`, `roles`

---

### 6) 线索 (leads)

#### 筛选参数

| 参数 | 可选值 | 说明 |
|------|--------|------|
| `keyword` | string | 关键词搜索 |
| `status[]` | `待处理`、`已跟进`、`已转化` | 线索状态（多选） |
| `classification[]` | `公司`、`市场`、`销售` | 线索分类（多选） |
| `source[]` | `官方渠道`、`自办活动`、`三方活动`、`市场名单`、`熟人推荐`、`生态伙伴`、`销售自拓` | 线索来源（多选） |
| `tags[]` | string | 标签名称（多选，AND 匹配） |
| `mine` | boolean | 只查我的线索 |
| `publicOnly` | boolean | 只查公海线索 |

> **注意：** `tags[]` 仅用于线索检索，客户与机会暂无标签字段。

#### 用法示例

**关键词搜索：**
```bash
node scripts/search.mjs leads --query keyword="<关键词>" --query limit=20
```

**复杂筛选 - 状态+分类+归属：**
```bash
node scripts/search.mjs leads \
  --query 'status[]=已跟进' \
  --query 'classification[]=销售' \
  --query mine=true
```

**按标签筛选（AND 关系）：**
```bash
node scripts/search.mjs leads \
  --query 'tags[]=重点客户' \
  --query 'tags[]=AI'
```

**公海 vs 我的线索：**
```bash
# 公海线索
node scripts/search.mjs leads --query publicOnly=true

# 我的线索
node scripts/search.mjs leads --query mine=true
```

**输出核心字段：** `id`, `companyName`, `status`, `classification`, `owner`, `importedAt`

---

### 7) 机会 (opportunities)

#### 筛选参数

| 参数 | 类型/可选值 | 说明 |
|------|-------------|------|
| `name` | string | 机会名称（模糊搜索） |
| `customerName` | string | 客户名称（模糊搜索） |
| `status` | `需求引导`、`客户立项`、`客户选定`、`客户成交`、`机会失败`（多值逗号分隔） | 机会状态 |
| `minAmount` / `maxAmount` | number | 金额范围 |
| `startDate` / `endDate` | YYYY-MM-DD | 预计成交日期范围 |
| `startYear` / `startMonth` / `endYear` / `endMonth` | number | 年月筛选 |
| `createdAtStartDate` / `createdAtEndDate` | YYYY-MM-DD | 创建时间范围 |
| `opportunitySalesId` / `opportunityPreSalesId` | ID | 销售/售前ID（多值逗号分隔） |
| `lastFollowUpStartDate` / `lastFollowUpEndDate` | YYYY-MM-DD | 最后跟进时间范围 |
| `sortBy` | 字段名 | 排序字段 |
| `sortOrder` | `asc` / `desc` | 排序方向 |

**排序字段可选值：** `id`, `name`, `amount`, `estimatedCloseDate`, `status`, `customerName`, `customer.companyName`, `opportunitySales.name`, `opportunityPreSales.name`, `lastFollowUpTime`

#### 用法示例

**按客户和状态：**
```bash
node scripts/search.mjs opportunities \
  --query customerName="<客户名>" \
  --query status=需求引导,客户立项
```

**按金额和日期范围：**
```bash
node scripts/search.mjs opportunities \
  --query minAmount=100000 \
  --query maxAmount=500000 \
  --query startDate=2026-02-01 \
  --query endDate=2026-03-31
```

**输出核心字段：** `id`, `name`, `status`, `amount`, `estimatedCloseDate`, `customer`

---

### 8) 用户 (users / sales-presales-users)

#### 筛选参数

| 参数 | 说明 |
|------|------|
| `search` | 姓名或邮箱关键词（模糊搜索） |
| `limit` | 返回数量限制 |

#### 用法示例

**普通用户搜索：**
```bash
node scripts/search.mjs users --search "<姓名或邮箱>" --limit 20
```

**仅查销售/售前：**
```bash
node scripts/search.mjs sales-presales-users --search "<姓名或邮箱>"
```

**输出核心字段：** `id`, `name`, `email`, `roles`, `createdAt`

---

### 9) 标签 (tags)

#### 筛选参数

| 参数 | 可选值 | 说明 |
|------|--------|------|
| `category` | `LEAD` | 标签分类（当前主要用 LEAD） |
| `search` | string | 关键词（搜索名称/描述/分类） |

> **注意：** 当前业务上仅线索使用 tag 字段；客户、机会暂无 tag 字段

#### 用法示例

```bash
# 全部标签
node scripts/search.mjs tags

# 按分类
node scripts/search.mjs tags --category LEAD

# 按关键词
node scripts/search.mjs tags --category LEAD --search "<关键词>"
```

**输出核心字段：** `id`, `name`, `category`, `description`, `sortOrder`, `isActive`

---

### 10) 通知 (notifications)
注：仅可查询当前用户名下的通知
#### 筛选参数

| 参数 | 可选值 | 说明 |
|------|--------|------|
| `status` | `active` / `history` | active=待处理(ACTIVE/OVERDUE), history=历史(DONE/OVERDUE) |
| `category` | `LEAD_TIMEOUT` 等 | 通知分类 |
| `page` | number | 页码 |
| `limit` | number | 每页数量 |

#### 用法示例

```bash
# 待处理通知（ACTIVE/OVERDUE）
node scripts/search.mjs notifications --status active

# 历史通知（DONE/OVERDUE）
node scripts/search.mjs notifications --status history

# 按分类+分页
node scripts/search.mjs notifications \
  --category LEAD_TIMEOUT \
  --status active \
  --page 2 \
  --limit 20
```

**输出核心字段：** `id`, `category`, `title`, `message`, `status`, `isRead`, `createdAt`

---

### 11) 售前行程 (presales-itineraries)

#### 筛选参数

| 参数 | 说明 |
|------|------|
| `start-date` / `end-date` | 时间段（YYYY-MM-DD） |
| `user-id` | 售前人员ID |
| `opportunity-id` | 机会ID |

#### 用法示例

```bash
# 按时间段
node scripts/search.mjs presales-itineraries \
  --start-date 2026-02-10 \
  --end-date 2026-02-16

# 按售前人员
node scripts/search.mjs presales-itineraries \
  --user-id <userId> \
  --start-date 2026-02-10 \
  --end-date 2026-02-16

# 按机会
node scripts/search.mjs presales-itineraries --opportunity-id <opportunityId>
```

**输出核心字段：** `id`, `title`, `startTime`, `endTime`, `tripType`, `deliveryMode`, `status`, `opportunity`, `customer`

---

### 12) 合同 (contracts)

#### 筛选参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `title` | string | 合同标题（模糊） |
| `contract-number` | string | 合同编号（模糊） |
| `customer-name` | string | 客户名称（模糊） |
| `signed-at-start-date` / `signed-at-end-date` | YYYY-MM-DD | 签约日期范围 |
| `followUpSalesId` | ID | 跟进销售ID（多值用逗号分隔，通过 --query 传递） |
| `opportunity` | string | 关联机会名称（模糊，通过 --query 传递） |
| `sortBy` | 字段名 | 排序字段 |
| `sortOrder` | `asc` / `desc` | 排序方向 |

**排序字段可选值：** `contractNumber`, `title`, `totalAmount`, `signedAt`, `customerName`, `opportunityName`, `followUpSalesName`, `createdAt`

#### 用法示例

```bash
# 按标题
node scripts/search.mjs contracts --title "合同标题"

# 按合同编号
node scripts/search.mjs contracts --contract-number "C2025001"

# 按客户名称
node scripts/search.mjs contracts --customer-name "客户名"

# 按签约日期范围
node scripts/search.mjs contracts \
  --signed-at-start-date 2026-01-01 \
  --signed-at-end-date 2026-03-31

# 高级筛选（--query 支持任意 API 参数，多值用逗号分隔）
node scripts/search.mjs contracts \
  --query "opportunity=机会名称" \
  --query "followUpSalesId=sales-id-1,sales-id-2"
```

**输出核心字段：** `id`, `contractNumber`, `title`, `totalAmount`, `signedAt`, `customer`, `opportunity`, `receivedAmount`

---

### 13) 回款 (contract-payments)

#### 筛选参数

| 参数 | 类型/可选值 | 说明 |
|------|-------------|------|
| `title` | string | 合同标题（模糊） |
| `contract-number` | string | 合同编号（模糊） |
| `status` | `已回款`、`待回款`（多值用逗号分隔） | 回款状态 |
| `expected-at-start-date` / `expected-at-end-date` | YYYY-MM-DD | 预计回款日期范围 |
| `followUpSalesId` | ID | 跟进销售ID（多值用逗号分隔，通过 --query 传递） |
| `sortBy` | `expectedAt`, `status`, `createdAt` | 排序字段 |
| `sortOrder` | `asc` / `desc` | 默认 `asc` |

#### 用法示例

```bash
# 按状态
node scripts/search.mjs contract-payments --status 待回款
node scripts/search.mjs contract-payments --status 已回款

# 按合同信息
node scripts/search.mjs contract-payments --title "合同标题"
node scripts/search.mjs contract-payments --contract-number "C2025001"

# 按日期范围
node scripts/search.mjs contract-payments \
  --expected-at-start-date 2026-01-01 \
  --expected-at-end-date 2026-03-31

# 高级筛选（--query 支持任意 API 参数，多值用逗号分隔）
node scripts/search.mjs contract-payments \
  --query "status=待回款,已回款" \
  --query "followUpSalesId=sales-id"
```

**输出核心字段：** `id`, `nodeName`, `expectedAmount`, `expectedAt`, `actualReceivedAmount`, `status`, `contract`

## 公海概念说明

**公海**是 CRM 中未分配给具体销售的线索和客户池，由特殊"公海用户"统一持有。

- **线索流转**：新线索先进入公海，销售可领取或分配
- **客户回收**：长期未跟进的客户可能退回公海

### 公海查询

**公海线索：**
```bash
node scripts/search.mjs leads --query publicOnly=true
```

**公海客户：**
```bash
# 先获取公海用户ID
node scripts/search.mjs me
# 从响应中获取 publicPoolUserEmail，然后查询用户ID
node scripts/search.mjs users --search "<公海用户邮箱>"
# 使用公海用户ID查询
node scripts/search.mjs customers --query 'followUpSalesId[]=<公海用户ID>'
```

## 输出建议

向用户展示结果时，优先显示核心字段：

- **自己**：`id`, `name`, `email`, `roles`
- **客户**：`id`, `companyName`, `customerStatus`, `followUpSales`
- **线索**：`id`, `companyName`, `status`, `classification`, `owner`, `importedAt`
- **机会**：`id`, `name`, `status`, `amount`, `estimatedCloseDate`, `customer`
- **商务记录**：`recordTime`, `followUpType`, `contactedPerson`, `description`
- **联系人**：`name`, `phone`, `position`, `roles`
- **用户**：`id`, `name`, `email`, `roles`
- **标签**：`id`, `name`, `category`, `description`
- **通知**：`id`, `category`, `title`, `message`, `status`, `isRead`
- **售前行程**：`id`, `title`, `startTime`, `endTime`, `tripType`, `deliveryMode`, `status`
- **合同**：`id`, `contractNumber`, `title`, `totalAmount`, `signedAt`, `customer`, `opportunity`
- **回款**：`id`, `nodeName`, `expectedAmount`, `expectedAt`, `actualReceivedAmount`, `status`
