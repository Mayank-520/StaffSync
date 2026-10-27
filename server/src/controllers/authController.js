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

module.exports = {
  login,
  getMe,
  changePassword
};
