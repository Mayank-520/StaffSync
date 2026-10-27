require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const express = require('express');
const http = require('http');

// Models
const User = require('../src/models/User');
const Attendance = require('../src/models/Attendance');
const Leave = require('../src/models/Leave');
const Announcement = require('../src/models/Announcement');
const Training = require('../src/models/Training');

// App and middleware
const app = require('../src/app');
const connectDB = require('../src/config/db');
const { protect, authorize, requireSelfOrAdmin } = require('../src/middleware/authMiddleware');
const generateToken = require('../src/utils/generateToken');

let server;
let baseUrl;
const PORT = 5099;

let testCount = 0;
let passedCount = 0;
let failedCount = 0;

function assert(condition, testName) {
  testCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failedCount++;
    console.error(`  ❌ [FAIL] ${testName}`);
  }
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 StaffSync Phase 2 - Automated Test Suite');
  console.log('====================================================');

  try {
    // 1. Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB for testing.');

    // 2. Start HTTP server on test port
    await new Promise((resolve) => {
      server = app.listen(PORT, () => {
        baseUrl = `http://localhost:${PORT}`;
        console.log(`Test server running at ${baseUrl}`);
        resolve();
      });
    });

    // 3. Clean up any previous test leftovers (safety: only delete records with test prefix)
    await User.deleteMany({ email: /^test_staffsync_/i });

    // ==========================================
    // SUITE 1: Model Validation & Schema Rules
    // ==========================================
    console.log('\n--- Suite 1: Model Validation & Schema Constraints ---');

    // 1.1 User requires name, email, password, department, designation, employeeId
    let userValError = null;
    try {
      const invalidUser = new User({});
      await invalidUser.validate();
    } catch (err) {
      userValError = err;
    }
    assert(userValError !== null, 'User model rejects empty document');
    assert(userValError && userValError.errors.email, 'User model requires email');
    assert(userValError && userValError.errors.password, 'User model requires password');
    assert(userValError && userValError.errors.employeeId, 'User model requires employeeId');

    // 1.2 User email format validation
    let emailValError = null;
    try {
      const invalidEmailUser = new User({
        name: 'Test Person',
        email: 'invalid-email-format',
        password: 'password123',
        department: 'Tech',
        designation: 'Dev',
        employeeId: 'TEST-VAL-001'
      });
      await invalidEmailUser.validate();
    } catch (err) {
      emailValError = err;
    }
    assert(emailValError && emailValError.errors.email, 'User model rejects invalid email syntax');

    // 1.3 User role enum constraint
    let roleValError = null;
    try {
      const invalidRoleUser = new User({
        name: 'Test Person',
        email: 'test_staffsync_role@example.com',
        password: 'password123',
        department: 'Tech',
        designation: 'Dev',
        employeeId: 'TEST-VAL-002',
        role: 'superadmin_invalid'
      });
      await invalidRoleUser.validate();
    } catch (err) {
      roleValError = err;
    }
    assert(roleValError && roleValError.errors.role, 'User model rejects unknown roles outside [admin, manager, employee]');

    // 1.4 Leave model validation & calculation
    const testLeave = new Leave({
      user: new mongoose.Types.ObjectId(),
      leaveType: 'annual',
      startDate: new Date('2026-11-01'),
      endDate: new Date('2026-11-05'),
      reason: 'Attending annual college tech symposium'
    });
    await testLeave.save();
    assert(testLeave.totalDays === 5, 'Leave model automatically calculates inclusive totalDays (5 days)');
    assert(testLeave.status === 'pending', 'Leave status defaults to pending');
    await Leave.findByIdAndDelete(testLeave._id);

    // 1.5 Announcement model validation
    const testAnnounce = new Announcement({
      title: 'Company Townhall 2026',
      content: 'All hands meeting scheduled for this Friday.',
      priority: 'high',
      postedBy: new mongoose.Types.ObjectId()
    });
    await testAnnounce.save();
    assert(testAnnounce.priority === 'high', 'Announcement priority saved');
    assert(testAnnounce.targetDepartment === 'All', 'Announcement targetDepartment defaults to All');
    await Announcement.findByIdAndDelete(testAnnounce._id);

    // 1.6 Training model validation
    const testTraining = new Training({
      title: 'Information Security Essentials',
      description: 'Annual mandatory security refresher training.',
      category: 'Compliance',
      deadline: new Date('2026-12-31')
    });
    await testTraining.save();
    assert(testTraining.status === 'active', 'Training status defaults to active');
    await Training.findByIdAndDelete(testTraining._id);

    // ==========================================
    // SUITE 2: Password Hashing & Role Displays
    // ==========================================
    console.log('\n--- Suite 2: Password Hashing & Role Virtuals ---');

    const testPassword = 'PlainPassword123!';
    const testUser = await User.create({
      name: 'Test Employee One',
      email: 'test_staffsync_emp1@example.com',
      password: testPassword,
      role: 'employee',
      department: 'Engineering',
      designation: 'Junior Developer',
      employeeId: 'TEST-EMP-001',
      status: 'active'
    });

    assert(testUser.password !== testPassword, 'Password is automatically hashed with bcrypt before saving');
    assert(testUser.password.startsWith('$2'), 'Hashed password is a valid bcrypt hash');
    const isPasswordValid = await testUser.matchPassword(testPassword);
    const isPasswordInvalid = await testUser.matchPassword('WrongPassword');
    assert(isPasswordValid === true, 'matchPassword returns true for correct plain password');
    assert(isPasswordInvalid === false, 'matchPassword returns false for wrong plain password');

    // Virtual role display
    assert(testUser.roleDisplay === 'Employee', 'Virtual roleDisplay for employee is "Employee"');

    const testAdmin = await User.create({
      name: 'Test HR Admin',
      email: 'test_staffsync_admin@example.com',
      password: 'AdminPassword123!',
      role: 'admin',
      department: 'Human Resources',
      designation: 'HR Lead',
      employeeId: 'TEST-ADM-001',
      status: 'active'
    });
    assert(testAdmin.roleDisplay === 'HR Administrator', 'Virtual roleDisplay for admin is "HR Administrator"');

    const testManager = await User.create({
      name: 'Test Team Manager',
      email: 'test_staffsync_manager@example.com',
      password: 'ManagerPassword123!',
      role: 'manager',
      department: 'Engineering',
      designation: 'Engineering Manager',
      employeeId: 'TEST-MGR-001',
      status: 'active'
    });
    assert(testManager.roleDisplay === 'Manager', 'Virtual roleDisplay for manager is "Manager"');

    // ==========================================
    // SUITE 3: Authentication API (Login, /me, Change Password)
    // ==========================================
    console.log('\n--- Suite 3: Authentication API Endpoints ---');

    // 3.1 Login with wrong password
    const loginFail = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'test_staffsync_emp1@example.com', password: 'WrongPassword' }
    });
    assert(loginFail.status === 401, 'POST /api/auth/login rejects wrong password with 401 Unauthorized');
    assert(loginFail.data.success === false, 'POST /api/auth/login returns success: false on failed login');

    // 3.2 Login with non-existent email
    const loginNonExistent = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'test_staffsync_nonexistent@example.com', password: 'AnyPassword' }
    });
    assert(loginNonExistent.status === 401, 'POST /api/auth/login rejects unknown email with 401 Unauthorized');

    // 3.3 Login with deactivated account
    const inactiveUser = await User.create({
      name: 'Inactive Employee',
      email: 'test_staffsync_inactive@example.com',
      password: 'Password123!',
      role: 'employee',
      department: 'Operations',
      designation: 'Clerk',
      employeeId: 'TEST-INA-001',
      status: 'inactive'
    });
    const loginInactive = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'test_staffsync_inactive@example.com', password: 'Password123!' }
    });
    assert(loginInactive.status === 403, 'POST /api/auth/login blocks inactive users with 403 Forbidden');

    // 3.4 Successful login
    const loginSuccess = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'test_staffsync_emp1@example.com', password: testPassword }
    });
    assert(loginSuccess.status === 200, 'POST /api/auth/login succeeds with 200 OK');
    assert(Boolean(loginSuccess.data.token), 'POST /api/auth/login returns a JWT token');
    assert(loginSuccess.data.user.password === undefined, 'POST /api/auth/login does NOT return password hash in response');
    assert(loginSuccess.data.user.roleDisplay === 'Employee', 'POST /api/auth/login includes roleDisplay');

    const empToken = loginSuccess.data.token;

    // 3.5 GET /api/auth/me without token
    const meWithoutToken = await request('/api/auth/me');
    assert(meWithoutToken.status === 401, 'GET /api/auth/me blocks unauthenticated requests with 401 Unauthorized');

    // 3.6 GET /api/auth/me with invalid token
    const meWithBadToken = await request('/api/auth/me', {
      headers: { Authorization: 'Bearer this_is_an_invalid_token' }
    });
    assert(meWithBadToken.status === 401, 'GET /api/auth/me blocks invalid token with 401 Unauthorized');

    // 3.7 GET /api/auth/me with valid token
    const meValid = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${empToken}` }
    });
    assert(meValid.status === 200, 'GET /api/auth/me succeeds with 200 OK for valid JWT');
    assert(meValid.data.user.email === 'test_staffsync_emp1@example.com', 'GET /api/auth/me returns current user profile');
    assert(meValid.data.user.password === undefined, 'GET /api/auth/me does not expose password');

    // 3.8 POST /api/auth/change-password with wrong current password
    const pwChangeWrong = await request('/api/auth/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: { currentPassword: 'IncorrectOldPassword', newPassword: 'BrandNewPassword123!' }
    });
    assert(pwChangeWrong.status === 400, 'POST /api/auth/change-password rejects incorrect current password with 400');

    // 3.9 POST /api/auth/change-password with identical password
    const pwChangeSame = await request('/api/auth/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: { currentPassword: testPassword, newPassword: testPassword }
    });
    assert(pwChangeSame.status === 400, 'POST /api/auth/change-password rejects identical new password with 400');

    // 3.10 POST /api/auth/change-password successfully
    const newPassword = 'BrandNewPassword123!';
    const pwChangeSuccess = await request('/api/auth/change-password', {
      method: 'POST',
      headers: { Authorization: `Bearer ${empToken}` },
      body: { currentPassword: testPassword, newPassword }
    });
    assert(pwChangeSuccess.status === 200, 'POST /api/auth/change-password succeeds with 200 OK');

    // Verify old password fails and new password works
    const loginOldPw = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'test_staffsync_emp1@example.com', password: testPassword }
    });
    assert(loginOldPw.status === 401, 'Old password no longer works after password change');

    const loginNewPw = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'test_staffsync_emp1@example.com', password: newPassword }
    });
    assert(loginNewPw.status === 200, 'New password successfully authenticates user');
    const updatedEmpToken = loginNewPw.data.token;

    // ==========================================
    // SUITE 4: Role-Based Access Control (RBAC)
    // ==========================================
    console.log('\n--- Suite 4: Role-Based Authorization & Permissions ---');

    const adminToken = generateToken(testAdmin._id, 'admin');
    const managerToken = generateToken(testManager._id, 'manager');

    // 4.1 Admin-only route: employee access is blocked
    const employeeOnAdminRoute = await request('/api/auth/verify-admin', {
      headers: { Authorization: `Bearer ${updatedEmpToken}` }
    });
    assert(employeeOnAdminRoute.status === 403, 'Employee is blocked from Admin-only route (403 Forbidden)');

    // 4.2 Admin-only route: manager access is blocked
    const managerOnAdminRoute = await request('/api/auth/verify-admin', {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(managerOnAdminRoute.status === 403, 'Manager is blocked from Admin-only route (403 Forbidden)');

    // 4.3 Admin-only route: admin access is allowed
    const adminOnAdminRoute = await request('/api/auth/verify-admin', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminOnAdminRoute.status === 200, 'HR Admin successfully accesses Admin-only route (200 OK)');

    // 4.4 Manager-or-admin route: employee is blocked, manager and admin allowed
    const empOnMgrRoute = await request('/api/auth/verify-manager', {
      headers: { Authorization: `Bearer ${updatedEmpToken}` }
    });
    const mgrOnMgrRoute = await request('/api/auth/verify-manager', {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(empOnMgrRoute.status === 403, 'Employee blocked from Manager/Admin route (403 Forbidden)');
    assert(mgrOnMgrRoute.status === 200, 'Manager allowed on Manager/Admin route (200 OK)');

    // 4.5 Private resource protection (requireSelfOrAdmin)
    // Employee tries to access another employee's private resource
    const anotherEmpId = testManager._id.toString();
    const empAccessingOther = await request(`/api/auth/verify-self/${anotherEmpId}`, {
      headers: { Authorization: `Bearer ${updatedEmpToken}` }
    });
    assert(empAccessingOther.status === 403, 'Employee cannot access another employee private resource (403 Forbidden)');

    // Employee accesses their own private resource
    const ownEmpId = testUser._id.toString();
    const empAccessingOwn = await request(`/api/auth/verify-self/${ownEmpId}`, {
      headers: { Authorization: `Bearer ${updatedEmpToken}` }
    });
    assert(empAccessingOwn.status === 200, 'Employee can access their own private resource (200 OK)');

    // Admin accesses any employee private resource
    const adminAccessingEmp = await request(`/api/auth/verify-self/${ownEmpId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminAccessingEmp.status === 200, 'HR Admin can access any employee private resource (200 OK)');

    // ==========================================
    // SUITE 5: Health Check Regression Test
    // ==========================================
    console.log('\n--- Suite 5: Health Check Endpoint Regression ---');
    const healthCheck = await request('/api/health');
    assert(healthCheck.status === 200, 'Existing GET /api/health endpoint remains functional (200 OK)');
    assert(healthCheck.data.success === true, 'Health check payload contains success: true');

    // ==========================================
    // Clean up test data
    // ==========================================
    console.log('\n--- Cleaning up test records ---');
    await User.deleteMany({ email: /^test_staffsync_/i });
    console.log('Test records deleted safely without touching existing records.');

  } catch (err) {
    console.error('Fatal Test Suite Error:', err);
    failedCount++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    console.log('\n====================================================');
    console.log(`Test Summary: ${passedCount}/${testCount} Passed (${failedCount} Failed)`);
    console.log('====================================================\n');

    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();
