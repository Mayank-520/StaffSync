require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const readline = require('readline');
const connectDB = require('../config/db');
const User = require('../models/User');

const askQuestion = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
};

const setupAdmin = async () => {
  try {
    console.log('==================================================');
    console.log('🛡️  StaffSync - Initial HR Administrator Setup');
    console.log('==================================================');

    // 1. Connect to Database
    await connectDB();

    // 2. Security Check: Check if an Admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  [Setup Locked]: An HR Administrator already exists in StaffSync.');
      console.log(`ℹ️  Existing Admin Email: ${existingAdmin.email}`);
      console.log('👉 For security, this setup script only runs once.');
      console.log('==================================================');
      await mongoose.disconnect();
      process.exit(0);
    }

    // 3. Read credentials from environment variables or interactive prompt
    let name = process.env.ADMIN_NAME;
    let email = process.env.ADMIN_EMAIL;
    let password = process.env.ADMIN_PASSWORD;
    let employeeId = process.env.ADMIN_EMPLOYEE_ID || 'ADM-001';

    if (!email || !password) {
      if (!process.stdin.isTTY) {
        console.error('❌ Error: In non-interactive mode, ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
        await mongoose.disconnect();
        process.exit(1);
      }

      console.log('Please provide initial HR Administrator details:');
      if (!name) name = await askQuestion('Admin Full Name [Default: StaffSync Administrator]: ') || 'StaffSync Administrator';
      email = await askQuestion('Admin Corporate Email: ');
      password = await askQuestion('Admin Password (min 6 characters): ');
    }

    // 4. Validate Inputs
    if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(email)) {
      console.error('❌ Error: Please provide a valid email address.');
      await mongoose.disconnect();
      process.exit(1);
    }

    if (!password || password.length < 6) {
      console.error('❌ Error: Password must be at least 6 characters long.');
      await mongoose.disconnect();
      process.exit(1);
    }

    // 5. Create the Initial HR Administrator
    const adminUser = await User.create({
      name: name || 'StaffSync Administrator',
      email: email.toLowerCase().trim(),
      password, // Pre-save hook securely hashes password with bcryptjs
      role: 'admin',
      department: 'Human Resources',
      designation: 'HR Administrator',
      employeeId,
      status: 'active'
    });

    console.log('✅ [Success]: Initial HR Administrator created successfully!');
    console.log(`👤 Name: ${adminUser.name}`);
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`🆔 Employee ID: ${adminUser.employeeId}`);
    console.log(`🎭 Role: ${adminUser.roleDisplay} (${adminUser.role})`);
    console.log('🔒 Password: [SECURELY HASHED AND STORED WITH BCRYPT]');
    console.log('==================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Setup Failed:', err.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

setupAdmin();
