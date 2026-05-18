# PhishShield Setup

## Backend

Create and install the local Python environment:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Run backend tests:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests -q
```

Start the FastAPI backend:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

The backend reads `OPENAI_API_KEY` from `.env.local`. The key must stay server-side and must never be copied into extension files.

## Extension

Run extension tests:

```powershell
npm.cmd test --prefix extension
```

Build browser-specific extension folders:

```powershell
npm.cmd run build --prefix extension
```

Build output:

- Chrome: `extension\dist\chrome`
- Firefox: `extension\dist\firefox`

## Load In Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select `extension\dist\chrome`.

## Load In Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Choose **Load Temporary Add-on**.
3. Select `extension\dist\firefox\manifest.json`.

## Privacy Boundary

The extension sends only sanitized page signals to the backend:

- current URL and hostname,
- page title,
- selected visible text,
- form action URL,
- form method,
- input field types,
- submit button text.

It does not send typed usernames, passwords, cookies, local storage, session storage, or full page HTML.
