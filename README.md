# StaffSync - Modern Human Resource Management Solution

StaffSync is an enterprise-grade, full-stack MERN (MongoDB, Express.js, React.js, Node.js) web application designed for comprehensive human resource operations, employee lifecycle tracking, attendance and working hours recording, multi-tier leave approval workflows, company-wide announcements, and employee training.

The frontend interface preserves a modern aesthetic inspired by executive Canva prototypes: deep navy sidebar (`#1a2238`), crisp white dashboard cards, electric blue accents (`#0d6efd`), and clean typography.

---

## 🏗️ Project Architecture & Folder Structure

```text
StaffSync/
├── client/                     # Frontend Application (React + Vite + Bootstrap 5)
│   ├── public/                 # Static web assets
│   ├── src/
│   │   ├── components/         # Reusable UI widgets
│   │   │   ├── common/         # ProtectedRoute, StatusBadge, LoadingSpinner, AlertMessage
│   │   │   └── layout/         # AppLayout, Sidebar, Topbar
│   │   ├── context/            # AuthContext (React Context for persistent JWT session)
│   │   ├── pages/              # Page views
│   │   │   ├── dashboards/     # AdminDashboard, ManagerDashboard, EmployeeDashboard
│   │   │   ├── Login.jsx       # Login view with validation
│   │   │   ├── Dashboard.jsx   # Role-based dashboard dispatcher
│   │   │   ├── Employees.jsx   # Searchable employee directory & management modals
│   │   │   ├── Attendance.jsx  # Clock in/out widget & historical logs
│   │   │   ├── Leaves.jsx      # Leave balances & approval workflow
│   │   │   ├── Announcements.jsx # Company notices & priority bulletin
│   │   │   ├── Training.jsx    # Skill development & self progress tracker
│   │   │   ├── Profile.jsx     # Corporate ID card, contact info & change password
│   │   │   └── NotFound.jsx    # 404 handler
│   │   ├── services/           # Axios REST API services (api, auth, employee, etc.)
│   │   ├── App.jsx             # React Router routing configuration
│   │   ├── index.css           # Canva AI theme tokens & responsive styles
│   │   └── main.jsx            # React root mount
│   ├── .env.example            # Frontend environment blueprint
│   ├── index.html              # HTML entry file
│   ├── package.json            # Client dependencies & scripts
│   └── vite.config.js          # Vite build config (Port 5173)
│
├── server/                     # Backend Application (Node.js + Express.js + Mongoose)
│   ├── src/
│   │   ├── config/             # MongoDB connector with auto-retry (db.js)
│   │   ├── controllers/        # Business logic controllers
│   │   ├── middleware/         # authMiddleware (JWT, RBAC), validate
│   │   ├── models/             # User, Attendance, Leave, Announcement, Training
│   │   ├── routes/             # authRoutes, employeeRoutes, attendanceRoutes, etc.
│   │   ├── scripts/            # setupAdmin.js (Secure initial HR admin setup)
│   │   ├── utils/              # generateToken.js (JWT signing)
│   │   ├── app.js              # Express app, CORS, error handling
│   │   └── server.js           # Server startup entry point (Port 5000)
│   ├── test/                   # Automated integration test suites
│   │   ├── auth.test.js        # Phase 2 Authentication & RBAC tests (46 tests)
│   │   └── api.test.js         # Phase 3 REST APIs tests (70 tests)
│   ├── .env.example            # Backend environment blueprint
│   └── package.json            # Server dependencies & test scripts
│
├── .gitignore                  # Excludes node_modules, .env, and build artifacts
├── package.json                # Root workspace convenience scripts
└── README.md                   # Complete documentation
```

---

## 🚀 Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Fast single-page application and component-driven UI |
| | Bootstrap 5 & Bootstrap Icons | Responsive grid, accessible controls, and vector icons |
| | React Router DOM | Client-side routing with role-based route guards |
| | Axios | HTTP client with automatic JWT header injection |
| | Chart.js & React-Chartjs-2 | Visual metrics for attendance, headcount, and leave trends |
| **Backend** | Node.js & Express.js | High-performance asynchronous REST API server |
| | MongoDB Atlas & Mongoose | Cloud document database with structured schemas |
| | JSON Web Tokens (JWT) | Stateless authentication across sessions |
| | bcryptjs | Cryptographic password hashing (10 salt rounds) |
| | express-validator | Request sanitization and field validation |

