<!--
Fill every {{...}}; delete guidance comments and any steps that don't apply.
Rule: every command copy-paste runnable. A clean machine must succeed from this file alone.
-->
# Deploying {{Project Name}}

{{One sentence: what it is and where it ends up.}}

## Prerequisites
- {{Tool >= version}}   (check: `{{cmd --version}}`)

## 1. Get the code
```bash
git clone {{repo-url}} && cd {{repo-dir}}
git checkout {{tag}}
{{install deps}}
```

## 2. Configure
- {{SETTING — what it's for — example}}   <!-- or: "No configuration required." -->

## 3. Deploy
```bash
{{exact deploy commands}}
```

## 4. Verify
- {{open / run this}} → you should see {{result}}.

## Troubleshooting
| You see | Fix |
|---|---|
| {{exact error string}} | {{fix}} |
