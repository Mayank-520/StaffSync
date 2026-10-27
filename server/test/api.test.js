require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// Models
const User = require('../src/models/User');
const Attendance = require('../src/models/Attendance');
const Leave = require('../src/models/Leave');
const Announcement = require('../src/models/Announcement');
const Training = require('../src/models/Training');

const app = require('../src/app');
const connectDB = require('../src/config/db');
const generateToken = require('../src/utils/generateToken');

let server;
let baseUrl;
const PORT = 5098;

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

async function runApiTests() {
  console.log('====================================================');
  console.log('🧪 StaffSync Phase 3 - REST APIs Automated Test Suite');
  console.log('====================================================');

  try {
    await connectDB();
    console.log('Connected to MongoDB for Phase 3 API tests.');

    await new Promise((resolve) => {
      server = app.listen(PORT, () => {
        baseUrl = `http://localhost:${PORT}`;
        console.log(`Test API server running at ${baseUrl}`);
        resolve();
      });
    });

    // Clean up any test records sequentially to avoid connection pool burst
    await User.deleteMany({ email: /^test_p3_/i });
    await Attendance.deleteMany({ notes: /test_p3/i });
    await Leave.deleteMany({ reason: /test_p3/i });
    await Announcement.deleteMany({ title: /test_p3/i });
    await Training.deleteMany({ title: /test_p3/i });

    // Create Test Role Users
    // 1. Admin
    const adminUser = await User.create({
      name: 'P3 Admin User',
      email: 'test_p3_admin@example.com',
      password: 'AdminPassword123!',
      role: 'admin',
      department: 'Human Resources',
      designation: 'HR Lead',
      employeeId: 'P3-ADM-001',
      status: 'active'
    });
    const adminToken = generateToken(adminUser._id, 'admin');

    // 2. Manager (Engineering)
    const managerUser = await User.create({
      name: 'P3 Engineering Manager',
      email: 'test_p3_manager@example.com',
      password: 'ManagerPassword123!',
      role: 'manager',
      department: 'Engineering',
      designation: 'Tech Lead',
      employeeId: 'P3-MGR-001',
      status: 'active'
    });
    const managerToken = generateToken(managerUser._id, 'manager');

    // 3. Employee 1 (Reports to Manager, Engineering)
    const emp1User = await User.create({
      name: 'P3 Employee One',
      email: 'test_p3_emp1@example.com',
      password: 'EmployeePassword123!',
      role: 'employee',
      department: 'Engineering',
      designation: 'Full Stack Dev',
      employeeId: 'P3-EMP-001',
      manager: managerUser._id,
      status: 'active',
      leaveBalance: { annual: 10, sick: 5, casual: 5, maternity: 0, paternity: 0, unpaid: 10 }
    });
    const emp1Token = generateToken(emp1User._id, 'employee');

    // 4. Employee 2 (Marketing - different department, different manager)
    const emp2User = await User.create({
      name: 'P3 Employee Two',
      email: 'test_p3_emp2@example.com',
      password: 'EmployeePassword123!',
      role: 'employee',
      department: 'Marketing',
      designation: 'Content Lead',
      employeeId: 'P3-EMP-002',
      status: 'active',
      leaveBalance: { annual: 10, sick: 5, casual: 5, maternity: 0, paternity: 0, unpaid: 10 }
    });
    const emp2Token = generateToken(emp2User._id, 'employee');

    // ==========================================
    // MODULE 1: EMPLOYEE MANAGEMENT (/api/employees)
    // ==========================================
    console.log('\n--- Module 1: Employee Management (/api/employees) ---');

    // 1.1 Non-admin blocked from creating employee
    const createByEmp = await request('/api/employees', {
      method: 'POST',
      headers: { Authorization: `Bearer ${emp1Token}` },
      body: {
        name: 'Forbidden Employee',
        email: 'test_p3_forbidden@example.com',
        password: 'Password123!',
        department: 'Engineering',
        designation: 'Junior Dev',
        employeeId: 'P3-FORBIDDEN-01'
      }
    });
    assert(createByEmp.status === 403, 'Employee blocked from creating new employee (403 Forbidden)');

    // 1.2 Admin creates employee successfully
    const createByAdmin = await request('/api/employees', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'P3 Created Employee',
        email: 'test_p3_created@example.com',
        password: 'Password123!',
        department: 'Finance',
        designation: 'Accountant',
        employeeId: 'P3-FIN-001',
        role: 'employee'
      }
    });
    assert(createByAdmin.status === 201, 'HR Admin successfully creates new employee (201 Created)');
    assert(createByAdmin.data.employee.password === undefined, 'Created employee response does NOT expose password');
    const createdEmpId = createByAdmin.data.employee._id;

    // 1.3 Duplicate email rejected
    const dupEmail = await request('/api/employees', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Duplicate Email Test',
        email: 'test_p3_created@example.com',
        password: 'Password123!',
        department: 'Finance',
        designation: 'Accountant',
        employeeId: 'P3-FIN-999'
      }
    });
    assert(dupEmail.status === 400, 'Duplicate employee email rejected with 400 Bad Request');

    // 1.4 Admin lists employees with search & filter
    const listEmployees = await request('/api/employees?department=Finance&search=Created', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(listEmployees.status === 200, 'Admin can list employees with department and search filters (200 OK)');
    assert(listEmployees.data.employees.length >= 1, 'Search query successfully filtered created employee');

    // 1.5 Manager access restriction: Manager sees team (emp1) but not emp2 (Marketing)
    const mgrEmployeeView = await request(`/api/employees/${emp1User._id}`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(mgrEmployeeView.status === 200, 'Manager can view their team member profile (200 OK)');

    const mgrOtherDeptView = await request(`/api/employees/${emp2User._id}`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(mgrOtherDeptView.status === 403, 'Manager blocked from viewing employee outside their team/department (403 Forbidden)');

    // 1.6 Employee can only access their own full profile
    const empAccessOther = await request(`/api/employees/${emp2User._id}`, {
      headers: { Authorization: `Bearer ${emp1Token}` }
    });
    assert(empAccessOther.status === 403, 'Employee blocked from viewing another employee private record (403 Forbidden)');

    const empAccessSelf = await request(`/api/employees/${emp1User._id}`, {
      headers: { Authorization: `Bearer ${emp1Token}` }
    });
    assert(empAccessSelf.status === 200, 'Employee can view their own profile (200 OK)');

    // 1.7 Employee updates permitted personal fields
    const empSelfUpdate = await request(`/api/employees/${emp1User._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${emp1Token}` },
      body: { phone: '+1-555-0199', address: '42 Campus Way, Tech Park' }
    });
    assert(empSelfUpdate.status === 200, 'Employee can update their personal phone and address (200 OK)');
    assert(empSelfUpdate.data.employee.phone === '+1-555-0199', 'Phone number updated successfully');

    // 1.8 Admin deactivates employee (soft delete)
    const deactRes = await request(`/api/employees/${createdEmpId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deactRes.status === 200, 'Admin can deactivate employee account (200 OK)');

    // 1.9 Admin cannot deactivate self
    const deactSelf = await request(`/api/employees/${adminUser._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deactSelf.status === 400, 'Admin is blocked from deactivating their own account (400 Bad Request)');

    // ==========================================
    // MODULE 2: ATTENDANCE MANAGEMENT (/api/attendance)
    // ==========================================
    console.log('\n--- Module 2: Attendance Management (/api/attendance) ---');

    // 2.1 Check out before checking in is rejected
    const checkOutEarly = await request('/api/attendance/check-out', {
      method: 'POST',
      headers: { Authorization: `Bearer ${emp1Token}` }
    });
    assert(checkOutEarly.status === 400, 'Check-out before check-in is rejected (400 Bad Request)');

    // 2.2 First check-in succeeds
    const checkInRes = await request('/api/attendance/check-in', {
      method: 'POST',
      headers: { Authorization: `Bearer ${emp1Token}` },
      body: { notes: 'test_p3 check-in note' }
    });
    assert(checkInRes.status === 201, 'Employee successfully checks in for today (201 Created)');
    assert(checkInRes.data.attendance.checkIn !== null, 'Check-in timestamp recorded');

    // 2.3 Duplicate check-in on the same day blocked
    const duplicateCheckIn = await request('/api/attendance/check-in', {
      method: 'POST',
      headers: { Authorization: `Bearer ${emp1Token}` }
    });
    assert(duplicateCheckIn.status === 400, 'Duplicate check-in on the same day is blocked (400 Bad Request)');

    // 2.4 View today's status
    const todayStatus = await request('/api/attendance/today', {
      headers: { Authorization: `Bearer ${emp1Token}` }
    });
    assert(todayStatus.status === 200, 'GET /api/attendance/today returns 200 OK');
    assert(todayStatus.data.hasCheckedIn === true, 'Today status reports hasCheckedIn: true');
    assert(todayStatus.data.hasCheckedOut === false, 'Today status reports hasCheckedOut: false');

    // 2.5 Check-out succeeds & calculates working hours
    const checkOutRes = await request('/api/attendance/check-out', {
      method: 'POST',
      headers: { Authorization: `Bearer ${emp1Token}` },
      body: { notes: 'test_p3 check-out note' }
    });
    assert(checkOutRes.status === 200, 'Employee check-out succeeds (200 OK)');
    assert(checkOutRes.data.attendance.checkOut !== null, 'Check-out timestamp recorded');
    assert(checkOutRes.data.attendance.workingHours !== undefined, 'Working hours duration calculated');

    // 2.6 Second check-out on the same day is blocked
    const repeatCheckOut = await request('/api/attendance/check-out', {
      method: 'POST',
      headers: { Authorization: `Bearer ${emp1Token}` }
    });
    assert(repeatCheckOut.status === 400, 'Repeated check-out on same day blocked (400 Bad Request)');

    // 2.7 Employee views personal history
    const myHistory = await request('/api/attendance/my-history', {
      headers: { Authorization: `Bearer ${emp1Token}` }
    });
    assert(myHistory.status === 200, 'Employee views personal attendance history (200 OK)');
    assert(myHistory.data.records.length >= 1, 'Attendance record appears in personal history');

    // 2.8 Manager views team attendance (sees emp1, but not emp2)
    const mgrAttendance = await request('/api/attendance', {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(mgrAttendance.status === 200, 'Manager can view team attendance records (200 OK)');
    const mgrSeesEmp1 = mgrAttendance.data.records.some((r) => r.user?._id?.toString() === emp1User._id.toString());
    assert(mgrSeesEmp1 === true, 'Manager sees reportee attendance record');

    // ==========================================
    // MODULE 3: LEAVE MANAGEMENT (/api/leaves)
    // ==========================================
    console.log('\n--- Module 3: Leave Management (/api/leaves) ---');

    // 3.1 Invalid date range (end date earlier than start date)
    const invalidDateLeave = await request('/api/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${emp1Token}` },
      body: {
        leaveType: 'annual',
        startDate: '2026-11-10',
        endDate: '2026-11-05',
        reason: 'test_p3 invalid dates'
      }
    });
    assert(invalidDateLeave.status === 400, 'Leave rejected when end date is earlier than start date (400 Bad Request)');

    // 3.2 Insufficient leave balance rejected
    const excessLeave = await request('/api/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${emp1Token}` },
      body: {
        leaveType: 'sick',
        startDate: '2026-11-01',
        endDate: '2026-11-20', // 20 days requested, only 5 available
        reason: 'test_p3 excess sick leave'
      }
    });
    assert(excessLeave.status === 400, 'Leave request exceeding available balance rejected (400 Bad Request)');

    // 3.3 Valid leave request submitted
    const validLeave = await request('/api/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${emp1Token}` },
      body: {
        leaveType: 'annual',
        startDate: '2026-11-15',
        endDate: '2026-11-17', // 3 days requested, 10 available
        reason: 'test_p3 Annual college vacation'
      }
    });
    assert(validLeave.status === 201, 'Valid leave request submitted successfully (201 Created)');
    assert(validLeave.data.leave.status === 'pending', 'Submitted leave status is pending');
    assert(validLeave.data.leave.totalDays === 3, 'Calculated totalDays is 3');
    const leaveId = validLeave.data.leave._id;

    // 3.4 Overlapping leave request rejected
    const overlapLeave = await request('/api/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${emp1Token}` },
      body: {
        leaveType: 'annual',
        startDate: '2026-11-16',
        endDate: '2026-11-18',
        reason: 'test_p3 overlapping request'
      }
    });
    assert(overlapLeave.status === 400, 'Overlapping leave request rejected (400 Bad Request)');

    // 3.5 Employee CANNOT approve their own leave request
    const selfApprove = await request(`/api/leaves/${leaveId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${emp1Token}` },
      body: { status: 'approved', reviewerNote: 'Self approved' }
    });
    assert(selfApprove.status === 403, 'Employee is blocked from approving their own leave request (403 Forbidden)');

    // 3.6 Manager cannot review leave for employee outside their team
    const emp2Leave = await request('/api/leaves', {
      method: 'POST',
      headers: { Authorization: `Bearer ${emp2Token}` },
      body: {
        leaveType: 'casual',
        startDate: '2026-12-01',
        endDate: '2026-12-02',
        reason: 'test_p3 emp2 casual leave'
      }
    });
    const emp2LeaveId = emp2Leave.data.leave._id;

    const mgrReviewOutside = await request(`/api/leaves/${emp2LeaveId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: { status: 'approved' }
    });
    assert(mgrReviewOutside.status === 403, 'Manager blocked from approving leave outside their team (403 Forbidden)');

    // 3.7 Manager approves team member leave
    const mgrApprove = await request(`/api/leaves/${leaveId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: { status: 'approved', reviewerNote: 'Approved for tech symposium' }
    });
    assert(mgrApprove.status === 200, 'Manager successfully approves team member leave (200 OK)');
    assert(mgrApprove.data.leave.status === 'approved', 'Leave status changed to approved');

    // 3.8 Verify leave balance deducted after approval (10 - 3 = 7)
    const updatedEmp1 = await User.findById(emp1User._id);
    assert(updatedEmp1.leaveBalance.annual === 7, 'Employee leave balance deducted properly upon approval (10 - 3 = 7)');

    // 3.9 Re-modifying an already approved leave is blocked
    const repeatStatus = await request(`/api/leaves/${leaveId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: { status: 'rejected' }
    });
    assert(repeatStatus.status === 400, 'Re-modifying already finalized leave status is blocked (400 Bad Request)');

    // ==========================================
    // MODULE 4: ANNOUNCEMENTS (/api/announcements)
    // ==========================================
    console.log('\n--- Module 4: Announcements (/api/announcements) ---');

    // 4.1 Non-admin blocked from creating announcement
    const empAnnounce = await request('/api/announcements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${emp1Token}` },
      body: { title: 'test_p3 Unauth Notice', content: 'Unauthorized content' }
    });
    assert(empAnnounce.status === 403, 'Employee blocked from publishing announcement (403 Forbidden)');

    // 4.2 Admin creates company-wide announcement
    const adminAnnounce = await request('/api/announcements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        title: 'test_p3 Q4 All Hands Meeting',
        content: 'Company quarterly townhall will be held next Friday at 3 PM.',
        priority: 'high',
        targetDepartment: 'All',
        isPinned: true
      }
    });
    assert(adminAnnounce.status === 201, 'HR Admin successfully creates announcement (201 Created)');
    const announceId = adminAnnounce.data.announcement._id;

    // 4.3 Admin creates Marketing-specific announcement
    const mktAnnounce = await request('/api/announcements', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        title: 'test_p3 Marketing Strategy Session',
        content: 'Marketing team sync on 2027 product branding.',
        priority: 'medium',
        targetDepartment: 'Marketing'
      }
    });
    const mktAnnounceId = mktAnnounce.data.announcement._id;

    // 4.4 Engineering employee cannot view Marketing-only announcement detail
    const emp1ViewMkt = await request(`/api/announcements/${mktAnnounceId}`, {
      headers: { Authorization: `Bearer ${emp1Token}` }
    });
    assert(emp1ViewMkt.status === 403, 'Employee blocked from viewing other department targeted announcement (403 Forbidden)');

    // 4.5 Engineering employee CAN view company-wide announcement
    const emp1ViewAll = await request(`/api/announcements/${announceId}`, {
      headers: { Authorization: `Bearer ${emp1Token}` }
    });
    assert(emp1ViewAll.status === 200, 'Employee can view company-wide announcement (200 OK)');

    // 4.6 Admin can update & deactivate announcement
    const deactAnnounce = await request(`/api/announcements/${announceId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(deactAnnounce.status === 200, 'Admin can deactivate announcement (200 OK)');

    // ==========================================
    // MODULE 5: TRAINING & DEVELOPMENT (/api/trainings)
    // ==========================================
    console.log('\n--- Module 5: Training & Development (/api/trainings) ---');

    // 5.1 Employee blocked from creating training
    const empCreateTraining = await request('/api/trainings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${emp1Token}` },
      body: { title: 'test_p3 Unauthorized', description: 'Forbidden', deadline: '2026-12-31' }
    });
    assert(empCreateTraining.status === 403, 'Employee blocked from creating training programs (403 Forbidden)');

    // 5.2 Manager creates training program and assigns emp1
    const createTrainingRes = await request('/api/trainings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: {
        title: 'test_p3 React Performance Optimization',
        description: 'Advanced React patterns, memoization, and Vite optimizations.',
        category: 'Technical',
        deadline: '2026-12-15',
        assignedEmployees: [emp1User._id]
      }
    });
    assert(createTrainingRes.status === 201, 'Manager creates training module and assigns employee (201 Created)');
    const trainingId = createTrainingRes.data.training._id;

    // 5.3 Enrolled employee views their training module
    const myTrainings = await request('/api/trainings/my-trainings', {
      headers: { Authorization: `Bearer ${emp1Token}` }
    });
    assert(myTrainings.status === 200, 'Employee views their assigned trainings (200 OK)');
    assert(myTrainings.data.trainings.length >= 1, 'Assigned training appears in employee list');
    assert(myTrainings.data.trainings[0].myStatus === 'assigned', 'Initial progress is "assigned"');

    // 5.4 Employee updates own training progress to in-progress
    const updateProgress1 = await request(`/api/trainings/${trainingId}/progress`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${emp1Token}` },
      body: { status: 'in-progress' }
    });
    assert(updateProgress1.status === 200, 'Employee updates progress to in-progress (200 OK)');
    assert(updateProgress1.data.myStatus === 'in-progress', 'Status updated to in-progress');

    // 5.5 Employee updates own training progress to completed
    const updateProgress2 = await request(`/api/trainings/${trainingId}/progress`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${emp1Token}` },
      body: { status: 'completed' }
    });
    assert(updateProgress2.status === 200, 'Employee updates progress to completed (200 OK)');
    assert(updateProgress2.data.completedAt !== null, 'Completion timestamp saved');

    // 5.6 Non-enrolled employee (emp2) blocked from updating progress
    const emp2Progress = await request(`/api/trainings/${trainingId}/progress`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${emp2Token}` },
      body: { status: 'completed' }
    });
    assert(emp2Progress.status === 403, 'Non-enrolled employee blocked from updating training progress (403 Forbidden)');

    // ==========================================
    // MODULE 6: DASHBOARD METRICS (/api/dashboard/stats)
    // ==========================================
    console.log('\n--- Module 6: Dashboard Statistics (/api/dashboard/stats) ---');

    // 6.1 Admin dashboard stats
    const adminStats = await request('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminStats.status === 200, 'Admin dashboard stats returns 200 OK');
    assert(adminStats.data.role === 'admin', 'Admin role recognized');
    assert(adminStats.data.overview.totalEmployees >= 3, 'Overview reports real employee count from MongoDB');
    assert(Array.isArray(adminStats.data.departmentDistribution), 'Department distribution array returned');

    // 6.2 Manager dashboard stats
    const mgrStats = await request('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert(mgrStats.status === 200, 'Manager dashboard stats returns 200 OK');
    assert(mgrStats.data.role === 'manager', 'Manager role recognized');
    assert(mgrStats.data.overview.teamSize >= 1, 'Team size reports actual count of team members');

    // 6.3 Employee dashboard stats
    const empStats = await request('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${emp1Token}` }
    });
    assert(empStats.status === 200, 'Employee dashboard stats returns 200 OK');
    assert(empStats.data.role === 'employee', 'Employee role recognized');
    assert(empStats.data.todayAttendance.checkedIn === true, 'Employee todayAttendance reflects check-in');
    assert(empStats.data.leaveBalance.annual === 7, 'Employee dashboard shows updated leave balance (7)');
    assert(empStats.data.trainings.completed >= 1, 'Employee dashboard shows completed training count');

    // ==========================================
    // MODULE 7: HEALTH CHECK REGRESSION
    // ==========================================
    console.log('\n--- Module 7: Health Check Regression ---');
    const health = await request('/api/health');
    assert(health.status === 200, 'GET /api/health returns 200 OK');
    assert(health.data.success === true, 'Health payload success is true');

    // ==========================================
    // CLEANUP
    // ==========================================
    console.log('\n--- Cleaning up test records ---');
    await User.deleteMany({ email: /^test_p3_/i });
    await Attendance.deleteMany({ notes: /test_p3/i });
    await Leave.deleteMany({ reason: /test_p3/i });
    await Announcement.deleteMany({ title: /test_p3/i });
    await Training.deleteMany({ title: /test_p3/i });
    console.log('Phase 3 test records cleaned up cleanly.');

  } catch (err) {
    console.error('Fatal API Test Suite Error:', err);
    failedCount++;
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    console.log('\n====================================================');
    console.log(`Phase 3 Test Summary: ${passedCount}/${testCount} Passed (${failedCount} Failed)`);
    console.log('====================================================\n');

    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runApiTests();
