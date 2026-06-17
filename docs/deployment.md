# Production Deployment Strategy

This document outlines the best practices and recommended pathways for deploying the Pharmacy Management System (PMS) into a live, production SaaS environment.

## 1. Backend Deployment (Laravel 11)

### Recommended Hosting: Laravel Forge / VPS
Due to the strict database transactional requirements and HMVC architecture, deploying on a dedicated VPS (e.g., DigitalOcean, AWS EC2, or Linode) managed by **Laravel Forge** is highly recommended.

### Pre-Deployment Checklist
1. **Environment Setup (`.env`)**:
   - Set `APP_ENV=production` and `APP_DEBUG=false`.
   - Ensure the database connection (`DB_CONNECTION=mysql`) points to a managed, highly available database cluster (e.g., AWS RDS) to handle the locking mechanisms without bottlenecking.
   - Set the `SANCTUM_STATEFUL_DOMAINS` to your exact frontend production domain (e.g., `app.yourpharmacy.com`).
   - Set `SESSION_DOMAIN=.yourpharmacy.com`.

2. **Optimization Commands**:
   Laravel needs to be fully cached to ensure blazing-fast API responses for the POS interface. Run these on your deployment script:
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   php artisan event:cache
   ```

3. **Database Migrations**:
   Run the migrations safely:
   ```bash
   php artisan migrate --force
   ```

4. **Queue Workers (Optional but Recommended)**:
   If you move Invoice email processing or heavy analytics to background jobs in the future, configure Supervisor to keep `php artisan queue:work` running continuously.

## 2. Frontend Deployment (Next.js 15)

### Recommended Hosting: Vercel
Vercel is the optimal hosting platform for Next.js applications. It naturally handles edge caching, global CDN distribution, and CI/CD pipelines out of the box.

### Pre-Deployment Checklist
1. **Environment Variables**:
   In the Vercel project settings, configure the following:
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourpharmacy.com/api/v1
   ```

2. **CORS Configuration (Critical)**:
   Ensure your Laravel backend explicitly accepts requests from your Vercel deployment URL. Update `config/cors.php` in Laravel:
   ```php
   'allowed_origins' => ['https://app.yourpharmacy.com', 'https://*.vercel.app'],
   'supports_credentials' => true,
   ```

3. **Build Command**:
   Ensure the Vercel build command is standard:
   ```bash
   npm run build
   ```

4. **Handling Print Layouts**:
   The Thermal Receipt Printing relies heavily on `@media print` CSS rules. Before deploying, do a final QA pass to ensure no newly added global styles conflict with the `print:hidden` and `print:block` Tailwind classes.

## 3. Security & Maintenance Considerations
- **SSL Certificates**: Ensure both the Backend API and Frontend App are served over HTTPS. Sanctum's secure cookies and tokens require secure origins.
- **Backups**: Configure automated daily snapshots for your MySQL database. Given the critical nature of Shift variances and Inventory levels, point-in-time recovery is essential.
- **Log Management**: Consider integrating a tool like Sentry to track backend Exceptions (especially `lockForUpdate` deadlocks) and frontend React errors in real-time.
