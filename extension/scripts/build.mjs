import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, "dist");
const chromeDist = join(dist, "chrome");
const firefoxDist = join(dist, "firefox");

await rm(dist, { recursive: true, force: true });
await mkdir(chromeDist, { recursive: true });
await mkdir(firefoxDist, { recursive: true });

for (const target of [chromeDist, firefoxDist]) {
  await mkdir(join(target, "content"), { recursive: true });
  await mkdir(join(target, "background"), { recursive: true });
  await mkdir(join(target, "popup"), { recursive: true });
  await cp(join(root, "src/popup"), join(target, "popup"), { recursive: true });
  await writeFile(join(target, "content/index.js"), await contentBundle(), "utf8");
  await writeFile(join(target, "background/index.js"), await backgroundBundle(), "utf8");
}

await cp(join(root, "manifest.chrome.json"), join(chromeDist, "manifest.json"));
await cp(join(root, "manifest.firefox.json"), join(firefoxDist, "manifest.json"));

console.log(`Built Chrome extension to ${chromeDist}`);
console.log(`Built Firefox extension to ${firefoxDist}`);

async function contentBundle() {
  const detector = stripExports(await readFile(join(root, "src/content/detector.js"), "utf8"));
  const warning = stripExports(await readFile(join(root, "src/content/warningUi.js"), "utf8"));
  return `${detector}\n\n${warning}\n\n${contentRuntime()}`;
}

async function backgroundBundle() {
  const types = stripExports(await readFile(join(root, "src/shared/types.js"), "utf8"));
  const browserApi = stripExports(await readFile(join(root, "src/shared/browserApi.js"), "utf8"));
  const runtime = await readFile(join(root, "src/background/index.js"), "utf8");
  return `${types}\n\n${browserApi}\n\n${runtime.replaceAll(/import .*;\n/g, "")}`;
}

function stripExports(source) {
  return source.replaceAll("export function", "function").replaceAll("export const", "const");
}

function contentRuntime() {
  return `
const api = globalThis.browser || globalThis.chrome;

async function scanCurrentPage() {
  const signals = collectPageSignals(document, location.href);
  const loginForms = findLoginForms(document);
  if (loginForms.length === 0) {
    return;
  }

  const response = await api?.runtime?.sendMessage?.({
    type: "PHISHSHIELD_ANALYZE_PAGE",
    signals,
  });

  if (response?.assessment?.risk_level === "suspicious" || response?.assessment?.risk_level === "high") {
    for (const form of loginForms) {
      renderInlineWarning(form, response.assessment);
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", scanCurrentPage, { once: true });
} else {
  scanCurrentPage();
}
`;
}
