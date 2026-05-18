import assert from "node:assert/strict";
import test from "node:test";

import { collectPageSignals } from "../src/content/detector.js";

function element(tagName, attrs = {}, children = []) {
  return {
    tagName: tagName.toUpperCase(),
    children,
    textContent: attrs.textContent || "",
    value: attrs.value || "",
    getAttribute(name) {
      return attrs[name] ?? null;
    },
    querySelectorAll(selector) {
      const selectors = selector.split(",").map((item) => item.trim().toUpperCase());
      const matches = [];
      const visit = (node) => {
        if (selectors.includes(node.tagName)) {
          matches.push(node);
        }
        for (const child of node.children || []) {
          visit(child);
        }
      };
      visit(this);
      return matches;
    },
  };
}

test("detects login forms with password fields", () => {
  const form = element("form", { id: "login", action: "https://collector.example/submit", method: "post" }, [
    element("input", { type: "email", value: "user@example.com" }),
    element("input", { type: "password", value: "super-secret" }),
    element("button", { textContent: "Verify now" }),
  ]);
  const doc = {
    title: "Account sign in",
    body: element("body", { textContent: "Your account will be locked. Verify now." }, [form]),
    querySelectorAll(selector) {
      return selector === "form" ? [form] : [];
    },
  };

  const signals = collectPageSignals(doc, "https://secure-paypaI.example/login");

  assert.equal(signals.hostname, "secure-paypai.example");
  assert.equal(signals.forms.length, 1);
  assert.deepEqual(signals.forms[0].field_types, ["email", "password"]);
  assert.equal(signals.forms[0].action, "https://collector.example/submit");
});

test("does not collect credential values", () => {
  const form = element("form", { id: "login" }, [
    element("input", { type: "text", value: "actual-user" }),
    element("input", { type: "password", value: "actual-password" }),
  ]);
  const doc = {
    title: "Login",
    body: element("body", { textContent: "Login" }, [form]),
    querySelectorAll(selector) {
      return selector === "form" ? [form] : [];
    },
  };

  const signals = collectPageSignals(doc, "https://example.com/login");
  const serialized = JSON.stringify(signals);

  assert.equal(serialized.includes("actual-user"), false);
  assert.equal(serialized.includes("actual-password"), false);
});
