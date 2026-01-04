---
description: Commit all staged and unstaged changes, push to the remote, and create a pull request.
---

Commit all staged and unstaged changes, push to the remote, and create a pull request.

Follow these steps:

1. Run `git status` and `git diff` to see all changes
2. Run `git log --oneline -5` to understand recent commit style
3. Stage all changes with `git add -A`
4. Create a commit with a clear, concise message that describes the changes
5. Push to the current branch (use `git push -u origin HEAD` if no upstream is set)
6. Create a PR using `gh pr create` with:
   - A descriptive title
   - A body summarizing the changes with a "## Summary" section
   - Include "🤖 Generated with [Claude Code](https://claude.com/claude-code)" at the end

If a PR already exists for this branch, skip PR creation and just report the existing PR URL.

## Changelog & Version (for releases)

After creating the PR, ask the user:
- "Is this a release? Should I update the changelog and version?"

If yes:
1. Determine version bump type:
   - **patch** (1.2.0 → 1.2.1): Bug fixes only
   - **minor** (1.2.0 → 1.3.0): New features, backwards compatible
   - **major** (1.2.0 → 2.0.0): Breaking changes
2. Update `package.json` version field
3. Add new section to top of `CHANGELOG.md` with:
   - Version number and today's date
   - Changes grouped by: Added, Changed, Fixed, Removed
4. Commit the version bump: "Bump version to X.X.X"
5. Push the update
