import { collectPageSignals, findLoginForms } from "./detector.js";
import { renderInlineWarning } from "./warningUi.js";

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
