export type RoleType = "Kepala Divisi" | "HRD" | "Direktur" | "Karyawan";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export const APPROVAL_FLOW: { role: RoleType; order: number }[] = [
  { role: "Kepala Divisi", order: 1 },
  { role: "HRD", order: 2 },
  { role: "Direktur", order: 3 },
];

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
  const currentIndex = APPROVAL_FLOW.findIndex(
    (flow) => flow.role === currentApprover
  );
  if (currentIndex === -1 || currentIndex === APPROVAL_FLOW.length - 1) {
    return null;
  }
  return APPROVAL_FLOW[currentIndex + 1].role;
}

export function canApprove(
  userRole: RoleType,
  currentApprovals: Array<{
    status: ApprovalStatus;
    approvalOrder: number;
    approver: { role: { name: RoleType } };
  }>
): boolean {
  const roleConfig = APPROVAL_FLOW.find((flow) => flow.role === userRole);
  if (!roleConfig) return false;

  const userOrder = roleConfig.order;

  // For each approval, check if all previous orders are approved
  const previousApprovals = currentApprovals.filter(
    (approval) => approval.approvalOrder < userOrder
  );

  return previousApprovals.every((approval) => approval.status === "APPROVED");
}

export function getApprovalStatus(
  approvals: Array<{
    status: ApprovalStatus;
    approvalOrder: number;
    approver: { role: { name: RoleType } };
  }>,
  userRole: RoleType
) {
  const roleConfig = APPROVAL_FLOW.find((flow) => flow.role === userRole);
  if (!roleConfig) return [];

  const userOrder = roleConfig.order;

  // Only return approvals up to the user's order
  return APPROVAL_FLOW.filter((flow) => flow.order <= userOrder).map((flow) => {
    const approval = approvals.find((a) => a.approver.role.name === flow.role);
    return {
      role: flow.role,
      status: approval?.status || "PENDING",
      order: flow.order,
    };
  });
}
