# Agile User Stories & Business Logic

## 1. Point of Sale (POS)
**User Story:** As a Cashier, I want to scan items quickly so that I can process customer orders without delay.
- **Logic:** The UI automatically focuses the search input. Upon barcode scan or name entry, the item is added to the cart. If quantity is zero, alternatives matching `active_ingredient_id` are displayed.
**User Story:** As a Cashier, I want to hold an invoice so I can serve the next customer while the current one fetches their wallet.
- **Logic:** Cart state is saved locally or in the DB as a `Draft`. Screen clears for the new customer.

## 2. Inventory & Expiry
**User Story:** As a Branch Manager, I want visual alerts for expiring items so I can return them or run promotions.
- **Logic:** Background jobs or frontend helpers calculate `expiry_date` vs `current_date` to apply Red/Yellow/Green traffic light coding.
**User Story:** As a Branch Manager, I want a shortage list generated automatically.
- **Logic:** A database trigger or Laravel observer monitors `quantity`. If it drops below `min_limit`, the item is added to the `Shortages` table.

## 3. Cross-Branch Stock Transfers
**User Story:** As a Branch Manager, I want to request stock from another branch and track its delivery.
- **Logic:**
  1. Branch A creates request (`status = pending`).
  2. Branch B approves (`status = shipped`). System deducts stock from Branch B and places it in an isolated "transit" state to prevent it from being sold.
  3. Branch A receives (`status = received`). System adds stock to Branch A.

## 4. Blind Shift Closing
**User Story:** As a Super Admin, I want cashiers to count their drawer without knowing the expected amount to prevent theft.
- **Logic:**
  1. System calculates `Expected Cash` = (Opening Float + Cash Sales - Refunds - Expenses).
  2. This figure is **strictly hidden** from the cashier.
  3. Cashier manually inputs the `actual_cash_submitted`.
  4. System generates a hidden discrepancy report (overage/shortage) visible only to Branch Managers and Super Admins.

## 5. Invoice Correction
**User Story:** As a Cashier, I want to correct a mistake on a finalized invoice.
- **Logic:** No hard deletes allowed. The cashier must process a "Refund" transaction to restock the items and adjust the shift's cash balance.
