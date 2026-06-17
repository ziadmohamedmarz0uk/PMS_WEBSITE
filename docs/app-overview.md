# App Overview: Multi-Branch Pharmacy Management System (SaaS)

## Core Philosophy
The fundamental architecture of this system is based on **"Centralized Management and Decentralized Operations"**. It is a cloud-based SaaS platform tailored for multi-branch pharmacy networks. 

## Main Objectives
- **Strict Financial Control**: Prevent fraud and enforce tight cash management through blind shift closing and robust audit trails.
- **Inventory Optimization**: Reduce waste from expiry and maintain optimal stock levels through automated alerts and shortage tracking.
- **High-Performance POS**: Deliver a blazing-fast, keyboard-driven Point of Sale interface designed to maximize cashier efficiency.

## Key Modules
1. **Master Catalog (Centralized)**: Medications and their metadata (name, active ingredient, category, barcode, base prices) are defined once at the system/organization level.
2. **Branch Operations (Decentralized)**: Each branch independently manages its physical stock quantities, expiry dates, batch numbers, and sales.
3. **Shared CRM**: A unified customer database allowing cross-branch loyalty points and shared credit accounts.
4. **Stock Transfers**: An end-to-end workflow (Pending -> Shipped (Transit) -> Received) for moving inventory safely between branches.
5. **Cash & Shift Management**: Shift tracking tied to individual users and branches, utilizing blind reconciliation where expected cash is calculated by the system but hidden from the cashier.
