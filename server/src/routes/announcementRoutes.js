const express = require('express');
const { body, param } = require('express-validator');
const {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

const createAnnouncementValidation = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('content').trim().isLength({ min: 5 }).withMessage('Content must be at least 5 characters long'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Priority must be low, medium, high, or urgent')
];

router.get('/', getAnnouncements);
router.get('/:id', param('id').isMongoId().withMessage('Invalid announcement ID'), validate, getAnnouncementById);
router.post('/', authorize('admin'), createAnnouncementValidation, validate, createAnnouncement);
router.put('/:id', authorize('admin'), param('id').isMongoId().withMessage('Invalid announcement ID'), validate, updateAnnouncement);
router.delete('/:id', authorize('admin'), param('id').isMongoId().withMessage('Invalid announcement ID'), validate, deleteAnnouncement);

module.exports = router;
