# FleetPro – Transport Management System

**Stack:** React 18 · Node.js / Express · Supabase (PostgreSQL) · JWT Auth · DOCX generation

---

## Quick Start

### Step 1 — Create Supabase Project
1. Go to https://supabase.com → New Project
2. Open **SQL Editor** → paste the entire contents of `backend/config/schema.sql` → Run
3. Copy your **Project URL** and **service_role** key (Settings → API)

### Step 2 — Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
npm run seed        # inserts default users + sample data
npm run dev         # http://localhost:5000
```

### Step 3 — Frontend
```bash
cd frontend
npm install
npm start           # http://localhost:3000
```

---

## Default Logins
| Role    | Username | Password    |
|---------|----------|-------------|
| Admin   | admin    | admin123    |
| Manager | manager  | manager123  |
| Driver  | driver1  | driver123   |

---

## Role Permissions
| Action          | Admin | Manager | Driver |
|-----------------|-------|---------|--------|
| View all data   | ✅    | ✅      | ✅     |
| Create / Edit   | ✅    | ✅      | ❌     |
| Delete records  | ✅    | ❌      | ❌     |
| Manage users    | ✅    | ❌      | ❌     |

---

## Project Structure
```
fleetpro/
├── backend/
│   ├── config/
│   │   ├── db.js           ← Supabase client
│   │   ├── schema.sql      ← Run this in Supabase SQL Editor
│   │   └── seed.js         ← npm run seed
│   ├── controllers/        ← One file per module
│   ├── middleware/         ← JWT auth + error handler
│   ├── routes/index.js     ← All REST endpoints
│   ├── services/
│   │   ├── invoiceGenerator.js    ← Fills Lucky Transport invoice template → DOCX
│   │   └── tripReportGenerator.js ← Trip sheet matching your image → DOCX
│   ├── .env.example
│   └── server.js
└── frontend/
    └── src/
        ├── api/            ← Axios + all API functions
        ├── components/     ← Sidebar, Topbar, shared UI
        ├── context/        ← AuthContext (JWT)
        ├── pages/          ← Dashboard, Vehicles, Drivers, Customers,
        │                      Trips, Maintenance, Billing, Payments, Users
        └── styles/         ← global.css (dark industrial theme)
```

---

## Key Features

### 📄 Trip Sheet Export
- Enter trip entries: SR.NO, DATE, VEHICLE NO, CHA NAME, VEHICLE TYPE,
  OPENING TIME, MRB ARRIVAL TIME, CLOSING TIME, PER TRIP HRS, TOTAL HRS, G.T IN HRS, CHARGES
- Summary: Trip Amount, Extra OLT Hrs, ACC Monthly Pass, Rate, Total
- Click **Export** → downloads DOCX in landscape format matching your image

### 🧾 Invoice Generation (matches BLANK_INVOICE.doc)
- Linked to a trip (auto-fills all amounts)
- Generates Lucky Transport Services letterhead with:
  - Invoice Number (auto: INV/2025-26/001)
  - CGST 9% + SGST 9%
  - Description: "Local Transportation charges for Adhoc truck & jeep..."
  - Bank details, PAN, GSTIN, authorised signatory
- Click **📄 DOCX** → downloads filled Word document

### ⚠️ Document Expiry Alerts
- Vehicles with Insurance / Fitness / Permit expiring within 45 days
- Shown on Dashboard + sidebar badge

### 💳 Payment Tracking
- Record full or partial payments with mode (NEFT/RTGS/Cheque/UPI/Cash)
- Auto-marks invoice Paid when fully settled

---

## API Endpoints
```
POST /api/auth/login
GET  /api/auth/me
GET  /api/dashboard

GET/POST        /api/vehicles
GET/PUT/DELETE  /api/vehicles/:id
GET             /api/vehicles/expiring

GET/POST        /api/drivers
GET/PUT/DELETE  /api/drivers/:id

GET/POST        /api/customers
GET/PUT/DELETE  /api/customers/:id

GET/POST        /api/trips
GET/PUT/DELETE  /api/trips/:id
PUT             /api/trips/:id/entries   ← update entry rows
GET             /api/trips/:id/export    ← download DOCX trip sheet

GET/POST        /api/maintenance
GET/PUT/DELETE  /api/maintenance/:id
GET             /api/maintenance/stats

GET/POST        /api/invoices
GET/PUT         /api/invoices/:id
POST            /api/invoices/:id/pay
GET             /api/invoices/:id/download  ← download DOCX invoice
GET             /api/invoices/summary
```
