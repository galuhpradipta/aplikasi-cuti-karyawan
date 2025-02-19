export type RoleType = "Karyawan" | "Kepala Divisi" | "HRD" | "Direktur";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export const APPROVAL_FLOW: RoleType[] = ["Kepala Divisi", "HRD", "Direktur"];

export interface ApprovalFlow {
  role: RoleType;
  order: number;
  required: boolean;
}

export const LEAVE_APPROVAL_FLOW: ApprovalFlow[] = [
  {
    role: "Kepala Divisi",
    order: 1,
    required: true,
  },
  {
    role: "HRD",
    order: 2,
    required: true,
  },
  {
    role: "Direktur",
    order: 3,
    required: true,
  },
];

export function getNextApprover(currentApprover: RoleType): RoleType | null {
  const currentIndex = APPROVAL_FLOW.indexOf(currentApprover);
  if (currentIndex === -1 || currentIndex === APPROVAL_FLOW.length - 1) {
    return null;
  }
  return APPROVAL_FLOW[currentIndex + 1];
}

export function canApprove(
  userRole: RoleType,
  currentApprovals: Array<{
    status: ApprovalStatus;
    approver: { role: { name: RoleType } };
  }>
): boolean {
  // Get the order of the user's role in the approval flow
  const userOrder = LEAVE_APPROVAL_FLOW.find(
    (flow) => flow.role === userRole
  )?.order;
  if (!userOrder) return false;

  // If it's the first approver (Kepala Divisi), they can always approve if status is PENDING
  if (userOrder === 1) return true;

  // For subsequent approvers, check if previous approvers have approved
  const previousApprovers = LEAVE_APPROVAL_FLOW.filter(
    (flow) => flow.order < userOrder
  ).map((flow) => flow.role);

  return previousApprovers.every((role) => {
    const approval = currentApprovals.find(
      (a) => a.approver.role.name === role
    );
    return approval?.status === "APPROVED";
  });
}

export function getApprovalStatus(
  approvals: Array<{
    status: ApprovalStatus;
    approver: { role: { name: RoleType } };
  }>
) {
  return LEAVE_APPROVAL_FLOW.map((flow) => {
    const approval = approvals.find((a) => a.approver.role.name === flow.role);
    return {
      role: flow.role,
      status: approval?.status || "PENDING",
      order: flow.order,
      required: flow.required,
    };
  });
}
