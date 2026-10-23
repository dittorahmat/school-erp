# Issue tracker: GitHub Issues

Issues for this repo live in GitHub Issues at `dittorahmat/school-erp`.

## Operations

Use the `gh` CLI for all operations. Always specify `--repo dittorahmat/school-erp` if not in a working directory git context.

### List issues

```bash
gh issue list --repo dittorahmat/school-erp
```

Filter by triage label:

```bash
gh issue list --repo dittorahmat/school-erp --label needs-triage
gh issue list --repo dittorahmat/school-erp --label ready-for-agent
```

### View an issue

```bash
gh issue view <number> --repo dittorahmat/school-erp --comments
```

### Create an issue

```bash
gh issue create --repo dittorahmat/school-erp --title "<title>" --body "<body>" --label "<label>"
```

### Update an issue

Add a comment:

```bash
gh issue comment <number> --repo dittorahmat/school-erp --body "<comment>"
```

Change labels (e.g. during triage):

```bash
gh issue edit <number> --repo dittorahmat/school-erp --add-label "<label>" --remove-label "<old-label>"
```

Close an issue:

```bash
gh issue close <number> --repo dittorahmat/school-erp
```
