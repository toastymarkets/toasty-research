---
description: Generate a comprehensive session summary documenting all work completed.
---

Generate a comprehensive session summary documenting all work completed during this coding session.

Follow these steps:

1. Run `git log --oneline [branch] --not main` to get all commits on the feature branch
2. Analyze the commits to understand what was accomplished
3. Generate a well-formatted summary including:

## Format

```markdown
## Complete Session Summary

**Branch**: `feature-branch-name`
**Total Commits**: X

### 🎯 Major Accomplishments

#### 1️⃣ **Phase Name** (brief description)
- Key changes made
- Impact and purpose
- Specific features added

#### 2️⃣ **Phase Name** (brief description)
- More accomplishments
- Group related changes together

### 📊 Statistics
- **Quantified metrics**: Files changed, lines added, keywords added, etc.
- **Scope**: Cities/components affected
- **Testing**: What was verified

### ✅ Status
- Current state (Ready to merge / Remaining work / In progress)
- Next steps if applicable
```

## Best Practices

- **Use emojis** (1️⃣, 2️⃣, 🎯, 📊, ✅) to make sections scannable
- **Be specific**: Include commit hashes, file names, exact numbers
- **Group logically**: Organize by feature/phase, not chronologically
- **Quantify**: "Added 30 keywords" not "Added many keywords"
- **Highlight impact**: Why the changes matter for users/traders
- **Note testing**: What was verified to work
- **Keep it concise**: Bullet points, not paragraphs

## When to Use

- End of a feature implementation session
- Before using `/ship` to create a PR
- When documenting a complex series of changes
- For context in the next session or handoff