---

## 🌟 Key Application Modules

1. **HR Administrator Dashboard:** Real-time KPI statistics (Headcount, Present Today, Absent Today, Attendance Rate %, Pending Leaves, Active Announcements, Active Training modules), Chart.js department distribution bar chart, attendance ratio donut chart, and recent activity logs.
2. **Manager Dashboard:** Department overview, team headcount, daily team attendance status, and pending leave requests from direct reportees.
3. **Employee Dashboard:** Today's attendance clock-in/out widget with live timestamps and working duration, leave balances summary, and assigned training programs.
4. **Employee Management:** Directory with multi-field search (name, email, ID), department filters, pagination, role management, contact info updates, and secure account deactivation.
5. **Attendance Management:** 1-click check-in and check-out with automatic late status tagging (after 9:30 AM), half-day calculations, duplicate check-in prevention, and supervisor audit logs.
6. **Leave Management:** Applications with date range validation, overlapping request prevention, leave balance deduction, supervisor review notes, and anti-self-approval security.
7. **Company Announcements:** Bulletin board with priority tags (`urgent`, `high`, `medium`, `low`), pinned notices, and department-level audience targeting.
8. **Training & Skill Development:** Training programs catalog, employee enrollment, and self-directed progress tracking (`assigned` → `in-progress` → `completed`).
9. **Profile & Security Settings:** Digital corporate identity card, contact details update, and authenticated password change.

---

## ⚙️ Prerequisites

