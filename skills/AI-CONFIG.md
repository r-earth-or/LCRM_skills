# LCRM AI Config

适用于 Claude Code、Codex 等 AI 工具。

## 环境变量

- 必填：`LCRM_API_KEY`
- 可选：`LCRM_BASE_URL`
  - 默认值：`https://crm.langcore.net`
  - 仅在测试环境时覆盖。

## 调用策略

在各 skill 目录中优先调用 `scripts/` 下的请求脚本：

- `node scripts/search.mjs ...`
- `node scripts/business-record.mjs ...`
- `node scripts/presales-itinerary.mjs ...`
- `node scripts/request.mjs ...`（兜底）

## 最小请求示例

```bash
curl -sS "${LCRM_BASE_URL:-https://crm.langcore.net}/api/auth/me" \
  -H "Authorization: Bearer ${LCRM_API_KEY}" \
  -H "Content-Type: application/json"
```
