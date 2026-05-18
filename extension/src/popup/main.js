const api = globalThis.browser || globalThis.chrome;

async function init() {
  const tabs = await api?.tabs?.query?.({ active: true, currentWindow: true });
  const tab = tabs?.[0];
  const response = await api?.runtime?.sendMessage?.({
    type: "PHISHSHIELD_GET_CURRENT",
    tabId: tab?.id,
  });
  render(response?.assessment, tab?.url);
}

function render(assessment, tabUrl) {
  const status = document.getElementById("status");
  const title = document.getElementById("title");
  const domain = document.getElementById("domain");
  const score = document.getElementById("score");
  const bar = document.getElementById("bar");
  const reasons = document.getElementById("reasons");

  const risk = assessment?.risk_level || "safe";
  const value = assessment?.score || 0;
  status.textContent = labelFor(risk);
  status.className = `pill ${risk}`;
  title.textContent = titleFor(risk, Boolean(assessment));
  domain.textContent = tabUrl ? new URL(tabUrl).hostname : "Current page";
  score.textContent = String(value);
  bar.style.width = `${value}%`;
  bar.className = `bar ${risk}`;
  reasons.innerHTML = "";

  const reasonItems = assessment?.reasons?.length
    ? assessment.reasons
    : ["No obvious phishing signals were found."];
  for (const reason of reasonItems) {
    const item = document.createElement("li");
    item.innerHTML = `<span class="dot">!</span><span>${escapeHtml(reason)}</span>`;
    reasons.appendChild(item);
  }
}

function labelFor(risk) {
  if (risk === "high") return "High risk";
  if (risk === "suspicious") return "Suspicious";
  return "Safe";
}

function titleFor(risk, hasAssessment) {
  if (!hasAssessment) return "No scan result yet";
  if (risk === "high") return "Check before signing in";
  if (risk === "suspicious") return "Login risk detected";
  return "No obvious phishing signals";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
