# Machine-readable evidence

When requested, return a final JSON object (without Markdown fences):

```json
{
  "workflow": "aop-mode",
  "kind": "repair",
  "summary": "Concrete result",
  "checks": [
    {
      "command": "node --test",
      "before": "failed",
      "after": "passed",
      "evidence": "Decisive output"
    }
  ],
  "findings": [
    {
      "file": "src/example.ts",
      "line": 12,
      "trigger": "Specific input",
      "consequence": "Observable defect"
    }
  ],
  "limits": []
}
```

Use kind `repair`, `change`, `review`, or `explain`. Lists may be empty. Before and
after are `passed`, `failed`, or `not-run`. Never fabricate a check. Reviews place
findings in the response, not in files. This report is an agent claim; independent
tests must check it against execution and actual artifacts.
