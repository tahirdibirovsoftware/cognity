"use client";

import { useActionState, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  Clock3,
  Filter,
  Key,
  Mail,
  Search,
  Shield,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { initials } from "@/lib/metrics";
import { AssignTrainingDialog } from "./assign-training-dialog";
import { deleteEmployeeAction, type ActionState } from "./actions";

export type EmployeeRecord = {
  id: string;
  name: string;
  email: string;
  role: "EMPLOYEE" | "MANAGER";
  department: string | null;
  createdAt: Date;
  totalAssigned: number;
  pendingCount: number;
  completedCount: number;
  passedCount: number;
  averageScore: number | null;
  assignments: Array<{
    assignmentId: string;
    assessmentId: string;
    assessmentTitle: string;
    status: "PENDING" | "COMPLETED";
    dueAt: Date | null;
    completedAt: Date | null;
    score: number | null;
    passed: boolean | null;
  }>;
  assignedAssessmentIds: string[];
};

type PublishedAssessment = {
  id: string;
  title: string;
  passingScore: number;
  documentTitle: string;
};

const initialDeleteState: ActionState = {};

export function EmployeeDirectory({
  employees,
  publishedAssessments,
  currentUserId,
}: {
  employees: EmployeeRecord[];
  publishedAssessments: PublishedAssessment[];
  currentUserId: string;
}) {
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");

  const [deleteState, deleteAction] = useActionState(
    deleteEmployeeAction,
    initialDeleteState,
  );

  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const e of employees) {
      if (e.department) set.add(e.department);
    }
    return Array.from(set).sort();
  }, [employees]);

  const filtered = useMemo(() => {
    return employees.filter((employee) => {
      const matchesSearch =
        employee.name.toLowerCase().includes(search.toLowerCase()) ||
        employee.email.toLowerCase().includes(search.toLowerCase());

      const matchesDept =
        selectedDept === "ALL" || employee.department === selectedDept;

      const matchesRole =
        selectedRole === "ALL" || employee.role === selectedRole;

      return matchesSearch && matchesDept && matchesRole;
    });
  }, [employees, search, selectedDept, selectedRole]);

  return (
    <div className="space-y-4">
      {deleteState.error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {deleteState.error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="size-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="ALL">All departments ({departments.length})</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="ALL">All roles</option>
            <option value="EMPLOYEE">Employees only</option>
            <option value="MANAGER">Managers only</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="size-8 text-muted-foreground/60" />
            <h3 className="mt-3 text-sm font-semibold">No team members found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your search terms or filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="hidden shadow-none md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Team member</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Training status</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-muted text-[11px] font-semibold">
                            {initials(employee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="leading-tight">
                          <p className="text-sm font-medium">{employee.name}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="size-3" />
                            <span>{employee.email}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Building2 className="size-3.5 text-muted-foreground" />
                        <span>{employee.department ?? "General"}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {employee.role === "MANAGER" ? (
                        <Badge variant="outline" className="gap-1 border-brand/40 bg-brand/10 text-brand">
                          <Shield className="size-3" />
                          Manager
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <User className="size-3" />
                          Employee
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      {employee.role === "MANAGER" ? (
                        <span className="text-xs text-muted-foreground">Admin access</span>
                      ) : employee.totalAssigned === 0 ? (
                        <span className="text-xs text-muted-foreground">No assessments</span>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            {employee.pendingCount > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 font-medium text-amber-700 dark:text-amber-400">
                                <Clock3 className="size-3" />
                                {employee.pendingCount} pending
                              </span>
                            ) : null}
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-700 dark:text-emerald-400">
                              <BadgeCheck className="size-3" />
                              {employee.completedCount} completed
                            </span>
                          </div>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {employee.role === "MANAGER" ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : employee.completedCount === 0 ? (
                        <span className="text-xs text-muted-foreground">Not started</span>
                      ) : (
                        <div className="text-xs">
                          <span className="font-semibold tabular-nums text-foreground">
                            {employee.averageScore ?? 0}%
                          </span>{" "}
                          <span className="text-muted-foreground">avg score</span>
                          <p className="text-[11px] text-muted-foreground">
                            {employee.passedCount} of {employee.completedCount} passed
                          </p>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {employee.role === "EMPLOYEE" ? (
                          <AssignTrainingDialog
                            employeeId={employee.id}
                            employeeName={employee.name}
                            assignedAssessmentIds={employee.assignedAssessmentIds}
                            publishedAssessments={publishedAssessments}
                          />
                        ) : null}

                        {employee.id !== currentUserId ? (
                          <form
                            action={deleteAction}
                            onSubmit={(e) => {
                              if (!confirm(`Are you sure you want to remove ${employee.name}?`)) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <input type="hidden" name="userId" value={employee.id} />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              className="size-8 p-0 text-muted-foreground hover:text-destructive"
                              title={`Remove ${employee.name}`}
                            >
                              <Trash2 className="size-3.5" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {filtered.map((employee) => (
              <Card key={employee.id} className="shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-muted text-xs font-semibold">
                          {initials(employee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-sm font-semibold">
                          {employee.name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {employee.email}
                        </CardDescription>
                      </div>
                    </div>
                    {employee.role === "MANAGER" ? (
                      <Badge variant="outline" className="border-brand/40 bg-brand/10 text-[10px] text-brand">
                        Manager
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Employee
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0 text-xs">
                  <div className="flex items-center justify-between border-t pt-2 text-muted-foreground">
                    <span>Department:</span>
                    <span className="font-medium text-foreground">
                      {employee.department ?? "General"}
                    </span>
                  </div>

                  {employee.role === "EMPLOYEE" ? (
                    <>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Training status:</span>
                        <span>
                          {employee.totalAssigned === 0 ? (
                            "None assigned"
                          ) : (
                            <span className="font-medium text-foreground">
                              {employee.completedCount} / {employee.totalAssigned} done
                              {employee.pendingCount > 0 ? ` (${employee.pendingCount} pending)` : ""}
                            </span>
                          )}
                        </span>
                      </div>

                      {employee.completedCount > 0 ? (
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Avg score:</span>
                          <span className="font-semibold text-foreground">
                            {employee.averageScore ?? 0}% ({employee.passedCount} passed)
                          </span>
                        </div>
                      ) : null}

                      <div className="border-t pt-2">
                        <AssignTrainingDialog
                          employeeId={employee.id}
                          employeeName={employee.name}
                          assignedAssessmentIds={employee.assignedAssessmentIds}
                          publishedAssessments={publishedAssessments}
                        />
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Industrial Credentials Quick Reference Box */}
      <Card className="border bg-muted/20 shadow-none">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border bg-background p-2 text-muted-foreground shadow-2xs">
              <Key className="size-4 text-brand" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                Employee Access Protocol
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Employees sign in at <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">/login</code> using their registered email and the initial password set at creation (default: <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">welcome123</code>).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
