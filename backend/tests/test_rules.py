from app.models import PageSignals
from app.rules import score_page


def test_brand_impersonation_and_action_mismatch_raise_risk():
    signals = PageSignals(
        url="https://secure-paypaI.example/login",
        hostname="secure-paypaI.example",
        page_title="PayPal account verification",
        visible_text=["Your account will be locked. Verify your password now."],
        forms=[
            {
                "id": "login",
                "action": "https://collector.example/submit",
                "method": "post",
                "field_types": ["email", "password"],
                "submit_text": "Verify now",
            }
        ],
    )

    result = score_page(signals)

    assert result.risk_level == "high"
    assert result.score >= 70
    assert "Domain visually resembles PayPal." in result.reasons
    assert "Login form submits to a different host." in result.reasons


def test_safe_https_login_stays_low_risk():
    signals = PageSignals(
        url="https://example.com/login",
        hostname="example.com",
        page_title="Example login",
        visible_text=["Sign in to your account."],
        forms=[
            {
                "id": "login",
                "action": "https://example.com/session",
                "method": "post",
                "field_types": ["email", "password"],
                "submit_text": "Sign in",
            }
        ],
    )

    result = score_page(signals)

    assert result.risk_level == "safe"
    assert result.score < 35
    assert result.reasons == []
