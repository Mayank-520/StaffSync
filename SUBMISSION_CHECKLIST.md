# StaffSync — Project Submission & Evaluation Checklist

This document serves as your submission guide and viva/presentation checklist for your college project and SkillWallet / university portal evaluation.

---

## 1. Source Code Repository Checklist

- [x] **Full-Stack Decoupled Architecture:** Clean `client/` (React + Vite) and `server/` (Node + Express) directories.
- [x] **Git Cleanliness:** `.gitignore` properly set up at root to prevent uploading `node_modules/`, `.env`, and build outputs.
- [x] **No Hardcoded Credentials:** Verified that zero passwords, database URIs, or JWT secrets are hardcoded in source code files.
- [x] **Environment Blueprints:** `server/.env.example` and `client/.env.example` are present with clear placeholder explanations.
- [x] **Dependencies:** `package.json` files in root, server, and client have all dependencies listed and tested.
- [x] **Clean Production Build:** Tested `npm run build` in `client/` with 0 errors.

---

## 2. Environment Configuration Checklist

Before demonstrating or packaging:
- [ ] **Backend Configuration (`server/.env`):**
  - `PORT=5000`
  - `NODE_ENV=development`
  - `MONGODB_URI=<Your MongoDB Atlas Connection URI>`
  - `JWT_SECRET=<Strong 32+ character random secret>`
  - `CLIENT_URL=http://localhost:5173`
- [ ] **Frontend Configuration (`client/.env`):**
  - `VITE_API_BASE_URL=http://localhost:5000/api`
- [ ] **Atlas Network Whitelist:** IP set to `0.0.0.0/0` (Allow access from anywhere) in Atlas Console → Network Access.

---

## 3. Automated Test Verification Results

StaffSync includes an automated integration test suite. When asked by examiners how your application was tested, you can present these results:

```text
Test Command: npm test (or npm run test:api & npm run test:auth in server)

1. Authentication & Security Suite (server/test/auth.test.js):
   - Model schema constraints & validation rules: PASSED
   - bcryptjs salted password hashing & matchPassword verification: PASSED
   - JWT generation & token expiry checks: PASSED
   - Login with invalid / deactivated accounts: PASSED
   - Role Display virtuals ("HR Administrator", "Manager", "Employee"): PASSED
   - RBAC route protection (Admin-only, Manager, Self): PASSED
   - Health check regression: PASSED
   Total: 46 / 46 PASSED

2. Business Logic & REST APIs Suite (server/test/api.test.js):
   - Employee Management CRUD, search, and department scoping: PASSED
   - Attendance check-in, check-out, duration calculation, duplicate guard: PASSED
   - Leave applications, date validation, overlap prevention, balance deduction: PASSED
   - Anti-Self Approval security guard: PASSED
   - Company Announcements priority feed & audience targeting: PASSED
   - Training module assignment & employee progress tracking: PASSED
   - Dynamic role-based dashboard statistics: PASSED
   Total: 70 / 70 PASSED

Grand Total: 116 / 116 Tests Passing (100% Pass Rate)
```

---

## 4. Recommended Demonstration & Viva Flow

Follow this 5-step narrative during your project presentation:

### Step 1: Initial System Setup & Security Architecture
* Explain that the system avoids insecure default accounts or public admin registration.
* Demonstrate `npm run setup:admin` in the terminal to show how an HR Administrator is securely provisioned.
* Show how running the script a second time is locked.

### Step 2: HR Administrator Walkthrough
1. Log in as **HR Administrator** (`admin@staffsync.com`).
2. Show the **Executive Dashboard**:
   * Organization headcount, attendance rate percentage, active announcements.
   * Department distribution bar chart (Chart.js) and attendance donut chart.
3. Navigate to **Employee Management**:
   * Demonstrate searching and department filtering.
   * Add a new **Manager** (`manager@staffsync.com`, Department: Engineering) and a new **Employee** (`employee@staffsync.com`, Department: Engineering).
