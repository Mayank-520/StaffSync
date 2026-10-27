const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: Verify JWT and authenticate current user
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user in database, excluding password
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // Check account status
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact the HR Administrator.'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication session expired. Please log in again.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.'
    });
  }
};

/**
 * Middleware: Restrict access based on user role
 * @param  {...string} roles - e.g. 'admin', 'manager'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to authorization.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.roleDisplay || req.user.role}' is not authorized to access this resource.`
      });
    }

    next();
  };
};

/**
 * Middleware: Ensure an employee can only view/modify their own resource,
 * while an HR Admin can access any employee resource.
 */
const requireSelfOrAdmin = (paramKey = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const targetId = req.params[paramKey] || req.body[paramKey];

    // Admin has full access
    if (req.user.role === 'admin') {
      return next();
    }

    // User can only access their own record
    if (targetId && targetId.toString() === req.user._id.toString()) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Forbidden: You do not have permission to access another employee\'s private records.'
    });
  };
};

/**
 * Middleware: Ensure a Manager can only access their team members,
 * while an HR Admin can access anyone, and an Employee can only access themselves.
 */
const requireTeamOrAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  // Admin has universal access
  if (req.user.role === 'admin') {
    return next();
  }

  const targetUserId = req.params.id || req.body.userId;
  if (!targetUserId) {
    return next();
  }

  // Employee can only access themselves
  if (req.user.role === 'employee') {
    if (targetUserId.toString() === req.user._id.toString()) {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Employees cannot access other employee records.'
    });
  }

  // Manager: verify target is on their team or is the manager themselves
  if (req.user.role === 'manager') {
    if (targetUserId.toString() === req.user._id.toString()) {
      return next();
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    const isReportingManager = targetUser.manager && targetUser.manager.toString() === req.user._id.toString();
    const isSameDepartment = targetUser.department === req.user.department;

    if (isReportingManager || isSameDepartment) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Forbidden: Managers can only view employees in their authorized team or department.'
    });
  }

  return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges.' });
};

module.exports = {
  protect,
  authorize,
  requireSelfOrAdmin,
  requireTeamOrAdmin
};
