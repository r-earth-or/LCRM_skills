---
name: lcrm-business-record
description: 解析销售输入并创建商务记录，缺失信息时先追问，提交前必须确认。
---

# 商务记录填写

## 目标

销售输入自然语言后，自动整理并创建商务记录。
如果信息缺失，先提醒补充。
提交前必须让用户确认。

注意：商务记录查询功能已移至 lcrm-search skill，本 skill 仅负责创建商务记录。

## 脚本入口

- 主脚本：`node scripts/business-record.mjs <action> [options]`
- 环境变量：
  - 必填：`LCRM_API_KEY`
  - 可选：`LCRM_BASE_URL`（默认 `https://crm.langcore.net`）

## 目标接口

- `POST /api/business-records`

请求体关键字段：

- 必填：
  - `customerId` 或 `leadId`（二选一，销售场景优先 `customerId`）
  - `followUpType`（枚举）
  - `contactedPerson`
  - `description`（去 HTML 后至少 10 个字）
- 可选：
  - `recordTime`
  - `opportunityId`
  - `opportunityStatus`
  - `estimatedCloseDate`
  - `actualCloseDate`
  - `attachments`

`followUpType` 枚举：

- `微信` `电话` `线上会议` `邮件` `现场拜访` `商务活动` `其他`

## 必须执行的流程

1. 解析用户输入，抽取：
   - 客户名称
   - 联系人名称
   - 跟进类型（若无法判断先置空）
   - 记录内容
2. 客户名称转 ID：
   - 脚本：`node scripts/business-record.mjs find-customer --company-name "<客户名>" --limit 5`
   - 无结果：告知客户不存在并让用户补充准确名称。
   - 多结果：列候选让用户确认唯一客户。
3. 联系人校验（建议）：
   - 脚本：`node scripts/business-record.mjs customer-detail --customer-id "<customerId>"`，检查联系人是否存在。
   - 若未命中，不阻断，但提示"联系人未在系统中匹配到，将按文本写入 contactedPerson"。
4. 组装 payload 并做本地校验：
   - `description` 长度 >= 10
   - `followUpType` 必须在枚举中
5. 提交前确认（强制）：
   - 输出确认卡片，至少包含：
     - `customerId` + 客户名
     - `contactedPerson`
     - `followUpType`
     - `description` 摘要
     - `recordTime`（若为空说明"默认当前时间"）
   - 仅当用户明确回复"确认/提交/是"再执行 POST。
6. 提交并回传结果：
   - 脚本：`node scripts/business-record.mjs create --payload '<JSON>'` 或 `--payload-file <file>`
   - 成功：返回 `id/recordTime` 与关键字段。
   - 失败：透出后端错误并给下一步补充建议。

## 命令示例

```bash
node scripts/business-record.mjs create \
  --customer-id "<customerId>" \
  --follow-up-type "电话" \
  --contacted-person "张三" \
  --description "已与客户确认POC范围和预算，预计下周提交技术方案。"
```

## 缺失信息提示模板

当以下字段缺失时，直接向用户追问：

- 缺客户名：`请补充客户名称。`
- 缺联系人：`请补充本次对接人姓名。`
- 缺跟进类型：`请补充跟进类型（微信/电话/线上会议/邮件/现场拜访/商务活动/其他）。`
- 缺记录内容或不足 10 字：`请补充更完整的跟进记录（至少 10 个字）。`
- 请求返回报错：`请先完善联系人信息（姓名、电话、角色）后再新增商务记录`(此时需要用户前往LCRM系统web端完善联系人信息)。
