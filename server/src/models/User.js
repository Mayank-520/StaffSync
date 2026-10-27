const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide the employee full name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address'
      ],
      index: true
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Never return password in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'manager', 'employee'],
        message: 'Role must be either admin, manager, or employee'
      },
      default: 'employee',
      index: true
    },
    department: {
      type: String,
      required: [true, 'Please provide a department'],
      trim: true
    },
    designation: {
      type: String,
      required: [true, 'Please provide a designation/job title'],
      trim: true
    },
    employeeId: {
      type: String,
      required: [true, 'Please provide an Employee ID'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on-leave'],
      default: 'active'
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relationship: { type: String, default: '' },
      phone: { type: String, default: '' }
    },
    joiningDate: {
      type: Date,
      default: Date.now
    },
    avatar: {
      type: String,
      default: ''
    },
    leaveBalance: {
      annual: { type: Number, default: 15, min: 0 },
      sick: { type: Number, default: 10, min: 0 },
      casual: { type: Number, default: 10, min: 0 },
      maternity: { type: Number, default: 90, min: 0 },
      paternity: { type: Number, default: 15, min: 0 },
      unpaid: { type: Number, default: 30, min: 0 }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * Virtual field for frontend role display:
 * Converts raw role strings to human-friendly titles:
 * - 'admin' -> 'HR Administrator'
 * - 'manager' -> 'Manager'
 * - 'employee' -> 'Employee'
 */
userSchema.virtual('roleDisplay').get(function () {
  switch (this.role) {
    case 'admin':
      return 'HR Administrator';
    case 'manager':
      return 'Manager';
    case 'employee':
    default:
      return 'Employee';
  }
});

/**
 * Pre-save hook: Hash password with bcryptjs before saving
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Instance method: Compare entered password with hashed password in database
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
