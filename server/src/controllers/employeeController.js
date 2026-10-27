const User = require('../models/User');

/**
 * @desc    Get all employees with search, filter, and pagination
 * @route   GET /api/employees
 * @access  Private (Admin: all, Manager: team, Employee: directory)
 */
const getEmployees = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {};

    // Role-based scoping
    if (req.user.role === 'manager') {
      // Manager can view employees in their department or reporting directly to them
      query.$or = [
        { manager: req.user._id },
        { department: req.user.department },
        { _id: req.user._id }
      ];
    } else if (req.user.role === 'employee') {
      // Employee sees only active employees in directory
      query.status = 'active';
    }

    // Search keyword (name, email, employeeId)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      const searchConditions = [
        { name: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex }
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    // Filters
    if (req.query.department && req.query.department !== 'All') {
      query.department = req.query.department;
    }
    if (req.query.role) {
      query.role = req.query.role;
    }
    if (req.query.status && req.user.role === 'admin') {
      query.status = req.query.status;
    }

    // Field projection: Employees in directory don't see sensitive info
    let selectFields = '-password';
    if (req.user.role === 'employee') {
      selectFields = 'name email department designation employeeId avatar status roleDisplay';
    }

    const [total, employees] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select(selectFields)
        .populate('manager', 'name email employeeId designation')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    // Attach roleDisplay virtual
    employees.forEach((emp) => {
      switch (emp.role) {
        case 'admin':
          emp.roleDisplay = 'HR Administrator';
          break;
        case 'manager':
          emp.roleDisplay = 'Manager';
          break;
        case 'employee':
        default:
          emp.roleDisplay = 'Employee';
          break;
      }
    });

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      limit,
      employees
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single employee by ID
 * @route   GET /api/employees/:id
 * @access  Private (Admin: all, Manager: team, Employee: self only)
 */
const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Ownership & permission guard
    if (req.user.role === 'employee' && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view other employee records.'
      });
    }

    const employee = await User.findById(id)
      .select('-password')
      .populate('manager', 'name email employeeId designation department')
      .lean();

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found.'
      });
    }

    // Manager access check
    if (req.user.role === 'manager') {
      const isReporting = employee.manager && employee.manager._id?.toString() === req.user._id.toString();
      const isSameDept = employee.department === req.user.department;
      const isSelf = employee._id.toString() === req.user._id.toString();

      if (!isReporting && !isSameDept && !isSelf) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only view employees in your authorized department or team.'
        });
      }
    }

    switch (employee.role) {
      case 'admin':
        employee.roleDisplay = 'HR Administrator';
        break;
      case 'manager':
        employee.roleDisplay = 'Manager';
        break;
      default:
        employee.roleDisplay = 'Employee';
        break;
    }

    res.status(200).json({
      success: true,
      employee
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create new employee (HR Administrator only)
 * @route   POST /api/employees
 * @access  Private (Admin only)
 */
const createEmployee = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'employee',
      department,
      designation,
      employeeId,
      status = 'active',
      manager = null,
      phone = '',
      address = '',
      emergencyContact = {},
      joiningDate = Date.now(),
      leaveBalance
    } = req.body;

    // Check email uniqueness
    const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'An employee with this email address already exists.'
      });
    }

    // Check employeeId uniqueness
    const idExists = await User.findOne({ employeeId: employeeId.toUpperCase().trim() });
    if (idExists) {
      return res.status(400).json({
        success: false,
        message: 'An employee with this Employee ID already exists.'
      });
    }

    // Validate manager if provided
    let managerId = null;
    if (manager) {
      const managerUser = await User.findById(manager);
      if (managerUser) {
        managerId = managerUser._id;
      }
    }

    const employee = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role,
      department,
      designation,
      employeeId: employeeId.toUpperCase().trim(),
      status,
      manager: managerId,
      phone,
      address,
      emergencyContact,
      joiningDate,
      ...(leaveBalance && { leaveBalance })
    });

    const responseData = employee.toObject();
    delete responseData.password;

    res.status(201).json({
      success: true,
      message: 'Employee record created successfully.',
      employee: responseData
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update employee details
 * @route   PUT /api/employees/:id
 * @access  Private (Admin: all fields, Employee: self contact info only)
 */
const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await User.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found.'
      });
    }

    // Employee updating self: permitted fields only
    if (req.user.role === 'employee') {
      if (req.user._id.toString() !== id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only update your own profile details.'
        });
      }

      const { phone, address, emergencyContact, avatar } = req.body;
      if (phone !== undefined) employee.phone = phone;
      if (address !== undefined) employee.address = address;
      if (emergencyContact !== undefined) employee.emergencyContact = emergencyContact;
      if (avatar !== undefined) employee.avatar = avatar;

      await employee.save();
      const responseData = employee.toObject();
      delete responseData.password;

      return res.status(200).json({
        success: true,
        message: 'Your profile has been updated.',
        employee: responseData
      });
    }

    // Admin updates
    if (req.user.role === 'admin') {
      const {
        name,
        email,
        role,
        department,
        designation,
        employeeId,
        status,
        manager,
        phone,
        address,
        emergencyContact,
        joiningDate,
        leaveBalance,
        avatar
      } = req.body;

      // Check email uniqueness if changing email
      if (email && email.toLowerCase() !== employee.email) {
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
          return res.status(400).json({
            success: false,
            message: 'Email address already in use by another employee.'
          });
        }
        employee.email = email.toLowerCase().trim();
      }

      // Check employeeId uniqueness if changing ID
      if (employeeId && employeeId.toUpperCase() !== employee.employeeId) {
        const idExists = await User.findOne({ employeeId: employeeId.toUpperCase() });
        if (idExists) {
          return res.status(400).json({
            success: false,
            message: 'Employee ID already in use.'
          });
        }
        employee.employeeId = employeeId.toUpperCase().trim();
      }

      if (name) employee.name = name;
      if (role) employee.role = role;
      if (department) employee.department = department;
      if (designation) employee.designation = designation;
      if (status) employee.status = status;
      if (manager !== undefined) employee.manager = manager || null;
      if (phone !== undefined) employee.phone = phone;
      if (address !== undefined) employee.address = address;
      if (emergencyContact !== undefined) employee.emergencyContact = emergencyContact;
      if (joiningDate !== undefined) employee.joiningDate = joiningDate;
      if (leaveBalance !== undefined) employee.leaveBalance = leaveBalance;
      if (avatar !== undefined) employee.avatar = avatar;

      await employee.save();
      const responseData = employee.toObject();
      delete responseData.password;

      return res.status(200).json({
        success: true,
        message: 'Employee record updated successfully.',
        employee: responseData
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Forbidden: Insufficient permissions to update this employee.'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Deactivate employee account (Soft delete)
 * @route   DELETE /api/employees/:id
 * @access  Private (Admin only)
 */
const deactivateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent admin from deactivating their own account
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'Security protection: You cannot deactivate your own active HR Administrator account.'
      });
    }

    const employee = await User.findById(id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found.'
      });
    }

    employee.status = 'inactive';
    await employee.save();

    res.status(200).json({
      success: true,
      message: `Employee ${employee.name} (${employee.employeeId}) has been deactivated.`
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deactivateEmployee
};
