const Leave = require('../models/Leave');
const User = require('../models/User');

/**
 * @desc    Submit a new leave application
 * @route   POST /api/leaves
 * @access  Private (Authenticated)
 */
const applyLeave = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date or end date format.'
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date.'
      });
    }

    // Calculate duration in days (inclusive)
    const diffTime = end.getTime() - start.getTime();
    const requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check user leave balance
    const user = await User.findById(req.user._id);
    const currentBalance = (user.leaveBalance && user.leaveBalance[leaveType]) !== undefined
      ? user.leaveBalance[leaveType]
      : 15;

    if (currentBalance < requestedDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance for '${leaveType}'. Available: ${currentBalance} day(s), Requested: ${requestedDays} day(s).`
      });
    }

    // Check for overlapping pending or approved leave requests
    const overlapping = await Leave.findOne({
      user: req.user._id,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active or pending leave request covering these dates.'
      });
    }

    const leave = await Leave.create({
      user: req.user._id,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays: requestedDays,
      reason,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: `Leave request for ${requestedDays} day(s) submitted successfully.`,
      leave
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get logged-in employee's own leave applications
 * @route   GET /api/leaves/my-leaves
 * @access  Private (Authenticated)
 */
const getMyLeaves = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('leaveBalance');

    const leaves = await Leave.find({ user: req.user._id })
      .populate('reviewedBy', 'name designation')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      leaveBalance: user.leaveBalance,
      leaves
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get team or company leave applications (Admin & Manager)
 * @route   GET /api/leaves
 * @access  Private (Admin: all, Manager: team only)
 */
const getAllLeaves = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const query = {};

    // Manager scoping: only requests from authorized team members
    if (req.user.role === 'manager') {
      const teamEmployees = await User.find({
        $or: [
          { manager: req.user._id },
          { department: req.user.department }
        ]
      }).select('_id');
      const teamIds = teamEmployees.map((e) => e._id);
      query.user = { $in: teamIds };
    }

    // Filter by status (pending, approved, rejected)
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by leaveType
    if (req.query.leaveType) {
      query.leaveType = req.query.leaveType;
    }

    const [total, leaves] = await Promise.all([
      Leave.countDocuments(query),
      Leave.find(query)
        .populate('user', 'name email employeeId department designation avatar')
        .populate('reviewedBy', 'name designation')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      leaves
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single leave request by ID
 * @route   GET /api/leaves/:id
 * @access  Private (Admin: any, Manager: team, Employee: self)
 */
const getLeaveById = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('user', 'name email employeeId department designation manager')
      .populate('reviewedBy', 'name designation')
      .lean();

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found.'
      });
    }

    // Permission checks
    if (req.user.role === 'employee' && leave.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot view another employee\'s leave application.'
      });
    }

    if (req.user.role === 'manager') {
      const isReporting = leave.user.manager && leave.user.manager.toString() === req.user._id.toString();
      const isSameDept = leave.user.department === req.user.department;
      const isSelf = leave.user._id.toString() === req.user._id.toString();

      if (!isReporting && !isSameDept && !isSelf) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only view leave applications from your authorized team.'
        });
      }
    }

    res.status(200).json({
      success: true,
      leave
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Approve or Reject a leave application
 * @route   PATCH /api/leaves/:id/status
 * @access  Private (Admin & Manager)
 */
const updateLeaveStatus = async (req, res, next) => {
  try {
    const { status, reviewerNote = '' } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Permitted actions: approved, rejected.'
      });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found.'
      });
    }

    // RULE 1: An employee/manager CANNOT approve their own leave request!
    if (leave.user.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Action denied: You cannot approve or review your own leave request.'
      });
    }

    // RULE 2: Managers can only review their authorized team members
    if (req.user.role === 'manager') {
      const applicant = await User.findById(leave.user);
      const isReporting = applicant && applicant.manager && applicant.manager.toString() === req.user._id.toString();
      const isSameDept = applicant && applicant.department === req.user.department;

      if (!isReporting && !isSameDept) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only review leave applications from your department or team.'
        });
      }
    }

    // RULE 3: Prevent invalid or repeated status transitions
    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Conflict: This leave request has already been ${leave.status} and cannot be modified again.`
      });
    }

    // If approving, deduct leave balance
    if (status === 'approved') {
      const applicant = await User.findById(leave.user);
      if (applicant && applicant.leaveBalance) {
        const currentBal = applicant.leaveBalance[leave.leaveType] || 0;
        applicant.leaveBalance[leave.leaveType] = Math.max(0, currentBal - leave.totalDays);
        await applicant.save();
      }
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewerNote = reviewerNote;
    leave.reviewedAt = new Date();

    await leave.save();

    res.status(200).json({
      success: true,
      message: `Leave request has been ${status}.`,
      leave
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  getLeaveById,
  updateLeaveStatus
};
