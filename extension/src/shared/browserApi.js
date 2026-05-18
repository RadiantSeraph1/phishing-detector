export function getBrowserApi() {
  if (globalThis.browser) {
    return globalThis.browser;
  }
  if (globalThis.chrome) {
    return globalThis.chrome;
  }
  return null;
}
