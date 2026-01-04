---
description: Kill all dev servers except the most recent one.
---

Kill all dev servers except the most recent one.

This command cleans up orphaned Vite dev servers that accumulate during development sessions.

Steps:

1. List all running Vite dev server processes with `ps aux | grep -E "node.*vite" | grep -v grep`
2. If only 0-1 servers are running, report that no cleanup is needed
3. If multiple servers are running, identify them by PID and start time
4. Kill all but the most recently started server (highest PID typically, or use start time)
5. Also kill their parent `npm run dev` processes
6. Verify only one server remains and report which port it's running on
7. Report how many servers were killed

Use this command pattern to find and kill old servers:
```bash
# Get all vite PIDs sorted by start time, kill all but the last one
ps aux | grep -E "(npm.*dev|node.*vite)" | grep -v grep
```
