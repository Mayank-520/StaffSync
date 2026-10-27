const Announcement = require('../models/Announcement');

/**
 * @desc    Get announcements relevant to user's role and department
 * @route   GET /api/announcements
 * @access  Private (Authenticated)
 */
const getAnnouncements = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {};

    // Non-admins see only active announcements intended for All or their department
    if (req.user.role !== 'admin') {
      query.isActive = true;
      query.$or = [
        { targetDepartment: 'All' },
        { targetDepartment: req.user.department }
      ];
    }

    // Filter by priority
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    // Filter by department (Admin view)
    if (req.query.department && req.user.role === 'admin') {
      query.targetDepartment = req.query.department;
    }

    // Search keyword
    if (req.query.search) {
      query.title = new RegExp(req.query.search.trim(), 'i');
    }

    const [total, announcements] = await Promise.all([
      Announcement.countDocuments(query),
      Announcement.find(query)
        .populate('postedBy', 'name designation avatar role')
        .sort({ isPinned: -1, publicationDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      announcements
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single announcement by ID
 * @route   GET /api/announcements/:id
 * @access  Private (Authenticated)
 */
const getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('postedBy', 'name designation avatar')
      .lean();

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.'
      });
    }

    // Clearance check for non-admin
    if (req.user.role !== 'admin') {
      if (!announcement.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Announcement not found.'
        });
      }

      if (announcement.targetDepartment !== 'All' && announcement.targetDepartment !== req.user.department) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to view announcements targeted to another department.'
        });
      }
    }

    res.status(200).json({
      success: true,
      announcement
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create new announcement (Admin only)
 * @route   POST /api/announcements
 * @access  Private (Admin only)
 */
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, priority = 'medium', targetDepartment = 'All', isPinned = false } = req.body;

    const announcement = await Announcement.create({
      title,
      content,
      priority,
      targetDepartment,
      isPinned,
      postedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully.',
      announcement
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update announcement (Admin only)
 * @route   PUT /api/announcements/:id
 * @access  Private (Admin only)
 */
const updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.'
      });
    }

    const { title, content, priority, targetDepartment, isPinned, isActive } = req.body;

    if (title !== undefined) announcement.title = title;
    if (content !== undefined) announcement.content = content;
    if (priority !== undefined) announcement.priority = priority;
    if (targetDepartment !== undefined) announcement.targetDepartment = targetDepartment;
    if (isPinned !== undefined) announcement.isPinned = isPinned;
    if (isActive !== undefined) announcement.isActive = isActive;

    await announcement.save();

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully.',
      announcement
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Deactivate or Delete announcement (Admin only)
 * @route   DELETE /api/announcements/:id
 * @access  Private (Admin only)
 */
const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found.'
      });
    }

    // Soft deactivate
    announcement.isActive = false;
    await announcement.save();

    res.status(200).json({
      success: true,
      message: 'Announcement deactivated successfully.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
