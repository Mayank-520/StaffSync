const { validationResult } = require('express-validator');

/**
 * Middleware to check express-validator validation results.
 * If errors exist, returns a 400 Bad Request with formatted error details.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please correct the highlighted errors.',
      errors: formattedErrors
    });
  }
  next();
};

module.exports = validate;