4. Navigate to **Announcements**:
   * Post a new company announcement with "Urgent" priority and "All" departments.
5. Navigate to **Training**:
   * Create a training module (e.g., "Full-Stack Security Essentials") and assign it to the newly created employee.

### Step 3: Employee Self-Service Walkthrough
1. Open an incognito browser window or log out and log in as the newly created **Employee**.
2. Show the **Employee Dashboard**:
   * Highlight the live Attendance Shift widget.
   * Click **"Clock In Now"** — show the recorded timestamp and status badge ("Present").
   * Demonstrate duplicate check-in prevention (button changes to Clock Out).
   * Show available leave balances (Annual: 15, Sick: 10, Casual: 10).
3. Navigate to **Leaves**:
   * Apply for 3 days of Annual Leave. Show that status is immediately marked as "Pending".
4. Navigate to **Training**:
   * Click **"Start Training"** (progress bar changes to 50% "In Progress").
   * Click **"Mark as Completed"** (progress bar reaches 100% with completion timestamp).

### Step 4: Manager Approval Walkthrough
1. Log in as the **Manager** (`manager@staffsync.com`).
2. Show the **Manager Dashboard**:
   * Displays team headcount (1 member) and pending team leave requests.
3. Navigate to **Leave Requests**:
   * View the pending leave request from their team member.
   * Click **"Approve"** and enter an optional note (e.g. "Approved by Engineering Lead").
4. Log back in as the **Employee**:
   * Show that the leave status updated to "Approved" and their Annual Leave balance was automatically deducted (15 → 12 days).

### Step 5: Architecture & Viva Q&A Highlights
* **Authentication:** Stateless JSON Web Tokens (JWT) signed with HMAC-SHA256 and sent via HTTP `Authorization: Bearer <token>` headers.
* **Password Security:** Salted one-way hashing with `bcryptjs` (work factor 10), never exposed in API queries (`select: false`).
* **Cross-Origin Security:** CORS middleware with strict allowed origin whitelist (`CLIENT_URL`).
* **Database Modeling:** Normalized Mongoose schemas with compound unique indexing (`{ user: 1, date: 1 }` on attendance).

---

## 5. Recommended Application Screenshots for Project Report

Take clean screenshots of these 8 screens to include in your project documentation / report:
1. **Login Page:** Clean dark-mode gradient backdrop with the StaffSync logo card.
2. **HR Admin Dashboard:** Top KPI cards, department bar chart, attendance ratio donut.
3. **Manager Dashboard:** Department overview and pending team approvals.
4. **Employee Dashboard:** Clock-in widget, leave balance counters, assigned courses.
5. **Employee Directory:** Searchable table with department dropdown filter and action buttons.
6. **Attendance Log:** Check-in status card and monthly attendance history table.
7. **Leave Management:** Leave balance widgets, application form modal, and supervisor approval modal.
8. **Company Announcements:** Bulletin cards with priority tags (`Urgent`, `High`, etc.).

---

## 6. SkillWallet / University Portal Checklist

> [!NOTE]
> Different universities and portals (like SkillWallet) have specific submission guidelines. Confirm with your department coordinator if your college requires:
>
> 1. **GitHub Repository URL:** Public or private repository link (ensure `.env` is NOT uploaded).
> 2. **Live Deployment URL:** (Optional) If required, backend can be deployed on Render/Railway and frontend on Vercel/Netlify.
> 3. **Recorded Video Walkthrough:** A 3–5 minute screencast demonstrating login, clock-in, leave application, and approval.
> 4. **PDF Project Report:** Containing Abstract, System Architecture, ER Diagram, API Specifications, Screenshots, and Conclusion.
> 5. **Zip Archive:** Clean zip archive of project folder excluding `node_modules` (can be created using `git archive` or zipping without `node_modules`).
