# LCRM Skills

Installable skills for LCRM workflows.

## Available Skills

- `lcrm-search`
- `lcrm-business-record`
- `lcrm-presales-itinerary`

Installable folders are in `skills/.curated/`.

## Recommended Install (`npx skills add`)

```bash
# list skills in this repo
npx skills add r-earth-or/LCRM_skills --list

# install one skill
npx skills add r-earth-or/LCRM_skills --skill lcrm-search

# install all skills
npx skills add r-earth-or/LCRM_skills --all
```

If your environment needs a target agent flag (for example Claude Code), use the agent option supported by your local CLI (`npx skills add --help`).

## Important: Default Branch

`npx skills add owner/repo` reads from the repository default branch.
Set your GitHub default branch to `main` before publishing updates.

## Fallback Install for Codex

```bash
# install one
python ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo r-earth-or/LCRM_skills \
  --path skills/.curated/lcrm-search

# install all three
python ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo r-earth-or/LCRM_skills \
  --path skills/.curated/lcrm-search skills/.curated/lcrm-business-record skills/.curated/lcrm-presales-itinerary
```

## Fallback Install for Claude Code

```bash
mkdir -p ~/.claude/skills
cp -R skills/.curated/lcrm-search ~/.claude/skills/
cp -R skills/.curated/lcrm-business-record ~/.claude/skills/
cp -R skills/.curated/lcrm-presales-itinerary ~/.claude/skills/
```

Restart your tool after install to load skills.

## Required Environment

- `LCRM_API_KEY` (required)
- `LCRM_BASE_URL` (optional, default `https://crm.langcore.net`)
