---
name: lcrm-search
description: 检索自己、客户、客户商务记录、客户机会、客户联系人、线索、机会、标签与用户，并通过脚本发起查询。
---

# 场景1：检索

## 目标

支持销售快速检索：

- 自己（当前登录身份）
- 客户（包括公海客户）
- 商务记录（按客户、线索、机会、记录人查询）
- 客户机会
- 客户联系人
- 线索（包括公海线索）
- 机会
- 标签
- 用户
- 通知（激活的通知、历史通知）
- 售前行程（按时间段筛选）

## 脚本入口

- 主脚本：`node scripts/search.mjs <action> [options]`
- 通用脚本：`node scripts/request.mjs ...`
- 环境变量：
  - 必填：`LCRM_API_KEY`
  - 可选：`LCRM_BASE_URL`（默认 `https://crm.langcore.net`）

## 执行流程

1. 判断用户要查的对象（自己/客户/线索/机会/标签/用户/客户关联数据）。
2. 若对象是自己，使用 `me` action。
3. 若对象是用户，优先使用 `users` 或 `sales-presales-users` action。
4. 若对象是标签，使用 `tags` action。
5. 优先调用 `search.mjs` 对应 action 发起检索。
6. 若命中多条且无法确定唯一对象，先让用户选择再继续。
7. 返回结果时，先给核心字段，再给可继续缩小范围的建议参数。

## 检索枚举字典

客户筛选枚举（`GET /api/customers`）：

- `customerType[]`：`直接客户`、`合作伙伴`
- `customerSource[]`：`自拓线索`、`公司分配`
- `customerStatus[]`：`潜在客户`、`跟进客户`、`商机客户`、`合作客户`、`无效客户`
- `region[]`：`上海`、`北京`、`华南`、`华东`、`海外`、`其他`

机会筛选枚举（`GET /api/opportunities/list`）：

- `status`：`需求引导`、`客户立项`、`客户选定`、`客户成交`、`机会失败`

线索筛选枚举（`GET /api/leads`）：

- `status[]`：`待处理`、`已跟进`、`已转化`
- `classification[]`：`公司`、`市场`、`销售`
- `source[]` 或 `source`：`官方渠道`、`自办活动`、`三方活动`、`市场名单`、`熟人推荐`、`生态伙伴`、`销售自拓`
- `tags[]`：线索标签名称（支持多值，按“包含全部标签”匹配）
- 说明：`tags[]` 当前仅用于线索检索，不适用于客户与机会检索

商务记录字段枚举（用于结果解读与关联查询）：

- `followUpType`：`微信`、`电话`、`线上会议`、`邮件`、`现场拜访`、`商务活动`、`其他`

标签筛选枚举（`GET /api/tags`）：

- `category`：当前系统主要使用 `LEAD`
- 说明：当前业务上仅线索使用 tag 字段；客户、机会暂无 tag 字段

## API 映射

### 1) 搜索自己（当前身份）

- 脚本：
  - `node scripts/search.mjs me`
- API：
  - `GET /api/auth/me`

### 2) 检索客户

- 脚本：
  - `node scripts/search.mjs customers --company-name "<客户名>" --limit 5`
  - 复杂筛选：`node scripts/search.mjs customers --query 'customerStatus[]=跟进客户' --query 'region[]=华东'`
  - 查询公海客户：先获取公海用户ID，再查询 `node scripts/search.mjs customers --query 'followUpSalesId[]=<公海用户ID>'`
  - 查询我的客户：`node scripts/search.mjs customers --query 'followUpSalesId[]=<我的用户ID>'`

### 3) 检索商务记录

支持多种查询方式：

- 按客户查询：`node scripts/search.mjs customer-business-records --customer-id "<customerId>"`
- 按记录人查询：`node scripts/search.mjs business-records --recorder-id "<userId>"`
- 按记录人和时间查询：`node scripts/search.mjs business-records --recorder-id "<userId>" --start-date 2026-02-12 --end-date 2026-02-12`
- 按线索查询：`node scripts/search.mjs business-records --lead-id "<leadId>"`
- 按机会查询：`node scripts/search.mjs business-records --opportunity-id "<opportunityId>"`
- 组合查询：`node scripts/search.mjs business-records --customer-id "<id>" --query limit=10`
- 时间范围查询：`node scripts/search.mjs business-records --start-date 2026-02-01 --end-date 2026-02-28`

注意：如需先找客户再查记录，使用：`node scripts/search.mjs customers --company-name "<客户名>" --limit 5`

### 4) 检索客户机会

二选一：

