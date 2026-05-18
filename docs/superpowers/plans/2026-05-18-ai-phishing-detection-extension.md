# AI Phishing Detection Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working MVP with a tested FastAPI phishing-analysis backend and a Chrome/Firefox-compatible browser extension that shows a polished popup and inline login-form warnings.

**Architecture:** The extension scans pages locally, renders non-blocking warnings, and asks the FastAPI backend for AI-assisted risk explanations using sanitized page signals. The backend combines deterministic rule scoring with an optional OpenAI Responses API structured JSON assessment. The extension never sends typed credentials or password values.

**Tech Stack:** Python 3 + FastAPI + pytest for the backend; zero-build JavaScript + Node's built-in test runner for extension logic; Manifest V3 with separate Chrome and Firefox manifest files.

---

## File Map

- `backend/requirements.txt`: Python dependencies for FastAPI, tests, dotenv, and OpenAI.
- `backend/app/models.py`: Pydantic request/response models and credential-field validation.
- `backend/app/rules.py`: deterministic phishing rule scorer.
- `backend/app/openai_client.py`: OpenAI Responses API adapter with structured JSON output and safe fallback behavior.
- `backend/app/main.py`: FastAPI application and `/analyze` endpoint.
- `backend/tests/test_rules.py`: rule scoring tests.
- `backend/tests/test_api.py`: API validation and response tests.
- `extension/package.json`: extension build/test scripts.
- `extension/manifest.chrome.json`: Chrome Manifest V3.
- `extension/manifest.firefox.json`: Firefox-compatible Manifest V3.
- `extension/scripts/build.mjs`: copies popup assets and emits bundled Chrome/Firefox extension folders.
- `extension/src/shared/types.js`: shared risk and page-signal helpers.
- `extension/src/shared/browserApi.js`: Chrome/Firefox browser API wrapper.
- `extension/src/content/detector.js`: login form and page-signal detection.
- `extension/src/content/warningUi.js`: inline warning rendering/dismissal.
- `extension/src/content/index.js`: content script wiring.
- `extension/src/background/index.js`: tab analysis coordination and badge state.
- `extension/src/popup/index.html`: popup shell.
- `extension/src/popup/main.ts`: popup UI rendering.
- `extension/src/popup/styles.css`: polished security UI styles.
- `extension/tests/detector.test.ts`: content detector tests.
- `extension/tests/warningUi.test.ts`: inline warning tests.
- `docs/SETUP.md`: local run and browser loading instructions.

## Task 1: Backend Models And Rule Scoring

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/models.py`
- Create: `backend/app/rules.py`
- Create: `backend/tests/test_rules.py`

- [ ] **Step 1: Write failing backend rule tests**

Create `backend/tests/test_rules.py`:

```python
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
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `python -m pytest backend/tests/test_rules.py -q`

Expected: FAIL because `app.models` and `app.rules` do not exist.

- [ ] **Step 3: Implement backend models and rules**

Create `backend/requirements.txt`:

```text
fastapi==0.115.6
uvicorn[standard]==0.34.0
pydantic==2.10.4
pytest==8.3.4
python-dotenv==1.0.1
openai==1.59.7
```

Create `backend/app/__init__.py`:

```python
```

Create `backend/app/models.py` with `FormSignal`, `PageSignals`, `RiskAssessment`, and validation that rejects credential-like raw fields.

Create `backend/app/rules.py` with `score_page(signals: PageSignals) -> RiskAssessment`, brand impersonation checks for common brands, action-host mismatch detection, HTTP credential-form detection, urgent wording detection, and score-to-level mapping.

- [ ] **Step 4: Run tests and confirm GREEN**

Run: `python -m pytest backend/tests/test_rules.py -q`

Expected: PASS.

## Task 2: FastAPI Analysis Endpoint

**Files:**
- Create: `backend/app/openai_client.py`
- Create: `backend/app/main.py`
- Create: `backend/tests/test_api.py`

- [ ] **Step 1: Write failing API tests**

Create `backend/tests/test_api.py` with tests that:

- posts suspicious page signals to `/analyze`,
- asserts a valid risk response,
- asserts forbidden credential-like payload fields are rejected with HTTP 422.

- [ ] **Step 2: Run tests and confirm RED**

Run: `python -m pytest backend/tests/test_api.py -q`

Expected: FAIL because `backend/app/main.py` does not exist.

- [ ] **Step 3: Implement API and OpenAI adapter**

Create `backend/app/openai_client.py` with an `OpenAIAnalyzer` class. It should return `None` when no API key is configured or an OpenAI call fails, so deterministic rules remain available.

Create `backend/app/main.py` with:

- `GET /health`
- `POST /analyze`

The `/analyze` endpoint should combine rule reasons with AI reasons when available.

- [ ] **Step 4: Run backend tests**

Run: `python -m pytest backend/tests -q`

Expected: PASS.

## Task 3: Extension Detector And Warning UI

**Files:**
- Create: `extension/package.json`
- Create: `extension/src/shared/types.js`
- Create: `extension/src/content/detector.js`
- Create: `extension/src/content/warningUi.js`
- Create: `extension/tests/detector.test.mjs`
- Create: `extension/tests/warningUi.test.mjs`

- [ ] **Step 1: Write failing extension tests**

Create tests for:

- detecting a login form with a password field,
- extracting sanitized page signals without password values,
- rendering an inline warning that can be dismissed.

- [ ] **Step 2: Run tests and confirm RED**

Run: `npm.cmd test --prefix extension`

Expected: FAIL because extension source files do not exist.

- [ ] **Step 3: Implement detector and warning UI**

Implement:

- `collectPageSignals(document, window.location.href)`
- `renderInlineWarning(form, assessment)`
- isolated `phishshield-*` class names,
- no credential value collection.

- [ ] **Step 4: Run extension tests**

Run: `npm.cmd test --prefix extension`

Expected: PASS.

## Task 4: Extension Runtime, Popup, And Manifests

**Files:**
- Create: `extension/manifest.chrome.json`
- Create: `extension/manifest.firefox.json`
- Create: `extension/src/shared/browserApi.js`
- Create: `extension/src/background/index.js`
- Create: `extension/src/content/index.js`
- Create: `extension/src/popup/index.html`
- Create: `extension/src/popup/main.ts`
- Create: `extension/src/popup/styles.css`

- [ ] **Step 1: Implement browser compatibility wrapper**

Create `browserApi.ts` to use `globalThis.browser` when present and fall back to `globalThis.chrome`.

- [ ] **Step 2: Implement content/background wiring**

The content script sends page signals to the background service. The background service calls `http://127.0.0.1:8000/analyze`, updates badge text/color, and stores the latest assessment by tab.

- [ ] **Step 3: Implement polished popup UI**

The popup should match the approved UX direction: calm copy, compact risk reasons, clear status pill, and no scary language.

- [ ] **Step 4: Build extension**

Run: `npm.cmd run build --prefix extension`

Expected: PASS and emits `extension/dist`.

## Task 5: Documentation And Final Verification

**Files:**
- Create: `docs/SETUP.md`
- Modify: `docs/superpowers/plans/2026-05-18-ai-phishing-detection-extension.md`

- [ ] **Step 1: Write setup docs**

Document:

- backend virtualenv setup,
- backend test command,
- backend dev server command,
- extension install/build/test commands,
- Chrome load-unpacked path,
- Firefox temporary add-on path,
- privacy note that typed credentials are not sent.

- [ ] **Step 2: Run final verification**

Run:

```powershell
python -m pytest backend/tests -q
npm.cmd test --prefix extension
npm.cmd run build --prefix extension
```

Expected: all commands exit 0.

- [ ] **Step 3: Commit implementation**

Run:

```powershell
git status --short
git add backend extension docs/SETUP.md docs/superpowers/plans/2026-05-18-ai-phishing-detection-extension.md
git commit -m "Build phishing detection extension MVP"
```

Expected: commit succeeds and `.env.local` remains ignored.
