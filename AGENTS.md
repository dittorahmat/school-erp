# Agents Guidelines

## Agent skills

### Issue tracker

Local markdown files in `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`GLOSSARY.md` + `docs/adr/`). See `docs/agents/domain.md`.

### Frontend Design & UI Mandate

Semua perubahan, penambahan, perbaikan tampilan, maupun refactoring pada komponen frontend (`apps/web/` atau antarmuka pengguna apa pun) **WAJIB** melalui dan mematuhi panduan skill **`design-taste-frontend`** (tasteskill v2 anti-slop rules):
- Gunakan token tema resmi (DM Sans, tabular-nums untuk data/tabel, hindari gradien ungu/indigo generik, hilangkan fake drop-shadows pada elemen istirahat, hindari hairline dividers tanpa substansi).
- Setiap komponen atau halaman baru/modifikasi wajib diverifikasi dengan linter: `node .agents/skills/design-taste-frontend/scripts/lint.mjs <files>`.
