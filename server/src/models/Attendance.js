const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Attendance must belong to an employee'],
      index: true
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required'],
      index: true
    },
    checkIn: {
      type: Date,
      default: null
    },
    checkOut: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: {
        values: ['present', 'absent', 'late', 'half-day'],
        message: 'Status must be present, absent, late, or half-day'
      },
      default: 'present',
      index: true
    },
    workingHours: {
      type: Number,
      default: 0,
      min: [0, 'Working hours cannot be negative']
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate attendance records for the same employee on the same date
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

// Automatically calculate working hours before saving if checkIn and checkOut are provided
attendanceSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut) {
    const durationMs = new Date(this.checkOut).getTime() - new Date(this.checkIn).getTime();
    if (durationMs > 0) {
      // Calculate hours to two decimal places
      this.workingHours = parseFloat((durationMs / (1000 * 60 * 60)).toFixed(2));
    }
  }
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
module.exports = Attendance;
