const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a training module title'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide a training description'],
      trim: true
    },
    category: {
      type: String,
      enum: {
        values: [
          'Technical',
          'Soft Skills',
          'Compliance',
          'Leadership',
          'Management',
          'Orientation',
          'Health & Safety',
          'Other'
        ],
        message: 'Invalid training category'
      },
      default: 'Technical',
      index: true
    },
    deadline: {
      type: Date,
      required: [true, 'Please specify the completion deadline or schedule']
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'archived', 'completed'],
        message: 'Training status must be active, archived, or completed'
      },
      default: 'active',
      index: true
    },
    assignedEmployees: [
      {
        employee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        status: {
          type: String,
          enum: ['assigned', 'in-progress', 'completed'],
          default: 'assigned'
        },
        completedAt: {
          type: Date,
          default: null
        }
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Training = mongoose.model('Training', trainingSchema);
module.exports = Training;
