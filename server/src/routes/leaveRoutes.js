const express = require('express');
const { body, param } = require('express-validator');
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  getLeaveById,
  updateLeaveStatus
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

const applyLeaveValidation = [
  body('leaveType')
    .isIn(['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid'])
    .withMessage('Invalid leave type'),
  body('startDate').isISO8601().withMessage('Valid start date required (YYYY-MM-DD)'),
  body('endDate').isISO8601().withMessage('Valid end date required (YYYY-MM-DD)'),
  body('reason').trim().isLength({ min: 5, max: 500 }).withMessage('Reason must be between 5 and 500 characters')
];

const updateStatusValidation = [
  param('id').isMongoId().withMessage('Invalid leave ID'),
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected')
];

router.post('/', applyLeaveValidation, validate, applyLeave);
router.get('/my-leaves', getMyLeaves);
router.get('/', authorize('admin', 'manager'), getAllLeaves);
router.get('/:id', param('id').isMongoId().withMessage('Invalid leave ID'), validate, getLeaveById);
router.patch('/:id/status', authorize('admin', 'manager'), updateStatusValidation, validate, updateLeaveStatus);

module.exports = router;
