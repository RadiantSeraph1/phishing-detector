import { getBrowserApi } from "../shared/browserApi.js";
import { normalizeAssessment } from "../shared/types.js";

const api = getBrowserApi();
const latestByTab = new Map();
const API_URL = "http://127.0.0.1:8000/analyze";

api?.runtime?.onMessage?.addListener?.((message, sender, sendResponse) => {
  if (message?.type !== "PHISHSHIELD_ANALYZE_PAGE") {
    return false;
  }

  analyzePage(message.signals)
    .then((assessment) => {
      const tabId = sender?.tab?.id;
      if (typeof tabId === "number") {
        latestByTab.set(tabId, assessment);
        updateBadge(tabId, assessment);
      }
      sendResponse({ assessment });
    })
    .catch(() => {
      const assessment = normalizeAssessment({ risk_level: "safe", score: 0, reasons: [] });
      sendResponse({ assessment });
    });

  return true;
});

api?.runtime?.onMessage?.addListener?.((message, sender, sendResponse) => {
  if (message?.type !== "PHISHSHIELD_GET_CURRENT") {
    return false;
  }
  const tabId = message.tabId;
  sendResponse({ assessment: latestByTab.get(tabId) || null });
  return false;
});

async function analyzePage(signals) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(signals),
  });
  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.status}`);
  }
  return normalizeAssessment(await response.json());
}

function updateBadge(tabId, assessment) {
  const text = assessment.risk_level === "high" ? "HIGH" : assessment.risk_level === "suspicious" ? "!" : "";
  const color = assessment.risk_level === "high" ? "#c93e3e" : "#b76a00";
  api?.action?.setBadgeText?.({ tabId, text });
  if (text) {
    api?.action?.setBadgeBackgroundColor?.({ tabId, color });
  }
}
