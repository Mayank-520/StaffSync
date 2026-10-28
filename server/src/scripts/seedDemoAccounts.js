require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const Training = require('../models/Training');

const DEMO_PASSWORD = 'DemoPass123!';

const seedDemoAccounts = async () => {
  try {
    console.log('==================================================');
    console.log('🌱 StaffSync - Idempotent Demo Accounts Seed');
    console.log('==================================================');

    await connectDB();

    // 1. Seed or update Manager account first (so employee can reference manager)
    let manager = await User.findOne({ email: 'demo.manager@staffsync.com' });
    if (!manager) {
      manager = await User.create({
        name: 'Demo Engineering Manager',
        email: 'demo.manager@staffsync.com',
        password: DEMO_PASSWORD, // Pre-save hook hashes with bcrypt
        role: 'manager',
        department: 'Engineering',
        designation: 'Lead Technical Manager',
        employeeId: 'MGR-DEMO-01',
        status: 'active',
        phone: '+1 (555) 234-5678',
        joiningDate: new Date('2023-01-15')
      });
      console.log('✅ Created Demo Manager: demo.manager@staffsync.com');
    } else {
      manager.name = 'Demo Engineering Manager';
      manager.status = 'active';
      manager.role = 'manager';
      manager.password = DEMO_PASSWORD;
      await manager.save();
      console.log('🔄 Updated Demo Manager: demo.manager@staffsync.com');
    }

    // 2. Seed or update HR Administrator account
    let hrAdmin = await User.findOne({ email: 'demo.hr@staffsync.com' });
    if (!hrAdmin) {
      hrAdmin = await User.create({
        name: 'Demo HR Director',
        email: 'demo.hr@staffsync.com',
        password: DEMO_PASSWORD,
        role: 'admin',
        department: 'Human Resources',
        designation: 'HR Director',
        employeeId: 'HR-DEMO-01',
        status: 'active',
        phone: '+1 (555) 123-4567',
        joiningDate: new Date('2022-06-01')
      });
      console.log('✅ Created Demo HR Administrator: demo.hr@staffsync.com');
    } else {
      hrAdmin.name = 'Demo HR Director';
      hrAdmin.status = 'active';
      hrAdmin.role = 'admin';
      hrAdmin.password = DEMO_PASSWORD;
      await hrAdmin.save();
      console.log('🔄 Updated Demo HR Administrator: demo.hr@staffsync.com');
    }

    // 3. Seed or update Employee account
    let employee = await User.findOne({ email: 'demo.employee@staffsync.com' });
    if (!employee) {
      employee = await User.create({
        name: 'Demo Software Engineer',
        email: 'demo.employee@staffsync.com',
        password: DEMO_PASSWORD,
        role: 'employee',
        department: 'Engineering',
        designation: 'Senior Software Engineer',
        employeeId: 'EMP-DEMO-01',
        manager: manager._id,
        status: 'active',
        phone: '+1 (555) 345-6789',
        joiningDate: new Date('2024-03-10'),
        leaveBalance: {
          annual: 14,
          sick: 8,
          casual: 9,
          maternity: 90,
          paternity: 15,
          unpaid: 30
        }
      });
      console.log('✅ Created Demo Employee: demo.employee@staffsync.com');
    } else {
      employee.name = 'Demo Software Engineer';
      employee.status = 'active';
      employee.role = 'employee';
      employee.manager = manager._id;
      employee.password = DEMO_PASSWORD;
      await employee.save();
      console.log('🔄 Updated Demo Employee: demo.employee@staffsync.com');
    }

    // 4. Seed demo announcement if none exists
    const announcementCount = await Announcement.countDocuments();
    if (announcementCount === 0) {
      await Announcement.create({
        title: 'Welcome to StaffSync Modern HRMS',
        content: 'StaffSync is now live for workforce management, real-time attendance, and automated leave approvals.',
        priority: 'high',
        targetDepartment: 'All',
        postedBy: hrAdmin._id,
        isPinned: true
      });
      console.log('📢 Created Initial Company Announcement');
    }

    // 5. Seed demo training if none exists
    const trainingCount = await Training.countDocuments();
    if (trainingCount === 0) {
      await Training.create({
        title: 'Cybersecurity & Data Privacy 2026',
        description: 'Mandatory annual enterprise training on security hygiene, phishing detection, and secure coding.',
        category: 'Compliance',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'active',
        assignedEmployees: [
          {
            employee: employee._id,
            assignedDate: new Date(),
            progress: 'in-progress'
          }
        ]
      });
      console.log('🎓 Created Initial Training Course');
    }

    console.log('==================================================');
    console.log('✨ Demo accounts successfully seeded & ready!');
    console.log('👑 HR Administrator : demo.hr@staffsync.com / DemoPass123!');
    console.log('👔 Manager          : demo.manager@staffsync.com / DemoPass123!');
    console.log('💻 Employee         : demo.employee@staffsync.com / DemoPass123!');
    console.log('==================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Demo Seed Failed:', err.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

seedDemoAccounts();
