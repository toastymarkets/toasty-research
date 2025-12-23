/**
 * Development-only logger utility
 * Logs are silenced in production builds
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args) => isDev && console.log(...args),
  warn: (...args) => isDev && console.warn(...args),
  error: (...args) => console.error(...args), // Always log errors
  info: (...args) => isDev && console.info(...args),
  debug: (...args) => isDev && console.debug(...args),
  group: (label) => isDev && console.group(label),
  groupEnd: () => isDev && console.groupEnd(),
  groupCollapsed: (label) => isDev && console.groupCollapsed(label),
  table: (data) => isDev && console.table(data),
  time: (label) => isDev && console.time(label),
  timeEnd: (label) => isDev && console.timeEnd(label),
};

export default logger;
