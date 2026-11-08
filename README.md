# ShopNear Finance — Business Financial Management System

A professional, secure, fully mobile-responsive Business Financial Management System for single businesses with multiple users, built with **Next.js (App Router)**, **TypeScript (strict)**, and **MongoDB + Mongoose**.

Currency: **Bangladeshi Taka (BDT, ৳)**.

---

## 🏛️ System Architecture & Accounting Principles

1. **Integer Paisa Precision**: All monetary values are strictly stored as integer paisa (1 BDT = 100 paisa). Floating-point arithmetic is never stored in the database.
2. **Double-Entry Bookkeeping**: Real general ledger where every financial event posts balanced debit and credit entries (`sum(debit) === sum(credit)`).
3. **Multi-Document ACID Transactions**: All financial mutations run inside MongoDB replica-set transactions with automated transient retry.
4. **Immutable Audit Trails & Posting Records**: Financial journal entries and audit logs cannot be updated or deleted once posted; corrections happen exclusively through reversal + replacement entries.
5. **Role-Based Access Control (RBAC)**:
   - `owner`: Unrestricted administrative & financial authority.
   - `super_admin`: System configuration, user management, role assignments.
   - `admin`: Operational management of transactions, accounts, and reporting.
   - `accountant`: Double-entry bookkeeping, journal entries, ledgers, reconciliations.
   - `manager`: Expense submission and assigned transaction reviews.
   - `investor`: Strict isolated access strictly limited to their own investments, withdrawals, capital, and statements.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 20 (Node 24 tested)
- MongoDB instance (MongoDB Atlas or local replica set)

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your environment settings:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net
JWT_ACCESS_SECRET=your_super_secure_access_secret_key_at_least_32_chars
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_at_least_32_chars
APP_URL=http://localhost:3000
DEFAULT_TIMEZONE=Asia/Dhaka
NEXT_PUBLIC_CURRENCY=BDT
NEXT_PUBLIC_CURRENCY_SYMBOL=৳
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed Initial Roles & Users
```bash
npm run seed
```
Demo accounts created:
- **Owner**: `owner@shopnear.test` / `ShopNear#2026!`
- **Admin**: `admin@shopnear.test` / `ShopNear#2026!`
- **Accountant**: `accountant@shopnear.test` / `ShopNear#2026!`
- **Manager**: `manager@shopnear.test` / `ShopNear#2026!`
- **Investor**: `investor@shopnear.test` / `ShopNear#2026!`

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 6. Run Unit & Integration Tests
```bash
npm run test
```

### 7. Run Type-Check & Production Build
```bash
npx tsc --noEmit
npm run build
```

---

## 📱 Mobile-First Quality Bar
- Tested and responsive at **360px**, 768px, 1024px, and 1440px.
- Sticky topbar + fixed bottom navigation (Home, Transactions, Center Quick-Add FAB sheet, Accounts, More).
- Tap targets meeting WCAG AA accessibility standards (min 44px).
- Dynamic tabular numerals for financial figures.
