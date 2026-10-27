const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deactivateEmployee
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

// All employee routes require authentication
router.use(protect);

/**
 * Validation rules for creating an employee
 */
const createEmployeeValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').trim().isEmail().withMessage('Valid corporate email address is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('role').optional().isIn(['admin', 'manager', 'employee']).withMessage('Role must be admin, manager, or employee'),
  body('status').optional().isIn(['active', 'inactive', 'on-leave']).withMessage('Status must be active, inactive, or on-leave')
];

/**
 * Validation rules for ID parameters
 */
const idValidation = [
  param('id').isMongoId().withMessage('Invalid employee ID format')
];

router.get('/', getEmployees);
router.get('/:id', idValidation, validate, getEmployeeById);
router.post('/', authorize('admin'), createEmployeeValidation, validate, createEmployee);
router.put('/:id', idValidation, validate, updateEmployee);
router.delete('/:id', authorize('admin'), idValidation, validate, deactivateEmployee);

module.exports = router;
