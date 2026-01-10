# Fix Browser

Use this command when Playwright browser gets stuck opening about:blank repeatedly or has connection issues.

## Steps

1. Kill any stuck Chrome processes spawned by Playwright MCP:
```bash
pkill -f "playwright-mcp" || true
pkill -f "chrome.*--remote-debugging" || true
```

2. Wait 2 seconds for processes to fully terminate

3. Clear the Playwright MCP cache directory if it exists:
```bash
rm -rf /Users/jul/Library/Caches/ms-playwright/mcp-chrome-* 2>/dev/null || true
```

4. Report to user that browser has been reset and they can now use browser_navigate again

## Notes
- This is needed when the MCP browser gets into a bad state
- After running this, wait a moment before navigating to a new page
- The next browser_navigate call will start a fresh browser instance
