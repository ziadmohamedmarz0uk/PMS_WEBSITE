# Multi-Branch Pharmacy Management System (PMS)

## 🏥 Project Overview
The Pharmacy Management System (PMS) is an enterprise-grade SaaS application designed to manage multi-branch pharmacy chains. The core philosophy of this architecture is **"Centralized Management, Decentralized Operations."** 

This ensures that SuperAdmins and BranchManagers maintain complete oversight of financial integrity, stock movements, and global analytics, while Cashiers and Pharmacists are empowered with blazing-fast, isolated point-of-sale interfaces.

## 💻 Technology Stack
- **Frontend Engine**: Next.js 15 (App Router, TypeScript, Tailwind CSS)
- **State Management**: Zustand (Optimized cart rendering without global DOM repaints)
- **Backend Architecture**: Laravel 11 with HMVC (Hierarchical Model-View-Controller) pattern via `nwidart/laravel-modules`
- **Database**: MySQL (Enforced InnoDB Engine for ACID compliance)
- **Authentication**: Laravel Sanctum (Token-Based / CSRF) + Zustand Auth Store

## ✨ Key Engineering Achievements
1. **Blind Shift Closing**: Cashiers are forced to blindly submit their physical cash at the end of their shift. The system natively calculates the mathematical `variance` (Overage/Shortage) and exposes it *only* to Admins via strict Role-Based Access Control (RBAC).
2. **Cross-Branch Operations**: A native cross-branch search engine allows cashiers to find out-of-stock medicines at sister branches and immediately request a stock transfer directly from the POS.
3. **Pessimistic Locking**: The backend utilizes database-level transactions (`DB::transaction`) and pessimistic row locking (`lockForUpdate()`) to completely prevent race conditions during high-frequency POS checkouts and stock transfers.
4. **Traffic Light Expiry Alert**: An intelligent, dynamic computed property that flags medicines as `Red` (< 30 days), `Yellow` (30-90 days), or `Green` (> 90 days) visually across the UI.
5. **Keyboard-First POS Engine**: The Next.js POS is built for high-speed operation, natively hijacking browser defaults to map `F2` (Search), `F4` (Hold), and `F12` (Checkout/Print) for maximum efficiency.
6. **Thermal Receipt Printing**: A native, heavily optimized `@media print` component configured perfectly for standard 80mm thermal receipt printers, isolated cleanly from the primary UI.

## 🚀 Local Setup Instructions

### 1. Clone & Prepare
```bash
git clone https://github.com/your-org/pms-website.git
cd PMS_WEBSITE
```

### 2. Backend Setup (Laravel)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```
*Configure your `.env` to point to an empty local MySQL database named `pms_db`.*

```bash
php artisan migrate:fresh --seed
php artisan serve
```
*(The backend will run on `http://localhost:8000`)*

### 3. Frontend Setup (Next.js)
Open a new terminal window:
```bash
cd frontend
npm install
```
*Create a `.env.local` inside `frontend/` (if needed) with:*
`NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`

```bash
npm run dev
```
*(The frontend will run on `http://localhost:3000`)*

## 🔑 Default Seeded Credentials
The system has been heavily populated with realistic mock data, including 3 branches, 10 categories, 50 medicines, and varying expiry scenarios.

**All passwords are:** `password`

### Super Admin (Global Access & Financials)
- `admin@pms.com`

### Branch Managers (Branch-Isolated Access)
- `manager0@pms.com` (Main Branch)
- `manager1@pms.com` (Branch A)
- `manager2@pms.com` (Branch B)

### Cashiers (Restricted to POS)
- `cashier0_1@pms.com` / `cashier0_2@pms.com`
- `cashier1_1@pms.com` / `cashier1_2@pms.com`
- `cashier2_1@pms.com` / `cashier2_2@pms.com`

---
*Architected and Engineered for High-Performance SaaS Operations.*
