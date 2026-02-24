---
name: lcrm-presales-itinerary
description: 售前行程管理：创建、修改、删除、完成、查询售前行程，支持AI解析自然语言输入。
---

# 售前行程管理

## 目标

售前可以管理自己的行程（增删改查完成），销售可以查询售前的行程和工作负载。

## 脚本入口

- 主脚本：`node scripts/presales-itinerary.mjs <action> [options]`
- 查询脚本：`node scripts/search.mjs presales-itineraries [options]`
- 通用脚本：`node scripts/request.mjs ...`
- 环境变量：
  - 必填：`LCRM_API_KEY`
  - 可选：`LCRM_BASE_URL`（默认 `https://crm.langcore.net`）

## 目标接口

- 创建：`POST /api/presales-itineraries`
- 修改：`PUT /api/presales-itineraries/{id}`
- 删除：`DELETE /api/presales-itineraries/{id}`
- 完成：`POST /api/presales-itineraries/{id}/complete`
- 查询：`GET /api/presales-itineraries/week` (支持时间段、用户、机会筛选)
- 辅助机会检索：`GET /api/presales-itineraries/opportunities?keyword=<关键词>&limit=20`

## 创建接口字段

必填：
- `title`
- `startTime`
- `endTime`
- `opportunityId`
- `tripType`
- `deliveryMode`

选填：
- `remark`：备注，会同步到飞书日程描述中

## 枚举约束

`tripType`：

- `需求调研` `产品介绍` `技术交流` `方案沟通` `方案撰写` `技术预研` `POC测试`
- `产品演示` `产品部署` `标书撰写` `讲标支持` `商务谈判` `内部会议` `案例整理` `培训学习`

`deliveryMode`：

- `现场` `远程`

`status`：

- `PLANNED` 已计划
- `COMPLETED` 已完成

## 时间约束

- 必须是半小时粒度（分钟只能 `00` 或 `30`）。
- `endTime` 必须晚于 `startTime`。

## 必须执行的流程

1. 先调脚本解析原文：
   - `node scripts/presales-itinerary.mjs ai-parse --text "<用户原文>"`
2. 根据解析结果补齐字段：
   - `opportunityId` 缺失时，调用：
     - `node scripts/presales-itinerary.mjs search-opportunities --keyword "<关键词>" --limit 20`
     - 然后让用户确认具体机会。
   - `tripType` 或 `deliveryMode` 缺失/非法时，让用户从枚举里选。
   - `title/startTime/endTime` 缺失时，逐项追问。
3. 本地校验：
   - 时间合法且半小时粒度。
   - 枚举合法。
4. 提交前确认（强制）：
   - 展示确认卡片：
     - 标题
     - 时间范围
     - 机会（名称 + 客户）
     - 行程类型
     - 交付形式
     - 备注（有则展示）
   - 仅当用户明确回复"确认/提交/是"后再调用创建接口。
5. 调用创建脚本并回传结果：
   - `node scripts/presales-itinerary.mjs create --payload '<JSON>'`
   - 或 `--payload-file <file>`

## 操作命令示例

### 创建行程

```bash
node scripts/presales-itinerary.mjs create \
  --title "朗致产品演示" \
  --start-time "2026-02-12T14:00:00" \
  --end-time "2026-02-12T16:00:00" \
  --opportunity-id "<opportunityId>" \
  --trip-type "产品演示" \
  --delivery-mode "现场"

# 带备注
node scripts/presales-itinerary.mjs create \
  --title "朗致产品演示" \
  --start-time "2026-02-12T14:00:00" \
  --end-time "2026-02-12T16:00:00" \
  --opportunity-id "<opportunityId>" \
  --trip-type "产品演示" \
  --delivery-mode "现场" \
  --remark "需要准备演示环境"
```

### 修改行程

```bash
node scripts/presales-itinerary.mjs update \
  --id "<itineraryId>" \
  --title "更新后的标题" \
  --start-time "2026-02-12T15:00:00" \
  --end-time "2026-02-12T17:00:00" \
  --opportunity-id "<opportunityId>" \
  --trip-type "方案沟通" \
  --delivery-mode "远程"

# 带备注
node scripts/presales-itinerary.mjs update \
  --id "<itineraryId>" \
  --title "更新后的标题" \
  --start-time "2026-02-12T15:00:00" \
  --end-time "2026-02-12T17:00:00" \
  --opportunity-id "<opportunityId>" \
  --trip-type "方案沟通" \
  --delivery-mode "远程" \
  --remark "更新备注"
```

### 删除行程

```bash
node scripts/presales-itinerary.mjs delete --id "<itineraryId>"
```

### 完成行程

完成行程后，系统会自动根据完成情况创建一条商务记录（跟进类型为"售前现场"或"售前远程"，取决于行程的交付形式）。

`--completion-note` 支持富文本（HTML 格式）。

```bash
node scripts/presales-itinerary.mjs complete \
  --id "<itineraryId>" \
  --actual-hours 2.5 \
  --completion-note "完成产品演示，客户反馈良好"
```

### 查询行程

```bash
# 查询指定时间段的行程
node scripts/search.mjs presales-itineraries \
  --start-date 2026-02-10 \
  --end-date 2026-02-16

# 查询某个售前的行程（销售查询售前工作负载）
node scripts/search.mjs presales-itineraries \
  --user-id "<userId>" \
  --start-date 2026-02-10 \
  --end-date 2026-02-16

# 查询某个机会的行程
node scripts/search.mjs presales-itineraries \
  --opportunity-id "<opportunityId>"
```

## 缺失信息提示模板

- 缺机会：`请确认要关联的机会（可提供机会名或客户名）。`
- 缺类型：`请确认行程类型（从系统枚举中选择）。`
- 缺交付形式：`请确认交付形式（现场/远程）。`
- 缺时间：`请补充开始和结束时间（半小时粒度，例如 2026-02-11T14:00:00 到 2026-02-11T16:30:00）。`

## 权限说明

- **售前（PreSales）**：可以创建、修改、删除、完成、查询自己的行程
- **销售（Sales）**：可以查询售前的行程和工作负载（用于了解售前是否有空）
- **管理员（SystemAdmin）**：拥有所有权限
