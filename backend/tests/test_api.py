from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_analyze_returns_rule_based_assessment():
    response = client.post(
        "/analyze",
        json={
            "url": "https://secure-paypaI.example/login",
            "hostname": "secure-paypaI.example",
            "page_title": "PayPal account verification",
            "visible_text": ["Your account will be locked. Verify your password now."],
            "forms": [
                {
                    "id": "login",
                    "action": "https://collector.example/submit",
                    "method": "post",
                    "field_types": ["email", "password"],
                    "submit_text": "Verify now",
                }
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["risk_level"] == "high"
    assert body["score"] >= 70
    assert body["source"] in {"rules", "rules+ai"}
    assert "Domain visually resembles PayPal." in body["reasons"]


def test_analyze_rejects_sensitive_payload_fields():
    response = client.post(
        "/analyze",
        json={
            "url": "https://example.com/login",
            "hostname": "example.com",
            "password": "secret-password",
            "visible_text": ["Sign in"],
            "forms": [],
        },
    )

    assert response.status_code == 422


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
