const express = require('express');
const { body, param } = require('express-validator');
const {
  getTrainings,
  getMyTrainings,
  createTraining,
  assignEmployees,
  updateProgress,
  deleteTraining
} = require('../controllers/trainingController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

const createTrainingValidation = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('deadline').isISO8601().withMessage('Valid deadline date required')
];

router.get('/', authorize('admin', 'manager'), getTrainings);
router.get('/my-trainings', getMyTrainings);
router.post('/', authorize('admin', 'manager'), createTrainingValidation, validate, createTraining);
router.post('/:id/assign', authorize('admin', 'manager'), param('id').isMongoId().withMessage('Invalid training ID'), validate, assignEmployees);
router.patch('/:id/progress', param('id').isMongoId().withMessage('Invalid training ID'), validate, updateProgress);
router.delete('/:id', authorize('admin'), param('id').isMongoId().withMessage('Invalid training ID'), validate, deleteTraining);

module.exports = router;
