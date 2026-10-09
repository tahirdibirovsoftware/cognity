import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createEmployeeSchema,
  assignAssessmentSchema,
} from "./employee-schema";

describe("createEmployeeSchema", () => {
  it("validates valid employee data with defaults", () => {
    const parsed = createEmployeeSchema.safeParse({
      name: "Tahir Dibirov",
      email: "tahir@cognity.internal",
    });

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.name, "Tahir Dibirov");
      assert.equal(parsed.data.email, "tahir@cognity.internal");
      assert.equal(parsed.data.department, "General");
      assert.equal(parsed.data.password, "welcome123");
      assert.equal(parsed.data.role, "EMPLOYEE");
    }
  });

  it("accepts custom password and department", () => {
    const parsed = createEmployeeSchema.safeParse({
      name: "Leyla Aliyeva",
      email: "leyla@cognity.internal",
      department: "Compliance",
      password: "customPassword2026",
      role: "MANAGER",
    });

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.department, "Compliance");
      assert.equal(parsed.data.password, "customPassword2026");
      assert.equal(parsed.data.role, "MANAGER");
    }
  });

  it("rejects invalid emails and too short names", () => {
    const invalidEmail = createEmployeeSchema.safeParse({
      name: "Valid Name",
      email: "not-an-email",
    });
    assert.equal(invalidEmail.success, false);

    const shortName = createEmployeeSchema.safeParse({
      name: "A",
      email: "valid@cognity.internal",
    });
    assert.equal(shortName.success, false);

    const shortPassword = createEmployeeSchema.safeParse({
      name: "Valid Name",
      email: "valid@cognity.internal",
      password: "123",
    });
    assert.equal(shortPassword.success, false);
  });
});

describe("assignAssessmentSchema", () => {
  it("validates UUIDs and default due days", () => {
    const parsed = assignAssessmentSchema.safeParse({
      employeeId: "a0000000-0000-4000-8000-000000000000",
      assessmentId: "b0000000-0000-4000-8000-000000000000",
    });

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.dueDays, 14);
    }
  });

  it("rejects invalid UUIDs", () => {
    const parsed = assignAssessmentSchema.safeParse({
      employeeId: "not-a-uuid",
      assessmentId: "22222222-2222-2222-2222-222222222222",
    });

    assert.equal(parsed.success, false);
  });
});
