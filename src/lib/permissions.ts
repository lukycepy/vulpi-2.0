export const PERMISSIONS = [
  { id: "view_dashboard", label: "Zobrazit dashboard", description: "Přístup k hlavní nástěnce" },
  { id: "manage_invoices", label: "Správa faktur", description: "Vytvářet a upravovat faktury" },
  { id: "approve_invoices", label: "Schvalovat faktury", description: "Schvalování faktur nad limit" },
  { id: "view_margins", label: "Zobrazit marže", description: "Vidět nákupní ceny a marže" },
  { id: "manage_inventory", label: "Správa skladu", description: "Příjem a výdej zboží" },
  { id: "manage_users", label: "Správa uživatelů", description: "Přidávat a odebírat uživatele" },
  { id: "manage_roles", label: "Správa rolí", description: "Vytvářet a upravovat role" },
  { id: "manage_settings", label: "Nastavení", description: "Měnit nastavení organizace" },
  { id: "impersonate_users", label: "Impersonace", description: "Přihlásit se jako jiný uživatel (Admin)" },
  { id: "manage_bank", label: "Správa banky", description: "Párování plateb a bankovní účty" },
  { id: "manage_expenses", label: "Správa výdajů", description: "Evidence nákladů" },
  { id: "manage_clients", label: "Správa klientů", description: "Adresář klientů" },
  { id: "manage_projects", label: "Správa projektů", description: "Projekty a zakázky" },
  { id: "manage_templates", label: "Správa šablon", description: "Vytvářet a upravovat šablony faktur" },
  { id: "manage_custom_fields", label: "Správa polí", description: "Definovat vlastní pole" },
  { id: "can_export_data", label: "Export dat", description: "Možnost exportovat data do Excelu/CSV" },
];

export const DEFAULT_ROLES = {
  SUPERADMIN: PERMISSIONS.map(p => p.id),
  ADMIN: ["view_dashboard", "manage_invoices", "approve_invoices", "view_margins", "manage_inventory", "manage_users", "manage_roles", "manage_settings", "impersonate_users", "manage_bank", "manage_expenses", "manage_clients", "manage_projects", "manage_templates", "manage_custom_fields", "can_export_data"],
  MANAGER: ["view_dashboard", "manage_invoices", "approve_invoices", "view_margins", "manage_inventory", "manage_bank", "manage_expenses", "manage_clients", "manage_projects", "can_export_data"],
  USER: ["view_dashboard", "manage_invoices", "manage_clients"],
  WAREHOUSEMAN: ["manage_inventory"],
  ACCOUNTANT: ["view_dashboard", "manage_invoices", "manage_bank", "manage_expenses", "manage_clients"],
};
