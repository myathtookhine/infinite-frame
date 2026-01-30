/**
 * Standardized API response helpers
 */

/**
 * Send a success response
 * @param {Response} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @param {number} status - HTTP status code (default: 200)
 */
const success = (res, data, message = 'Success', status = 200) => {
  return res.status(status).json({ success: true, data, message });
};

/**
 * Send an error response
 * @param {Response} res - Express response object
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 */
const error = (res, status, message) => {
  return res.status(status).json({ success: false, message });
};

/**
 * Send a server error response with logging
 * @param {Response} res - Express response object
 * @param {Error} err - Error object
 * @param {string} context - Context for logging
 */
const serverError = (res, err, context = 'Server Error') => {
  console.error(`[${context}]`, err.message);
  return res.status(500).json({ success: false, message: 'Server Error' });
};

/**
 * Handle PostgreSQL constraint errors
 * @param {Response} res - Express response object
 * @param {Error} err - Error object
 * @param {Object} messages - Custom messages for specific error codes
 */
const handleDbError = (res, err, messages = {}) => {
  // Unique constraint violation
  if (err.code === '23505') {
    return error(res, 400, messages['23505'] || 'This entry already exists');
  }
  // Foreign key constraint violation
  if (err.code === '23503') {
    return error(res, 400, messages['23503'] || 'Cannot delete: Item is linked to other records');
  }
  // Default server error
  return serverError(res, err);
};

module.exports = {
  success,
  error,
  serverError,
  handleDbError
};
