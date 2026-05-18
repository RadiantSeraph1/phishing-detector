import assert from "node:assert/strict";
import test from "node:test";

import { buildWarningModel } from "../src/content/warningUi.js";

test("builds a dismissible inline warning model", () => {
  const assessment = {
    risk_level: "suspicious",
    score: 64,
    reasons: ["Domain visually resembles PayPal."],
    source: "rules",
    warning_copy: "This login form looks suspicious.",
  };

  const model = buildWarningModel(assessment);

  assert.equal(model.title, "This login form looks suspicious.");
  assert.equal(model.reasons.length, 1);
  assert.equal(model.dismissLabel, "Dismiss");
  assert.equal(model.detailsLabel, "Show why");
});
