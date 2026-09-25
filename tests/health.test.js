import test from "node:test";
import assert from "node:assert";

test("SmartCare API health endpoint", async () => {
  const response = await fetch("http://localhost:4000/api/health");

  assert.strictEqual(response.status, 200);

  const data = await response.json();

  assert.deepStrictEqual(data, { ok: true });
});
