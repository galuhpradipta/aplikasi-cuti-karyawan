export enum RoleName {
  KARYAWAN = "Karyawan",
  KEPALA_DIVISI = "Kepala Divisi",
  HRD = "HRD",
  DIREKTUR = "Direktur",
}

export enum DivisionName {
  IT = "IT",
  FINANCE = "Finance",
  MARKETING = "Marketing",
  OPERATIONS = "Operations",
  SALES = "Sales",
}

export interface Role {
  id: number;
  name: RoleName;
}

export interface Division {
  id: number;
  name: DivisionName;
}

export interface User {
  id: number;
  email: string;
  name: string;
  nik: string;
  role: Role;
  division?: Division;
}

export const REGISTERABLE_ROLES = [RoleName.KARYAWAN, RoleName.KEPALA_DIVISI];
