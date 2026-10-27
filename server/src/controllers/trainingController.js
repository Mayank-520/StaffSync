const Training = require('../models/Training');
const User = require('../models/User');

/**
 * @desc    Get all training programs (Admin & Manager)
 * @route   GET /api/trainings
 * @access  Private (Admin & Manager)
 */
const getTrainings = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.search) {
      query.title = new RegExp(req.query.search.trim(), 'i');
    }

    const [total, trainings] = await Promise.all([
      Training.countDocuments(query),
      Training.find(query)
        .populate('createdBy', 'name designation')
        .populate('assignedEmployees.employee', 'name email employeeId department designation avatar')
        .sort({ deadline: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      trainings
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get trainings assigned to logged-in employee
 * @route   GET /api/trainings/my-trainings
 * @access  Private (Authenticated)
 */
const getMyTrainings = async (req, res, next) => {
  try {
    const trainings = await Training.find({
      'assignedEmployees.employee': req.user._id,
      status: { $ne: 'archived' }
    })
      .populate('createdBy', 'name designation')
      .sort({ deadline: 1 })
      .lean();

    // Map each training to expose the employee's personal progress status
    const formattedTrainings = trainings.map((t) => {
      const myAssignment = t.assignedEmployees.find(
        (a) => a.employee.toString() === req.user._id.toString()
      );
      return {
        _id: t._id,
        title: t.title,
        description: t.description,
        category: t.category,
        deadline: t.deadline,
        trainingStatus: t.status,
        myStatus: myAssignment ? myAssignment.status : 'assigned',
        completedAt: myAssignment ? myAssignment.completedAt : null,
        createdBy: t.createdBy,
        createdAt: t.createdAt
      };
    });

    res.status(200).json({
      success: true,
      count: formattedTrainings.length,
      trainings: formattedTrainings
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a new training program
 * @route   POST /api/trainings
 * @access  Private (Admin & Manager)
 */
const createTraining = async (req, res, next) => {
  try {
    const { title, description, category, deadline, assignedEmployees = [] } = req.body;

    // Format assigned employees into { employee, status: 'assigned' }
    const formattedAssigned = [];
    if (Array.isArray(assignedEmployees)) {
      for (const empId of assignedEmployees) {
        if (empId && !formattedAssigned.some((item) => item.employee.toString() === empId.toString())) {
          formattedAssigned.push({
            employee: empId,
            status: 'assigned'
          });
        }
      }
    }

    const training = await Training.create({
      title,
      description,
      category,
      deadline,
      assignedEmployees: formattedAssigned,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Training module created successfully.',
      training
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Assign employees to training
 * @route   POST /api/trainings/:id/assign
 * @access  Private (Admin & Manager)
 */
const assignEmployees = async (req, res, next) => {
  try {
    const { employeeIds } = req.body;
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of employee IDs to assign.'
      });
    }

    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training module not found.'
      });
    }

    let addedCount = 0;
    employeeIds.forEach((id) => {
      const alreadyAssigned = training.assignedEmployees.some(
        (a) => a.employee.toString() === id.toString()
      );
      if (!alreadyAssigned) {
        training.assignedEmployees.push({
          employee: id,
          status: 'assigned'
        });
        addedCount++;
      }
    });

    await training.save();

    res.status(200).json({
      success: true,
      message: `${addedCount} new employee(s) assigned to training module.`,
      training
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update employee's own training progress
 * @route   PATCH /api/trainings/:id/progress
 * @access  Private (Assigned Employee)
 */
const updateProgress = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['assigned', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid progress status. Allowed: assigned, in-progress, completed.'
      });
    }

    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training program not found.'
      });
    }

    // Find the current user in assigned employees
    const assignment = training.assignedEmployees.find(
      (a) => a.employee.toString() === req.user._id.toString()
    );

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not enrolled in this training module.'
      });
    }

    assignment.status = status;
    if (status === 'completed') {
      assignment.completedAt = new Date();
    } else {
      assignment.completedAt = null;
    }

    await training.save();

    res.status(200).json({
      success: true,
      message: `Your training progress has been updated to '${status}'.`,
      myStatus: status,
      completedAt: assignment.completedAt
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete or archive training
 * @route   DELETE /api/trainings/:id
 * @access  Private (Admin only)
 */
const deleteTraining = async (req, res, next) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training module not found.'
      });
    }

    await Training.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Training module removed successfully.'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTrainings,
  getMyTrainings,
  createTraining,
  assignEmployees,
  updateProgress,
  deleteTraining
};
