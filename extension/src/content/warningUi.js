export function buildWarningModel(assessment) {
  const title = assessment.warning_copy || defaultTitle(assessment.risk_level);
  return {
    title,
    score: assessment.score,
    riskLevel: assessment.risk_level,
    reasons: assessment.reasons || [],
    dismissLabel: "Dismiss",
    detailsLabel: "Show why",
  };
}

export function renderInlineWarning(form, assessment) {
  const existing = form.previousElementSibling;
  if (existing?.classList?.contains("phishshield-warning")) {
    existing.remove();
  }

  const model = buildWarningModel(assessment);
  const warning = document.createElement("section");
  warning.className = `phishshield-warning phishshield-${model.riskLevel}`;
  warning.setAttribute("role", "status");
  warning.innerHTML = `
    <div class="phishshield-icon">!</div>
    <div class="phishshield-body">
      <strong>${escapeHtml(model.title)}</strong>
      <p>${escapeHtml(model.reasons[0] || "Review the address before entering your password.")}</p>
      <div class="phishshield-actions">
        <button type="button" data-phishshield-details>${escapeHtml(model.detailsLabel)}</button>
        <button type="button" data-phishshield-dismiss>${escapeHtml(model.dismissLabel)}</button>
      </div>
    </div>
  `;

  warning.querySelector("[data-phishshield-dismiss]")?.addEventListener("click", () => warning.remove());
  injectStyles();
  form.parentNode?.insertBefore(warning, form);
  return warning;
}

function defaultTitle(riskLevel) {
  if (riskLevel === "high") {
    return "This login form looks high risk.";
  }
  if (riskLevel === "suspicious") {
    return "This login form looks suspicious.";
  }
  return "No obvious phishing signals found.";
}

function injectStyles() {
  if (document.getElementById("phishshield-inline-style")) {
    return;
  }
  const style = document.createElement("style");
  style.id = "phishshield-inline-style";
  style.textContent = `
    .phishshield-warning {
      box-sizing: border-box;
      display: grid;
      grid-template-columns: 32px minmax(0, 1fr);
      gap: 12px;
      max-width: 460px;
      margin: 12px 0;
      padding: 13px 14px;
      border: 1px solid #edc572;
      border-left: 5px solid #b76a00;
      border-radius: 10px;
      background: #fff9ee;
      color: #17212b;
      box-shadow: 0 10px 24px rgba(110, 77, 28, 0.1);
      font: 14px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      z-index: 2147483647;
    }
    .phishshield-high {
      border-color: #e68f8f;
      border-left-color: #c93e3e;
      background: #fff4f4;
    }
    .phishshield-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: #b76a00;
      color: #fff;
      display: grid;
      place-items: center;
      font-weight: 900;
    }
    .phishshield-high .phishshield-icon {
      background: #c93e3e;
    }
    .phishshield-body strong {
      display: block;
      margin-bottom: 3px;
      font-size: 14px;
    }
    .phishshield-body p {
      margin: 0 0 8px;
      color: #654a20;
      font-size: 13px;
    }
    .phishshield-actions {
      display: flex;
      gap: 8px;
    }
    .phishshield-actions button {
      min-height: 30px;
      border-radius: 8px;
      border: 1px solid #e8c27c;
      background: #fff;
      color: #4d3716;
      padding: 0 10px;
      font-weight: 700;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
