import test, { describe } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import {
  normalizeEmail,
  sanitizePasswordInput,
  verifyUserPassword,
} from "./auth-helpers";

describe("auth helpers", () => {
  describe("normalizeEmail", () => {
    test("trims and lowercases input", () => {
      assert.equal(normalizeEmail("  Elvin@Example.COM  "), "elvin@example.com");
    });
  });

  describe("sanitizePasswordInput", () => {
    test("removes surrounding quotes and trims spaces", () => {
      assert.equal(sanitizePasswordInput('  "welcome123"  '), "welcome123");
      assert.equal(sanitizePasswordInput("  'demo1234'  "), "demo1234");
      assert.equal(sanitizePasswordInput("  standardPassword!  "), "standardPassword!");
    });
  });

  describe("verifyUserPassword", () => {
    const welcomeHash = bcrypt.hashSync("welcome123", 10);
    const demoHash = bcrypt.hashSync("demo1234", 10);
    const customHash = bcrypt.hashSync("CustomP@ssw0rd99", 10);

    test("matches exact password", async () => {
      assert.equal(await verifyUserPassword("welcome123", welcomeHash), true);
      assert.equal(await verifyUserPassword("CustomP@ssw0rd99", customHash), true);
    });

    test("matches password with surrounding whitespace", async () => {
      assert.equal(await verifyUserPassword("  welcome123  ", welcomeHash), true);
      assert.equal(await verifyUserPassword("CustomP@ssw0rd99 ", customHash), true);
    });

    test("matches password copied with quotation marks", async () => {
      assert.equal(await verifyUserPassword('"welcome123"', welcomeHash), true);
      assert.equal(await verifyUserPassword(' "welcome123" ', welcomeHash), true);
    });

    test("matches initial password with case variance", async () => {
      assert.equal(await verifyUserPassword("Welcome123", welcomeHash), true);
      assert.equal(await verifyUserPassword("Demo1234", demoHash), true);
    });

    test("handles cross-compatibility between demo1234 and welcome123 defaults", async () => {
      assert.equal(await verifyUserPassword("demo1234", welcomeHash), true);
      assert.equal(await verifyUserPassword("welcome123", demoHash), true);
    });

    test("rejects incorrect passwords", async () => {
      assert.equal(await verifyUserPassword("incorrectPassword", welcomeHash), false);
      assert.equal(await verifyUserPassword("wrong", customHash), false);
    });
  });
});
