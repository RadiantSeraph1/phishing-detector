export const RISK_LEVELS = ["safe", "suspicious", "high"];

export function normalizeAssessment(value) {
  return {
    risk_level: value?.risk_level || "safe",
    score: Number.isFinite(value?.score) ? value.score : 0,
    reasons: Array.isArray(value?.reasons) ? value.reasons : [],
    source: value?.source || "rules",
    warning_copy: value?.warning_copy || "No obvious phishing signals were found.",
  };
}
