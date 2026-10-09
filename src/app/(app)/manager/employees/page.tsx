import type { Metadata } from "next";
import {
  BadgeCheck,
  Building2,
  Clock3,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { getEmployeesWithStats } from "@/lib/queries";
import { requireManager } from "@/lib/session";
import { CreateEmployeeDialog } from "./create-employee-dialog";
import { EmployeeDirectory } from "./employee-directory";

export const metadata: Metadata = {
  title: "Employees",
};

export default async function EmployeesPage() {
  const currentManager = await requireManager();
  const data = await getEmployeesWithStats();

  const activeEmployees = data.employees.filter((e) => e.role === "EMPLOYEE");
  const gradedCount = activeEmployees.reduce(
    (sum, e) => sum + e.completedCount,
    0,
  );
  const passedCount = activeEmployees.reduce(
    (sum, e) => sum + e.passedCount,
    0,
  );
  const overallPassRate =
    gradedCount > 0 ? Math.round((passedCount / gradedCount) * 100) : 0;

  const departments = new Set(
    data.employees.map((e) => e.department).filter(Boolean),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Add team members, configure sign-in credentials, and assign compliance training."
      >
        <CreateEmployeeDialog
          publishedAssessments={data.publishedAssessments}
        />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total team members"
          value={String(data.employees.length)}
          hint={`${data.totalEmployees} employees · ${data.totalManagers} managers`}
          icon={Users}
        />
        <StatCard
          label="Pending training"
          value={String(data.pendingTrainingCount)}
          hint="Employees with awaiting assessments"
          icon={Clock3}
          accent={data.pendingTrainingCount > 0}
        />
        <StatCard
          label="Compliance pass rate"
          value={gradedCount === 0 ? "—" : `${overallPassRate}%`}
          hint={`${passedCount} of ${gradedCount} submissions passed`}
          icon={BadgeCheck}
        />
        <StatCard
          label="Departments"
          value={String(departments.size)}
          hint="Active organizational units"
          icon={Building2}
        />
      </div>

      <EmployeeDirectory
        employees={data.employees}
        publishedAssessments={data.publishedAssessments}
        currentUserId={currentManager.id}
      />
    </div>
  );
}
