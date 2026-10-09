import { z } from "zod";

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Enter a valid email address").toLowerCase(),
  department: z.string().trim().max(100).optional().default("General"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100)
    .optional()
    .default("welcome123"),
  role: z.enum(["EMPLOYEE", "MANAGER"]).default("EMPLOYEE"),
  initialAssessmentId: z.string().uuid().optional().or(z.literal("")),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const assignAssessmentSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  assessmentId: z.string().uuid("Invalid assessment ID"),
  dueDays: z.coerce.number().int().min(1).max(365).default(14),
});

export type AssignAssessmentInput = z.infer<typeof assignAssessmentSchema>;
