from urllib.parse import urlparse

from app.models import PageSignals, RiskAssessment


BRAND_LOOKALIKES = {
    "paypal": ("PayPal", ("paypa1", "paypai", "paypaI", "paypol")),
    "google": ("Google", ("g00gle", "googIe", "gooogle")),
    "microsoft": ("Microsoft", ("micros0ft", "rnicrosoft", "microsof-t")),
    "amazon": ("Amazon", ("arnazon", "amaz0n")),
    "facebook": ("Facebook", ("faceb00k", "facebo0k")),
}

URGENT_WORDS = (
    "locked",
    "verify now",
    "immediately",
    "suspended",
    "confirm your password",
    "account will be",
)

SUSPICIOUS_TLDS = (".zip", ".mov", ".top", ".click", ".country")


def score_page(signals: PageSignals) -> RiskAssessment:
    score = 0
    reasons: list[str] = []
    hostname = signals.hostname.lower()
    parsed_url = urlparse(signals.url)

    brand_reason = _brand_impersonation_reason(hostname)
    if brand_reason:
        score += 45
        reasons.append(brand_reason)

    if hostname.startswith("xn--") or ".xn--" in hostname:
        score += 25
        reasons.append("Domain uses punycode characters.")

    if hostname.endswith(SUSPICIOUS_TLDS):
        score += 15
        reasons.append("Domain uses a commonly abused top-level domain.")

    if hostname.count(".") >= 3:
        score += 10
        reasons.append("Domain uses excessive subdomains.")

    for form in signals.forms:
        if not form.has_password_field:
            continue

        action_hostname = form.action_hostname
        if action_hostname and action_hostname != hostname:
            score += 30
            reasons.append("Login form submits to a different host.")

        if parsed_url.scheme == "http":
            score += 35
            reasons.append("Password form is served over an insecure connection.")

    if _contains_urgent_wording(signals):
        score += 20
        reasons.append("Page uses urgent account-security wording.")

    score = min(score, 100)
    risk_level = _level_for_score(score)
    return RiskAssessment(
        risk_level=risk_level,
        score=score,
        reasons=_dedupe(reasons),
        warning_copy=_warning_copy(risk_level),
    )


def _brand_impersonation_reason(hostname: str) -> str | None:
    normalized = hostname.replace("-", "").replace(".", "")
    for canonical, (label, lookalikes) in BRAND_LOOKALIKES.items():
        if canonical in normalized:
            continue
        if any(variant.lower() in normalized.lower() for variant in lookalikes):
            return f"Domain visually resembles {label}."
    return None


def _contains_urgent_wording(signals: PageSignals) -> bool:
    text = " ".join([signals.page_title or "", *signals.visible_text]).lower()
    return any(term in text for term in URGENT_WORDS)


def _level_for_score(score: int):
    if score >= 70:
        return "high"
    if score >= 35:
        return "suspicious"
    return "safe"


def _warning_copy(risk_level: str) -> str:
    if risk_level == "high":
        return "This login form looks high risk. Check the address before entering credentials."
    if risk_level == "suspicious":
        return "This login form looks suspicious. Check the address before entering your password."
    return "No obvious phishing signals were found."


def _dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            result.append(value)
    return result
