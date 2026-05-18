const MAX_TEXT_LENGTH = 800;

export function collectPageSignals(doc = document, pageUrl = location.href) {
  const url = new URL(pageUrl);
  const forms = Array.from(doc.querySelectorAll("form")).map(readFormSignal);
  return {
    url: url.href,
    hostname: url.hostname.toLowerCase(),
    page_title: doc.title || null,
    visible_text: collectVisibleText(doc),
    forms: forms.filter((form) => form.field_types.length > 0),
  };
}

export function findLoginForms(doc = document) {
  return Array.from(doc.querySelectorAll("form")).filter((form) => {
    return Array.from(form.querySelectorAll("input")).some((input) => input.getAttribute("type") === "password");
  });
}

function readFormSignal(form) {
  const fields = Array.from(form.querySelectorAll("input, select, textarea"));
  const submit = Array.from(form.querySelectorAll("button, input")).find((field) => {
    const type = (field.getAttribute("type") || "").toLowerCase();
    return field.tagName === "BUTTON" || type === "submit";
  });
  return {
    id: form.getAttribute("id") || form.getAttribute("name") || null,
    action: form.getAttribute("action") || null,
    method: (form.getAttribute("method") || "get").toLowerCase(),
    field_types: fields.map(fieldType).filter(Boolean),
    submit_text: cleanText(submit?.textContent || submit?.getAttribute("value") || ""),
  };
}

function fieldType(field) {
  const tag = field.tagName.toLowerCase();
  if (tag === "select" || tag === "textarea") {
    return tag;
  }
  return (field.getAttribute("type") || "text").toLowerCase();
}

function collectVisibleText(doc) {
  const text = cleanText(doc.body?.textContent || "");
  if (!text) {
    return [];
  }
  return [text.slice(0, MAX_TEXT_LENGTH)];
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
