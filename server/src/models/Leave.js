const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Leave request must belong to an employee'],
      index: true
    },
    leaveType: {
      type: String,
      enum: {
        values: ['annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid'],
        message: 'Leave type must be annual, sick, casual, maternity, paternity, or unpaid'
      },
      required: [true, 'Please select a leave type']
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide the leave start date']
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide the leave end date']
    },
    totalDays: {
      type: Number,
      default: 1,
      min: [0.5, 'Leave duration must be at least half a day']
    },
    reason: {
      type: String,
      required: [true, 'Please specify the reason for your leave'],
      trim: true,
      minlength: [5, 'Reason must be at least 5 characters'],
      maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: 'Status must be pending, approved, or rejected'
      },
      default: 'pending',
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewerNote: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Reviewer note cannot exceed 500 characters']
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Calculate totalDays before saving if startDate and endDate are provided
leaveSchema.pre('save', function (next) {
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime >= 0) {
      // Add 1 day for inclusive date range
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      this.totalDays = days;
    }
  }
  next();
});

const Leave = mongoose.model('Leave', leaveSchema);
module.exports = Leave;
