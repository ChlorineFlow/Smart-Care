import test from "node:test";
import assert from "node:assert";

test("SmartCare API health endpoint", async () => {
  const healthUrl = process.env.API_HEALTH_URL || "http://localhost:4000/api/health";
  const response = await fetch(healthUrl);

  assert.strictEqual(response.status, 200);

  const data = await response.json();

  assert.deepStrictEqual(data, { ok: true });
});
