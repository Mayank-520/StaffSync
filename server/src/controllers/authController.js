const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Authenticate user & get JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by lowercase email and include password field for comparison
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    // Safe error message to avoid account enumeration
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check account status
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact an HR Administrator.'
      });
    }

    // Verify password hash
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT
    const token = generateToken(user._id, user.role);

    // Sanitize user object for response (remove password)
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleDisplay: user.roleDisplay,
      department: user.department,
      designation: user.designation,
      employeeId: user.employeeId,
      status: user.status,
      avatar: user.avatar,
      joiningDate: user.joiningDate
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get currently logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private (Authenticated)
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by authMiddleware.protect
    const user = await User.findById(req.user._id)
      .populate('manager', 'name email employeeId designation department')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    // Ensure roleDisplay virtual is included
    user.roleDisplay = req.user.roleDisplay;

    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Change logged-in user password
 * @route   POST /api/auth/change-password
 * @access  Private (Authenticated)
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Fetch user with password field
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Check current password
    const isCurrentMatch = await user.matchPassword(currentPassword);
    if (!isCurrentMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.'
      });
    }

    // Check if new password is identical to current
    const isSamePassword = await user.matchPassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be identical to your current password.'
      });
    }

    // Set new password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    // Issue fresh JWT
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
      token
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Register a new employee account (Public Registration)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, department, designation } = req.body;

    const cleanEmail = email.toLowerCase().trim();

    // Check if account already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    // Generate unique employee ID (e.g. EMP-10492)
    let employeeId;
    let isUnique = false;
    while (!isUnique) {
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      employeeId = `EMP-${randomSuffix}`;
      const found = await User.findOne({ employeeId });
      if (!found) isUnique = true;
    }

    // SECURITY: Always enforce least-privileged 'employee' role.
    // Visitors can NEVER self-elevate to 'admin' or 'manager'.
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password, // Pre-save hook securely hashes with bcryptjs
      role: 'employee',
      department: department?.trim() || 'General',
      designation: designation?.trim() || 'Associate',
      employeeId,
      status: 'active'
    });

    // Generate JWT
    const token = generateToken(user._id, user.role);

    // Sanitize user object for response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleDisplay: user.roleDisplay,
      department: user.department,
      designation: user.designation,
      employeeId: user.employeeId,
      status: user.status,
      avatar: user.avatar,
      joiningDate: user.joiningDate
    };

    res.status(201).json({
      success: true,
      message: 'Account registered successfully. Welcome to StaffSync!',
      token,
      user: userResponse
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get pre-configured demo account credentials
 * @route   GET /api/auth/demo-credentials
 * @access  Public
 */
const getDemoCredentials = async (req, res, next) => {
  try {
    const demoAccounts = [
      {
        role: 'admin',
        title: 'HR Administrator',
        email: 'demo.hr@staffsync.com',
        password: 'DemoPass123!',
        department: 'Human Resources',
        description: 'Full oversight: view organization KPIs, manage staff directory, oversee leaves & system configurations',
        badge: 'Admin Access'
      },
      {
        role: 'manager',
        title: 'Operations Manager',
        email: 'demo.manager@staffsync.com',
        password: 'DemoPass123!',
        department: 'Engineering',
        description: 'Team leadership: track reportee attendance, approve/reject leave requests & assign training modules',
        badge: 'Team Lead'
      },
      {
        role: 'employee',
        title: 'Software Engineer',
        email: 'demo.employee@staffsync.com',
        password: 'DemoPass123!',
        department: 'Engineering',
        description: 'Employee portal: 1-click attendance clock-in/out, leave balance tracker, submit leaves & complete training',
        badge: 'Employee Portal'
      }
    ];

    res.status(200).json({
      success: true,
      accounts: demoAccounts
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  register,
  getDemoCredentials,
  getMe,
  changePassword
};
