# Multi-Branch Pharmacy Management System

A full-stack pharmacy management system for multi-branch operations. The project focuses on fast POS workflows, role-based dashboards, inventory tracking, stock transfers, shift control, and receipt printing.

## Highlights

- Role-based access for super admins, branch managers, cashiers, and pharmacists.
- Keyboard-first POS flow with hold invoice, checkout, return, expense, and thermal receipt printing.
- Inventory management with expiry status indicators and cross-branch availability checks.
- Shift start/end flow with cash variance tracking.
- Dashboard modules for branches, users, inventory, medicines, suppliers, transfers, shifts, invoices, and expenses.
- Arabic/English UI support through a small translation hook and language store.

## Tech Stack

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS
- State management: Zustand
- API client: Axios
- Charts and UI: Recharts, Lucide React, React Select
- Backend: Laravel 12, Laravel Sanctum, MySQL
- Architecture: Modular Laravel backend with frontend/backend separation

## Project Structure

```text
PMS_WEBSITE/
  backend/    Laravel API, database, modules, seeders
  frontend/   Next.js app router UI
  docs/       Supporting project docs
```

## Frontend Features

- Protected app routes and auth state persistence.
- POS cart store with quantity limits, sub-unit support, discounts, payment methods, and held carts.
- Reusable forms for branches, users, and medicines.
- Dashboard pages for core pharmacy operations.
- Print-specific receipt component optimized for 80mm thermal receipt printers.

## Local Setup

Clone the project:

```bash
git clone https://github.com/ziadmohamedmarz0uk/PMS_WEBSITE.git
cd PMS_WEBSITE
```

Install and run the backend:

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Update `.env` with your MySQL database credentials, then run:

```bash
php artisan migrate:fresh --seed
php artisan serve
```

The backend runs on:

```text
http://localhost:8000
```

Install and run the frontend in another terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Start the frontend:

```bash
npm run dev
```

The frontend runs on:

```text
http://localhost:3000
```

## Demo Accounts

All seeded demo accounts use this password:

```text
password
```

Super admin:

```text
admin@pms.com
```

Branch managers:

```text
manager0@pms.com
manager1@pms.com
manager2@pms.com
```

Cashiers:

```text
cashier0_1@pms.com
cashier0_2@pms.com
cashier1_1@pms.com
cashier1_2@pms.com
cashier2_1@pms.com
cashier2_2@pms.com
```

## Notes

This is a portfolio project built to demonstrate full-stack product thinking, POS workflows, API integration, role-based UI, state management, and responsive dashboard development.
