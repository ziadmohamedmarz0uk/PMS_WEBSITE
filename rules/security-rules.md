# Security & Access Rules

## Authentication & Authorization
- Use **Laravel Sanctum** for API token-based authentication.
- Implement strict **Role-Based Access Control (RBAC)**:
  - **Super Admin**: Full system access, cross-branch reporting, master catalog management.
  - **Branch Manager**: Restricted to their assigned `branch_id`. Can view branch reports and approve transfers.
  - **Cashier**: Restricted to the POS interface, opening/closing their own shift, and viewing their own branch's inventory. Cannot view purchase prices or profit margins.

## Data Isolation (Multi-Tenancy)
- All Eloquent queries executed by Branch Managers or Cashiers **must** be scoped to their `branch_id`. Consider using Laravel Global Scopes to automatically enforce this tenant isolation and prevent accidental data leakage.

## STRICT DIRECTIVE: Data Immutability
- **No Hard Deletes**: Cashiers are never allowed to delete or modify a finalized/printed invoice.
- **Corrections via Refunds**: To correct a mistake, a Cashier must initiate a separate "Refund" transaction. This ensures the integrity of the audit trail, inventory counts, and expected cash calculations.
