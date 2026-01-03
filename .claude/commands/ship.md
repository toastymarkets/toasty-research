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