* **Node.js:** v18.0.0 or higher (Tested and verified with v24.22.1)
* **npm:** v9.0.0 or higher (Tested with v11.19.1)
* **MongoDB:** Free cloud cluster on [MongoDB Atlas](https://www.mongodb.com/atlas) (or local MongoDB Community Server)
* **Modern Web Browser:** Chrome, Edge, Firefox, or Safari

---

## 🔐 Environment Variables Configuration

### Backend: `server/.env`
Create a `.env` file in the `server/` directory (you can copy `server/.env.example`):

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection String (Atlas URI)
# Replace <username> and <password> with your Atlas database user credentials
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/staffsync?retryWrites=true&w=majority

# JWT Authentication
# Use a strong, random 32+ character string
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRE=7d

# Allowed Frontend Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

### Frontend: `client/.env`
Create a `.env` file in the `client/` directory (you can copy `client/.env.example`):

```env
# API Base URL pointing to the Express server
VITE_API_BASE_URL=http://localhost:5000/api
```

> [!CAUTION]
> **Security Rule:** Never commit `.env` files to Git. Both `.env` files are protected by `.gitignore`.

---

## 🛠️ Installation & Setup Steps

### 1. Install Dependencies
From the root directory, run:
```powershell
npm run install:all
```
*(Or navigate into `server/` and `client/` independently and run `npm install` in each).*

### 2. Create the Initial HR Administrator (One-Time Setup)
StaffSync does not use insecure hardcoded passwords or public admin registration. Create your administrator account via:

```powershell
npm run setup:admin
```
The interactive terminal will prompt you for:
1. **Full Name** (e.g., `Mayank Ahirwar`)
2. **Corporate Email** (e.g., `admin@staffsync.com`)
3. **Password** (minimum 6 characters)

*(Once created, this setup command automatically locks itself to prevent unauthorized accounts).*

### 3. Run the Development Servers
Open two separate terminal windows:

* **Terminal 1 — Backend Server:**
  ```powershell
  cd server
  npm run dev
  ```
  *Server running at:* `http://localhost:5000`

* **Terminal 2 — Frontend Client:**
  ```powershell
  cd client
  npm run dev
  ```
  *Client running at:* `http://localhost:5173`

---

## 🧪 Automated Testing

StaffSync includes an automated integration test suite covering models, password hashing, JWT guards, role permissions, duplicate attendance handling, and leave transitions.

* **Run all tests (116 tests):**
  ```powershell
  npm test
  ```
* **Run Authentication & Security tests only (46 tests):**
  ```powershell
  npm run test:auth --prefix server
  ```
* **Run REST APIs & Business Logic tests only (70 tests):**
  ```powershell
  npm run test:api --prefix server
  ```
* **Run Frontend Production Build:**
  ```powershell
  cd client
  npm run build
  ```

---

## 🛡️ User Roles & Permissions Matrix

| Capability / Module | HR Administrator (`admin`) | Team Manager (`manager`) | Employee (`employee`) |
| :--- | :---: | :---: | :---: |
| **System Dashboard** | Organization-wide | Team Department | Personal Workspace |
| **View Employee Directory** | Full Access | Team Members | Public Directory Only |
| **Add / Edit Employees** | Yes (All fields) | No | Self (Contact info only) |
| **Deactivate Employees** | Yes (Not self) | No | No |
| **Check-in / Check-out** | Yes | Yes | Yes |
| **View Attendance Logs** | All Employees | Team Reportees | Self Only |
| **Submit Leave Request** | Yes | Yes | Yes |
| **Review Leave Requests** | Yes (All) | Team Reportees | No (Self-approval blocked) |
| **Publish Announcements** | Yes (All priority) | No | Read Only |
| **Create Training Programs**| Yes | Yes | Read & Self-Progress |
| **Assign Employees** | Yes | Yes | No |

---

## 📡 REST API Reference Overview

### Authentication (`/api/auth`)
* `POST /api/auth/login` — Authenticate and receive JWT
* `GET /api/auth/me` — Retrieve authenticated user profile
* `POST /api/auth/change-password` — Update user password

### Employees (`/api/employees`)
* `GET /api/employees` — List employees with search, department filter, and pagination
* `GET /api/employees/:id` — View employee details (scoped by role)
* `POST /api/employees` — Create new employee (Admin only)
* `PUT /api/employees/:id` — Update employee record
* `DELETE /api/employees/:id` — Soft-deactivate employee (Admin only)

### Attendance (`/api/attendance`)
* `POST /api/attendance/check-in` — Record daily check-in (prevents duplicates)
* `POST /api/attendance/check-out` — Record daily check-out and calculate hours
* `GET /api/attendance/today` — Current user's today attendance status
* `GET /api/attendance/my-history` — User's historical attendance records
* `GET /api/attendance` — Team/Company attendance logs (Manager/Admin)

### Leaves (`/api/leaves`)
* `POST /api/leaves` — Submit leave application
* `GET /api/leaves/my-leaves` — View personal leave history & balances
* `GET /api/leaves` — List leave applications for review (Manager/Admin)
* `GET /api/leaves/:id` — View specific leave application details
* `PATCH /api/leaves/:id/status` — Approve or reject leave application

### Announcements (`/api/announcements`)
* `GET /api/announcements` — View active notices (scoped to department/all)
* `GET /api/announcements/:id` — View announcement details
* `POST /api/announcements` — Publish notice (Admin only)
* `PUT /api/announcements/:id` — Edit notice (Admin only)
* `DELETE /api/announcements/:id` — Deactivate notice (Admin only)

### Training (`/api/trainings`)
* `GET /api/trainings` — List training modules (Manager/Admin)
* `GET /api/trainings/my-trainings` — View enrolled modules (Employee)
* `POST /api/trainings` — Create training module (Manager/Admin)
* `POST /api/trainings/:id/assign` — Assign employees (Manager/Admin)
* `PATCH /api/trainings/:id/progress` — Update progress status (Assigned employee)
* `DELETE /api/trainings/:id` — Delete module (Admin only)

### Dashboard (`/api/dashboard`)
* `GET /api/dashboard/stats` — Real-time dynamic analytics tailored to user role

### Health Check
* `GET /api/health` — Inspect backend server status and timestamp

---

## 🔧 Common Troubleshooting Steps

1. **MongoDB Atlas Connection Error (`MongoNetworkError` / SSL error):**
   * Ensure your IP address is whitelisted in MongoDB Atlas under **Network Access** (`0.0.0.0/0` allows universal access).
   * Verify your database username and password in `server/.env` contain no unescaped special characters.
2. **CORS Error in Browser Console:**
   * Confirm that `CLIENT_URL=http://localhost:5173` is set in `server/.env`.
3. **Port 5000 or 5173 Already in Use:**
   * If another process occupies port 5000, you can change `PORT=5001` in `server/.env` and update `VITE_API_BASE_URL=http://localhost:5001/api` in `client/.env`.
4. **OneDrive File Sync Delays:**
   * If `npm install` takes unusually long, pause OneDrive synchronization temporarily to prevent OneDrive from inspecting thousands of dependency files.
