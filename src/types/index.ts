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

export interface InvoiceTemplate {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  fontFamily: string | null;
  customFontUrl?: string | null;
  logoPosition: string | null;
  showQrCode: boolean;
  showSignature: boolean;
  showBarcodes: boolean;
  customCss?: string | null;
  textOverrides?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
