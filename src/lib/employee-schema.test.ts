import { describe, expect, it } from "vitest";
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

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Tahir Dibirov");
      expect(parsed.data.email).toBe("tahir@cognity.internal");
      expect(parsed.data.department).toBe("General");
      expect(parsed.data.password).toBe("welcome123");
      expect(parsed.data.role).toBe("EMPLOYEE");
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

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.department).toBe("Compliance");
      expect(parsed.data.password).toBe("customPassword2026");
      expect(parsed.data.role).toBe("MANAGER");
    }
  });

  it("rejects invalid emails and too short names", () => {
    const invalidEmail = createEmployeeSchema.safeParse({
      name: "Valid Name",
      email: "not-an-email",
    });
    expect(invalidEmail.success).toBe(false);

    const shortName = createEmployeeSchema.safeParse({
      name: "A",
      email: "valid@cognity.internal",
    });
    expect(shortName.success).toBe(false);

    const shortPassword = createEmployeeSchema.safeParse({
      name: "Valid Name",
      email: "valid@cognity.internal",
      password: "123",
    });
    expect(shortPassword.success).toBe(false);
  });
});

describe("assignAssessmentSchema", () => {
  it("validates UUIDs and default due days", () => {
    const parsed = assignAssessmentSchema.safeParse({
      employeeId: "a0000000-0000-4000-8000-000000000000",
      assessmentId: "b0000000-0000-4000-8000-000000000000",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.dueDays).toBe(14);
    }
  });

  it("rejects invalid UUIDs", () => {
    const parsed = assignAssessmentSchema.safeParse({
      employeeId: "not-a-uuid",
      assessmentId: "22222222-2222-2222-2222-222222222222",
    });

    expect(parsed.success).toBe(false);
  });
});
