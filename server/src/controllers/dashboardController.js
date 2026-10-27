const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Announcement = require('../models/Announcement');
const Training = require('../models/Training');

const getDayBounds = (d = new Date()) => {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * @desc    Get dashboard metrics tailored to current user role
 * @route   GET /api/dashboard/stats
 * @access  Private (Authenticated)
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const { start: todayStart, end: todayEnd } = getDayBounds();
    const role = req.user.role;

    // ==========================================
    // 1. HR ADMINISTRATOR DASHBOARD
    // ==========================================
    if (role === 'admin') {
      const [
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        presentTodayCount,
        lateTodayCount,
        pendingLeavesCount,
        activeAnnouncementsCount,
        activeTrainingsCount,
        departmentDistribution,
        recentLeaves,
        recentAnnouncements
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ status: 'active' }),
        User.countDocuments({ status: 'inactive' }),
        Attendance.countDocuments({
          date: { $gte: todayStart, $lte: todayEnd },
          status: { $in: ['present', 'late', 'half-day'] }
        }),
        Attendance.countDocuments({
          date: { $gte: todayStart, $lte: todayEnd },
          status: 'late'
        }),
        Leave.countDocuments({ status: 'pending' }),
        Announcement.countDocuments({ isActive: true }),
        Training.countDocuments({ status: 'active' }),
        User.aggregate([
          { $match: { status: 'active' } },
          { $group: { _id: '$department', count: { $sum: 1 } } },
          { $project: { department: '$_id', count: 1, _id: 0 } },
          { $sort: { count: -1 } }
        ]),
        Leave.find()
          .populate('user', 'name email employeeId department avatar')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
        Announcement.find({ isActive: true })
          .populate('postedBy', 'name designation')
          .sort({ isPinned: -1, publicationDate: -1 })
          .limit(4)
          .lean()
      ]);

      const attendanceRate = activeEmployees > 0
        ? Math.round((presentTodayCount / activeEmployees) * 100)
        : 0;

      return res.status(200).json({
        success: true,
        role: 'admin',
        roleDisplay: 'HR Administrator',
        overview: {
          totalEmployees,
          activeEmployees,
          inactiveEmployees,
          presentToday: presentTodayCount,
          lateToday: lateTodayCount,
          absentToday: Math.max(0, activeEmployees - presentTodayCount),
          attendanceRate: `${attendanceRate}%`,
          pendingLeaves: pendingLeavesCount,
          activeAnnouncements: activeAnnouncementsCount,
          activeTrainings: activeTrainingsCount
        },
        departmentDistribution,
        recentLeaves,
        recentAnnouncements
      });
    }

    // ==========================================
    // 2. MANAGER DASHBOARD
    // ==========================================
    if (role === 'manager') {
      const teamQuery = {
        $or: [
          { manager: req.user._id },
          { department: req.user.department }
        ],
        status: 'active'
      };

      const teamMembers = await User.find(teamQuery).select('_id name email employeeId department designation avatar');
      const teamIds = teamMembers.map((m) => m._id);

      const [
        teamPresentCount,
        teamPendingLeavesCount,
        teamRecentLeaves,
        announcements
      ] = await Promise.all([
        Attendance.countDocuments({
          user: { $in: teamIds },
          date: { $gte: todayStart, $lte: todayEnd },
          status: { $in: ['present', 'late', 'half-day'] }
        }),
        Leave.countDocuments({
          user: { $in: teamIds },
          status: 'pending'
        }),
        Leave.find({ user: { $in: teamIds } })
          .populate('user', 'name email employeeId department avatar')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
        Announcement.find({
          isActive: true,
          $or: [{ targetDepartment: 'All' }, { targetDepartment: req.user.department }]
        })
          .sort({ isPinned: -1, publicationDate: -1 })
          .limit(4)
          .lean()
      ]);

      return res.status(200).json({
        success: true,
        role: 'manager',
        roleDisplay: 'Manager',
        overview: {
          teamSize: teamMembers.length,
          department: req.user.department,
          teamPresentToday: teamPresentCount,
          teamAbsentToday: Math.max(0, teamMembers.length - teamPresentCount),
          teamPendingLeaves: teamPendingLeavesCount
        },
        teamMembers,
        recentTeamLeaves: teamRecentLeaves,
        announcements
      });
    }

    // ==========================================
    // 3. EMPLOYEE DASHBOARD
    // ==========================================
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      todayAttendance,
      monthlyRecords,
      userLeaves,
      trainings,
      announcements,
      freshUser
    ] = await Promise.all([
      Attendance.findOne({
        user: req.user._id,
        date: { $gte: todayStart, $lte: todayEnd }
      }),
      Attendance.find({
        user: req.user._id,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      }),
      Leave.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Training.find({
        'assignedEmployees.employee': req.user._id,
        status: { $ne: 'archived' }
      }).lean(),
      Announcement.find({
        isActive: true,
        $or: [{ targetDepartment: 'All' }, { targetDepartment: req.user.department }]
      })
        .sort({ isPinned: -1, publicationDate: -1 })
        .limit(4)
        .lean(),
      User.findById(req.user._id).select('leaveBalance')
    ]);

    const presentDaysThisMonth = monthlyRecords.filter((r) =>
      ['present', 'late', 'half-day'].includes(r.status)
    ).length;

    const totalHoursWorkedThisMonth = monthlyRecords.reduce(
      (sum, r) => sum + (r.workingHours || 0),
      0
    );

    let completedTrainingsCount = 0;
    let pendingTrainingsCount = 0;
    trainings.forEach((t) => {
      const assignment = t.assignedEmployees.find(
        (a) => a.employee.toString() === req.user._id.toString()
      );
      if (assignment && assignment.status === 'completed') {
        completedTrainingsCount++;
      } else {
        pendingTrainingsCount++;
      }
    });

    const pendingLeavesCount = userLeaves.filter((l) => l.status === 'pending').length;

    return res.status(200).json({
      success: true,
      role: 'employee',
      roleDisplay: 'Employee',
      todayAttendance: {
        checkedIn: Boolean(todayAttendance && todayAttendance.checkIn),
        checkedOut: Boolean(todayAttendance && todayAttendance.checkOut),
        checkInTime: todayAttendance?.checkIn || null,
        checkOutTime: todayAttendance?.checkOut || null,
        workingHours: todayAttendance?.workingHours || 0,
        status: todayAttendance?.status || 'absent'
      },
      monthlySummary: {
        month: now.toLocaleString('default', { month: 'long' }),
        presentDays: presentDaysThisMonth,
        totalHoursWorked: parseFloat(totalHoursWorkedThisMonth.toFixed(2))
      },
      leaveBalance: freshUser?.leaveBalance || { annual: 15, sick: 10, casual: 10 },
      pendingLeavesCount,
      trainings: {
        totalAssigned: trainings.length,
        completed: completedTrainingsCount,
        pending: pendingTrainingsCount
      },
      recentLeaves: userLeaves,
      recentAnnouncements: announcements
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats
};
