# LCRM Skills

本仓库已按 Skills CLI 自动安装规范整理，推荐安装入口为 `skills/.curated/`。

## 自动安装目录（推荐）

- `skills/.curated/lcrm-search`
- `skills/.curated/lcrm-business-record`
- `skills/.curated/lcrm-presales-itinerary`

每个技能目录均为自包含结构：

- 根目录必须有 `SKILL.md`
- 技能所需脚本位于 `scripts/`
- `SKILL.md` 中的命令统一使用 `node scripts/...`

## 安装示例

使用 `skill-installer` 从 GitHub 安装（将 `<owner>/<repo>` 替换为你的仓库）：

```bash
# 安装单个 skill
python ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo <owner>/<repo> \
  --path skills/.curated/lcrm-search

# 一次安装三个 skill
python ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo <owner>/<repo> \
  --path skills/.curated/lcrm-search skills/.curated/lcrm-business-record skills/.curated/lcrm-presales-itinerary
```

## 运行约束

- 基础地址：`${LCRM_BASE_URL:-https://crm.langcore.net}`
- 鉴权头：`Authorization: Bearer ${LCRM_API_KEY}`
- 必填环境变量：`LCRM_API_KEY`

## 兼容目录（历史保留）

以下目录保留用于历史打包/迁移，不作为 Skills CLI 自动安装入口：

- `skills/search_LCRM`
- `skills/business-record`
- `skills/presales-itinerary`
- `skills/scripts`
- `skills/manifest.json`
