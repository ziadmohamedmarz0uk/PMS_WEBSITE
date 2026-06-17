# System Architecture

## Technology Stack
- **Frontend**: Next.js (App Router, TypeScript, TailwindCSS)
- **Backend**: Laravel (PHP 8+, RESTful APIs)
- **Database**: MySQL (InnoDB Engine for ACID compliance)
- **Caching**: Redis (For aggregating SuperAdmin dashboard data and high-speed lookups)

## Database Schema (Core Entities)

The schema enforces strict separation between the master catalog and branch-specific inventory.

### 1. `medicines` (Master Catalog)
- `id` (PK)
- `name` (String)
- `scientific_name` (String)
- `barcode` (String, Unique)
- `base_price` (Decimal)
- `purchase_price` (Decimal)
- `category_id` (FK)
- `active_ingredient_id` (FK)
- `created_at`, `updated_at`

### 2. `branch_inventories` (Decentralized Stock)
- `id` (PK)
- `branch_id` (FK)
- `medicine_id` (FK)
- `quantity` (Integer)
- `expiry_date` (Date)
- `batch_number` (String)
- `created_at`, `updated_at`

### 3. `invoices` & `invoice_items`
**invoices:**
- `id` (PK)
- `branch_id` (FK)
- `shift_id` (FK)
- `customer_id` (FK, Nullable)
- `total_amount` (Decimal)
- `status` (Enum: finalized, refunded, draft)
- `created_at`, `updated_at`

**invoice_items:**
- `id` (PK)
- `invoice_id` (FK)
- `medicine_id` (FK)
- `quantity` (Integer)
- `unit_price` (Decimal)
- `subtotal` (Decimal)

### 4. `shifts`
- `id` (PK)
- `user_id` (FK)
- `branch_id` (FK)
- `start_time` (Timestamp)
- `end_time` (Timestamp, Nullable)
- `status` (Enum: open, closed)
- `actual_cash_submitted` (Decimal, Nullable)
- `expected_cash` (Decimal, calculated field, hidden from cashier)

### 5. `stock_transfers`
- `id` (PK)
- `from_branch` (FK)
- `to_branch` (FK)
- `status` (Enum: pending, shipped, received)
- `created_at`, `updated_at`

### 6. `audit_logs`
- `id` (PK)
- `user_id` (FK)
- `branch_id` (FK)
- `action` (String)
- `entity_type` (String)
- `entity_id` (BigInt)
- `timestamp` (Timestamp)
