export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  taxId?: string;
  vatId?: string;
  address?: string;
  logoUrl?: string;
}

export enum Role {
  SUPERADMIN = "SUPERADMIN",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  USER = "USER",
  ACCOUNTANT = "ACCOUNTANT",
  CLIENT = "CLIENT",
  WAREHOUSEMAN = "WAREHOUSEMAN",
}
