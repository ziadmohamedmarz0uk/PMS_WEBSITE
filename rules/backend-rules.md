# Backend Rules (Laravel & MySQL)

## API Structure
- **Laravel API Resources**: All Eloquent models must be transformed using API Resources before being sent in JSON responses.
- **Form Requests**: All incoming HTTP requests must be validated using Laravel Form Request classes. Controller methods should not contain raw validation logic.

## STRICT DIRECTIVE: Database Transactions
- **ACID Compliance**: The MySQL database must use the `InnoDB` engine.
- Any operation that modifies critical financial or inventory states (e.g., deducting inventory, creating an invoice, processing stock transfers, processing refunds) **MUST** be wrapped in a `DB::transaction()`.
- Example:
  ```php
  DB::transaction(function () use ($data) {
      // 1. Deduct Inventory
      // 2. Create Invoice
      // 3. Record Audit Log
  });
  ```
  If any step fails, the entire transaction must roll back to prevent data corruption.

## Background Processing
- Heavy tasks, such as generating end-of-month financial reports, calculating dead stock across branches, or sending bulk emails, must be offloaded to **Laravel Jobs/Queues**.
