const Attendance = require('../models/Attendance');
const User = require('../models/User');

/**
 * Helper to obtain normalized start and end of a given date (defaults to today)
 */
const getDayBounds = (inputDate = new Date()) => {
  const start = new Date(inputDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(inputDate);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * @desc    Employee Check-In for today
 * @route   POST /api/attendance/check-in
 * @access  Private (Authenticated)
 */
const checkIn = async (req, res, next) => {
  try {
    const { start, end } = getDayBounds();

    // Check for existing check-in today
    const existingRecord = await Attendance.findOne({
      user: req.user._id,
      date: { $gte: start, $lte: end }
    });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: `Duplicate check-in blocked: You have already checked in for today at ${new Date(existingRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        record: existingRecord
      });
    }

    const checkInTime = new Date();

    // Status logic: after 9:30 AM marks as 'late'
    const hours = checkInTime.getHours();
    const minutes = checkInTime.getMinutes();
    const isLate = hours > 9 || (hours === 9 && minutes > 30);

    const attendance = await Attendance.create({
      user: req.user._id,
      date: start,
      checkIn: checkInTime,
      status: isLate ? 'late' : 'present',
      notes: req.body.notes || ''
    });

    res.status(201).json({
      success: true,
      message: `Checked in successfully as ${isLate ? 'Late' : 'Present'}.`,
      attendance
    });
  } catch (err) {
    // Handle compound index unique constraint race condition gracefully
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate check-in blocked: An attendance record already exists for today.'
      });
    }
    next(err);
  }
};

/**
 * @desc    Employee Check-Out for today
 * @route   POST /api/attendance/check-out
 * @access  Private (Authenticated)
 */
const checkOut = async (req, res, next) => {
  try {
    const { start, end } = getDayBounds();

    const attendance = await Attendance.findOne({
      user: req.user._id,
      date: { $gte: start, $lte: end }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'You have not checked in yet today. Please check in first before checking out.'
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: `You have already checked out today at ${new Date(attendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        attendance
      });
    }

    const checkOutTime = new Date();
    attendance.checkOut = checkOutTime;

    // Calculate hours worked
    const durationMs = checkOutTime.getTime() - new Date(attendance.checkIn).getTime();
    const hoursWorked = parseFloat((durationMs / (1000 * 60 * 60)).toFixed(2));
    attendance.workingHours = hoursWorked;

    // If worked less than 4 hours, mark as half-day
    if (hoursWorked < 4) {
      attendance.status = 'half-day';
    }

    if (req.body.notes) {
      attendance.notes = `${attendance.notes ? attendance.notes + ' | ' : ''}${req.body.notes}`;
    }

    await attendance.save();

    res.status(200).json({
      success: true,
      message: `Checked out successfully. Total working hours: ${hoursWorked} hrs.`,
      attendance
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get current user's today attendance status
 * @route   GET /api/attendance/today
 * @access  Private (Authenticated)
 */
const getTodayStatus = async (req, res, next) => {
  try {
    const { start, end } = getDayBounds();

    const attendance = await Attendance.findOne({
      user: req.user._id,
      date: { $gte: start, $lte: end }
    });

    res.status(200).json({
      success: true,
      hasCheckedIn: Boolean(attendance && attendance.checkIn),
      hasCheckedOut: Boolean(attendance && attendance.checkOut),
      record: attendance || null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get current user's personal attendance history
 * @route   GET /api/attendance/my-history
 * @access  Private (Authenticated)
 */
const getMyHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };

    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.month && req.query.year) {
      const year = parseInt(req.query.year, 10);
      const month = parseInt(req.query.month, 10) - 1; // 0-indexed
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
      query.date = { $gte: monthStart, $lte: monthEnd };
    }

    const [total, records] = await Promise.all([
      Attendance.countDocuments(query),
      Attendance.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      records
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get team or company attendance records (Manager / HR Admin)
 * @route   GET /api/attendance
 * @access  Private (Admin: all, Manager: team only)
 */
const getTeamAttendance = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    let userIdsToQuery = null;

    // Manager scoping: only employees reporting to this manager or in their department
    if (req.user.role === 'manager') {
      const teamEmployees = await User.find({
        $or: [
          { manager: req.user._id },
          { department: req.user.department }
        ]
      }).select('_id');
      userIdsToQuery = teamEmployees.map((e) => e._id);
    }

    const query = {};

    if (userIdsToQuery) {
      query.user = { $in: userIdsToQuery };
    }

    // Filter by specific user if provided and authorized
    if (req.query.userId) {
      if (userIdsToQuery && !userIdsToQuery.some((id) => id.toString() === req.query.userId)) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot access attendance records outside your authorized team.'
        });
      }
      query.user = req.query.userId;
    }

    // Filter by date
    if (req.query.date) {
      const targetDate = new Date(req.query.date);
      const { start, end } = getDayBounds(targetDate);
      query.date = { $gte: start, $lte: end };
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const [total, records] = await Promise.all([
      Attendance.countDocuments(query),
      Attendance.find(query)
        .populate('user', 'name email employeeId department designation avatar')
        .sort({ date: -1, checkIn: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      records
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyHistory,
  getTeamAttendance
};