- `node scripts/search.mjs customer-opportunities --customer-id "<customerId>"`
- `node scripts/search.mjs customer-opportunities --customer-name "<客户名>"`

### 5) 检索客户联系人

- `node scripts/search.mjs customer-contacts --customer-id "<customerId>"`

### 6) 检索线索

- `node scripts/search.mjs leads --query keyword="<关键词>" --query limit=20`
- 复杂筛选示例：
  - `node scripts/search.mjs leads --query 'status[]=已跟进' --query 'classification[]=销售' --query mine=true`
  - `node scripts/search.mjs leads --query 'tags[]=重点客户' --query 'tags[]=AI'`
- 查询公海线索：`node scripts/search.mjs leads --query publicOnly=true`
- 查询我的线索：`node scripts/search.mjs leads --query mine=true`

### 7) 检索机会

- `node scripts/search.mjs opportunities --query customerName="<客户名>" --query status=需求引导,客户立项`
- 金额和日期筛选示例：
  - `node scripts/search.mjs opportunities --query minAmount=100000 --query maxAmount=500000 --query startDate=2026-02-01 --query endDate=2026-03-31`

### 8) 检索用户

- 用户检索（所有认证用户可访问，支持关键词）：
  - `node scripts/search.mjs users --search "<姓名或邮箱关键词>" --limit 20`
- 直接查销售/售前用户：
  - `node scripts/search.mjs sales-presales-users --search "<姓名或邮箱关键词>"`

### 9) 检索标签

- 查全部标签：
  - `node scripts/search.mjs tags`
- 按分类查标签：
  - `node scripts/search.mjs tags --category LEAD`
- 按关键词过滤标签（名称/描述/分类）：
  - `node scripts/search.mjs tags --category LEAD --search "<关键词>"`
- 注意：标签检索主要用于辅助线索检索/录入，当前不用于客户或机会字段过滤

### 10) 检索通知

- 查询激活的通知（ACTIVE/OVERDUE）：
  - `node scripts/search.mjs notifications --status active`
- 查询历史通知（DONE/OVERDUE）：
  - `node scripts/search.mjs notifications --status history`
- 按分类筛选：
  - `node scripts/search.mjs notifications --category LEAD_TIMEOUT --status active`
- 分页查询：
  - `node scripts/search.mjs notifications --page 2 --limit 20`

### 11) 检索售前行程

- 查询指定时间段的行程：
  - `node scripts/search.mjs presales-itineraries --start-date 2026-02-10 --end-date 2026-02-16`
- 查询某个售前的行程：
  - `node scripts/search.mjs presales-itineraries --user-id <userId> --start-date 2026-02-10 --end-date 2026-02-16`
- 查询某个机会的行程：
  - `node scripts/search.mjs presales-itineraries --opportunity-id <opportunityId>`

## 公海概念说明

**公海**是指未分配给具体销售的线索和客户池，由系统中的特殊"公海用户"持有。

### 公海线索

- 线索的 `ownerId` 等于公海用户ID时，该线索属于公海
- 查询公海线索：`node scripts/search.mjs leads --query publicOnly=true`
- 查询我的线索：`node scripts/search.mjs leads --query mine=true`
- 公海用户配置：环境变量 `PUBLIC_POOL_USER_EMAIL`

### 公海客户

- 客户的 `followUpSalesId` 等于公海用户ID时，该客户属于公海
- 查询公海客户：`node scripts/search.mjs customers --query 'followUpSalesId[]=<公海用户ID>'`
- 查询我的客户：`node scripts/search.mjs customers --query 'followUpSalesId[]=<我的用户ID>'`

### 获取公海用户ID

先查询当前用户信息获取公海用户邮箱，再查询用户列表获取公海用户ID：
```bash
# 1. 查询自己，获取系统配置
node scripts/search.mjs me

# 2. 使用公海用户邮箱查询用户ID
node scripts/search.mjs users --search "<公海用户邮箱>"
```

## 输出建议

- 自己：`id/name/email/roles`
- 客户：`id/companyName/customerStatus/followUpSales/_count`
- 商务记录：`recordTime/followUpType/contactedPerson/description`
- 机会：`id/name/status/amount/estimatedCloseDate/customer`
- 联系人：`name/phone/position/roles`
- 线索：`id/companyName/status/classification/owner/importedAt`
- 标签：`id/name/category/description/sortOrder/isActive`
- 用户：`id/name/email/roles/createdAt`
- 通知：`id/category/title/message/status/isRead/createdAt`
- 售前行程：`id/title/startTime/endTime/tripType/deliveryMode/status/opportunity/customer`
