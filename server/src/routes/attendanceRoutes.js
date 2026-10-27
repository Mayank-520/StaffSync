const express = require('express');
const {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyHistory,
  getTeamAttendance
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All attendance routes require authentication
router.use(protect);

router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', getTodayStatus);
router.get('/my-history', getMyHistory);
router.get('/', authorize('admin', 'manager'), getTeamAttendance);

module.exports = router;
